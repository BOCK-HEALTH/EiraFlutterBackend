// api/storeFileMessage.js (DEFINITIVE VERSION 5.0)
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

// --- DEFINITIVE HELPER FUNCTION ---
// This version uses a two-layered check: first MIME type, then filename extension as a fallback.
// This is the most robust way to categorize files.
function getFolderForFile(file) {
    // Layer 1: Check the MIME type first.
    if (file.mimetype) {
        if (file.mimetype.startsWith('video/')) return 'video';
        if (file.mimetype.startsWith('audio/')) return 'audio';
        if (file.mimetype.startsWith('image/')) return 'image';
    }

    // Layer 2 (Fallback): If MIME type is missing or doesn't match, check the file extension.
    if (file.originalFilename) {
        const extension = file.originalFilename.split('.').pop().toLowerCase();

        const videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'wmv'];
        const audioExtensions = ['mp3', 'wav', 'm4a', 'aac', 'flac'];
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'];
        const docExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'];

        if (videoExtensions.includes(extension)) return 'video';
        if (audioExtensions.includes(extension)) return 'audio';
        if (imageExtensions.includes(extension)) return 'image';
        if (docExtensions.includes(extension)) return 'documents';
    }

    // If both checks fail, place it in 'other'.
    return 'other';
}
// ------------------------------------

module.exports = async (req, res) => {
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

        // Call the new, robust function
        const fileTypeFolder = getFolderForFile(uploadedFile);
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