"use client";

/**
 * Google / Facebook sign-in via Firebase Auth (popup).
 * Uses validated NEXT_PUBLIC_* when present, otherwise GET /api/config/firebase-public
 * so backend and SPA share one Firebase web project without duplicating secrets in the browser bundle.
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
import {
  SHARED_FIREBASE_OAUTH_APP_NAME,
  getValidatedFirebasePublicOptionsFromEnv,
} from "@/lib/firebasePublicWebConfig";

const SOCIAL_APP_NAME = SHARED_FIREBASE_OAUTH_APP_NAME;

async function fetchPublicFirebaseWebConfig(): Promise<FirebaseOptions> {
  const base = getApiBaseUrl().replace(/\/$/, "");
  const response = await fetch(`${base}/api/config/firebase-public`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  const text = await response.text();
  const fallbackMessage =
    "Firebase is not configured on the server yet. Follow backend/.env.example, then restart the API (and frontend if you updated .env.local).";
  let parsed: {
    apiKey?: string;
    authDomain?: string;
    projectId?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
    message?: string;
    code?: string;
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
  const fromEnv = getValidatedFirebasePublicOptionsFromEnv();
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

/** True when env is complete or the SPA can reach the backend for bootstrap config */
export function isFirebaseSocialAuthAvailable(): boolean {
  if (getValidatedFirebasePublicOptionsFromEnv()) return true;
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
