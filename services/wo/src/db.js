const { Pool } = require('pg');

// Parse DATABASE_URL manually
const DATABASE_URL = process.env.DATABASE_URL || '';
const url = new URL(DATABASE_URL);

const pool = new Pool({
  host: url.hostname,
  port: url.port,
  database: url.pathname.slice(1),
  user: url.username,
  password: url.password
});

module.exports = pool;
