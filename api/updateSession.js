// updatesession.js

const { Client } = require('pg');
const { getUserEmailFromToken } = require('./_utils/firebase.js');

export default async function handler(req, res) {
  // --- START OF FIX ---
  // Handle the OPTIONS preflight request for CORS before any other logic
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*'); // Or your specific domain
    res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    return res.status(204).end();
  }
  // --- END OF FIX ---

  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method Not Allowed' });

  const { sessionId, title } = req.body;
  if (!sessionId || !title) return res.status(400).json({ error: 'Session ID and title required.' });

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized.' });
  
  const userEmail = await getUserEmailFromToken(token);
  if (!userEmail) return res.status(401).json({ error: 'Invalid token.' });
  
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  
  try {
    await client.connect();
    const result = await client.query(
      'UPDATE chat_sessions SET title = $1 WHERE id = $2 AND user_email = $3',
      [title, sessionId, userEmail]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Session not found or not owned by user.' });
    return res.status(200).json({ message: 'Session updated successfully.' });
  } catch (error) {
    console.error('Database error in updateSession:', error);
    return res.status(500).json({ error: 'Database error.' });
  } finally {
    await client.end();
  }
}