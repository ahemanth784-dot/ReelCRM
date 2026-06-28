require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const PASSWORD_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required to initialize PostgreSQL.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const maybeCreateFirstAdmin = async () => {
  const email = String(process.env.FIRST_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.FIRST_ADMIN_PASSWORD;
  const name = String(process.env.FIRST_ADMIN_NAME || 'Admin User').trim();

  if (!email && !password) {
    console.log('No users found. Set FIRST_ADMIN_EMAIL and FIRST_ADMIN_PASSWORD, or run npm run create-admin, to create the first admin.');
    return;
  }

  if (!email || !password) throw new Error('Both FIRST_ADMIN_EMAIL and FIRST_ADMIN_PASSWORD are required to create the first admin.');
  if (!/\S+@\S+\.\S+/.test(email)) throw new Error('FIRST_ADMIN_EMAIL must be a valid email address.');
  if (!PASSWORD_POLICY.test(password)) {
    throw new Error('FIRST_ADMIN_PASSWORD must be at least 8 characters and include uppercase, lowercase, number, and symbol.');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO users (name, email, password, role, is_active)
     VALUES ($1, $2, $3, 'admin', TRUE)`,
    [name, email, passwordHash]
  );
  console.log(`First admin created securely for ${email}.`);
};

const initialize = async () => {
  try {
    const schema = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('Database schema initialized successfully.');

    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100) UNIQUE');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255)');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP');

    const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM users');
    if (rows[0].count === 0) await maybeCreateFirstAdmin();
  } finally {
    await pool.end();
  }
};

initialize().catch(error => {
  console.error('Database initialization failed:', error);
  process.exit(1);
});

