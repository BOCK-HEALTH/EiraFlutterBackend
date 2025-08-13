
// updatesession.js

const { Client } = require('pg');
const { getUserEmailFromToken } = require('./_utils/firebase.js');

module.exports = async (request, response) => {
  // --- START OF FIX ---
  // Handle the OPTIONS preflight request for CORS before any other logic
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*'); // Or your specific domain
    res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    return res.status(204).end();

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

}
