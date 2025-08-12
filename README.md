Eira Backend – AWS Deployment Guide
Overview
This guide provides comprehensive instructions for setting up and deploying the Eira Backend on an AWS EC2 instance, integrating with AWS RDS (PostgreSQL), S3, and Firebase for authentication. It includes steps to set up the project in VS Code, refactor the code for an Express.js server, configure AWS infrastructure, and deploy securely while avoiding common pitfalls like committing sensitive credentials to GitHub.

Prerequisites

AWS Account with access to:
EC2 (for hosting the server)
RDS (for PostgreSQL database)
S3 (for file storage)
IAM (for managing access keys)


GitHub Account with a repository for the backend code
Node.js installed locally and on the EC2 instance
VS Code for local development
Basic Knowledge of SSH, Linux commands, and Git
Firebase Project with Admin SDK credentials for authentication
PM2 for process management on the server


Phase 1: Project Setup in VS Code
Step 1: Create a New Project Folder

Create a folder named eira-aws-backend on your computer.
Open VS Code, go to File > Open Folder..., and select eira-aws-backend.

Step 2: Open the Integrated Terminal

In VS Code, open the terminal with Ctrl+** (or **Cmd+ on Mac). All commands will be run in this terminal.

Step 3: Initialize Your Node.js Project
Run the following command to create a package.json file:
npm init -y

Step 4: Install Necessary Libraries
Install the required dependencies for the backend:
npm install express pg dotenv cors formidable aws-sdk firebase-admin

Step 5: Create Your File Structure
Run these commands to set up the project directories and files:
mkdir -p api/_utils
touch server.js
touch .env.development
touch .gitignore

Step 6: Populate the .gitignore File
Open .gitignore in VS Code and add:
# Dependencies
/node_modules

# Environment variables
.env
.env.development

Step 7: Copy Your Old Files
From your original EiraFlutterBackend project, copy all JavaScript files from the api and api/_utils folders into the corresponding folders in eira-aws-backend. Your VS Code explorer should look like:
eira-aws-backend/
├── api/
│   ├── _utils/
│   │   ├── firebase.js
│   │   └── neon.js
│   ├── deleteSession.js
│   ├── getMessages.js
│   ├── getSessions.js
│   ├── storeFileMessage.js
│   ├── storeMessage.js
│   └── updateSession.js
├── .gitignore
├── node_modules/
├── package.json
├── package-lock.json
└── server.js


Phase 2: Refactoring the Code for an Express Server
Step 1: Rename neon.js to db.js
In VS Code, right-click api/_utils/neon.js and rename it to db.js. Replace its contents with:
// api/_utils/db.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

module.exports = pool;

Step 2: Update File Imports
In all route files (getMessages.js, getSessions.js, etc.), replace require('.../neon.js') with require('.../db.js'). Use VS Code’s search and replace (Ctrl+Shift+F) for efficiency.
Step 3: Build the Main server.js File
Open server.js and add the following code to create an Express.js server:
// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');

require('dotenv').config({ path: '.env.development' });

const getSessionsHandler = require('./api/getSessions.js');
const getMessagesHandler = require('./api/getMessages.js');
const storeMessageHandler = require('./api/storeMessage.js');
const storeFileMessageHandler = require('./api/storeFileMessage.js');
const deleteSessionHandler = require('./api/deleteSession.js');
const updateSessionHandler = require('./api/updateSession.js');

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get('/api/getSessions', getSessionsHandler);
app.get('/api/getMessages', getMessagesHandler);
app.post('/api/storeMessage', storeMessageHandler);
app.post('/api/storeFileMessage', storeFileMessageHandler);
app.delete('/api/deleteSession', deleteSessionHandler);
app.put('/api/updateSession', updateSessionHandler);

app.get('/', (req, res) => {
  res.status(200).send('Eira Backend Server is running!');
});

app.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
});

