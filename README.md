# 🩺 Eira Mobile App Backend

This repository contains the **serverless Node.js backend** for the **Eira AI Health Assistant** mobile application. It is built to be deployed on **Vercel** and handles **user authentication, chat history, session management, and file storage**.

---

## 🧰 Core Technologies

| Component          | Technology                    |
| ------------------ | ----------------------------- |
| **Runtime**        | Node.js                       |
| **Deployment**     | Vercel Serverless Functions   |
| **Authentication** | Firebase Admin SDK            |
| **Database**       | Neon (PostgreSQL, serverless) |
| **File Storage**   | Firebase Cloud Storage        |

---

## 🔗 API Endpoints

> All endpoints are under `/api/` and require an `Authorization: Bearer <FirebaseIdToken>` header.

| Method | Endpoint                 | Description                                                                   |
| ------ | ------------------------ | ----------------------------------------------------------------------------- |
| GET    | `/api/getSessions`       | Fetch all chat sessions for the authenticated user (most recent first).       |
| GET    | `/api/getMessages`       | Fetch messages for a session (`?sessionId=...`) or the most recent one.       |
| POST   | `/api/storeMessage`      | Stores a new **text-only** message. Creates a session if `sessionId` is null. |
| POST   | `/api/storeFileMessage`  | ❌ **Deprecated.** Use `generateUploadUrl` & `finalizeUpload` instead.         |
| POST   | `/api/generateUploadUrl` | Generates a signed upload URL for Firebase Storage.                           |
| POST   | `/api/finalizeUpload`    | Saves uploaded file metadata to the database.                                 |
| POST   | `/api/updateSession`     | Updates session title or properties.                                          |
| POST   | `/api/deleteSession`     | Deletes a session and all associated messages.                                |

---

## 📁 Project Structure

```
/
├── api/                    # Vercel turns each file here into an API endpoint
│   ├── _utils/             # Helper modules
│   │   ├── firebase.js     # Firebase Admin SDK setup
│   │   └── neon.js         # Neon DB connection pool
│   ├── getMessages.js      # API logic
│   └── ...                 # Other endpoints
├── .env.development        # Environment variables (ignored by Git)
├── .gitignore              # Files to ignore
├── package.json            # Dependencies
└── vercel.json             # Vercel config
```

---

## ⚙️ Setup and Local Development

### 1. Prerequisites

* Node.js (v18+)
* [Vercel CLI](https://vercel.com/docs/cli)
* [Firebase Project](https://console.firebase.google.com/)
* [Neon PostgreSQL Account](https://neon.tech)

---

### 2. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/BOCK-HEALTH/EiraFlutterBackend.git
cd EiraFlutterBackend

# Install dependencies
npm install
```

---

## 🗃️ Set Up Neon (PostgreSQL)

### ✅ Step-by-Step:

1. **Go to** [https://neon.tech](https://neon.tech) and sign up.

2. **Create a new project** (select PostgreSQL).

3. **Copy the connection string**, e.g.:

   ```
   postgres://your_user:your_password@ep-neon-db.neon.tech/dbname
   ```

4. **Open the SQL Editor** and run the schema below:

```sql
CREATE TABLE users (
  email TEXT PRIMARY KEY,
  name TEXT
);

CREATE TABLE chat_sessions (
  id SERIAL PRIMARY KEY,
  user_email TEXT REFERENCES users(email) ON DELETE CASCADE,
  title TEXT DEFAULT 'Untitled Session',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
```

---

## 🔐 Set Up Firebase Admin SDK

### ✅ Steps:

1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Select your project > Go to **Project Settings** > **Service Accounts**.
3. Click **Generate New Private Key** – this downloads a JSON file.
4. Open the JSON and copy:

   * `project_id`
   * `client_email`
   * `private_key`

---

## 📄 Environment Variables Setup

Create a file named `.env.development` in the project root:

```env
# Neon Database
DATABASE_URL="postgres://your_user:your_password@ep-neon-db.neon.tech/dbname"

# Firebase Admin
FIREBASE_PROJECT_ID="your_project_id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-abc123@your_project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...<newline escaped key>...\n-----END PRIVATE KEY-----\n"

# Firebase Storage
FIREBASE_STORAGE_BUCKET="your_project_id.appspot.com"
```

---

## ▶️ Local Development

```bash
# Install Vercel CLI globally
npm install -g vercel

# Start local serverless environment
vercel dev
```

Visit: [http://localhost:3000](http://localhost:3000)

---

## 🚀 Deploy to Vercel (CI/CD)

### ✅ Initial Setup:

1. Go to [https://vercel.com](https://vercel.com) and sign in.
2. Click **"Add New Project"**, import this GitHub repo.
3. **Choose "Framework: Other"** (since this is a custom Node.js backend).
4. In **Environment Variables**, add all entries from your `.env.development`.

### ✅ Trigger Deployments

* Every `git push` to the `main` branch triggers a new deployment.
* You can manually trigger a deployment from the Vercel dashboard too.

---

## 🧪 Testing API Endpoints

Use tools like [Postman](https://www.postman.com/) or [cURL](https://curl.se/) with an authenticated Firebase ID token:

Example `GET` request to fetch sessions:

```http
GET /api/getSessions
Host: your-vercel-app.vercel.app
Authorization: Bearer <FirebaseIdToken>
```


