const path = require('path');
const {admin} = require(path.resolve(process.cwd(), 'api/_utils/firebase.js'));


const pool = require(path.resolve(process.cwd(), 'api/_utils/db.js'));


module.exports = async (request, response) => {
  if (request.method === 'OPTIONS') return response.status(200).end();

  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return response.status(401).send({ error: 'Unauthorized' });
  }

  const client = await pool.connect();

  try {
    const decodedToken = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
    const userEmail = decodedToken.email;
    const userName = decodedToken.name || userEmail.split('@')[0];
    const { message, sessionId: existingSessionId } = request.body; // <-- Get sessionId from request

    if (!userEmail || !message) {
      return response.status(400).send({ error: 'Email and message required.' });
    }

    await client.query('BEGIN');

    // Upsert user (this logic is correct)
    await client.query('INSERT INTO users (email, name) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING', [userEmail, userName]);

    let currentSessionId = existingSessionId;

    // --- THIS IS THE NEW CORE LOGIC ---
    // If the app did not provide a session ID, it means this is a NEW chat.
    if (!currentSessionId) {
      // Create a brand new session with a unique title
      const newSessionTitle = `Mobile Session - ${new Date().toLocaleDateString()}`;
      const newSessionResult = await client.query(
        "INSERT INTO chat_sessions (user_email, title) VALUES ($1, $2) RETURNING id",
        [userEmail, newSessionTitle]
      );
      currentSessionId = newSessionResult.rows[0].id;
    }

    // Insert the message into chat_history with the correct session ID
    const messageQuery = `
      INSERT INTO chat_history (user_email, message, sender, session_id) 
      VALUES ($1, $2, 'user', $3) RETURNING *
    `;
    const { rows } = await client.query(messageQuery, [userEmail, message, currentSessionId]);

    await client.query('COMMIT');
    return response.status(201).json(rows[0]);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error in storeMessage:", error);
    return response.status(500).send({ error: 'Internal Server Error' });
  } finally {
    client.release();
  }

};

