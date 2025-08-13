// api/getMessages.js (SECURE)
const pool = require('./_utils/db');
const { getUserEmailFromToken } = require('./_utils/firebase');

module.exports = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const { session_id } = req.query;
  if (!session_id) {
    return res.status(400).json({ error: 'Session ID is required' });
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