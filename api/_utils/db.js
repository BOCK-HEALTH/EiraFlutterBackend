// api/_utils/db.js
const { Pool } = require('pg');

// This single line reads all connection details from the DATABASE_URL environment variable.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for cloud providers like AWS RDS
  },
});

module.exports = pool;