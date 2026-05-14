"use client";

/**
 * Google / Facebook sign-in via Firebase Auth (popup).
 * Config resolution order:
 * 1) Validated `NEXT_PUBLIC_FIREBASE_*` in the browser bundle (build-time env).
 * 2) `GET /api/config/firebase-public` on the Next app (reads the same env on the server).
 * 3) Same path on the Express API (`NEXT_PUBLIC_API_URL`), for deployments that only configure the backend.
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

function firebaseOptionsFromParsed(parsed: {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}): FirebaseOptions | null {
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
  return null;
}

async function fetchPublicFirebaseWebConfig(): Promise<FirebaseOptions> {
  const fallbackMessage =
    "Firebase is not configured yet. Add real NEXT_PUBLIC_FIREBASE_* values in frontend/.env.local (Firebase Console → Web app snippet), and/or set FIREBASE_WEB_API_KEY, FIREBASE_PROJECT_ID, FIREBASE_MESSAGING_SENDER_ID, FIREBASE_APP_ID in backend/.env. Restart both servers.";

  const urls: string[] = [];
  if (typeof window !== "undefined") {
    urls.push(`${window.location.origin}/api/config/firebase-public`);
  }
  urls.push(`${getApiBaseUrl().replace(/\/$/, "")}/api/config/firebase-public`);
  const uniqueUrls = [...new Set(urls)];

  let lastServerMsg = "";

  for (const url of uniqueUrls) {
    let response: Response;
    try {
      response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
    } catch {
      continue;
    }

    const text = await response.text();
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
      parsed = JSON.parse(text) as typeof parsed;
    } catch {
      if (!response.ok && text.trim()) lastServerMsg = text.trim();
      continue;
    }

    const options = firebaseOptionsFromParsed(parsed);
    if (options) return options;

    const serverMsg =
      typeof parsed.message === "string" ? parsed.message.trim() : "";
    if (serverMsg) lastServerMsg = serverMsg;
  }

  throw new Error(lastServerMsg || fallbackMessage);
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

  try {
    return await ensureSocialFirebasePromise;
  } catch (error) {
    ensureSocialFirebasePromise = null;
    throw error;
  }
}

/** True when env is complete or the SPA can reach the backend for bootstrap config */
export function isFirebaseSocialAuthAvailable(): boolean {
  if (getValidatedFirebasePublicOptionsFromEnv()) return true;
  return Boolean(getApiBaseUrl().trim());
}

function getProviderErrorMessage(error: unknown, provider: "Google" | "Facebook") {
  const fallback =
    `${provider} sign-in is not configured yet. Add real Firebase Web app values to ` +
    "backend/.env or frontend/.env.local, enable the provider in Firebase Authentication, then restart both servers.";

  if (!(error instanceof Error)) return fallback;

  const code = "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
  if (code === "auth/configuration-not-found") {
    return `${provider} is not enabled for this Firebase project. Enable it in Firebase Console -> Authentication -> Sign-in method.`;
  }
  if (code === "auth/unauthorized-domain") {
    return "This domain is not authorized in Firebase. Add localhost to Firebase Console -> Authentication -> Settings -> Authorized domains.";
  }
  if (code === "auth/popup-closed-by-user") {
    return `${provider} sign-in was cancelled before it completed.`;
  }
  if (code === "auth/account-exists-with-different-credential") {
    return "An account already exists with this email using another sign-in method.";
  }

  return error.message || fallback;
}

/** Google — enable Google provider in Firebase Console → Authentication → Sign-in method */
export async function signInWithGoogle(): Promise<string> {
  try {
    const authInstance = await ensureSocialFirebaseAuth();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const result = await signInWithPopup(authInstance, provider);
    return idTokenFromResult(result);
  } catch (error) {
    throw new Error(getProviderErrorMessage(error, "Google"));
  }
}

/** Facebook — enable Facebook in Firebase Console and add Facebook App ID + secret */
export async function signInWithFacebook(): Promise<string> {
  try {
    const authInstance = await ensureSocialFirebaseAuth();
    const provider = new FacebookAuthProvider();
    const result = await signInWithPopup(authInstance, provider);
    return idTokenFromResult(result);
  } catch (error) {
    throw new Error(getProviderErrorMessage(error, "Facebook"));
  }
}
