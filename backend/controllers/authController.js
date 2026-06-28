const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch {
  nodemailer = null;
}

const WORKSPACE_OWNER_ID = Number(process.env.WORKSPACE_OWNER_ID || 1);
const PASSWORD_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const RESET_TOKEN_MINUTES = Number(process.env.PASSWORD_RESET_MINUTES || 30);
const DISPLAY_NAMES = {
  'ahemanth784@gmail.com': 'Aluvala Hemanth',
  'karthiknukala08@gmail.com': 'Karthik Nukala'
};

const safeUser = user => ({
  id: user.id,
  name: DISPLAY_NAMES[String(user.email || '').toLowerCase()] || user.name,
  fullName: DISPLAY_NAMES[String(user.email || '').toLowerCase()] || user.name,
  email: user.email,
  username: user.username || '',
  role: user.role,
  isActive: user.is_active !== false,
  studio_name: user.studio_name,
  studio_phone: user.studio_phone,
  studio_address: user.studio_address,
  avatar_url: user.avatar_url,
  created_at: user.created_at,
  login_email: user.email,
  workspace_id: WORKSPACE_OWNER_ID
});

const ensureResetColumns = async () => {
  try {
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255)');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP');
  } catch {
    // Mock DB ignores ALTER TABLE; real PostgreSQL supports it.
  }
};

const hashToken = token => crypto.createHash('sha256').update(token).digest('hex');

const getFrontendUrl = () => (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

const getMailTransport = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass || !nodemailer) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
};

const sendResetEmail = async ({ to, name, resetLink }) => {
  const transport = getMailTransport();
  if (!transport) return false;

  await transport.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject: 'Reset your ReelCRM password',
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <h2>Reset your ReelCRM password</h2>
        <p>Hello ${name || 'there'},</p>
        <p>Click the button below to reset your password. This link expires in ${RESET_TOKEN_MINUTES} minutes.</p>
        <p><a href="${resetLink}" style="background:#6D5DFB;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;display:inline-block">Reset Password</a></p>
        <p>If the button does not work, copy this link:</p>
        <p style="word-break:break-all;color:#4F46E5">${resetLink}</p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
    text: `Reset your ReelCRM password: ${resetLink}\n\nThis link expires in ${RESET_TOKEN_MINUTES} minutes.`
  });
  return true;
};

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [String(email).toLowerCase()]);
    if (result.rows.length === 0) return res.status(401).json({ message: 'Invalid credentials.' });

    const user = result.rows[0];
    if (!['admin', 'staff'].includes(user.role)) return res.status(403).json({ message: 'Invalid user role.' });
    if (user.is_active === false) return res.status(403).json({ message: 'Account is inactive. Contact admin.' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials.' });

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: safeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  const normalizedEmail = String(req.body.email || '').trim().toLowerCase();
  if (!normalizedEmail) return res.status(400).json({ message: 'Email is required.' });
  if (!/\S+@\S+\.\S+/.test(normalizedEmail)) return res.status(400).json({ message: 'Valid email is required.' });

  const response = { message: 'If that email exists, a reset link has been sent.' };

  try {
    await ensureResetColumns();
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
    const user = result.rows[0];

    if (user && user.is_active !== false && ['admin', 'staff'].includes(user.role)) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashToken(resetToken);
      const expiresAt = new Date(Date.now() + RESET_TOKEN_MINUTES * 60 * 1000);
      const resetLink = `${getFrontendUrl()}/reset-password?token=${resetToken}`;

      await pool.query(
        'UPDATE users SET password_reset_token=$1, password_reset_expires=$2, updated_at=NOW() WHERE id=$3',
        [tokenHash, expiresAt, user.id]
      );

      const mailed = await sendResetEmail({ to: normalizedEmail, name: user.name, resetLink });
      if (!mailed) {
        console.warn(`Password reset mail is not configured. Dev reset link for ${normalizedEmail}: ${resetLink}`);
        if (process.env.NODE_ENV !== 'production') response.resetLink = resetLink;
      }
    }

    res.json(response);
  } catch (err) {
    console.error('Forgot password failed:', err);
    res.status(500).json({ message: 'Unable to send reset link. Please try again later.' });
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  const { token, password, confirmPassword } = req.body;
  if (!token || !password || !confirmPassword) {
    return res.status(400).json({ message: 'Reset token, password, and confirm password are required.' });
  }
  if (password !== confirmPassword) return res.status(400).json({ message: 'Passwords do not match.' });
  if (!PASSWORD_POLICY.test(String(password))) {
    return res.status(400).json({ message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.' });
  }

  try {
    await ensureResetColumns();
    const tokenHash = hashToken(token);
    const result = await pool.query(
      'SELECT * FROM users WHERE password_reset_token=$1 AND password_reset_expires > NOW()',
      [tokenHash]
    );
    const user = result.rows[0];
    if (!user) return res.status(400).json({ message: 'Reset link is invalid or expired.' });
    if (user.is_active === false) return res.status(403).json({ message: 'Account is inactive. Contact admin.' });

    const hashed = await bcrypt.hash(password, 10);
    await pool.query(
      'UPDATE users SET password=$1, password_reset_token=NULL, password_reset_expires=NULL, updated_at=NOW() WHERE id=$2',
      [hashed, user.id]
    );

    res.json({ message: 'Password reset successfully. Please login with your new password.' });
  } catch (err) {
    console.error('Reset password failed:', err);
    res.status(500).json({ message: 'Unable to reset password. Please try again later.' });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.userId]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found.' });
    const user = result.rows[0];
    if (user.is_active === false) return res.status(403).json({ message: 'Account is inactive. Contact admin.' });
    res.json(safeUser(user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { login, forgotPassword, resetPassword, getMe };
