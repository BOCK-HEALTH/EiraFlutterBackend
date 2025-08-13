
const path = require('path');
const {admin} = require(path.resolve(process.cwd(), 'api/_utils/firebase.js'));


const pool = require(path.resolve(process.cwd(), 'api/_utils/db.js'));


module.exports = async (request, response) => {
  if (request.method === 'OPTIONS') return response.status(200).end();

  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return response.status(401).send({ error: 'Unauthorized' });

  }

  let client;
  try {
    const userEmail = await getUserEmailFromToken(token);
    if (!userEmail) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    client = await pool.connect();
    await client.query('BEGIN');

    let currentSessionId = existingSessionId;

    if (!currentSessionId) {
        // Create a new session if one isn't provided
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

