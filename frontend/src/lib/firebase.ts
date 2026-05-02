/**
 * Canonical Firebase entry for AI modules and shared usage.
 * Re-exports the existing app instance from firebaseService.
 */
export { db, storage, auth, default as firebaseApp } from "./firebaseService";
