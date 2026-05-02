/**
 * Exposes Firebase **web client** configuration (public; same values as in a web app bundle).
 */

const {
  getFirebaseWebOptions,
} = require("../config/firebaseWebEnv");

exports.getPublicFirebaseWebConfig = (req, res) => {
  const options = getFirebaseWebOptions();

  if (!options) {
    return res.status(503).json({
      success: false,
      message:
        "Firebase is not configured on the server. Pick ONE setup: " +
        "(1) Paste your Firebase Web app object as JSON into backend `.env`: FIREBASE_WEB_CONFIG_JSON={\"apiKey\":\"...\",\"authDomain\":\"...\",...}; " +
        "(2) Or set FIREBASE_WEB_API_KEY, FIREBASE_PROJECT_ID, FIREBASE_MESSAGING_SENDER_ID, FIREBASE_APP_ID in backend `.env` (storage/auth domain can auto-fill from project id); " +
        "(3) Or copy backend/firebase-web-client.json.example to backend/firebase-web-client.json with real values. " +
        "In development, the API will also read real NEXT_PUBLIC_FIREBASE_* from frontend/.env.local. Restart the API after changes.",
    });
  }

  res.json({
    apiKey: options.apiKey,
    authDomain: options.authDomain,
    projectId: options.projectId,
    storageBucket: options.storageBucket,
    messagingSenderId: options.messagingSenderId,
    appId: options.appId,
  });
};
