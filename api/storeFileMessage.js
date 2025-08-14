const { IncomingForm } = require('formidable');
const fs = require('fs/promises');
const AWS = require('aws-sdk');
const pool = require('./_utils/db');
const { getUserEmailFromToken } = require('./_utils/firebase');

// Configure the S3 client outside the handler
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

// --- FINALIZED HELPER FUNCTION ---
function getFolderForMimeType(mimeType) {
    if (!mimeType) return 'documents'; // Default for unknown types

    if (mimeType.startsWith('audio/')) {
        return 'audio';
    }
    if (mimeType.startsWith('image/')) {
        return 'image';
    }
    
    // Check for specific document types
    const documentMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv'
    ];

    if (documentMimeTypes.includes(mimeType) || mimeType.startsWith('text/')) {
        return 'documents';
    }
    
    // --- THIS IS THE FIX ---
    // Any remaining file types (which in your case are videos) will now go into the 'video' folder.
    // This directly changes the 'other' folder to be named 'video'.
    return 'video'; 
}
// ------------------------------------

module.exports = async (req, res) => {
    // The rest of the file remains exactly the same...
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const userEmail = await getUserEmailFromToken(token);
    if (!userEmail) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    const form = new IncomingForm();
    let client;

    try {
        const [fields, files] = await form.parse(req);
        
        const messageText = fields.message?.[0] || '';
        const uploadedFile = files.file?.[0];

        if (!uploadedFile) {
            return res.status(400).json({ error: 'File is required' });
        }

        const fileBuffer = await fs.readFile(uploadedFile.filepath);
        const existingSessionId = fields.sessionId?.[0] ? parseInt(fields.sessionId[0], 10) : null;
        let currentSessionId = existingSessionId;

        client = await pool.connect();
        await client.query('BEGIN');

        await client.query('INSERT INTO users (email, name) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING', [userEmail, userEmail.split('@')[0]]);
        
        if (!currentSessionId) {
            const newSessionResult = await client.query(
                "INSERT INTO chat_sessions (user_email, title) VALUES ($1, $2) RETURNING id",
                [userEmail, `Chat with ${uploadedFile.originalFilename}`]
            );
            currentSessionId = newSessionResult.rows[0].id;
        }

        const fileTypeFolder = getFolderForMimeType(uploadedFile.mimetype);
        const s3Key = `${userEmail}/${fileTypeFolder}/${Date.now()}_${uploadedFile.originalFilename}`;

        const uploadParams = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: s3Key,
            Body: fileBuffer,
            ContentType: uploadedFile.mimetype
        };
        const s3Data = await s3.upload(uploadParams).promise();

        const messageQuery = `
          INSERT INTO chat_history (user_email, message, sender, session_id, file_url, file_type) 
          VALUES ($1, $2, 'user', $3, $4, $5) RETURNING *
        `;
        const values = [userEmail, messageText, currentSessionId, [s3Data.Location], [uploadedFile.mimetype]];
        const { rows } = await client.query(messageQuery, values);

        await client.query('COMMIT');
        return res.status(201).json(rows[0]);

    } catch (error) {
        if (client) await client.query('ROLLBACK');
        console.error('Error in storeFileMessage:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (client) client.release();
    }
};