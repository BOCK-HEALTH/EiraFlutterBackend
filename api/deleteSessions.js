// deletesession.js

const { Client } = require('pg');
const { getUserEmailFromToken } = require('./_utils/firebase.js');

export default async function handler(req, res) {
    // --- START OF FIX ---
    // Handle the OPTIONS preflight request for CORS before any other logic
    
    // --- END OF FIX ---

    if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method Not Allowed' });
    
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'Session ID required.' });

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized.' });

    const userEmail = await getUserEmailFromToken(token);
    if (!userEmail) return res.status(401).json({ error: 'Invalid token.' });

    const client = new Client({ connectionString: process.env.DATABASE_URL });

    try {
        await client.connect();
        const result = await client.query(
          'DELETE FROM chat_sessions WHERE id = $1 AND user_email = $2',
          [sessionId, userEmail]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: 'Session not found or not owned by user.' });
        return res.status(200).json({ message: 'Session deleted successfully.' });
    } catch (error) {
        console.error('Database error in deleteSession:', error);
        return res.status(500).json({ error: 'Database error.' });
    } finally {
        await client.end();
    }
}