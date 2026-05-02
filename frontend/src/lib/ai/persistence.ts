/**
 * Firestore persistence for AI assistant:
 * - ai_chats/{userId}/messages/{messageId}
 * - ai_sessions/{userId}
 * - clients/{userId}
 */

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AISessionState, ClientProfileSnapshot, StoredChatMessage } from "./types";

const isFirebaseReady = () =>
  !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== "YOUR_PROJECT_ID_HERE";

export async function loadClientProfile(userId: string): Promise<ClientProfileSnapshot | null> {
  if (!userId || !isFirebaseReady()) return null;
  try {
    const ref = doc(db, "clients", userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      fullName: d.fullName as string | undefined,
      email: d.email as string | undefined,
      phone: d.phone as string | undefined,
      location: d.location as string | undefined,
      profileImage: d.profileImage as string | undefined,
      preferredEventType: d.preferredEventType as string | undefined,
      preferredArtistCategory: d.preferredArtistCategory as string | undefined,
      budgetMin: typeof d.budgetMin === "number" ? d.budgetMin : undefined,
      budgetMax: typeof d.budgetMax === "number" ? d.budgetMax : undefined,
      budgetCurrency: (d.budgetCurrency as ClientProfileSnapshot["budgetCurrency"]) ?? "USD",
      preferredGenres: Array.isArray(d.preferredGenres) ? (d.preferredGenres as string[]) : undefined,
      notificationSettings: d.notificationSettings as ClientProfileSnapshot["notificationSettings"],
    };
  } catch (e) {
    console.warn("[ai persistence] loadClientProfile:", e);
    return null;
  }
}

/** Merge API user into Firestore `clients/{userId}` (non-destructive). */
export async function upsertClientProfileFromApi(
  userId: string,
  apiUser: Record<string, unknown>
): Promise<void> {
  if (!userId || !isFirebaseReady()) return;
  try {
    const ref = doc(db, "clients", userId);
    const prefs = (apiUser.preferences as Record<string, unknown> | undefined) ?? {};
    await setDoc(
      ref,
      {
        fullName: apiUser.name,
        email: apiUser.email,
        phone: apiUser.phone ?? "",
        location: apiUser.location ?? "",
        profileImage: apiUser.profileImage ?? "",
        preferredEventType: prefs.eventType ?? "",
        preferredArtistCategory: prefs.category ?? "",
        budgetMin: typeof prefs.budgetMin === "number" ? prefs.budgetMin : undefined,
        budgetMax: typeof prefs.budgetMax === "number" ? prefs.budgetMax : undefined,
        budgetCurrency: (prefs.budgetCurrency as string) || "USD",
        preferredGenres: Array.isArray(prefs.genres) ? prefs.genres : [],
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (e) {
    console.warn("[ai persistence] upsertClientProfileFromApi:", e);
  }
}

export async function loadAISession(userId: string): Promise<AISessionState | null> {
  if (!userId || !isFirebaseReady()) return null;
  try {
    const ref = doc(db, "ai_sessions", userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      currentIntent: (d.currentIntent as AISessionState["currentIntent"]) ?? "help",
      bookingStep: (d.bookingStep as AISessionState["bookingStep"]) ?? "done",
      bookingData: (d.bookingData as AISessionState["bookingData"]) ?? {},
      selectedArtistId: d.selectedArtistId as string | undefined,
      lastUserIntent: d.lastUserIntent as AISessionState["lastUserIntent"],
      updatedAt: typeof d.updatedAt === "number" ? d.updatedAt : Date.now(),
    };
  } catch (e) {
    console.warn("[ai persistence] loadAISession:", e);
    return null;
  }
}

export async function saveAISession(userId: string, session: AISessionState): Promise<boolean> {
  if (!userId || !isFirebaseReady()) return false;
  try {
    await setDoc(
      doc(db, "ai_sessions", userId),
      {
        ...session,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (e) {
    console.warn("[ai persistence] saveAISession:", e);
    return false;
  }
}

export async function appendChatMessage(
  userId: string,
  msg: Omit<StoredChatMessage, "timestamp"> & { timestamp?: number }
): Promise<boolean> {
  if (!userId || !isFirebaseReady()) return false;
  try {
    await addDoc(collection(db, "ai_chats", userId, "messages"), {
      sender: msg.sender,
      text: msg.text,
      intent: msg.intent,
      metadata: msg.metadata ?? {},
      timestamp: msg.timestamp ?? Date.now(),
      createdAt: serverTimestamp(),
    });
    return true;
  } catch (e) {
    console.warn("[ai persistence] appendChatMessage:", e);
    return false;
  }
}

export async function clearChatMessages(userId: string): Promise<boolean> {
  if (!userId || !isFirebaseReady()) return false;
  try {
    const snap = await getDocs(collection(db, "ai_chats", userId, "messages"));
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
    return true;
  } catch (e) {
    console.warn("[ai persistence] clearChatMessages:", e);
    return false;
  }
}

export async function loadChatMessages(userId: string, max = 80): Promise<StoredChatMessage[]> {
  if (!userId || !isFirebaseReady()) return [];
  try {
    const q = query(
      collection(db, "ai_chats", userId, "messages"),
      orderBy("timestamp", "asc"),
      limit(max)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const x = d.data();
      return {
        sender: x.sender as StoredChatMessage["sender"],
        text: String(x.text ?? ""),
        timestamp: typeof x.timestamp === "number" ? x.timestamp : Date.now(),
        intent: (x.intent as StoredChatMessage["intent"]) ?? "fallback",
        metadata: (x.metadata as Record<string, unknown>) ?? {},
      };
    });
  } catch (e) {
    console.warn("[ai persistence] loadChatMessages (offline or index):", e);
    return [];
  }
}
