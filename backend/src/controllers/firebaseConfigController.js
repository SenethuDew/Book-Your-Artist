/**
 * Exposes Firebase **web client** configuration (public; same values as in a web app bundle).
 */

const { getFirebaseWebOptions } = require("../config/firebaseWebEnv");

exports.getPublicFirebaseWebConfig = (req, res) => {
  const options = getFirebaseWebOptions();

  if (!options) {
    return res.status(503).json({
      success: false,
      code: "firebase_not_configured",
      message:
        "Firebase is not configured on the server. Choose one setup in backend `.env` (see backend/.env.example): set FIREBASE_WEB_CONFIG_JSON **or** set FIREBASE_WEB_API_KEY, FIREBASE_PROJECT_ID, FIREBASE_MESSAGING_SENDER_ID, FIREBASE_APP_ID (auth domain and bucket default from project ID). Optionally add backend/firebase-web-client.json from firebase-web-client.json.example. In development only, matching NEXT_PUBLIC_FIREBASE_* in frontend/.env.local are read automatically. Restart the backend after edits.",
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
