import { db } from "./firebaseService";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import type { UIMessage } from "@/components/ai/ChatMessage";
import type { BookingFlowState } from "@/app/api/ai-assistant/route";

const isFirebaseReady = () =>
  !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== "YOUR_PROJECT_ID_HERE";

export interface PersistedChat {
  messages: UIMessage[];
  bookingFlow?: BookingFlowState;
  updatedAt?: unknown;
}

export const loadAIChat = async (userId: string): Promise<PersistedChat | null> => {
  if (!userId || !isFirebaseReady()) return null;
  try {
    const ref = doc(db, "ai_chats", userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data() as PersistedChat;
    return {
      messages: Array.isArray(data.messages) ? data.messages : [],
      bookingFlow: data.bookingFlow,
    };
  } catch (err) {
    console.warn("[ai-chat] load failed:", err);
    return null;
  }
};

export const saveAIChat = async (
  userId: string,
  messages: UIMessage[],
  bookingFlow?: BookingFlowState
): Promise<boolean> => {
  if (!userId || !isFirebaseReady()) return false;
  try {
    const ref = doc(db, "ai_chats", userId);
    // Trim to last 60 messages to keep doc small.
    const trimmed = messages.slice(-60);
    await setDoc(
      ref,
      {
        messages: trimmed,
        bookingFlow: bookingFlow || null,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.warn("[ai-chat] save failed:", err);
    return false;
  }
};

export const clearAIChat = async (userId: string): Promise<boolean> => {
  if (!userId || !isFirebaseReady()) return false;
  try {
    const ref = doc(db, "ai_chats", userId);
    await setDoc(ref, { messages: [], bookingFlow: null, updatedAt: serverTimestamp() });
    return true;
  } catch (err) {
    console.warn("[ai-chat] clear failed:", err);
    return false;
  }
};