Step 4: Refactor storeFileMessage.js for Amazon S3
Replace the entire contents of api/storeFileMessage.js with:
// api/storeFileMessage.js
const { IncomingForm } = require('formidable');
const fs = require('fs/promises');
const path = require('path');
const AWS = require('aws-sdk');
const { admin } = require(path.resolve(process.cwd(), 'api/_utils/firebase.js'));
const pool = require(path.resolve(process.cwd(), 'api/_utils/db.js'));

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const handler = async (request, response) => {
  const client = await pool.connect();
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return response.status(401).send('Unauthorized');
    }
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;
    const userEmail = decodedToken.email;
    const userName = decodedToken.name || userEmail.split('@')[0];

    const form = new IncomingForm();
    const files = [], fields = [];
    form.on('field', (fieldName, value) => fields.push({ fieldName, value }));
    form.on('file', (fieldName, file) => files.push({ fieldName, file }));
    await new Promise((resolve, reject) => form.parse(request, (err) => err ? reject(err) : resolve()));

    const messageText = fields.find(f => f.fieldName === 'message')?.value || '';
    const uploadedFile = files[0]?.file;
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
        'INSERT INTO chat_sessions (user_email, title) VALUES ($1, $2) RETURNING id',
        [userEmail, newSessionTitle]
      );
      currentSessionId = newSessionResult.rows[0].id;
    }

    const fileName = `${userId}/${Date.now()}_${uploadedFile.originalFilename}`;
    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      Body: fileBuffer,
      ContentType: uploadedFile.mimetype,
      ACL: 'public-read',
    };

    const s3Data = await s3.upload(uploadParams).promise();
    const publicUrl = s3Data.Location;

    const messageQuery = `
      INSERT INTO chat_history (user_email, message, sender, session_id, file_url, file_type)
      VALUES ($1, $2, 'user', $3, $4, $5) RETURNING *
    `;
    const values = [userEmail, messageText, currentSessionId, publicUrl, uploadedFile.mimetype];
    const { rows } = await client.query(messageQuery, values);

    await client.query('COMMIT');
    return response.status(201).json(rows[0]);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in storeFileMessage:', error);
    return response.status(500).send({ error: 'Internal Server Error' });
  } finally {
    client.release();
  }
};

module.exports = handler;

Step 5: Clean Up Old Route Files
In deleteSession.js, updateSession.js, and storeFileMessage.js, remove any if (req.method === 'OPTIONS') { ... } blocks, as the cors middleware in server.js handles this.
Step 6: Fill in .env.development
Open .env.development and add:
# DATABASE
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# AWS
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION="us-east-1"
S3_BUCKET_NAME=""

# FIREBASE
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-....@...iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"


Phase 3: AWS Infrastructure Setup
Step 1: Create an RDS PostgreSQL Database

In the AWS Console, go to RDS > Create Database.
Choose PostgreSQL, select Free Tier, and configure:
DB instance identifier: eira-backend-db
Master username and password (save securely)
Publicly accessible: Yes
VPC security group: Create a new one with inbound rule for PostgreSQL (port 5432)


Note the Database Endpoint URL, Master Username, and Master Password.

Step 2: Create an S3 Bucket

