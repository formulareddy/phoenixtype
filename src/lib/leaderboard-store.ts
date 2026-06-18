import { db } from "./firebase";
import {
  doc, getDoc, setDoc, getDocs,
  query, collection, where,
} from "firebase/firestore";

function modeKey(mode: string, mode2: string, language: string): string {
  return `${mode}_${mode2}_${language}`;
}

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  wpm: number;
  acc: number;
  raw: number;
  consistency: number;
  timestamp: number;
}

export interface WeeklyEntry {
  uid: string;
  displayName: string;
  xp: number;
}

/* ─── Friends ─── */

export async function getFriendUids(uid: string): Promise<string[]> {
  if (!db) return [];
  try {
    const [incomingSnap, outgoingSnap] = await Promise.all([
      getDocs(query(collection(db, "friendRequests"), where("to", "==", uid))),
      getDocs(query(collection(db, "friendRequests"), where("from", "==", uid))),
    ]);
    const friendUids = new Set<string>();
    for (const d of [...incomingSnap.docs, ...outgoingSnap.docs]) {
      const data = d.data();
      if (data.status === "accepted") {
        friendUids.add(data.from === uid ? data.to : data.from);
      }
    }
    return Array.from(friendUids);
  } catch (err) {
    console.warn("[lb] getFriendUids failed", err);
    return [];
  }
}

/* ─── Per-mode leaderboard ─── */

/** Store leaderboard entry inside the user's own document
 *  under `leaderboards.{modeKey}`.
 *  This works with existing Firestore rules (user can write own doc).
 */
export async function updateLeaderboardEntry(
  uid: string, displayName: string,
  mode: string, mode2: string, language: string,
  wpm: number, acc: number, raw: number, consistency: number,
) {
  if (!db) return;
  try {
    const ref = doc(db, "users", uid);
    const existing = await getDoc(ref);
    const mk = modeKey(mode, mode2, language);
    const prev = existing.exists()
      ? (existing.data()?.leaderboards?.[mk]?.wpm ?? 0)
      : 0;
    if (prev >= wpm) return;
    const name = existing.exists()
      ? (existing.data()?.displayName || displayName)
      : displayName;
    const entry = { uid, displayName: name, wpm, acc, raw, consistency, timestamp: Date.now() };
    await setDoc(ref, { leaderboards: { [mk]: entry } }, { merge: true });
  } catch (err) {
    console.warn("[lb] write failed", err);
  }
}

function getDayRange(previous: boolean): { minTime: number; maxTime: number } {
  const d = new Date();
  if (previous) d.setDate(d.getDate() - 1);
  const startOfDay = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return { minTime: startOfDay, maxTime: startOfDay + 86400000 };
}

const MAX_ENTRIES = 100;

function extractEntries(
  users: Record<string, any>[], mk: string, pageSize: number,
  timeframe?: string, previous?: boolean,
  friendsUids?: string[],
): LeaderboardEntry[] {
  const all: LeaderboardEntry[] = [];
  let minTime = 0, maxTime = Infinity;

  if (timeframe === "daily") {
    const r = getDayRange(!!previous);
    minTime = r.minTime;
    maxTime = r.maxTime;
  }

  for (const u of users) {
    const e = u?.leaderboards?.[mk];
    if (e && typeof e.wpm === "number") {
      if (timeframe === "daily") {
        const ts = e.timestamp || 0;
        if (ts < minTime || ts >= maxTime) continue;
      }
      if (friendsUids && friendsUids.length > 0 && !friendsUids.includes(e.uid)) continue;
      all.push(e as LeaderboardEntry);
    }
  }
  all.sort((a, b) => b.wpm - a.wpm || b.acc - a.acc || b.timestamp - a.timestamp);
  return all.slice(0, pageSize);
}

async function fetchEntries(
  mk: string, pageSize: number,
  timeframe?: string, previous?: boolean,
  friendsUids?: string[],
): Promise<LeaderboardEntry[]> {
  if (!db) return [];
  try {
    const snap = await getDocs(query(collection(db, "users")));
    return extractEntries(snap.docs.map(d => d.data()), mk, pageSize, timeframe, previous, friendsUids);
  } catch (err) {
    console.warn("[lb] fetch failed", err);
    return [];
  }
}

