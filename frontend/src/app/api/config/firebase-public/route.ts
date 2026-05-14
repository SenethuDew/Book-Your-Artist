import { NextResponse } from "next/server";
import { getValidatedFirebasePublicOptionsFromEnv } from "@/lib/firebasePublicWebConfig";

/**
 * Serves the same public Firebase web config shape as the Express
 * `GET /api/config/firebase-public` route, using Next.js env only.
 * Lets Google/Facebook OAuth work when operators configure `frontend/.env.local`
 * but have not duplicated keys into `backend/.env`.
 */
export async function GET() {
  const options = getValidatedFirebasePublicOptionsFromEnv();
  if (!options) {
    return NextResponse.json(
      {
        success: false,
        code: "firebase_not_configured",
        message:
          "Firebase web app env is missing or still has placeholders in frontend/.env.local. Add real NEXT_PUBLIC_FIREBASE_* values from Firebase Console → Project settings → Your apps (Web), or set FIREBASE_* / FIREBASE_WEB_CONFIG_JSON in backend/.env. Restart both servers after edits.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    apiKey: options.apiKey,
    authDomain: options.authDomain,
    projectId: options.projectId,
    storageBucket: options.storageBucket,
    messagingSenderId: options.messagingSenderId,
    appId: options.appId,
  });
}
