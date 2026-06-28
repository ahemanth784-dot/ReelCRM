const bcrypt = require('bcryptjs');
const pool = require('../db');

const PASSWORD_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const ensureUserColumns = async () => {
  try {
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100) UNIQUE');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE');
  } catch (err) {
    // Mock DB ignores ALTER TABLE; real DB should support it.
  }
};

const toSafeStaff = row => ({
  id: row.id,
  fullName: row.name,
  name: row.name,
  email: row.email,
  username: row.username || '',
  role: 'staff',
  isActive: row.is_active !== false,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const validatePassword = password => PASSWORD_POLICY.test(String(password || ''));

const getStaff = async (req, res) => {
  try {
    await ensureUserColumns();
    const result = await pool.query(
      `SELECT id, name, email, username, role, is_active, created_at, updated_at
       FROM users WHERE role = 'staff' ORDER BY created_at DESC`
    );
    res.json({ staff: result.rows.map(toSafeStaff) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const createStaff = async (req, res) => {
  const { fullName, name, email, username, password, confirmPassword } = req.body;
  const staffName = String(fullName || name || '').trim();
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!staffName || !normalizedEmail || !password || !confirmPassword) {
    return res.status(400).json({ message: 'Full name, email, password, and confirm password are required.' });
  }
  if (!/\S+@\S+\.\S+/.test(normalizedEmail)) return res.status(400).json({ message: 'Valid email is required.' });
  if (password !== confirmPassword) return res.status(400).json({ message: 'Passwords do not match.' });
  if (!validatePassword(password)) {
    return res.status(400).json({ message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.' });
  }

  try {
    await ensureUserColumns();
    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (exists.rows.length) return res.status(409).json({ message: 'Email already exists.' });

    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, username, password, role, is_active)
       VALUES ($1, $2, $3, $4, 'staff', TRUE)
       RETURNING id, name, email, username, role, is_active, created_at, updated_at`,
      [staffName, normalizedEmail, username ? String(username).trim() : null, hashed]
    );
    res.status(201).json(toSafeStaff(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const updateStaff = async (req, res) => {
  const { fullName, name, email, username, isActive } = req.body;
  const staffName = String(fullName || name || '').trim();
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!staffName || !normalizedEmail) return res.status(400).json({ message: 'Full name and email are required.' });
  if (!/\S+@\S+\.\S+/.test(normalizedEmail)) return res.status(400).json({ message: 'Valid email is required.' });

  try {
    await ensureUserColumns();
    const duplicate = await pool.query('SELECT id FROM users WHERE email = $1 AND id <> $2', [normalizedEmail, req.params.id]);
    if (duplicate.rows.length) return res.status(409).json({ message: 'Email already exists.' });

    const result = await pool.query(
      `UPDATE users SET name=$1, email=$2, username=$3, is_active=$4, updated_at=NOW()
       WHERE id=$5 AND role='staff'
       RETURNING id, name, email, username, role, is_active, created_at, updated_at`,
      [staffName, normalizedEmail, username ? String(username).trim() : null, isActive !== false, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Staff member not found.' });
    res.json(toSafeStaff(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const resetStaffPassword = async (req, res) => {
  const { password, confirmPassword } = req.body;
  if (!password || !confirmPassword) return res.status(400).json({ message: 'Password and confirm password are required.' });
  if (password !== confirmPassword) return res.status(400).json({ message: 'Passwords do not match.' });
  if (!validatePassword(password)) {
    return res.status(400).json({ message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.' });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `UPDATE users SET password=$1, updated_at=NOW()
       WHERE id=$2 AND role='staff'
       RETURNING id, name, email, username, role, is_active, created_at, updated_at`,
      [hashed, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Staff member not found.' });
    res.json({ message: 'Password reset successfully.', staff: toSafeStaff(result.rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const deleteStaff = async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM users WHERE id=$1 AND role='staff' RETURNING id, name, email, username, role, is_active, created_at, updated_at`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Staff member not found.' });
    res.json({ message: 'Staff member deleted.', staff: toSafeStaff(result.rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getStaff, createStaff, updateStaff, resetStaffPassword, deleteStaff };
