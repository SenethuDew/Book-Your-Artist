/**
 * Resolves Firebase **web** options (public client config) and the Web API key from several sources.
 * Order: FIREBASE_WEB_CONFIG_JSON → backend env vars → optional firebase-web-client.json → dev: frontend/.env.local
 */

const fs = require("fs");
const path = require("path");

function isPlaceholder(val) {
  if (val == null) return true;
  const s = String(val).trim();
  if (!s) return true;
  const low = s.toLowerCase();
  return (
    low.includes("your_") ||
    low.includes("<your") ||
    low === "change_me" ||
    low.startsWith("replace_")
  );
}

function deriveFromProjectId(projectId) {
  const pid = String(projectId).trim();
  if (!pid) return { authDomain: "", storageBucket: "" };
  return {
    authDomain: `${pid}.firebaseapp.com`,
    storageBucket: `${pid}.appspot.com`,
  };
}

function parseDotenvStyle(contents) {
  const map = {};
  for (let line of String(contents).split(/\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    map[key] = val;
  }
  return map;
}

function normalizeOptions(raw) {
  if (!raw || typeof raw !== "object") return null;
  const apiKey = raw.apiKey?.trim?.() || raw.API_KEY?.trim?.();
  const projectId = raw.projectId?.trim?.() || raw.project_id?.trim?.();
  if (isPlaceholder(apiKey) || isPlaceholder(projectId)) return null;

  const d = deriveFromProjectId(projectId);
  const authDomain = (raw.authDomain || raw.auth_domain || d.authDomain || "").trim();
  const storageBucket = (raw.storageBucket || raw.storage_bucket || d.storageBucket || "").trim();
  const messagingSenderId = String(
    raw.messagingSenderId || raw.messaging_sender_id || "",
  ).trim();
  const appId = String(raw.appId || raw.app_id || "").trim();

  if (isPlaceholder(authDomain) || isPlaceholder(storageBucket)) return null;
  if (isPlaceholder(messagingSenderId) || isPlaceholder(appId)) return null;

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };
}

function tryParseConfigJson(str) {
  if (!str || !String(str).trim()) return null;
  try {
    const obj = JSON.parse(str);
    return normalizeOptions(obj);
  } catch {
    return null;
  }
}

function tryReadJsonFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return normalizeOptions(raw);
  } catch (e) {
    console.warn("[firebase] Could not read", filePath, e.message);
    return null;
  }
}

function tryReadFrontendEnvLocal() {
  if (process.env.NODE_ENV === "production") return null;
  const candidates = [
    path.join(__dirname, "../../../frontend/.env.local"),
    path.join(__dirname, "../../../../frontend/.env.local"),
  ];
  for (const p of candidates) {
    try {
      if (!fs.existsSync(p)) continue;
      const map = parseDotenvStyle(fs.readFileSync(p, "utf8"));
      const raw = {
        apiKey: map.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: map.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: map.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: map.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: map.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: map.NEXT_PUBLIC_FIREBASE_APP_ID,
      };
      const opt = normalizeOptions(raw);
      if (opt) {
        if (process.env.NODE_ENV === "development") {
          console.log("[firebase] Using web config from", p);
        }
        return opt;
      }
    } catch (e) {
      console.warn("[firebase] Could not read frontend env", p, e.message);
    }
  }
  return null;
}

/**
 * @returns {null | { apiKey: string, authDomain: string, projectId: string, storageBucket: string, messagingSenderId: string, appId: string }}
 */
function getFirebaseWebOptions() {
  const fromJsonEnv = tryParseConfigJson(process.env.FIREBASE_WEB_CONFIG_JSON);
  if (fromJsonEnv) return fromJsonEnv;

  const apiKey =
    process.env.FIREBASE_WEB_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const defaults = projectId ? deriveFromProjectId(projectId) : { authDomain: "", storageBucket: "" };
  const authDomain =
    process.env.FIREBASE_AUTH_DOMAIN?.trim() || defaults.authDomain || "";
  const storageBucket =
    process.env.FIREBASE_STORAGE_BUCKET?.trim() || defaults.storageBucket || "";
  const messagingSenderId = process.env.FIREBASE_MESSAGING_SENDER_ID?.trim() || "";
  const appId = process.env.FIREBASE_APP_ID?.trim() || "";

  const assembled = normalizeOptions({
    apiKey,
    projectId,
    authDomain,
    storageBucket,
    messagingSenderId,
    appId,
  });
  if (assembled) return assembled;

  const fromFile = tryReadJsonFile(
    path.join(__dirname, "../../firebase-web-client.json"),
  );
  if (fromFile) return fromFile;

  return tryReadFrontendEnvLocal();
}

function getFirebaseWebApiKey() {
  const opt = getFirebaseWebOptions();
  if (opt?.apiKey && !isPlaceholder(opt.apiKey)) return opt.apiKey;
  const fallback =
    process.env.FIREBASE_WEB_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() ||
    "";
  if (isPlaceholder(fallback)) return "";
  return fallback;
}

module.exports = {
  getFirebaseWebOptions,
  getFirebaseWebApiKey,
  isPlaceholder,
};
