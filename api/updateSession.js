// api/updateSession.js (SECURE)
const pool = require('./_utils/db');
const { getUserEmailFromToken } = require('./_utils/firebase');

module.exports = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const { sessionId, title } = req.body;
  if (!sessionId || !title) {
    return res.status(400).json({ error: 'Session ID and title are required' });
  }

  try {
    const userEmail = await getUserEmailFromToken(token);
    if (!userEmail) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    // Query now includes user_email to ensure ownership
    const result = await pool.query(
      'UPDATE chat_sessions SET title = $1 WHERE id = $2 AND user_email = $3 RETURNING *',
      [title, sessionId, userEmail]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Session not found or not owned by user' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating session:', err);
    res.status(500).json({ error: 'Database error' });
  }
};