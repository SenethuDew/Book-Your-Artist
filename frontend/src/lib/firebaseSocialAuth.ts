"use client";

/**
 * Google / Facebook sign-in via Firebase Auth (popup).
 * Config: valid NEXT_PUBLIC_FIREBASE_* in .env.local, or public config served by
 * GET /api/config/firebase-public when the frontend still has placeholders.
 */

import type { FirebaseOptions } from "firebase/app";
import {
  initializeApp,
  getApps,
} from "firebase/app";
import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  type UserCredential,
} from "firebase/auth";
import { getApiBaseUrl } from "@/lib/api";

const SOCIAL_APP_NAME = "book-your-artist-social-auth";

const PLACEHOLDER_MARKERS = [
  "YOUR_",
  "CHANGE_ME",
  "REPLACE",
  "<your",
];

function looksLikePlaceholder(raw: string | undefined): boolean {
  const s = raw?.trim() ?? "";
  if (!s) return true;
  const lower = s.toLowerCase();
  return PLACEHOLDER_MARKERS.some((m) => lower.includes(m.toLowerCase()));
}

/** Full web config built from NEXT_PUBLIC_* when values are non-placeholder */
function firebaseConfigFromEnv(): FirebaseOptions | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim();
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim();
  const messagingSenderId =
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim();
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim();

  if (
    looksLikePlaceholder(apiKey) ||
    looksLikePlaceholder(projectId) ||
    looksLikePlaceholder(authDomain) ||
    looksLikePlaceholder(storageBucket) ||
    looksLikePlaceholder(messagingSenderId) ||
    looksLikePlaceholder(appId)
  ) {
    return null;
  }

  return {
    apiKey: apiKey as string,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };
}

async function fetchPublicFirebaseWebConfig(): Promise<FirebaseOptions> {
  const base = getApiBaseUrl().replace(/\/$/, "");
  const response = await fetch(`${base}/api/config/firebase-public`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  const text = await response.text();
  const fallbackMessage =
    "Firebase client config was not loaded from the backend. Add FIREBASE_WEB_API_KEY, FIREBASE_PROJECT_ID, FIREBASE_AUTH_DOMAIN, FIREBASE_APP_ID, FIREBASE_STORAGE_BUCKET, and FIREBASE_MESSAGING_SENDER_ID to backend `.env`, then restart the API.";
  let parsed: {
    apiKey?: string;
    authDomain?: string;
    projectId?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
    message?: string;
  };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(
      !response.ok ? text.trim() || fallbackMessage : fallbackMessage,
    );
  }

  if (
    parsed.apiKey &&
    parsed.authDomain &&
    parsed.projectId &&
    parsed.storageBucket &&
    parsed.messagingSenderId &&
    parsed.appId
  ) {
    return {
      apiKey: parsed.apiKey,
      authDomain: parsed.authDomain,
      projectId: parsed.projectId,
      storageBucket: parsed.storageBucket,
      messagingSenderId: parsed.messagingSenderId,
      appId: parsed.appId,
    };
  }

  const serverMsg =
    typeof parsed.message === "string" ? parsed.message.trim() : "";
  throw new Error(
    !response.ok
      ? serverMsg || text.trim() || fallbackMessage
      : serverMsg || fallbackMessage,
  );
}

async function resolveFirebaseWebConfig(): Promise<FirebaseOptions> {
  const fromEnv = firebaseConfigFromEnv();
  if (fromEnv) return fromEnv;
  return fetchPublicFirebaseWebConfig();
}

async function idTokenFromResult(result: UserCredential): Promise<string> {
  const token = await result.user.getIdToken();
  if (!token) throw new Error("No ID token from provider");
  return token;
}

let ensureSocialFirebasePromise: Promise<ReturnType<typeof getAuth>> | null =
  null;

async function ensureSocialFirebaseAuth(): Promise<ReturnType<typeof getAuth>> {
  if (ensureSocialFirebasePromise) return ensureSocialFirebasePromise;

  ensureSocialFirebasePromise = (async () => {
    const options = await resolveFirebaseWebConfig();
    const existing = getApps().find((a) => a.name === SOCIAL_APP_NAME);
    const app = existing ?? initializeApp(options, SOCIAL_APP_NAME);
    return getAuth(app);
  })();

  return ensureSocialFirebasePromise;
}

/** True when Firebase can be initialized from env OR when the SPA can reach the API for fallback config */
export function isFirebaseSocialAuthAvailable(): boolean {
  if (firebaseConfigFromEnv()) return true;
  return Boolean(getApiBaseUrl().trim());
}

/** Google — enable Google provider in Firebase Console → Authentication → Sign-in method */
export async function signInWithGoogle(): Promise<string> {
  const authInstance = await ensureSocialFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(authInstance, provider);
  return idTokenFromResult(result);
}

/** Facebook — enable Facebook in Firebase Console and add Facebook App ID + secret */
export async function signInWithFacebook(): Promise<string> {
  const authInstance = await ensureSocialFirebaseAuth();
  const provider = new FacebookAuthProvider();
  const result = await signInWithPopup(authInstance, provider);
  return idTokenFromResult(result);
}
