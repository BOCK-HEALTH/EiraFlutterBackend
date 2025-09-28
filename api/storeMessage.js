// api/storeMessage.js (JWT Refactored)
const pool = require('./_utils/db');

module.exports = async (req, res) => {
  const { message, sessionId: existingSessionId, title } = req.body;
  if (!message) {
      return res.status(400).json({ error: 'Message content is required.' });
  }

  let client;
  try {
    const userEmail = req.user.email; // Get email securely from the token.
    const userName = req.user.name;   // We can also get the name from the token payload.

    client = await pool.connect();
    await client.query('BEGIN');
    
    // First, ensure the user exists in the 'users' table.
    await client.query(
        'INSERT INTO users (email, name, password) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING',
        [userEmail, userName, 'placeholder_password_not_used'] // We need a value for password, but it's not used here.
    );

    let currentSessionId = existingSessionId;

    if (!currentSessionId) {
        const sessionTitle = title || `Chat on ${new Date().toLocaleDateString()}`;
        const newSessionResult = await client.query(
            "INSERT INTO chat_sessions (user_email, title) VALUES ($1, $2) RETURNING id",
            [userEmail, sessionTitle]
        );
        currentSessionId = newSessionResult.rows[0].id;
    }

    const result = await client.query(
      `INSERT INTO chat_history (user_email, session_id, message, sender) 
       VALUES ($1, $2, $3, 'user') RETURNING *`,
      [userEmail, currentSessionId, message]
    );

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);

  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error('Error storing message:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    if (client) client.release();
  }
};
