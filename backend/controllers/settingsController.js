const pool = require('../db');
const bcrypt = require('bcryptjs');

// GET /api/settings/profile
const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id,name,email,role,studio_name,studio_phone,studio_address,avatar_url,created_at FROM users WHERE id=$1',
      [req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ message:'User not found.' });
    res.json(result.rows[0]);
  } catch(err) { res.status(500).json({ message:'Server error.' }); }
};

// PUT /api/settings/profile
const updateProfile = async (req, res) => {
  const { name, studio_name, studio_phone, studio_address } = req.body;
  try {
    const result = await pool.query(
      `UPDATE users SET name=$1,studio_name=$2,studio_phone=$3,studio_address=$4,updated_at=NOW() WHERE id=$5 RETURNING id,name,email,role,studio_name,studio_phone,studio_address`,
      [name, studio_name, studio_phone, studio_address, req.user.id]
    );
    res.json(result.rows[0]);
  } catch(err) { res.status(500).json({ message:'Server error.' }); }
};

// PUT /api/settings/change-password
const changePassword = async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) return res.status(400).json({ message:'Both passwords required.' });
  try {
    const result = await pool.query('SELECT id,password FROM users WHERE email=$1', [req.user.email]);
    if (!result.rows.length) return res.status(404).json({ message:'User not found.' });
    const valid = await bcrypt.compare(current_password, result.rows[0].password);
    if (!valid) return res.status(400).json({ message:'Current password is incorrect.' });
    const hashed = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password=$1,updated_at=NOW() WHERE id=$2', [hashed, result.rows[0].id]);
    res.json({ message:'Password updated successfully.' });
  } catch(err) { res.status(500).json({ message:'Server error.' }); }
};

module.exports = { getProfile, updateProfile, changePassword };



