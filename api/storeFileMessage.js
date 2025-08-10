// api/storeFileMessage.js (Refactored for S3)
const { IncomingForm } = require('formidable');
const fs = require('fs/promises');
const path = require('path');
const AWS = require('aws-sdk'); // Use the AWS SDK
const { admin } = require(path.resolve(process.cwd(), 'api/_utils/firebase.js'));
const pool = require(path.resolve(process.cwd(), 'api/_utils/db.js')); // Use the new db.js

// Configure the AWS S3 client outside the handler
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const handler = async (request, response) => {
  const client = await pool.connect();
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return response.status(401).send('Unauthorized');
    }
    const idToken = authHeader.split('Bearer ');
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;
    const userEmail = decodedToken.email;
    const userName = decodedToken.name || userEmail.split('@');

    const form = new IncomingForm();
    const files = [], fields = [];
    form.on('field', (fieldName, value) => fields.push({ fieldName, value }));
    form.on('file', (fieldName, file) => files.push({ fieldName, file }));
    await new Promise((resolve, reject) => form.parse(request, (err) => err ? reject(err) : resolve()));

    const messageText = fields.find(f => f.fieldName === 'message')?.value || '';
    const uploadedFile = files?.file;
    if (!uploadedFile) return response.status(400).send('File is required');

    const fileBuffer = await fs.readFile(uploadedFile.filepath);
    const existingSessionIdField = fields.find(f => f.fieldName === 'sessionId')?.value;
    const existingSessionId = existingSessionIdField ? parseInt(existingSessionIdField, 10) : null;
    let currentSessionId = existingSessionId;

    await client.query('BEGIN');
    await client.query('INSERT INTO users (email, name) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING', [userEmail, userName]);

    if (!currentSessionId) {
      const newSessionTitle = `Mobile Session - ${new Date().toLocaleDateString()}`;
      const newSessionResult = await client.query(
        "INSERT INTO chat_sessions (user_email, title) VALUES ($1, $2) RETURNING id",
        [userEmail, newSessionTitle]
      );
      currentSessionId = newSessionResult.rows.id;
    }

    // --- S3 UPLOAD LOGIC ---
    const fileName = `${userId}/${Date.now()}_${uploadedFile.originalFilename}`;
    const uploadParams = {
        Bucket: process.env.S3_BUCKET_NAME, // Your S3 bucket name from .env
        Key: fileName,
        Body: fileBuffer,
        ContentType: uploadedFile.mimetype,
        ACL: 'public-read' // Make the file publicly readable
    };

    const s3Data = await s3.upload(uploadParams).promise();
    const publicUrl = s3Data.Location; // The public URL of the uploaded file
    // --- END S3 LOGIC ---

    const messageQuery = `
      INSERT INTO chat_history (user_email, message, sender, session_id, file_url, file_type)
      VALUES ($1, $2, 'user', $3, $4, $5) RETURNING *
    `;
    const values = [userEmail, messageText, currentSessionId, [publicUrl], [uploadedFile.mimetype]];
    const { rows } = await client.query(messageQuery, values);

    await client.query('COMMIT');
    return response.status(201).json(rows);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in storeFileMessage:', error);
    return response.status(500).send({ error: 'Internal Server Error' });
  } finally {
    client.release();
  }
};

module.exports = handler;