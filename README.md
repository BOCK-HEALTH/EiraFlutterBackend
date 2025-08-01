🩺 Eira Mobile App Backend
This repository contains the serverless Node.js backend for the Eira AI Health Assistant mobile application. It is built to be deployed on Vercel for seamless CI/CD and handles user authentication, chat history, and session management.

🧰 Core Technologies
Area	Technology
Runtime	Node.js
Deployment	Vercel Serverless Functions
Authentication	Firebase Admin SDK (ID token verification)
Database	Neon (Serverless PostgreSQL)
File Storage	Firebase Cloud Storage

🔗 API Endpoints
All endpoints are under /api/ and require an Authorization: Bearer <FirebaseIdToken> header.

Method	Endpoint	Description
GET	/api/getSessions	Fetches all chat sessions for the authenticated user (most recent first).
GET	/api/getMessages	Fetches messages for a session (?sessionId=...) or the most recent one.
POST	/api/storeMessage	Stores a new text-only message. Creates a session if sessionId is null.
POST	/api/storeFileMessage	❌ Deprecated. Use generateUploadUrl & finalizeUpload instead.
POST	/api/generateUploadUrl	(Step 1) Generates a signed upload URL for Firebase Storage.
POST	/api/finalizeUpload	(Step 2) Saves uploaded file metadata to the database.
POST	/api/updateSession	Updates session title or other properties.
POST	/api/deleteSession	Deletes a session and all associated messages.

📁 Project Structure
graphql
Copy
Edit
/
├── api/                    # Vercel turns each file here into an API endpoint
│   ├── _utils/             # Helper modules (not endpoints)
│   │   ├── firebase.js     # Firebase Admin SDK setup
│   │   └── neon.js         # Neon PostgreSQL connection pool
│   ├── getMessages.js      # API endpoint for fetching messages
│   └── ...                 # Other endpoints
├── .env.development        # Local environment variables (ignored by Git)
├── .gitignore              # Files to exclude from Git
├── package.json            # Dependencies and scripts
└── vercel.json             # Vercel config (e.g., for CORS)
⚙️ Setup and Local Development
1. Prerequisites
Node.js (v18+)

Vercel account

Firebase project (Authentication + Storage enabled)

Neon PostgreSQL database

2. Clone & Install
bash
Copy
Edit
# Clone the repo
git clone https://github.com/BOCK-HEALTH/EiraFlutterBackend.git
cd EiraFlutterBackend

# Install dependencies
npm install
3. Configure Environment Variables
Create a .env.development file in the root directory (📌 not .env.develpoment).

env
Copy
Edit
# .env.development

# Neon Database
DATABASE_URL="postgres://user:password@neon-host/db"

# Firebase Admin SDK
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-abc123@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourKeyHere...\n-----END PRIVATE KEY-----\n"

# Firebase Storage
FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
4. Run Locally
bash
Copy
Edit
# Install Vercel CLI
npm install -g vercel

# Start local serverless dev server
vercel dev
Visit: http://localhost:3000

🚀 Deployment on Vercel
CI/CD: Every push to the main branch triggers a deployment.

Environment Variables: Make sure to replicate your .env.development values in the Vercel project settings (Settings > Environment Variables).

🗄️ PostgreSQL Schema (Neon)
sql
Copy
Edit
-- users table
CREATE TABLE users (
  email TEXT PRIMARY KEY,
  name TEXT
);

-- chat_sessions table
CREATE TABLE chat_sessions (
  id SERIAL PRIMARY KEY,
  user_email TEXT REFERENCES users(email) ON DELETE CASCADE,
  title TEXT DEFAULT 'Untitled Session',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- chat_history table
CREATE TABLE chat_history (
  id SERIAL PRIMARY KEY,
  user_email TEXT REFERENCES users(email) ON DELETE CASCADE,
  session_id INTEGER REFERENCES chat_sessions(id) ON DELETE CASCADE,
  message TEXT,
  sender TEXT CHECK (sender IN ('user', 'eira')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  file_url TEXT[],
  file_type TEXT[]
);
