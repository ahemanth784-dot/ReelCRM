require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required to initialize PostgreSQL.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const initialize = async () => {
  try {
    const schema = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('Database schema initialized successfully.');

    const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM users');
    if (rows[0].count === 0) {
      const seed = fs.readFileSync(path.join(__dirname, '../db/seed.sql'), 'utf8');
      await pool.query(seed);
      console.log('Database demo data initialized successfully.');
    }
  } finally {
    await pool.end();
  }
};

initialize().catch(error => {
  console.error('Database initialization failed:', error);
  process.exit(1);
});
