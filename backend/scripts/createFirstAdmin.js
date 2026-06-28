require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const PASSWORD_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const requireEnv = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
};

const pool = new Pool({
  connectionString: requireEnv('DATABASE_URL'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const createFirstAdmin = async () => {
  const fullName = process.env.FIRST_ADMIN_NAME || 'Admin User';
  const email = requireEnv('FIRST_ADMIN_EMAIL').trim().toLowerCase();
  const password = requireEnv('FIRST_ADMIN_PASSWORD');

  if (!/\S+@\S+\.\S+/.test(email)) throw new Error('FIRST_ADMIN_EMAIL must be a valid email address.');
  if (!PASSWORD_POLICY.test(password)) {
    throw new Error('FIRST_ADMIN_PASSWORD must be at least 8 characters and include uppercase, lowercase, number, and symbol.');
  }

  const schema = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
  await pool.query(schema);

  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100) UNIQUE');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE');

  const existingAdmins = await pool.query("SELECT COUNT(*)::int AS count FROM users WHERE role = 'admin'");
  if (existingAdmins.rows[0].count > 0) {
    console.log('Admin already exists. No new admin was created.');
    return;
  }

  const duplicate = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (duplicate.rows.length) throw new Error('A user with FIRST_ADMIN_EMAIL already exists but is not an admin.');

  const passwordHash = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO users (name, email, password, role, is_active)
     VALUES ($1, $2, $3, 'admin', TRUE)`,
    [fullName.trim(), email, passwordHash]
  );
  console.log(`First admin created securely for ${email}.`);
};

createFirstAdmin()
  .catch(error => {
    console.error('First admin creation failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
