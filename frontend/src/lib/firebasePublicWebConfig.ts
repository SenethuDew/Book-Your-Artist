/**
 * Validates Firebase **Web** SDK public options from Next.js env.
 * Uses the same non-secret fields as firebase.google.com snippet (safe to expose NEXT_PUBLIC_*).
 */

import type { FirebaseOptions } from "firebase/app";

/** Named Firebase app instance for OAuth only — keeps default/[DEFAULT]-free Firestore SDK separate until env is fixed */
export const SHARED_FIREBASE_OAUTH_APP_NAME =
  "book-your-artist-social-auth" as const;

const PLACEHOLDER_MARKERS = [
  "YOUR_",
  "CHANGE_ME",
  "REPLACE",
  "<your",
] as const;

export function firebasePublicLooksLikePlaceholder(
  raw: string | undefined,
): boolean {
  const s = raw?.trim() ?? "";
  if (!s) return true;
  const lower = s.toLowerCase();
  return PLACEHOLDER_MARKERS.some((m) => lower.includes(m.toLowerCase()));
}

/** Resolved config for the default Firebase web app from env, or null if unset/placeholder */
export function getValidatedFirebasePublicOptionsFromEnv(): FirebaseOptions | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim();
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim();
  const messagingSenderId =
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim();
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim();

  if (
    firebasePublicLooksLikePlaceholder(apiKey) ||
    firebasePublicLooksLikePlaceholder(projectId) ||
    firebasePublicLooksLikePlaceholder(authDomain) ||
    firebasePublicLooksLikePlaceholder(storageBucket) ||
    firebasePublicLooksLikePlaceholder(messagingSenderId) ||
    firebasePublicLooksLikePlaceholder(appId)
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
