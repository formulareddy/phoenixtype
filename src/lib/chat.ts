import { db } from "./firebase";
import {
  collection, query, where, orderBy, onSnapshot,
  addDoc, getDocs, doc, setDoc, getDoc, limit,
} from "firebase/firestore";

export interface ChatMessage {
  id: string;
  from: string;
  text: string;
  timestamp: number;
}

export function chatId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join("_");
}

export async function ensureChat(uid1: string, uid2: string) {
  if (!db) return;
  const cid = chatId(uid1, uid2);
  const ref = doc(db, "chats", cid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      participants: [uid1, uid2],
      lastMessage: "",
      lastTimestamp: 0,
      createdAt: Date.now(),
    });
  }
}

export async function sendMessage(from: string, to: string, text: string) {
  if (!db) throw new Error("Firestore not available");
  const cid = chatId(from, to);
  await ensureChat(from, to);
  await addDoc(collection(db, "chats", cid, "messages"), {
    from,
    text,
    timestamp: Date.now(),
  });
  await setDoc(doc(db, "chats", cid), {
    lastMessage: text,
    lastTimestamp: Date.now(),
  }, { merge: true });
}

export async function getMessages(uid1: string, uid2: string): Promise<ChatMessage[]> {
  if (!db) return [];
  const cid = chatId(uid1, uid2);
  const q = query(
    collection(db, "chats", cid, "messages"),
    orderBy("timestamp", "asc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id } as ChatMessage));
}

export function listenMessages(
  uid1: string,
  uid2: string,
  cb: (messages: ChatMessage[]) => void,
): (() => void) | null {
  if (!db) return null;
  const cid = chatId(uid1, uid2);
  const q = query(
    collection(db, "chats", cid, "messages"),
    orderBy("timestamp", "asc"),
    limit(100),
  );
  return onSnapshot(q, (snap) => {
    const msgs = snap.docs.map(d => ({ ...d.data(), id: d.id } as ChatMessage));
    cb(msgs);
  });
}

export async function getRecentChats(uid: string): Promise<{ chatWith: string; lastMessage: string; lastTimestamp: number }[]> {
  if (!db) return [];
  const q = query(
    collection(db, "chats"),
    where("participants", "array-contains", uid),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    const other = (data.participants as string[]).find((p: string) => p !== uid) || "";
    return { chatWith: other, lastMessage: data.lastMessage || "", lastTimestamp: data.lastTimestamp || 0 };
  }).sort((a, b) => b.lastTimestamp - a.lastTimestamp);
}
