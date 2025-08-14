// api/deleteSession.js (FINAL SECURE CODE)
const pool = require('./_utils/db');
const { getUserEmailFromToken } = require('./_utils/firebase');

module.exports = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const { sessionId } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  try {
    const userEmail = await getUserEmailFromToken(token);
    if (!userEmail) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    const result = await pool.query(
      'DELETE FROM chat_sessions WHERE id = $1 AND user_email = $2', 
      [sessionId, userEmail]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Session not found or not owned by user' });
    }
    res.status(200).json({ message: 'Session deleted successfully' });
  } catch (err) {
    console.error('Error deleting session:', err);
    res.status(500).json({ error: 'Database error' });
  }
};