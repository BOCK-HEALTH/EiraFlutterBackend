
// api/deleteSession.js (Corrected for Express with Connection Pooling)
// IMPORTANT: Use the shared connection pool, not an individual client
const pool = require(require('path').resolve(process.cwd(), 'api/_utils/db.js'));
const { getUserEmailFromToken } = require(require('path').resolve(process.cwd(), 'api/_utils/firebase.js'));

module.exports = async (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) {
        return res.status(400).json({ error: 'Session ID required.' });
    }

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No token provided.' });
    }

    let client; // Define client outside the try block for the finally block

    try {
        const userEmail = await getUserEmailFromToken(token);
        if (!userEmail) {
            return res.status(401).json({ error: 'Unauthorized: Invalid token.' });
        }

        // 1. Get a client from the connection pool
        client = await pool.connect();

        // 2. Execute the query
        const result = await client.query(
          'DELETE FROM chat_sessions WHERE id = $1 AND user_email = $2',
          [sessionId, userEmail]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Session not found or you do not have permission to delete it.' });
        }

        return res.status(200).json({ message: 'Session deleted successfully.' });

    } catch (error) {
        console.error('Database error in deleteSession:', error);
        return res.status(500).json({ error: 'Internal Server Error.' });
    } finally {
        // 3. Release the client back to the pool
        if (client) {
            client.release();
        }
    }
};

