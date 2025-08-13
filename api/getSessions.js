// api/getSessions.js (SECURE)
const pool = require('./_utils/db');
const { getUserEmailFromToken } = require('./_utils/firebase');


const path = require('path');
const {admin} = require(path.resolve(process.cwd(), 'api/_utils/firebase.js'));

const pool = require(path.resolve(process.cwd(), 'api/_utils/db.js'));


module.exports = async (request, response) => {
  if (request.method === 'OPTIONS') {
    return response.status(200).end();

  }

  try {
    const userEmail = await getUserEmailFromToken(token);
    if (!userEmail) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    const result = await pool.query(
      'SELECT * FROM chat_sessions WHERE user_email = $1 ORDER BY created_at DESC',
      [userEmail] // Use the verified email
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching sessions:', err);
    res.status(500).json({ error: 'Database error' });
  }

};

