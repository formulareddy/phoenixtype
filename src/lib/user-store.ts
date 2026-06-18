import { db } from "./firebase";
import { doc, getDoc, setDoc, updateDoc, onSnapshot, query, where, getDocs, collection, orderBy, limit } from "firebase/firestore";
import { createStore } from "solid-js/store";

export interface UserData {
  uid: string;
  displayName: string;
  displayNameLower?: string;
  email?: string;
  bio: string;
  keyboard: string;
  github: string;
  twitter: string;
  instagram: string;
  website: string;
  avatarId: number;
  customAvatar: string;
  showActivityOnPublicProfile: boolean;
  startedTests: number;
  completedTests: number;
  timeTyping: number;
  xp: number;
  streakLength: number;
  streakMaxLength: number;
  streakHourOffset?: number;
  optOutOfLeaderboards?: boolean;
  lastNameChange?: number;
  lastTestDate: string;
  joined: number;
  pb15wpm: number; pb15acc: number; pb15raw: number; pb15cons: number; pb15date: string;
  pb30wpm: number; pb30acc: number; pb30raw: number; pb30cons: number; pb30date: string;
  pb60wpm: number; pb60acc: number; pb60raw: number; pb60cons: number; pb60date: string;
  pb120wpm: number; pb120acc: number; pb120raw: number; pb120cons: number; pb120date: string;
  pb10wpm: number; pb10acc: number; pb10raw: number; pb10cons: number; pb10date: string;
  pb25wpm: number; pb25acc: number; pb25raw: number; pb25cons: number; pb25date: string;
  pb50wpm: number; pb50acc: number; pb50raw: number; pb50cons: number; pb50date: string;
  pb100wpm: number; pb100acc: number; pb100raw: number; pb100cons: number; pb100date: string;
  blockedUsers?: string[];
  apeKeys?: { name: string; key: string; created: number; modified: number; lastUsed: number; active: boolean }[];
  discordLinked?: boolean;
  verified?: boolean;
  badge1000?: boolean;
}

const defaults: UserData = {
  uid: "", displayName: "", email: "", bio: "", keyboard: "", github: "", twitter: "", instagram: "", website: "",
  avatarId: 0, customAvatar: "", showActivityOnPublicProfile: true,
  startedTests: 0, completedTests: 0, timeTyping: 0, xp: 0, streakLength: 0, streakMaxLength: 0, lastTestDate: "", joined: 0,
  pb15wpm: 0, pb15acc: 0, pb15raw: 0, pb15cons: 0, pb15date: "",
  pb30wpm: 0, pb30acc: 0, pb30raw: 0, pb30cons: 0, pb30date: "",
  pb60wpm: 0, pb60acc: 0, pb60raw: 0, pb60cons: 0, pb60date: "",
  pb120wpm: 0, pb120acc: 0, pb120raw: 0, pb120cons: 0, pb120date: "",
  pb10wpm: 0, pb10acc: 0, pb10raw: 0, pb10cons: 0, pb10date: "",
  pb25wpm: 0, pb25acc: 0, pb25raw: 0, pb25cons: 0, pb25date: "",
  pb50wpm: 0, pb50acc: 0, pb50raw: 0, pb50cons: 0, pb50date: "",
  pb100wpm: 0, pb100acc: 0, pb100raw: 0, pb100cons: 0, pb100date: "",
};

export async function createUserDoc(uid: string, displayName: string, email?: string) {
  if (!db) return;
  const ref = doc(db, "users", uid);
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, { ...defaults, uid, displayName, displayNameLower: displayName.toLowerCase(), email: email || "", joined: Date.now() });
      checkAndSetBadge1000(uid);
    } else {
      const data = snap.data();
      const updates: Record<string, unknown> = {};
      if (!data.joined) updates.joined = Date.now();
      if (!data.displayNameLower) updates.displayNameLower = displayName.toLowerCase();
      if (Object.keys(updates).length > 0) await updateDoc(ref, updates);
      if (data.badge1000 === undefined) {
        checkAndSetBadge1000(uid);
      }
    }
  } catch { /* permission denied or offline */ }
}

const nameCache = new Map<string, { available: boolean; expires: number }>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

