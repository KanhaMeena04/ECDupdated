const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");
let firebaseInitialized = false;

try {
  const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");
  let serviceAccount = null;

  if (fs.existsSync(serviceAccountPath)) {
    serviceAccount = require(serviceAccountPath);
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = typeof process.env.FIREBASE_SERVICE_ACCOUNT === 'string'
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : process.env.FIREBASE_SERVICE_ACCOUNT;
    } catch (parseErr) {
      console.error("❌ Error parsing FIREBASE_SERVICE_ACCOUNT env var:", parseErr.message);
    }
  }

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    firebaseInitialized = true;
    console.log("✅ Firebase Admin SDK initialized successfully.");
  } else {
    console.warn(
      "⚠️ Firebase serviceAccountKey.json or FIREBASE_SERVICE_ACCOUNT env var not found. Push notifications via FCM will not work.",
    );
  }
} catch (error) {
  console.error("❌ Error initializing Firebase Admin SDK:", error.message);
}

module.exports = {
  admin: firebaseInitialized ? admin : null,
  isInitialized: firebaseInitialized,
};
