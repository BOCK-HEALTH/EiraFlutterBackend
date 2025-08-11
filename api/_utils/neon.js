const { Pool } = require('pg');

// Load environment variables locally
require('dotenv').config({ path: '.env.development' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    // This is required to connect to Neon
    rejectUnauthorized: false,
  },
});

module.exports = pool;
