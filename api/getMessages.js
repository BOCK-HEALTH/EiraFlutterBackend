
const path = require('path');
const {admin} = require(path.resolve(process.cwd(), 'api/_utils/firebase.js'));

const pool = require(path.resolve(process.cwd(), 'api/_utils/db.js'));


module.exports = async (request, response) => {
  if (request.method === 'OPTIONS') return response.status(200).end();

  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return response.status(401).send({ error: 'Unauthorized' });

  }

  try {
    const userEmail = await getUserEmailFromToken(token);
    if (!userEmail) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    // This query now ensures the user owns the session they are requesting messages from
    const result = await pool.query(
      'SELECT * FROM chat_history WHERE session_id = $1 AND user_email = $2 ORDER BY created_at ASC',
      [session_id, userEmail]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: 'Database error' });
  }

};

