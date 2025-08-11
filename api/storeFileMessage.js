<<<<<<< HEAD
const fs = require('fs/promises');
const { IncomingForm } = require('formidable');
const path = require('path');
const {admin} = require(path.resolve(process.cwd(), 'api/_utils/firebase.js'));
const pool = require(path.resolve(process.cwd(), 'api/_utils/neon.js'));

const handler = async (request, response) => {
  // --- START OF FIX ---
  // Handle the OPTIONS preflight request for CORS
  if (request.method === 'OPTIONS') {
    response.setHeader('Access-Control-Allow-Credentials', 'true');
    response.setHeader('Access-Control-Allow-Origin', '*'); // Or your specific domain
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    return response.status(204).end();
  }
  // --- END OF FIX ---


  if (request.method !== 'POST') {
    // This now only catches other non-allowed methods like GET, PUT, etc.
    return response.status(405).send('Method Not Allowed');
  }

  const client = await pool.connect();

  try {
    // ... all of your existing file upload logic remains the same ...
=======
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
>>>>>>> 4488980 (Initial backend deployment setup)
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return response.status(401).send('Unauthorized');
    }
<<<<<<< HEAD
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;
    const userEmail = decodedToken.email;
    const userName = decodedToken.name || userEmail.split('@')[0];

    const form = new IncomingForm();

    const files = [], fields = [];
    form.on('field', (fieldName, value) => fields.push({ fieldName, value }));
    form.on('file', (fieldName, file) => {
      files.push({ fieldName, file });
    });

    await new Promise((resolve, reject) => form.parse(request, (err) => err ? reject(err) : resolve()));

    const messageText = fields.find(f => f.fieldName === 'message')?.value || '';
    const uploadedFile = files[0]?.file;
    if (!uploadedFile) return response.status(400).send('File is required');

    const tempFilePath = uploadedFile.filepath;
    const fileBuffer = await fs.readFile(tempFilePath);

=======
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
>>>>>>> 4488980 (Initial backend deployment setup)
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
<<<<<<< HEAD
      currentSessionId = newSessionResult.rows[0].id;
    }

    const bucket = admin.storage().bucket();
    const fileName = `${userId}/${Date.now()}_${uploadedFile.originalFilename}`;
    const file = bucket.file(fileName);
    await file.save(fileBuffer, { metadata: { contentType: uploadedFile.mimetype } });
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;

    const messageQuery = `
      INSERT INTO chat_history (user_email, message, sender, session_id, file_url, file_type) 
      VALUES ($1, $2, 'user', $3, $4, $5) RETURNING *
    `;
    
    const values = [userEmail, messageText, currentSessionId, [publicUrl], [uploadedFile.mimetype]];
    
    const { rows } = await client.query(messageQuery, values);

    await client.query('COMMIT');
    return response.status(201).json(rows[0]);
=======
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
>>>>>>> 4488980 (Initial backend deployment setup)

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in storeFileMessage:', error);
    return response.status(500).send({ error: 'Internal Server Error' });
  } finally {
    client.release();
  }
};

<<<<<<< HEAD
module.exports = handler;
module.exports.config = {
  api: {
    bodyParser: false,
  },
};
=======
module.exports = handler;
>>>>>>> 4488980 (Initial backend deployment setup)
