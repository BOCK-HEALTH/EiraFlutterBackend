const path = require('path');
const {admin} = require(path.resolve(process.cwd(), 'api/_utils/firebase.js'));
const pool = require(path.resolve(process.cwd(), 'api/_utils/neon.js'));

module.exports = async (request, response) => {
  if (request.method === 'OPTIONS') return response.status(200).end();

  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return response.status(401).send({ error: 'Unauthorized' });
  }
  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userEmail = decodedToken.email;
    const { sessionId } = request.query; // Get sessionId from URL query: ?sessionId=123

    let query;
    let queryParams;

    if (sessionId) {
      // If a specific session is requested, fetch messages for it
      query = 'SELECT * FROM chat_history WHERE user_email = $1 AND session_id = $2 ORDER BY created_at ASC';
      queryParams = [userEmail, sessionId];
    } else {
      // If no session is specified, fetch messages from the user's MOST RECENT session
      query = `
        SELECT * FROM chat_history 
        WHERE session_id = (
          SELECT id FROM chat_sessions 
          WHERE user_email = $1 
          ORDER BY created_at DESC 
          LIMIT 1
        )
        ORDER BY created_at ASC
      `;
      queryParams = [userEmail];
    }
    
    const { rows } = await pool.query(query, queryParams);
    return response.status(200).json(rows);

  } catch (error) {
    console.error("Error in getMessages:", error);
    return response.status(500).send({ error: 'Internal Server Error' });
  }
};
