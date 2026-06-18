import { createStore } from "solid-js/store";
import { db } from "./firebase";
import {
  collection, query, where, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, getDocs, writeBatch,
} from "firebase/firestore";

export interface FriendUser {
  uid: string;
  name: string;
  addedAt: number;
}

export interface FriendRequestItem {
  id: string;
  from: string;
  to: string;
  fromName: string;
  toName: string;
  status: "pending" | "accepted" | "blocked";
  createdAt: number;
}

interface FriendsStore {
  incoming: FriendRequestItem[];
  outgoing: FriendRequestItem[];
  friends: FriendUser[];
  loading: boolean;
}

const [store, setStore] = createStore<FriendsStore>({
  incoming: [],
  outgoing: [],
  friends: [],
  loading: true,
});

export { store as friendsStore };

let unsubIncoming: (() => void) | null = null;
let unsubOutgoing: (() => void) | null = null;

export function listenFriends(uid: string | null) {
  if (unsubIncoming) { unsubIncoming(); unsubIncoming = null; }
  if (unsubOutgoing) { unsubOutgoing(); unsubOutgoing = null; }
  if (!db || !uid) {
    setStore({ incoming: [], outgoing: [], friends: [], loading: false });
    return;
  }

  setStore("loading", true);

  const incomingQ = query(
    collection(db, "friendRequests"),
    where("to", "==", uid),
  );

  const outgoingQ = query(
    collection(db, "friendRequests"),
    where("from", "==", uid),
  );

  function rebuild(incoming: FriendRequestItem[], outgoing: FriendRequestItem[]) {
    const pendingIn = incoming.filter(i => i.status === "pending");
    const pendingOut = outgoing.filter(i => i.status === "pending");
    const accepted: FriendUser[] = [];
    const seen = new Set<string>();

    for (const item of [...incoming, ...outgoing]) {
      if (item.status === "accepted") {
        const friendUid = item.from === uid ? item.to : item.from;
        const friendName = item.from === uid ? item.toName : item.fromName;
        if (!seen.has(friendUid)) {
          seen.add(friendUid);
          accepted.push({ uid: friendUid, name: friendName, addedAt: item.createdAt });
        }
      }
    }

    setStore({ incoming: pendingIn, outgoing: pendingOut, friends: accepted, loading: false });
  }

  let incomingCache: FriendRequestItem[] = [];
  let outgoingCache: FriendRequestItem[] = [];

  unsubIncoming = onSnapshot(incomingQ, (snap) => {
    incomingCache = snap.docs.map(d => {
      const data = d.data() as Omit<FriendRequestItem, "id">;
      return { ...data, id: d.id };
    });
    rebuild(incomingCache, outgoingCache);
  }, (err) => {
    console.error("Incoming friend request listener error:", err);
    setStore("loading", false);
  });

  unsubOutgoing = onSnapshot(outgoingQ, (snap) => {
    outgoingCache = snap.docs.map(d => {
      const data = d.data() as Omit<FriendRequestItem, "id">;
      return { ...data, id: d.id };
    });
    rebuild(incomingCache, outgoingCache);
  }, (err) => {
    console.error("Outgoing friend request listener error:", err);
    setStore("loading", false);
  });
}

export function stopListening() {
  if (unsubIncoming) { unsubIncoming(); unsubIncoming = null; }
  if (unsubOutgoing) { unsubOutgoing(); unsubOutgoing = null; }
}

export async function sendFriendRequest(fromUid: string, fromName: string, toName: string): Promise<void> {
  if (!db) throw new Error("Firestore not available");

  const usersSnap = await getDocs(query(
    collection(db, "users"),
    where("displayName", "==", toName),
  ));

  if (usersSnap.empty) throw new Error("User not found");
  if (usersSnap.docs.length > 1) throw new Error("Multiple users found");
  const toUser = usersSnap.docs[0];
  const toUid = toUser.id;
  const toDisplayName = toUser.data().displayName || toName;

  if (toUid === fromUid) throw new Error("You cannot add yourself as a friend");

  const [existing1, existing2] = await Promise.all([
    getDocs(query(collection(db, "friendRequests"), where("from", "==", fromUid), where("to", "==", toUid))),
    getDocs(query(collection(db, "friendRequests"), where("from", "==", toUid), where("to", "==", fromUid))),
  ]);
  const allExisting = [...existing1.docs, ...existing2.docs];
  for (const d of allExisting) {
    const data = d.data();
    if (data.status === "pending") throw new Error("Friend request already sent");
    if (data.status === "accepted") throw new Error("Already friends");
    if (data.status === "blocked") throw new Error("Unable to send request");
  }

  await addDoc(collection(db, "friendRequests"), {
    from: fromUid,
    to: toUid,
    fromName: fromName,
    toName: toDisplayName,
    status: "pending",
    createdAt: Date.now(),
  });
}

export async function acceptFriendRequest(item: FriendRequestItem): Promise<void> {
  if (!db) throw new Error("Firestore not available");
  await updateDoc(doc(db, "friendRequests", item.id), { status: "accepted" });
}

export async function rejectFriendRequest(item: FriendRequestItem): Promise<void> {
  if (!db) throw new Error("Firestore not available");
  await deleteDoc(doc(db, "friendRequests", item.id));
}

export async function removeFriend(currentUid: string, friend: FriendUser): Promise<void> {
  if (!db) throw new Error("Firestore not available");
  const [snap1, snap2] = await Promise.all([
    getDocs(query(collection(db, "friendRequests"), where("from", "==", currentUid), where("to", "==", friend.uid))),
    getDocs(query(collection(db, "friendRequests"), where("from", "==", friend.uid), where("to", "==", currentUid))),
  ]);
  const batch = writeBatch(db);
  for (const d of [...snap1.docs, ...snap2.docs]) {
    const data = d.data();
    if (data.status === "accepted") {
      batch.delete(doc(db, "friendRequests", d.id));
    }
  }
  await batch.commit();
}

export async function cancelFriendRequest(item: FriendRequestItem): Promise<void> {
  if (!db) throw new Error("Firestore not available");
  await deleteDoc(doc(db, "friendRequests", item.id));
}

export async function lookupUserByName(name: string): Promise<{ uid: string; displayName: string } | null> {
  if (!db) throw new Error("Firestore not available");
  const snap = await getDocs(query(
    collection(db, "users"),
    where("displayName", "==", name),
  ));
  if (snap.empty) return null;
  if (snap.docs.length > 1) return null;
  const doc = snap.docs[0];
  return { uid: doc.id, displayName: doc.data().displayName || name };
}

export async function rejectFriendRequestsBetween(currentUid: string, otherUid: string): Promise<void> {
  if (!db) return;
  const [snap1, snap2] = await Promise.all([
    getDocs(query(collection(db, "friendRequests"), where("from", "==", currentUid), where("to", "==", otherUid))),
    getDocs(query(collection(db, "friendRequests"), where("from", "==", otherUid), where("to", "==", currentUid))),
  ]);
  const batch = writeBatch(db);
  for (const d of [...snap1.docs, ...snap2.docs]) {
    batch.delete(doc(db, "friendRequests", d.id));
  }
  await batch.commit();
}