Go to S3 > Create Bucket.
Name it (e.g., eira-backend-files), select your region (e.g., us-east-1).
Uncheck Block all public access and add this bucket policy:{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::eira-backend-files/*"
    }
  ]
}


Note the Bucket Name and AWS Region.

Step 3: Create an IAM User

Go to IAM > Users > Create User.
Name it eira-backend-user, select Programmatic access.
Attach the AmazonS3FullAccess policy (for production, use a more restrictive policy).
Create the user and save the Access Key ID and Secret Access Key.

Step 4: Launch an EC2 Instance

Go to EC2 > Launch Instance.
Choose Ubuntu Server (e.g., 20.04 LTS), select t2.micro (Free Tier).
Create and download a .pem key pair.
Configure the security group with inbound rules:
SSH (port 22): Your IP
HTTP (port 80): 0.0.0.0/0
HTTPS (port 443): 0.0.0.0/0
Custom TCP (port 8080): 0.0.0.0/0


Launch the instance and note the Public IP Address.

Step 5: Link EC2 and RDS Security
Edit the RDS security group to allow inbound traffic on port 5432 from the EC2 instance’s security group.

Phase 4: Final Deployment from VS Code
Step 1: Update .env.development
Fill in .env.development with your AWS and Firebase credentials:
DATABASE_URL="postgresql://YOUR_RDS_USER:YOUR_RDS_PASSWORD@YOUR_RDS_ENDPOINT:5432/postgres"
AWS_ACCESS_KEY_ID="your_access_key"
AWS_SECRET_ACCESS_KEY="your_secret_key"
AWS_REGION="us-east-1"
S3_BUCKET_NAME="eira-backend-files"
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-....@...iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

Step 2: Push Your Code to GitHub
git init
git add .
git commit -m "Initial refactored backend"
git branch -M main
git remote add origin https://github.com/your-username/eira-aws-backend.git
git push -u origin main

Step 3: Connect to Your EC2 Server
chmod 400 /path/to/your-key-file.pem
ssh -i "/path/to/your-key-file.pem" ubuntu@YOUR_EC2_PUBLIC_IP_ADDRESS

Step 4: Set Up the Server
On the EC2 instance, run:
sudo apt update
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs git
sudo npm install pm2 -g

Step 5: Deploy the Code
git clone https://github.com/your-username/eira-aws-backend.git
cd eira-aws-backend
npm install

Step 6: Configure Environment Variables
Create a .env file:
cp .env.development .env
nano .env

Fill in the .env file with the same values as .env.development. Alternatively, set environment variables in ~/.bashrc:
nano ~/.bashrc

Add:
export DATABASE_URL="postgresql://YOUR_RDS_USER:YOUR_RDS_PASSWORD@YOUR_RDS_ENDPOINT:5432/postgres"
export AWS_ACCESS_KEY_ID="your_access_key"
export AWS_SECRET_ACCESS_KEY="your_secret_key"
export AWS_REGION="us-east-1"
export S3_BUCKET_NAME="eira-backend-files"
export FIREBASE_PROJECT_ID="your-project-id"
export FIREBASE_CLIENT_EMAIL="firebase-adminsdk-....@...iam.gserviceaccount.com"
export FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

Save and reload:
source ~/.bashrc

Step 7: Start the Application
pm2 start server.js --name eira-backend
pm2 save
pm2 startup

Follow the PM2-generated command to enable auto-restart on reboot.
Step 8: Verify Deployment
Check PM2 logs:
pm2 logs

Open a browser and navigate to:
http://YOUR_EC2_PUBLIC_IP_ADDRESS:8080

You should see: Eira Backend Server is running!

Security Best Practices

Never commit .env files to GitHub. Ensure .env and .env.development are in .gitignore.
Rotate AWS keys periodically via IAM > Users > Security credentials.
Restrict security group rules to specific IPs for production.
Use AWS SSM Parameter Store for sensitive variables instead of .env files.
Enable HTTPS in production using a reverse proxy like Nginx and Certbot.

Handling Compromised AWS Keys
If AWS detects exposed keys (e.g., in GitHub), it applies AWSCompromisedKeyQuarantineV3:

Rotate Keys:
Go to IAM > Users > eira-backend-user > Security credentials.
Create a new access key, update .env, deactivate the old key, test, then delete it.


Remove Quarantine Policy:
Go to IAM > Users > eira-backend-user > Permissions, remove AWSCompromisedKeyQuarantineV3.


Clean Git History:git filter-repo --path .env.development --invert-paths
git push --force




Troubleshooting

Port not reachable:
Verify EC2 security group allows port 8080.
Ensure server.js binds to 0.0.0.0, not localhost.


Database connection issues:
Check DATABASE_URL format and RDS security group rules.


S3 upload failures:
Confirm AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and S3_BUCKET_NAME are correct.


Environment variables not loading:
Run source ~/.bashrc or verify .env file contents.



