// api/_utils/firebase.js
const admin = require('firebase-admin');

// This check prevents re-initializing the app on every call
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // This safely parses the private key from the environment variable
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

// Reusable helper function to get a user's email from a token
async function getUserEmailFromToken(token) {
  if (!token) {
    return null;
  }
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken.email;
  } catch (error) {
    console.error("Error verifying Firebase token:", error);
    return null;
  }
}

module.exports = {
  admin,
  getUserEmailFromToken
};