/** Poll-based listener using getDocs + setInterval.
 *  Avoids Firebase onSnapshot issues on unfiltered collection queries.
 *  Polls every 15 seconds (same as monkeytype all-time update interval).
 */
export function listenEntries(
  mode: string, mode2: string, language: string,
  timeframe: string, previous: boolean, pageSize: number,
  cb: (entries: LeaderboardEntry[]) => void,
  friendsUids?: string[],
): (() => void) | null {
  if (!db) return null;
  const mk = modeKey(mode, mode2, language);
  let destroyed = false;

  async function poll() {
    if (destroyed) return;
    const entries = await fetchEntries(mk, pageSize, timeframe, previous, friendsUids);
    if (!destroyed) cb(entries);
  }

  poll();
  const id = setInterval(poll, 15000);

  return () => {
    destroyed = true;
    clearInterval(id);
  };
}

export async function getEntries(
  mode: string, mode2: string, language: string,
  timeframe: string, previous: boolean, pageSize: number,
  friendsUids?: string[],
): Promise<LeaderboardEntry[]> {
  if (!db) return [];
  return fetchEntries(modeKey(mode, mode2, language), pageSize, timeframe, previous, friendsUids);
}

export async function getUserEntry(
  uid: string, mode: string, mode2: string, language: string,
  timeframe?: string, previous?: boolean,
  friendsUids?: string[],
): Promise<LeaderboardEntry | null> {
  if (!db) return null;
  try {
    const mk = modeKey(mode, mode2, language);
    const snap = await getDoc(doc(db, "users", uid));
    const e = snap.data()?.leaderboards?.[mk];
    if (!e) return null;
    if (timeframe === "daily") {
      const r = getDayRange(!!previous);
      if (e.timestamp < r.minTime || e.timestamp >= r.maxTime) return null;
    }
    if (friendsUids && friendsUids.length > 0 && !friendsUids.includes(e.uid)) return null;
    return e as LeaderboardEntry;
  } catch (err) {
    console.warn("[lb] getUserEntry failed", err);
    return null;
  }
}

export async function getTotalCount(
  mode: string, mode2: string, language: string,
  timeframe?: string, previous?: boolean,
  friendsUids?: string[],
): Promise<number> {
  if (!db) return 0;
  try {
    const mk = modeKey(mode, mode2, language);
    const snap = await getDocs(collection(db, "users"));
    let count = 0;
    let minTime = 0, maxTime = Infinity;
    if (timeframe === "daily") {
      const r = getDayRange(!!previous);
      minTime = r.minTime;
      maxTime = r.maxTime;
    }
    for (const d of snap.docs) {
      const e = d.data()?.leaderboards?.[mk];
      if (e && typeof e.wpm === "number") {
        if (timeframe === "daily") {
          if (e.timestamp < minTime || e.timestamp >= maxTime) continue;
        }
        if (friendsUids && friendsUids.length > 0 && !friendsUids.includes(e.uid)) continue;
        count++;
      }
    }
    return count;
  } catch (err) {
    console.warn("[lb] getTotalCount failed", err);
    return 0;
  }
}

export async function getUserRank(
  uid: string, mode: string, mode2: string, language: string,
  timeframe?: string, previous?: boolean,
  friendsUids?: string[],
): Promise<{ rank: number; total: number }> {
  if (!db) return { rank: 0, total: 0 };
  try {
    const mk = modeKey(mode, mode2, language);
    const snap = await getDocs(collection(db, "users"));
    const entries: { uid: string; wpm: number }[] = [];
    let minTime = 0, maxTime = Infinity;
    if (timeframe === "daily") {
      const r = getDayRange(!!previous);
      minTime = r.minTime;
      maxTime = r.maxTime;
    }
    for (const d of snap.docs) {
      const e = d.data()?.leaderboards?.[mk];
      if (e && typeof e.wpm === "number") {
        if (timeframe === "daily") {
          if (e.timestamp < minTime || e.timestamp >= maxTime) continue;
        }
        if (friendsUids && friendsUids.length > 0 && !friendsUids.includes(e.uid)) continue;
        entries.push({ uid: d.id, wpm: e.wpm });
      }
    }
    entries.sort((a, b) => b.wpm - a.wpm);
    const total = entries.length;
    const idx = entries.findIndex(e => e.uid === uid);
    return { rank: idx >= 0 ? idx + 1 : 0, total };
  } catch (err) {
    console.warn("[lb] getUserRank failed", err);
    return { rank: 0, total: 0 };
  }
}

