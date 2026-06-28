const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const WORKSPACE_OWNER_ID = Number(process.env.WORKSPACE_OWNER_ID || 1);
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
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required.' });
  res.json({ message: 'If that email exists, a reset link has been sent.' });
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

module.exports = { login, forgotPassword, getMe };
