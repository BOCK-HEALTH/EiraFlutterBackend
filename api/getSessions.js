// eira-backend/api/getSessions.js

const path = require('path');
const {admin} = require(path.resolve(process.cwd(), 'api/_utils/firebase.js'));

const pool = require(path.resolve(process.cwd(), 'api/_utils/db.js'));


module.exports = async (request, response) => {
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return response.status(401).send({ error: 'Unauthorized: No token provided' });
  }
  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userEmail = decodedToken.email;

    if (!userEmail) {
      return response.status(400).send({ error: 'User email not found in token.' });
    }

    // Query the chat_sessions table for the user's email, newest first
    const query = 'SELECT * FROM chat_sessions WHERE user_email = $1 ORDER BY created_at DESC';
    const { rows } = await pool.query(query, [userEmail]);

    return response.status(200).json(rows);

  } catch (error) {
    console.error("Error in getSessions:", error);
    return response.status(500).send({ error: 'Internal Server Error' });
  }

};