export async function checkNameAvailability(name: string, excludeUid?: string): Promise<boolean> {
  if (!db) return true;
  const lower = name.toLowerCase();
  const cached = nameCache.get(lower);
  if (cached && Date.now() < cached.expires) return cached.available;
  const q = query(collection(db, "users"), where("displayNameLower", "==", lower));
  const snap = await getDocs(q);
  let available: boolean;
  if (snap.empty) {
    available = true;
  } else if (excludeUid && snap.docs.length === 1 && snap.docs[0].id === excludeUid) {
    available = true;
  } else {
    available = false;
  }
  nameCache.set(lower, { available, expires: Date.now() + CACHE_TTL });
  return available;
}

const VERIFIED_NAMES = new Set(["Cristiano Ronaldo", "Virat Kohli"]);

export function isVerifiedDisplayName(name: string): boolean {
  return VERIFIED_NAMES.has(name);
}

function applyVerification(data: UserData): UserData {
  if (!data.verified && VERIFIED_NAMES.has(data.displayName)) data.verified = true;
  return data;
}

/* ─── First-1000 badge ─── */

/** Display names excluded from the first-1000 badge count (test accounts). */
const EXCLUDED_BADGE_NAMES = new Set(["cristiano ronaldo", "virat kohli"]);

/** Return the set of UIDs that are among the first 1000 real signups. */
async function getFirst1000Uids(): Promise<Set<string>> {
  if (!db) return new Set();
  const snap = await getDocs(query(collection(db, "users"), orderBy("joined", "asc"), limit(2000)));
  const result = new Set<string>();
  let count = 0;
  for (const d of snap.docs) {
    const data = d.data();
    const name = (data.displayNameLower || "").toLowerCase();
    if (EXCLUDED_BADGE_NAMES.has(name)) continue;
    if (count >= 1000) break;
    result.add(d.id);
    count++;
  }
  return result;
}

/** Check if the given uid qualifies for the badge and set the field. */
export async function checkAndSetBadge1000(uid: string): Promise<boolean> {
  if (!db) return false;
  try {
    const first1000 = await getFirst1000Uids();
    const hasBadge = first1000.has(uid);
    await updateDoc(doc(db, "users", uid), { badge1000: hasBadge } as any).catch(() => {});
    return hasBadge;
  } catch {
    return false;
  }
}

export async function getUserData(uid: string): Promise<UserData | null> {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return null;
    return applyVerification({ ...defaults, ...snap.data() } as UserData);
  } catch { return null; }
}

export async function updateUserDoc(uid: string, updates: Partial<UserData>) {
  if (!db) return;
  await updateDoc(doc(db, "users", uid), updates);
}

export function listenUserData(uid: string | null, cb: (data: UserData | null) => void): (() => void) | null {
  if (!db || !uid) return null;
  const ref = doc(db, "users", uid);
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) cb(applyVerification({ ...defaults, ...snap.data() } as UserData));
    else cb(null);
  });
}

export function calcXp(wpm: number, acc: number): number {
  return Math.round(wpm * (acc / 100) * 10);
}

export function calcLevel(xp: number): number {
  let level = 0;
  let needed = 100;
  let total = 0;
  while (total + needed <= xp) {
    total += needed;
    level++;
    needed = Math.round(needed * 1.3);
  }
  return level;
}

export function calcXpForNextLevel(xp: number): { current: number; needed: number } {
  let level = 0;
  let needed = 100;
  let total = 0;
  while (total + needed <= xp) {
    total += needed;
    level++;
    needed = Math.round(needed * 1.3);
  }
  return { current: xp - total, needed };
}

export interface Badge {
  label: string;
  icon: string;
  color: string;
}

export function getBadge(level: number): Badge {
  if (level >= 500) return { label: "Mythical", icon: "★", color: "#FFD700" };
  if (level >= 350) return { label: "Grandmaster", icon: "◆", color: "#E53935" };
  if (level >= 200) return { label: "Master", icon: "⬟", color: "#9C27B0" };
  if (level >= 100) return { label: "Diamond", icon: "◇", color: "#42A5F5" };
  if (level >= 50) return { label: "Platinum", icon: "○", color: "#26A69A" };
  if (level >= 25) return { label: "Gold", icon: "●", color: "#FFB300" };
  if (level >= 10) return { label: "Silver", icon: "●", color: "#BDBDBD" };
  return { label: "Bronze", icon: "●", color: "#A1887F" };
}

const [userCache, setUserCache] = createStore<Record<string, UserData | null>>({});
export { userCache };

export function cacheUser(uid: string, data: UserData | null) {
  setUserCache(uid, data);
}
