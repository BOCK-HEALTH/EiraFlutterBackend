Eira Mobile App Backend
This repository contains the serverless Node.js backend for the Eira AI Health Assistant mobile application. It is built to be deployed on Vercel for seamless CI/CD, and it handles user authentication, chat history, and session management.
Core Technologies
Runtime: Node.js
Deployment: Vercel Serverless Functions
Authentication: Firebase Admin SDK (for verifying user ID tokens)
Database: Neon (Serverless PostgreSQL)
File Storage: Firebase Cloud Storage (for handling uploads like images, videos, etc.)
API Endpoints
All endpoints are located under the /api/ path and require an Authorization: Bearer <FirebaseIdToken> header for all requests.
Method	Endpoint	Description
GET	/api/getSessions	Fetches a list of all chat sessions for the authenticated user, ordered by most recent.
GET	/api/getMessages	Fetches all messages for a specific session (?sessionId=...) or the most recent session if none is provided.
POST	/api/storeMessage	Stores a new text-only message. Creates a new session if sessionId is null.
POST	/api/storeFileMessage	(Deprecated) Handles direct file uploads. Replaced by the new signed URL flow.
POST	/api/generateUploadUrl	(Step 1) Generates secure, temporary URLs for the client to upload files directly to Firebase Storage.
POST	/api/finalizeUpload	(Step 2) After direct upload, this endpoint is called to save the file metadata to the database.
POST	/api/updateSession	Updates the title or other properties of a specific chat session.
POST	/api/deleteSession	Deletes a chat session and all associated messages for the authenticated user.
Project Structure
The project follows the standard Vercel serverless function structure.
Generated code
/
├── api/                  # Vercel converts each file here into an API endpoint
│   ├── _utils/           # Helper modules (not exposed as endpoints)
│   │   ├── firebase.js   # Initializes Firebase Admin SDK
│   │   └── neon.js       # Initializes Neon PostgreSQL connection pool
│   ├── getMessages.js    # Endpoint logic for fetching messages
│   └── ...               # Other endpoint files
├── .env.development      # Local environment variables (NOT committed to Git)
├── .gitignore            # Specifies files to be ignored by Git
├── package.json          # Project dependencies and scripts
└── vercel.json           # Vercel deployment configuration (e.g., for CORS headers)
Use code with caution.
Setup and Local Development
To run this project on your local machine, follow these steps.
1. Prerequisites
Node.js (v18 or later)
A Vercel account
A Firebase project with Authentication and Storage enabled
A Neon PostgreSQL database
2. Clone and Install Dependencies
Generated bash
# Clone the repository
git clone <your-repository-url>
cd eira-flutter-backend-main

# Install npm packages
npm install
Use code with caution.
Bash
3. Set Up Environment Variables
Create a file named .env.development in the root of the project. Note: Your screenshot shows a typo (.env.develpoment); the correct name is .env.development.
Copy the contents of your Firebase service account key and Neon connection string into this file.
Generated code
# .env.development

# Neon Database Connection String
DATABASE_URL="postgres://user:password@..."

# Firebase Service Account Credentials
FIREBASE_PROJECT_ID="your-gcp-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-....@...iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourKeyHere...\n-----END PRIVATE KEY-----\n"

# Firebase Storage Bucket URL
FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
Use code with caution.
4. Run the Development Server
Use the Vercel CLI to simulate the serverless environment locally.
Generated bash
# Install Vercel CLI globally (if you haven't already)
npm install -g vercel

# Run the local development server
vercel dev
Use code with caution.
Bash
The API will now be running at http://localhost:3000.
Deployment
This project is configured for continuous deployment with Vercel.
Push to GitHub: Every git push to the main branch will automatically trigger a new deployment.
Environment Variables: Ensure that all the variables from your .env.development file are also set in your Vercel project's Settings > Environment Variables tab. The deployment will fail if these are not configured.
Database Schema
The application uses the following PostgreSQL schema on Neon.
Generated sql
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
    -- Columns to store arrays of file metadata
    file_url TEXT[],
    file_type TEXT[]
);
