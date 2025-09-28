// api/getMessages.js (JWT Refactored)
const pool = require('./_utils/db');

module.exports = async (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required.' });
  }

  try {
    const userEmail = req.user.email; // Get email securely from the token.
    if (!userEmail) {
      return res.status(403).json({ error: 'Forbidden: User email not found in token.' });
    }
    
    // This query is now secure, ensuring the user owns the session they are requesting.
    const result = await pool.query(
      'SELECT * FROM chat_history WHERE session_id = $1 AND user_email = $2 ORDER BY created_at ASC',
      [sessionId, userEmail]
    );
    res.json(result.rows);
  } catch (err)
 {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
