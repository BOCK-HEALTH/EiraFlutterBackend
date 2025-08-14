// setupDatabase.js
const pool = require('./api/_utils/db');

// All the correct CREATE TABLE commands are here in one multi-line string.
const createTablesQuery = `
  DROP TABLE IF EXISTS chat_history;
  DROP TABLE IF EXISTS chat_sessions;
  DROP TABLE IF EXISTS users;

  CREATE TABLE users (
      email VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255),
      created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE chat_sessions (
      id SERIAL PRIMARY KEY,
      user_email VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE chat_history (
      id SERIAL PRIMARY KEY,
      user_email VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
      session_id INTEGER NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
      message TEXT,
      sender VARCHAR(50),
      file_url TEXT[],
      file_type TEXT[],
      created_at TIMESTAMPTZ DEFAULT NOW()
  );
`;

async function setup() {
  let client;
  try {
    console.log("Connecting to the database...");
    client = await pool.connect();
    console.log("Successfully connected!");

    console.log("Running setup script to create tables...");
    await client.query(createTablesQuery);
    console.log("SUCCESS: Database tables created successfully!");

  } catch (err) {
    console.error("ERROR: Failed to set up the database.", err);
  } finally {
    if (client) {
      client.release();
      console.log("Database connection released.");
    }
    pool.end(); // Close the pool to allow the script to exit
  }
}

// Run the setup function
setup();