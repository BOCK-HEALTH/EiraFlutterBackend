// api/updateSession.js (FINAL SECURE CODE)
// api/updateSession.js (JWT Refactored)
const pool = require('./_utils/db');

module.exports = async (req, res) => {
  const { sessionId, title } = req.body;
  if (!sessionId || !title) {
    return res.status(400).json({ error: 'Session ID and title are required.' });
  }

  try {
    const userEmail = req.user.email; // Get email securely from the token.

    const result = await pool.query(
      'UPDATE chat_sessions SET title = $1 WHERE id = $2 AND user_email = $3 RETURNING *',
      [title, sessionId, userEmail]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Session not found or not owned by user.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating session:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
