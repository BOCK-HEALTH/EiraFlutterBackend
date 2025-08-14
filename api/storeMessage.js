// api/storeMessage.js (FINAL CORRECTED CODE)
const pool = require('./_utils/db');
const { getUserEmailFromToken } = require('./_utils/firebase');

module.exports = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  
  const { message, sessionId: existingSessionId, title } = req.body;
  if (!message) {
      return res.status(400).json({ error: 'Message content is required.' });
  }

  let client;
  try {
    const userEmail = await getUserEmailFromToken(token);
    if (!userEmail) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    client = await pool.connect();
    await client.query('BEGIN');

    // --- THIS IS THE FIX ---
    // First, ensure the user exists in the 'users' table before doing anything else.
    // The ON CONFLICT clause makes this a safe "upsert" - it does nothing if the user already exists.
    await client.query(
        'INSERT INTO users (email, name) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING',
        [userEmail, userEmail.split('@')[0]] // Use the email as the name for simplicity
    );
    // ----------------------

    let currentSessionId = existingSessionId;

    if (!currentSessionId) {
        // Now that the user is guaranteed to exist, this INSERT will succeed.
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
    res.status(500).json({ error: 'Database error' });
  } finally {
    if (client) client.release();
  }
};