/* ─── Weekly XP ─── */

/** Return Monday UTC date string like "2024-06-17" for the week containing `date`. */
function getWeekStartKey(date: Date): string {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

/** Monkeytype XP formula: round(wpm * (acc/100)^2) */
function calcXp(wpm: number, accuracy: number): number {
  return Math.round(wpm * Math.pow(accuracy / 100, 2));
}

/** Add XP from a completed test to the current week's total.
 *  Stored as `leaderboards.weekly_xp.{weekKey}` in the user's document.
 */
export async function updateWeeklyXp(
  uid: string, displayName: string,
  wpm: number, accuracy: number,
) {
  if (!db) return;
  const xp = calcXp(wpm, accuracy);
  if (xp <= 0) return;
  const weekKey = getWeekStartKey(new Date());
  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    const name = snap.exists()
      ? (snap.data()?.displayName || displayName)
      : displayName;
    const currentXp = snap.data()?.leaderboards?.weekly_xp?.[weekKey] ?? 0;
    await setDoc(ref, {
      displayName: name,
      leaderboards: {
        weekly_xp: { [weekKey]: currentXp + xp },
      },
    }, { merge: true });
  } catch (err) {
    console.warn("[lb] weekly xp update failed", err);
  }
}

/** Fetch weekly XP leaderboard entries for a given week (current or previous). */
async function fetchWeekly(
  previous: boolean,
  friendsUids?: string[],
): Promise<WeeklyEntry[]> {
  if (!db) return [];
  const d = new Date();
  if (previous) d.setDate(d.getDate() - 7);
  const weekKey = getWeekStartKey(d);
  try {
    const snap = await getDocs(query(collection(db, "users")));
    const entries: WeeklyEntry[] = [];
    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      const xp = data?.leaderboards?.weekly_xp?.[weekKey];
      if (typeof xp === "number" && xp > 0) {
        if (friendsUids && friendsUids.length > 0 && !friendsUids.includes(docSnap.id)) continue;
        entries.push({
          uid: docSnap.id,
          displayName: data?.displayName || "Unknown",
          xp,
        });
      }
    }
    entries.sort((a, b) => b.xp - a.xp);
    return entries.slice(0, MAX_ENTRIES);
  } catch (err) {
    console.warn("[lb] fetchWeekly failed", err);
    return [];
  }
}

/** Poll-based listener for the weekly XP leaderboard. */
export function listenWeekly(
  previous: boolean,
  cb: (entries: WeeklyEntry[]) => void,
  friendsUids?: string[],
): () => void {
  if (!db) return () => {};
  let destroyed = false;
  async function poll() {
    if (destroyed) return;
    const entries = await fetchWeekly(previous, friendsUids);
    if (!destroyed) cb(entries);
  }
  poll();
  const id = setInterval(poll, 15000);
  return () => { destroyed = true; clearInterval(id); };
}

/** Get the current user's weekly XP, rank, and total participants. */
export async function getUserWeeklyData(
  uid: string, previous: boolean,
  friendsUids?: string[],
): Promise<{ xp: number; rank: number; total: number }> {
  if (!db) return { xp: 0, rank: 0, total: 0 };
  const d = new Date();
  if (previous) d.setDate(d.getDate() - 7);
  const weekKey = getWeekStartKey(d);
  try {
    const snap = await getDoc(doc(db, "users", uid));
    const xp = snap.data()?.leaderboards?.weekly_xp?.[weekKey] ?? 0;
    const allSnap = await getDocs(query(collection(db, "users")));
    const allXp: number[] = [];
    for (const ds of allSnap.docs) {
      if (friendsUids && friendsUids.length > 0 && !friendsUids.includes(ds.id)) continue;
      const v = ds.data()?.leaderboards?.weekly_xp?.[weekKey];
      if (typeof v === "number" && v > 0) allXp.push(v);
    }
    allXp.sort((a, b) => b - a);
    const rank = xp > 0 ? allXp.indexOf(xp) + 1 : 0;
    return { xp, rank, total: allXp.length };
  } catch (err) {
    console.warn("[lb] getUserWeeklyData failed", err);
    return { xp: 0, rank: 0, total: 0 };
  }
}
