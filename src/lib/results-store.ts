import { createSignal, createRoot } from "solid-js";
import type { LeaderboardTimeframe, LeaderboardEntry } from "./leaderboard";

const STORAGE_KEY = "mt-results";

export interface StoredResult {
  id: string;
  name: string;
  wpm: number;
  acc: number;
  raw: number;
  consistency: number;
  mode: string;
  timestamp: number;
  duration?: number;
  difficulty?: string;
  language?: string;
  punctuation?: boolean;
  numbers?: boolean;
  funbox?: string[];
  modeValue?: string;
  charCount?: number;
}

const communityNames = [
  "miodec", "monkeytype", "speeddemon", "typegod", "keymaster",
  "qtip", "typefast", "wordwizard", "clackclack", "nimble",
  "alphakey", "charcount", "wpmking", "accqueen", "monkeystyle",
  "vroomvroom", "smoothbrain", "rawdogger", "dexster", "ctrlz",
  "spacebar", "fingertips", "homingkey", "pinkytarget", "ringfinger",
  "leftshift", "rightalt", "capslocker", "typeracer", "nokeyboard",
];

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function loadFromStorage(): StoredResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function saveToStorage(data: StoredResult[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function isWithinTimeframe(timestamp: number, timeframe: LeaderboardTimeframe): boolean {
  const now = Date.now();
  switch (timeframe) {
    case "daily": return now - timestamp < 86400000;
    case "weekly": return now - timestamp < 604800000;
    case "monthly": return now - timestamp < 2592000000;
    case "yearly": return now - timestamp < 31536000000;
    default: return true;
  }
}

export function generateCommunityEntries(
  realResults: StoredResult[],
  timeframe: LeaderboardTimeframe,
  count: number,
): StoredResult[] {
  if (realResults.length === 0) return [];
  const avgWpm = realResults.reduce((s, r) => s + r.wpm, 0) / realResults.length;
  const avgAcc = realResults.reduce((s, r) => s + r.acc, 0) / realResults.length;
  const avgRaw = realResults.reduce((s, r) => s + r.raw, 0) / realResults.length;
  const avgCon = realResults.reduce((s, r) => s + r.consistency, 0) / realResults.length;
  const stdWpm = Math.sqrt(realResults.reduce((s, r) => s + (r.wpm - avgWpm) ** 2, 0) / realResults.length) || 30;
  const stdAcc = Math.sqrt(realResults.reduce((s, r) => s + (r.acc - avgAcc) ** 2, 0) / realResults.length) || 3;
  const usedNames = new Set(realResults.map(r => r.name));
  const now = Date.now();
  const daySeed = Math.floor(now / 86400000);
  const entries: StoredResult[] = [];
  for (let i = 0; i < communityNames.length && entries.length < count; i++) {
    const n = communityNames[i];
    if (usedNames.has(n)) continue;
    const s = daySeed + i * 137;
    const wpm = Math.round(avgWpm + (pseudoRandom(s) - 0.5) * stdWpm * 2.5);
    const acc = Math.round((avgAcc + (pseudoRandom(s + 1) - 0.5) * stdAcc * 2) * 10) / 10;
    if (wpm < 30 || wpm > 250 || acc < 60 || acc > 100) continue;
    let ts: number;
    switch (timeframe) {
      case "daily": ts = now - pseudoRandom(s + 2) * 86400000; break;
      case "weekly": ts = now - pseudoRandom(s + 2) * 604800000; break;
      case "monthly": ts = now - pseudoRandom(s + 2) * 2592000000; break;
      case "yearly": ts = now - pseudoRandom(s + 2) * 31536000000; break;
      default: ts = now - pseudoRandom(s + 2) * 31536000000;
    }
    entries.push({
      id: `community-${n}`,
      name: n,
      wpm: Math.min(250, Math.max(30, wpm)),
      acc: Math.min(100, Math.max(60, acc)),
      raw: Math.round(wpm * (0.85 + pseudoRandom(s + 3) * 0.3)),
      consistency: Math.round((75 + pseudoRandom(s + 4) * 25) * 10) / 10,
      mode: "time",
      timestamp: ts,
    });
  }
  return entries.sort((a, b) => b.wpm - a.wpm);
}

export function buildLeaderboardData(
  timeframe: LeaderboardTimeframe,
  mode: string,
  allResults: StoredResult[],
): { entries: LeaderboardEntry[]; count: number } {
  const filtered = allResults.filter(r => isWithinTimeframe(r.timestamp, timeframe));
  const modeFiltered = filtered.filter(r => {
    const base = r.mode.split("+")[0];
    const m = mode.split("/")[0];
    return base === m;
  });
  const community = generateCommunityEntries(modeFiltered, timeframe, 25);
  const combined = [...modeFiltered, ...community];
  combined.sort((a, b) => b.wpm - a.wpm || b.acc - a.acc);
  const entries: LeaderboardEntry[] = combined.map((r, i) => ({
    rank: i + 1,
    name: r.name,
    wpm: r.wpm,
    acc: r.acc,
    raw: r.raw,
    consistency: r.consistency,
    timestamp: r.timestamp,
  }));
  return { entries, count: entries.length };
}

const store = createRoot(() => {
  const [results, setResults] = createSignal<StoredResult[]>(loadFromStorage());

  function addResult(
    wpm: number, acc: number, raw: number, consistency: number,
    mode: string, name?: string,
    difficulty?: string, language?: string, punctuation?: boolean,
    numbers?: boolean, funbox?: string[], modeValue?: string,
  ) {
    const entry: StoredResult = {
      id: generateId(),
      name: name || "guest",
      wpm: Math.round(wpm),
      acc: Math.round(acc * 10) / 10,
      raw: Math.round(raw),
      consistency: Math.round(consistency * 10) / 10,
      mode,
      timestamp: Date.now(),
      difficulty,
      language,
      punctuation,
      numbers,
      funbox,
      modeValue,
    };
    const updated = [entry, ...results()];
    setResults(updated);
    saveToStorage(updated);
  }

  return { results, addResult };
});

export function useResults() {
  return store;
}
