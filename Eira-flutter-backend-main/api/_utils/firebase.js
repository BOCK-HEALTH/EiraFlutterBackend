const admin = require('firebase-admin');

// This check prevents re-initializing the app
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

// Helper function to verify a token and get the user's email
async function getUserEmailFromToken(token) {
  if (!token) {
    return null;
  }
  try {
    // The decoded token from Firebase contains the user's email
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken.email;
  } catch (error) {
    console.error("Error verifying Firebase token:", error);
    return null;
  }
}

// Export both the admin object (for other files) and our new helper function
module.exports = {
  admin,
  getUserEmailFromToken // <-- EXPORTING THE CORRECT FUNCTION
};