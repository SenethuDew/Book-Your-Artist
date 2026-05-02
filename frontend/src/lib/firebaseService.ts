import { initializeApp, getApps, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { getValidatedFirebasePublicOptionsFromEnv } from "@/lib/firebasePublicWebConfig";

const FIRESTORE_FIREBASE_APP_NAME = "book-your-artist-firestore";

const firebaseConfigLooseFallback: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getOrInitializeFirestoreApp(): FirebaseApp {
  const existingNamed = getApps().find(
    (a) => a.name === FIRESTORE_FIREBASE_APP_NAME,
  );
  if (existingNamed) return existingNamed;

  const validated = getValidatedFirebasePublicOptionsFromEnv();
  if (!validated && typeof window !== "undefined") {
    console.warn(
      "[Firebase] NEXT_PUBLIC_FIREBASE_* are unset or placeholders. Firestore/Storage calls may fail. Google/Facebook OAuth can load config from API if backend `.env` is set (frontend/.env.example + backend/.env.example).",
    );
  }
  const cfg: FirebaseOptions = validated ?? firebaseConfigLooseFallback;
  return initializeApp(cfg, FIRESTORE_FIREBASE_APP_NAME);
}

const app = getOrInitializeFirestoreApp();

if (typeof window !== "undefined") {
  console.log("Firebase Firestore client ready");
}

export const db = getFirestore(app);

if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === "failed-precondition") {
      console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
    } else if (err.code === "unimplemented") {
      console.warn("Browser does not support persistence.");
    }
  });
}

export const storage = getStorage(app);
export const auth = getAuth(app);

export default app;
