// api/deleteSession.js (FINAL SECURE CODE)
// api/deleteSession.js (JWT Refactored)
const pool = require('./_utils/db');

module.exports = async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required.' });
  }

  try {
    const userEmail = req.user.email; // Get email securely from the token.
    
    const result = await pool.query(
      'DELETE FROM chat_sessions WHERE id = $1 AND user_email = $2', 
      [sessionId, userEmail]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Session not found or not owned by user.' });
    }
    res.status(200).json({ message: 'Session deleted successfully.' });
  } catch (err) {
    console.error('Error deleting session:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
