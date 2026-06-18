import { createMemo, createSignal, createEffect, For, Show, onCleanup } from "solid-js";
import { useAuth } from "../lib/AuthProvider";
import { useResults } from "../lib/results-store";
import type { StoredResult } from "../lib/results-store";
import { configStore } from "../lib/config-store";
import { profileStore } from "../lib/profile-store";
import { AVATARS, PREMIUM_AVATARS, PET_AVATARS, ANIMAL_AVATARS, DEFAULT_AVATAR_ID } from "../lib/avatars";
import { LANGUAGES } from "../constants/languages";
import { listenUserData, calcLevel, calcXpForNextLevel, getBadge } from "../lib/user-store";
import SlimSelect from "./ui/SlimSelect";
import EditProfileModal from "./EditProfileModal";
import { showSuccessNotification } from "../lib/notifications";

/* Full funbox modes list matching monkeytype's FunboxNameSchema */
const FUNBOX_NAMES: string[] = [
  "58008", "mirror", "upside_down", "nausea", "round_round_baby",
  "simon_says", "tts", "choo_choo", "arrows", "rAnDoMcAsE",
  "sPoNgEcAsE", "capitals", "layout_mirror", "layoutfluid",
  "earthquake", "space_balls", "gibberish", "ascii", "specials",
  "plus_zero", "plus_one", "plus_two", "plus_three",
  "read_ahead_easy", "read_ahead", "read_ahead_hard", "memory",
  "nospace", "poetry", "wikipedia", "weakspot", "pseudolang",
  "IPv4", "IPv6", "binary", "hexadecimal", "zipf", "morse", "crt",
  "backwards", "ddoouubblleedd", "instant_messaging",
  "underscore_spaces", "ALL_CAPS", "polyglot", "asl", "rot13", "no_quit",
];

interface Props {
  onNavigate: (page: string) => void;
}

interface PbEntry {
  wpm: number;
  acc: number;
  raw: number;
  consistency: number;
  timestamp: number;
}

/* Record<key, boolean> model matching monkeytype's ResultFilters */
interface ResultFilters {
  date: Record<string, boolean>;
  mode: Record<string, boolean>;
  difficulty: Record<string, boolean>;
  pb: Record<string, boolean>;
  punctuation: Record<string, boolean>;
  numbers: Record<string, boolean>;
  words: Record<string, boolean>;
  time: Record<string, boolean>;
  quoteLength: Record<string, boolean>;
  language: Record<string, boolean>;
  funbox: Record<string, boolean>;
  tags: Record<string, boolean>;
}

function normalizeResult(r: Record<string, unknown>): StoredResult {
  return {
    id: (r.id as string) || "",
    name: (r.name as string) || "guest",
    wpm: (r.wpm as number) || 0,
    acc: (r.acc as number) ?? 0,
    raw: (r.raw as number) || 0,
    consistency: (r.consistency as number) ?? 0,
    mode: (r.mode as string) || "time 15",
    timestamp: (r.timestamp as number) || Date.now(),
    duration: r.duration as number | undefined,
    difficulty: r.difficulty as string | undefined,
    language: r.language as string | undefined,
    punctuation: r.punctuation as boolean | undefined,
    numbers: r.numbers as boolean | undefined,
    funbox: r.funbox as string[] | undefined,
    modeValue: r.modeValue as string | undefined,
  };
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function getPbs(results: StoredResult[]): Record<string, PbEntry> {
  const pbs: Record<string, PbEntry> = {};
  for (const r of results) {
    if (!r.wpm) continue;
    const key = r.mode.includes(" ") ? r.mode.split(" ").slice(0, 2).join(" ") : r.mode;
    if (!pbs[key] || r.wpm > pbs[key].wpm) {
      pbs[key] = { wpm: r.wpm, acc: r.acc, raw: r.raw, consistency: r.consistency, timestamp: r.timestamp };
    }
  }
  return pbs;
}

function parseModeParts(mode: string): { base: string; value: string; hasPunct: boolean; hasNums: boolean } {
  const parts = mode.split(" ");
  const base = parts[0] || "time";
  const value = parts[1] || "";
  const hasPunct = parts.includes("punctuation") || parts.includes("punct");
  const hasNums = parts.includes("numbers");
  return { base, value, hasPunct, hasNums };
}

/* monkeytype-style filter helpers — Record<key, boolean> model */

function recordAll(keys: readonly string[]): Record<string, boolean> {
  return Object.fromEntries(keys.map(k => [k, true]));
}
function recordNone(keys: readonly string[]): Record<string, boolean> {
  return Object.fromEntries(keys.map(k => [k, false]));
}

function fromDefaultSettings(): ResultFilters {
  return {
    date: { all: true, last_day: false, last_week: false, last_month: false, last_3months: false },
    pb: { no: true, yes: true },
    difficulty: recordAll(["normal", "expert", "master"]),
    mode: recordAll(["time", "words", "quote", "zen", "custom"]),
    words: recordAll(["10", "25", "50", "100", "custom"]),
    time: recordAll(["15", "30", "60", "120", "custom"]),
    quoteLength: recordAll(["short", "medium", "long", "thicc"]),
    punctuation: { on: true, off: true },
    numbers: { on: true, off: true },
    language: recordAll(LANGUAGES),
    funbox: { none: true, ...recordAll(FUNBOX_NAMES) },
    tags: { none: true },
  };
}

function noFilters(): ResultFilters {
  return {
    date: { all: true, last_day: false, last_week: false, last_month: false, last_3months: false },
    pb: { no: false, yes: false },
    difficulty: recordNone(["normal", "expert", "master"]),
    mode: recordNone(["time", "words", "quote", "zen", "custom"]),
    words: recordNone(["10", "25", "50", "100", "custom"]),
    time: recordNone(["15", "30", "60", "120", "custom"]),
    quoteLength: recordNone(["short", "medium", "long", "thicc"]),
    punctuation: { on: false, off: false },
    numbers: { on: false, off: false },
    language: {},
    funbox: {},
    tags: {},
  };
}

function fromCurrentSettings(): ResultFilters {
  const f = noFilters();
  f.pb = { no: true, yes: true };
  f.difficulty[configStore.difficulty] = true;
  f.mode[configStore.mode] = true;
  if (configStore.mode === "time") {
    const v = `${configStore.time}`;
    if (["15", "30", "60", "120"].includes(v)) f.time[v] = true; else f.time["custom"] = true;
  } else if (configStore.mode === "words") {
    const v = `${configStore.wordCount}`;
    if (["10", "25", "50", "100"].includes(v)) f.words[v] = true; else f.words["custom"] = true;
  } else if (configStore.mode === "quote") {
    ["short", "medium", "long", "thicc"].forEach((ql, i) => {
      f.quoteLength[ql] = configStore.quoteLength?.includes(i as any) ?? false;
    });
  }
  f.punctuation = configStore.punctuation ? { on: true, off: false } : { on: false, off: true };
  f.numbers = configStore.numbers ? { on: true, off: false } : { on: false, off: true };
  if (configStore.mode === "quote" && /^english/.test(configStore.language)) {
    f.language["english"] = true;
  } else {
    f.language[configStore.language] = true;
  }
  if (configStore.funbox.length === 0) {
    f.funbox["none"] = true;
  } else {
    for (const fb of configStore.funbox) f.funbox[fb] = true;
  }
  f.tags["none"] = true;
  f.date.all = true;
  return f;
}



const FILTER_PRESETS_KEY = "mt-filter-presets";

function loadPresets(): { name: string; filters: ResultFilters }[] {
  try {
    const raw = localStorage.getItem(FILTER_PRESETS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function savePresets(presets: { name: string; filters: ResultFilters }[]) {
  try { localStorage.setItem(FILTER_PRESETS_KEY, JSON.stringify(presets)); } catch { /* ignore */ }
}

export default function AccountPage(props: Props) {
  const { store, logout } = useAuth();
  const [showEditProfile, setShowEditProfile] = createSignal(false);
  const [presets, setPresets] = createSignal<{ name: string; filters: ResultFilters }[]>(loadPresets());
  const [userData, setUserData] = createSignal<any>(null);

  createEffect(() => {
    const uid = store.user?.uid;
    if (!uid) return;
    const unsub = listenUserData(uid, (d) => setUserData(d));
    onCleanup(() => unsub?.());
  });

  const streakLength = () => userData()?.streakLength || 0;
  const userLevel = () => calcLevel(userData()?.xp || 0);
  const xpInfo = () => calcXpForNextLevel(userData()?.xp || 0);

  const allResults = createMemo(() => (results() as unknown as Record<string, unknown>[]).map(normalizeResult));

  /* Monkeytype-style filter helpers — empty active = skip filter (pass all) */
  function allTrue(g: Record<string, boolean>): boolean {
    const vals = Object.values(g);
    return vals.length > 0 && vals.every(v => v);
  }
  function activeKeys(g: Record<string, boolean>): string[] {
    return Object.entries(g).filter(([, v]) => v).map(([k]) => k);
  }
  /* If all true → skip, if empty → skip, otherwise match against active keys (OR within group, AND across groups). */
  function filterGroup<T>(g: Record<string, boolean>, val: T, match: (v: T, active: string[]) => boolean): boolean {
    if (allTrue(g)) return true;
    const active = activeKeys(g);
    if (active.length === 0) return true;
    return match(val, active);
  }

  /* ── Filter logic matching monkeytype AND/OR ── */
  const filteredResults = createMemo(() => {
    const r = allResults();
    const f = filters();

    return r.filter(t => {
      /* date */
      if (!allTrue(f.date)) {
        const dateActive = activeKeys(f.date).filter(k => k !== "all");
        if (dateActive.length === 0) return true;
        const now = Date.now();
        const cutoffs: Record<string, number> = {
          last_day: 86400000, last_week: 604800000, last_month: 2592000000, last_3months: 7776000000,
        };
        if (!dateActive.some(k => t.timestamp >= now - cutoffs[k])) return false;
      }

      /* pb */
      if (!allTrue(f.pb)) {
        const active = activeKeys(f.pb);
        if (active.length === 0) return true;
        const pbs = getPbs(allResults());
        const pbKey = parseModeParts(t.mode).base;
        const isPb = pbs[pbKey] && pbs[pbKey].timestamp === t.timestamp;
        if (active.includes("yes") && !active.includes("no") && !isPb) return false;
        if (active.includes("no") && !active.includes("yes") && isPb) return false;
      }

      /* mode/time/words */
      const { base: mpBase, value: mpVal } = parseModeParts(t.mode);
      if (!filterGroup(f.mode, mpBase, (v, a) => a.includes(v))) return false;
      const knownTimes = ["15", "30", "60", "120"];
      if (mpBase === "time" && !filterGroup(f.time, mpVal && knownTimes.includes(mpVal) ? mpVal : "custom", (v, a) => a.includes(v))) return false;
      const knownWords = ["10", "25", "50", "100"];
      if (mpBase === "words" && !filterGroup(f.words, mpVal && knownWords.includes(mpVal) ? mpVal : "custom", (v, a) => a.includes(v))) return false;

      /* difficulty */
      if (!filterGroup(f.difficulty, t.difficulty || "normal", (v, a) => a.includes(v))) return false;

      /* punctuation */
      if (!filterGroup(f.punctuation, null, (_, a) => {
        const { hasPunct } = parseModeParts(t.mode);
        const actual = t.punctuation !== undefined ? t.punctuation : hasPunct;
        return a.includes("on") && actual || a.includes("off") && !actual;
      })) return false;

      /* numbers */
      if (!filterGroup(f.numbers, null, (_, a) => {
        const { hasNums } = parseModeParts(t.mode);
        const actual = t.numbers !== undefined ? t.numbers : hasNums;
        return a.includes("on") && actual || a.includes("off") && !actual;
      })) return false;

      /* quoteLength: pass-through */
      /* language */
      if (!filterGroup(f.language, t.language || "english", (v, a) => a.includes(v))) return false;

      /* funbox */
      if (!filterGroup(f.funbox, null, (_, a) => {
        const modes = t.funbox || [];
        const hasMatch = modes.some(m => a.includes(m));
        const noneMatch = a.includes("none") && modes.length === 0;
        return hasMatch || noneMatch;
      })) return false;

      return true;
    });
  });

  const pbs = createMemo(() => getPbs(filteredResults()));

  const stats = createMemo(() => {
    const r = filteredResults();
    const completed = r.length;
    const started = completed;
    const timeTyped = r.reduce((s, t) => s + (t.duration || 0), 0);
    const wpmVals = r.map(t => t.wpm);
    const accVals = r.filter(t => t.acc > 0).map(t => t.acc);
    const rawVals = r.filter(t => t.raw > 0).map(t => t.raw);
    const conVals = r.filter(t => t.consistency > 0).map(t => t.consistency);
    const highWpm = wpmVals.length ? Math.max(...wpmVals) : 0;
    const avgWpm = wpmVals.length ? wpmVals.reduce((s, v) => s + v, 0) / wpmVals.length : 0;
    const highRaw = rawVals.length ? Math.max(...rawVals) : 0;
    const avgRaw = rawVals.length ? rawVals.reduce((s, v) => s + v, 0) / rawVals.length : 0;
    const avgAcc = accVals.length ? accVals.reduce((s, v) => s + v, 0) / accVals.length : 0;
    const highAcc = accVals.length ? Math.max(...accVals) : 0;
    const highCon = conVals.length ? Math.max(...conVals) : 0;
    const avgCon = conVals.length ? conVals.reduce((s, v) => s + v, 0) / conVals.length : 0;
    const last10 = r.slice(0, 10);
    const avgWpm10 = last10.length ? last10.reduce((s, t) => s + t.wpm, 0) / last10.length : 0;
    const avgRaw10 = last10.length ? last10.reduce((s, t) => s + t.raw, 0) / last10.length : 0;
    const avgAcc10 = last10.length ? last10.reduce((s, t) => s + t.acc, 0) / last10.length : 0;
    const avgCon10 = last10.length ? last10.reduce((s, t) => s + t.consistency, 0) / last10.length : 0;
    const estimatedWords = r.reduce((s, t) => {
      const wordsPerSec = t.wpm / 60;
      const secs = (t.duration || 60);
      return s + Math.round(wordsPerSec * secs);
    }, 0);
    return {
      started, completed, timeTyped,
      highWpm, avgWpm, highRaw, avgRaw,
      highAcc, avgAcc, highCon, avgCon,
      avgWpm10, avgRaw10, avgAcc10, avgCon10,
      estimatedWords,
    };
  });

  const recentResults = createMemo(() => filteredResults().slice(0, limit()));

  const availLanguages = createMemo(() => [...LANGUAGES]);

  const availLanguageOptions = createMemo(() =>
    availLanguages().map(l => ({ value: l, text: l }))
  );

  const availFunboxOptions = createMemo(() =>
    ["none", ...FUNBOX_NAMES].map(fb => ({ value: fb, text: fb === "none" ? "no funbox" : fb.replace(/_/g, " ") }))
  );

  const MODE_KEYS = ["time", "words", "quote", "zen", "custom"];
  const DIFF_KEYS = ["normal", "expert", "master"];
  const DATE_KEYS = ["last_day", "last_week", "last_month", "last_3months", "all"];
  const QL_KEYS = ["short", "medium", "long", "thicc"];

  const avatarUrl = () => store.user?.photoURL;
  const presetAvatarSrc = () => {
    const allAvs = [...AVATARS, ...PREMIUM_AVATARS, ...PET_AVATARS, ...ANIMAL_AVATARS];
    const av = allAvs.find(a => a.id === profileStore.avatarId);
    return av ? av.src : AVATARS[DEFAULT_AVATAR_ID].src;
  };
  const displayName = () => store.user?.displayName || store.user?.email?.split("@")[0] || "User";
  const joined = () => {
    const meta = store.user?.metadata;
    if (meta?.creationTime) {
      const d = new Date(meta.creationTime);
      return d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
    }
    return "-";
  };

  const TIME_MODES = ["time 15", "time 30", "time 60", "time 120"];
  const WORD_MODES = ["words 10", "words 25", "words 50", "words 100"];

  const DATE_LABELS: Record<string, string> = {
    all: "all time", last_day: "last day", last_week: "last week",
    last_month: "last month", last_3months: "last 3 months",
  };
  const DATE_SINGLE = { all: false, last_day: false, last_week: false, last_month: false, last_3months: false } as Record<string, boolean>;

  /* ButtonGroup matching monkeytype's toggle-button pattern */
  const ButtonGroup = (opts: {
    label: string;
    icon?: string;
    group: keyof ResultFilters;
    keys: string[];
    format?: (v: string) => string;
    singleSelect?: true;
  }) => (
    <div>
      <Show when={opts.label}>
        <div class="acct-filters-group-label">
          <Show when={opts.icon}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d={opts.icon!}/></svg>
          </Show>
          {opts.label}
        </div>
      </Show>
      <div class="acct-filters-btn-group">
        <For each={opts.keys}>
          {(k) => (
            <button
              class="acct-filter-btn"
              classList={{ "acct-filter-btn-active": filters()[opts.group][k] }}
              onClick={() => {
                setFilters(f => {
                  const cur = f[opts.group];
                  const next = { ...cur } as Record<string, boolean>;
                  if (opts.singleSelect) {
                    for (const kk of opts.keys) next[kk] = kk === k;
                  } else {
                    next[k] = !cur[k];
                  }
                  return { ...f, [opts.group]: next } as ResultFilters;
                });
              }}
            >{opts.format ? opts.format(k) : k}</button>
          )}
        </For>
      </div>
    </div>
  );

  return (
    <div class="page-full">
      <div class="page-full-back" onClick={() => props.onNavigate("test")}>
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
        back
      </div>
      <div class="page pageAccount full-width" id="pageAccount">
        <div class="content full-width">
          <div class="acct-page">

            {/* Email verification notice */}
            <Show when={store.user && !store.user.emailVerified}>
              <div class="acct-verify-notice">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                <div>Your email is not verified</div>
                <button>resend verification email</button>
              </div>
            </Show>

            {/* Profile */}
            <div class="acct-profile">
              <div class="acct-profile-content">
                <div class="acct-avatar-name">
                  <div class="acct-avatar">
                    <Show when={avatarUrl()} fallback={
                      <Show when={profileStore.customAvatar} fallback={
                        <img src={presetAvatarSrc()} alt="avatar" class="acct-avatar-img" />
                      }>
                        <img src={profileStore.customAvatar} alt="avatar" class="acct-avatar-img" />
                      </Show>
                    }>
                      <img src={avatarUrl()!} alt="" class="acct-avatar-img" />
                    </Show>
                  </div>
                  <div>
                    <div class="acct-name-row">
                      <span class="acct-name">{displayName()}</span>
                      <Show when={userData()?.verified}>
                        <img class="verified-badge" src="/badge.svg?v=2"/>
                      </Show>
                      <span class="acct-flags"></span>
                    </div>
                    <div class="acct-badges"></div>
                    <div class="acct-all-badges"></div>
                    <div class="acct-joined">Joined {joined()}</div>
                    <Show when={streakLength() > 0}>
                      <div class="acct-streak">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M13 5.08A7 7 0 0118.92 11h3.03c-.47-4.72-4.23-8.48-8.95-8.95v3.03zM18.92 13A7 7 0 0113 18.92v3.03c4.72-.47 8.48-4.23 8.95-8.95h-3.03zM11 18.92c-3.39-.49-6-3.4-6-6.92s2.61-6.43 6-6.92V2.05c-5.05.5-9 4.76-9 9.95s3.95 9.45 9 9.95v-3.03z"/></svg>
                        {streakLength()} day streak
                      </div>
                    </Show>
                    <div class="acct-level-bar">
                      <span class="acct-level">{userLevel()}</span>
                      <div class="acct-xp-track"><div class="acct-xp-fill" style={{ width: `${Math.min((xpInfo().current / xpInfo().needed) * 100, 100)}%` }}></div></div>
                      <span class="acct-xp-text">{xpInfo().current.toLocaleString()} / {xpInfo().needed.toLocaleString()} XP</span>
                    </div>
                  </div>
                </div>
                <div class="acct-sep"></div>
                <div class="acct-typing-stats">
                  <div>
                    <div class="acct-stat-label">tests started</div>
                    <div class="acct-stat-value">{allResults().length}</div>
                  </div>
                  <div>
                    <div class="acct-stat-label">tests completed</div>
                    <div class="acct-stat-value">{allResults().length}</div>
                  </div>
                  <div>
                    <div class="acct-stat-label">time typing</div>
                    <div class="acct-stat-value">{formatTime(allResults().reduce((s, t) => s + (t.duration || 0), 0))}</div>
                  </div>
                </div>
                <div class="acct-sep"></div>
                <div class="acct-bio-keyboard">
                  <div>
                    <div class="acct-stat-label">bio</div>
                    <div class="acct-stat-sub">{profileStore.bio || "-"}</div>
                  </div>
                  <div>
                    <div class="acct-stat-label">keyboard</div>
                    <div class="acct-stat-sub">{profileStore.keyboard || "-"}</div>
                  </div>
                </div>
                <Show when={profileStore.github || profileStore.twitter || profileStore.instagram || profileStore.website}>
                  <div class="acct-sep"></div>
                  <div class="acct-socials">
                    <div class="acct-stat-label">socials</div>
                    <div class="acct-stat-sub">
                      <Show when={profileStore.github}>
                        <a href={`https://github.com/${profileStore.github}`} target="_blank" rel="noopener noreferrer" aria-label={profileStore.github}>
                          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12 24 5.37 18.63 0 12 0z"/></svg>
                        </a>
                      </Show>
                      <Show when={profileStore.twitter}>
                        <a href={`https://x.com/${profileStore.twitter}`} target="_blank" rel="noopener noreferrer" aria-label={profileStore.twitter}>
                          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        </a>
                      </Show>
                        <Show when={profileStore.instagram}>
                          <a href={`https://instagram.com/${profileStore.instagram}`} target="_blank" rel="noopener noreferrer" aria-label={profileStore.instagram}>
                            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10m0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6m4.5-3.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>
                          </a>
                        </Show>
                      <Show when={profileStore.website}>
                        <a href={profileStore.website} target="_blank" rel="noopener noreferrer" aria-label={profileStore.website}>
                          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                        </a>
                      </Show>
                    </div>
                  </div>
                </Show>
              </div>
              <div class="acct-profile-actions">
                <button class="acct-icon-btn" title="Edit profile" onClick={() => setShowEditProfile(true)}>
                  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                </button>
                <button class="acct-icon-btn" title="Copy public link" onClick={async () => {
                  if (!store.user) return;
                  const url = `${window.location.origin}/profile/${store.user.uid}`;
                  try {
                    await navigator.clipboard.writeText(url);
                    showSuccessNotification("Link copied to clipboard");
                  } catch {
                    const ta = document.createElement("textarea");
                    ta.value = url;
                    ta.style.position = "fixed";
                    ta.style.opacity = "0";
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand("copy");
                    document.body.removeChild(ta);
                    showSuccessNotification("Link copied to clipboard");
                  }
                }}>
                  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>
                </button>
              </div>
            </div>

            {/* Leaderboard Positions */}
            <div class="acct-lb">
              <span class="acct-lb-title">All-Time English Leaderboards</span>
              <div class="acct-lb-item">
                <span>15 seconds</span>
                <span class="acct-lb-rank">-</span>
                <span class="acct-lb-pct">-</span>
              </div>
              <div class="acct-lb-item">
                <span>60 seconds</span>
                <span class="acct-lb-rank">-</span>
                <span class="acct-lb-pct">-</span>
              </div>
            </div>

            {/* Personal Bests */}
            <div class="acct-pbs">
              <div class="acct-pb-table">
                <div class="acct-pb-grid">
                  <For each={TIME_MODES}>
                    {(modeKey) => {
                      const pb = pbs()[modeKey];
                      return (
                        <div class="acct-pb-cell">
                          <div class="acct-pb-label">{modeKey.replace("time ", "")} seconds</div>
                          <div class="acct-pb-wpm">{pb ? Math.round(pb.wpm) : "-"}</div>
                          <div class="acct-pb-acc">{pb ? `${pb.acc.toFixed(1)}%` : "-"}</div>
                          <Show when={pb}>
                            <div class="acct-pb-hover">
                              <div style="display:grid;gap:0.2rem;text-align:center;">
                                <div>raw {Math.round(pb!.raw)}</div>
                                <div>cons {pb!.consistency.toFixed(1)}%</div>
                                <div>{new Date(pb!.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</div>
                              </div>
                            </div>
                          </Show>
                        </div>
                      );
                    }}
                  </For>
                </div>
                <div class="acct-pb-actions">
                  <button class="acct-icon-btn" title="Show all personal bests">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                  </button>
                </div>
              </div>
              <div class="acct-pb-table">
                <div class="acct-pb-grid">
                  <For each={WORD_MODES}>
                    {(modeKey) => {
                      const pb = pbs()[modeKey];
                      return (
                        <div class="acct-pb-cell">
                          <div class="acct-pb-label">{modeKey.replace("words ", "")} words</div>
                          <div class="acct-pb-wpm">{pb ? Math.round(pb.wpm) : "-"}</div>
                          <div class="acct-pb-acc">{pb ? `${pb.acc.toFixed(1)}%` : "-"}</div>
                          <Show when={pb}>
                            <div class="acct-pb-hover">
                              <div style="display:grid;gap:0.2rem;text-align:center;">
                                <div>raw {Math.round(pb!.raw)}</div>
                                <div>cons {pb!.consistency.toFixed(1)}%</div>
                                <div>{new Date(pb!.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</div>
                              </div>
                            </div>
                          </Show>
                        </div>
                      );
                    }}
                  </For>
                </div>
                <div class="acct-pb-actions">
                  <button class="acct-icon-btn" title="Show all personal bests">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                  </button>
                </div>
              </div>
            </div>

            {/* ── Filters Section (monkeytype replica) ── */}
            <div class="acct-filters">
              {/* Filter presets */}
              <Show when={presets().length > 0}>
                <div class="acct-filters-presets">
                  <div class="acct-filters-section-title">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                    filter presets
                  </div>
                  <div class="acct-filters-presets-grid">
                    <For each={presets()}>
                      {(preset) => (
                        <div class="acct-filters-preset-row">
                          <button class="acct-filter-btn acct-filter-btn-active" onClick={() => {
                            setFilters({ ...preset.filters });
                            setLimit(10);
                          }}>
                            {preset.name}
                          </button>
                          <button class="acct-filter-btn" onClick={() => {
                            const updated = presets().filter(p => p.name !== preset.name);
                            setPresets(updated);
                            savePresets(updated);
                          }}>
                            <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                          </button>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </Show>

              {/* Quick filter buttons */}
              <div class="acct-filters-section-title">
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/></svg>
                filters
              </div>
              <div class="acct-filters-actions-row">
                <button class="acct-filter-btn" onClick={() => {
                  setFilters(fromDefaultSettings());
                  setLimit(10);
                }}>all</button>
                <button class="acct-filter-btn" onClick={() => {
                  setFilters(fromCurrentSettings());
                  setLimit(10);
                }}>current settings</button>
                <button class="acct-filter-btn" classList={{ "acct-filter-btn-active": showAdvanced() }} onClick={() => setShowAdvanced(v => !v)}>advanced</button>
                <button class="acct-filter-btn" onClick={() => {
                  const name = prompt("Preset name:");
                  if (name && name.trim()) {
                    const updated = [...presets(), { name: name.trim(), filters: { ...filters() } }];
                    setPresets(updated);
                    savePresets(updated);
                  }
                }}>save as preset</button>
              </div>

              {/* Date buttons — always visible */}
              <div class="acct-filters-date-row">
                <For each={DATE_KEYS}>
                  {(k) => (
                    <button
                      class="acct-filter-btn"
                      classList={{ "acct-filter-btn-active": filters().date[k] }}
                      onClick={() => {
                        const next = { ...DATE_SINGLE };
                        next[k] = true;
                        setFilters(f => ({ ...f, date: next }));
                      }}
                    >{DATE_LABELS[k]}</button>
                  )}
                </For>
              </div>

              {/* Advanced filters panel */}
              <Show when={showAdvanced()}>
                <div class="acct-filters-advanced">
                  <div class="acct-filters-section-title">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></svg>
                    advanced filters
                  </div>
                  <button class="acct-filter-btn acct-filter-btn-clear" onClick={() => setFilters(noFilters())}>clear filters</button>
                  <div class="acct-filters-advanced-grid">
                    {/* Difficulty */}
                    <ButtonGroup
                      label="difficulty"
                      icon="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                      group="difficulty"
                      keys={DIFF_KEYS}
                    />
                    {/* Personal best */}
                    <ButtonGroup
                      label="personal best"
                      icon="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"
                      group="pb"
                      keys={["no", "yes"]}
                      format={v => v === "no" ? "no" : "yes"}
                    />
                    {/* Mode */}
                    <ButtonGroup
                      label="mode"
                      icon="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"
                      group="mode"
                      keys={MODE_KEYS}
                    />
                    {/* Quote Length */}
                    <ButtonGroup
                      label="quote length"
                      icon="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"
                      group="quoteLength"
                      keys={QL_KEYS}
                    />
                    {/* Words */}
                    <ButtonGroup
                      label="words"
                      icon="M9.93 13.5h4.14L12 7.98 9.93 13.5zM20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-4.05 16.5l-1.14-3H9.17l-1.12 3H5.96l5.11-13h1.86l5.11 13h-2.09z"
                      group="words"
                      keys={["10", "25", "50", "100", "custom"]}
                    />
                    {/* Time */}
                    <ButtonGroup
                      label="time"
                      icon="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"
                      group="time"
                      keys={["15", "30", "60", "120", "custom"]}
                    />
                    {/* Punctuation */}
                    <ButtonGroup
                      label="punctuation"
                      icon="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c2.21 0 4.21-.72 5.83-1.93l-1.46-1.46C15.14 19.14 13.64 20 12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8c0 .84-.13 1.65-.38 2.41-.25.76-.62 1.46-1.09 2.07-.47.61-1.04 1.13-1.69 1.54-.65.41-1.38.68-2.15.78-.77.1-1.55.04-2.29-.18-.74-.22-1.42-.6-1.99-1.11-.57-.51-1.02-1.13-1.33-1.84-.31-.71-.48-1.48-.48-2.29h1.5c0 1.1.4 2.1 1.06 2.9.66.8 1.6 1.3 2.66 1.3 1.06 0 2-.5 2.66-1.3.66-.8 1.06-1.8 1.06-2.9 0-1.06-.4-2.06-1.06-2.86-.66-.8-1.6-1.3-2.66-1.3-1.06 0-2 .5-2.66 1.3-.66.8-1.06 1.8-1.06 2.86 0 2.21 1.79 4 4 4 .92 0 1.76-.31 2.44-.84.68-.53 1.18-1.26 1.45-2.1.27-.84.41-1.74.41-2.66 0-2.76-1.12-5.26-2.93-7.07C17.26 3.12 14.76 2 12 2z"
                      group="punctuation"
                      keys={["on", "off"]}
                    />
                    {/* Numbers */}
                    <ButtonGroup
                      label="numbers"
                      icon="M8 4v16M16 4v16M4 8h16v2H4zm0 6h16v2H4z"
                      group="numbers"
                      keys={["on", "off"]}
                    />
                    {/* Funbox — multi-select dropdown matching monkeytype */}
                    <div class="acct-filters-language">
                      <div class="acct-filters-group-label">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H3V8h18v8zM6 15h2v-2h2v-2H8V9H6v2H4v2h2v2zm10-4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm4 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/></svg>
                        funbox
                      </div>
                      <SlimSelect
                        multiple
                        settings={{
                          showSearch: true,
                          placeholderText: "select a funbox",
                          allowDeselect: true,
                          closeOnSelect: false,
                          maxValuesShown: 4,
                          addAllOption: true,
                          scrollToTop: true,
                        }}
                        onChange={(selected) => {
                          const next: Record<string, boolean> = {};
                          for (const k of ["none", ...FUNBOX_NAMES]) next[k] = selected.includes(k);
                          setFilters(f => ({ ...f, funbox: next }));
                        }}
                        options={availFunboxOptions()}
                        selected={activeKeys(filters().funbox)}
                      />
                    </div>
                    {/* Language — multi-select dropdown */}
                    <Show when={availLanguages().length > 0}>
                      <div class="acct-filters-language">
                        <div class="acct-filters-group-label">
                          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                          language
                        </div>
                        <SlimSelect
                          multiple
                          settings={{
                            showSearch: true,
                            placeholderText: "select a language",
                            allowDeselect: true,
                            closeOnSelect: false,
                            addAllOption: true,
                          }}
                          onChange={(selected) => {
                            const next: Record<string, boolean> = {};
                            for (const k of availLanguages()) next[k] = selected.includes(k);
                            setFilters(f => ({ ...f, language: next }));
                          }}
                          options={availLanguageOptions()}
                          selected={activeKeys(filters().language)}
                        />
                      </div>
                    </Show>
                  </div>
                </div>
              </Show>
            </div>

            {/* ── Estimated Words Typed ── */}
            <div class="acct-estimated">
              estimated words typed
              <span class="acct-estimated-val">{stats().estimatedWords.toLocaleString()}</span>
            </div>

            {/* ── Stats Grid ── */}
            <div class="acct-stats">
              <div class="acct-stat-card">
                <div class="acct-stat-card-label">tests started</div>
                <div class="acct-stat-card-val">{stats().started}</div>
              </div>
              <div class="acct-stat-card">
                <div class="acct-stat-card-label">
                  tests completed
                  <span class="acct-stat-tooltip" title="Due to the increasing number of results in the database, you can now only see your last 1000 results in detail. Total time spent typing, started and completed tests stats will still be up to date at the top of the page, above the filters.">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/></svg>
                  </span>
                </div>
                <div class="acct-stat-card-val">
                  {stats().completed}
                  <span class="acct-stat-card-sub">
                    ({stats().completed > 0 ? Math.round((stats().completed / (stats().started || 1)) * 100) : 0}%)
                  </span>
                </div>
                <div class="acct-stat-card-sub">
                  {stats().completed > 0 ? ((stats().started - stats().completed) / stats().completed).toFixed(1) : "0.0"} restarts per completed test
                </div>
              </div>
              <div class="acct-stat-card">
                <div class="acct-stat-card-label">time typing</div>
                <div class="acct-stat-card-val">{formatTime(stats().timeTyped)}</div>
              </div>

              <div class="acct-stat-card">
                <div class="acct-stat-card-label">highest wpm</div>
                <div class="acct-stat-card-val">{Math.round(stats().highWpm)}</div>
              </div>
              <div class="acct-stat-card">
                <div class="acct-stat-card-label">average wpm</div>
                <div class="acct-stat-card-val">{Math.round(stats().avgWpm)}</div>
              </div>
              <div class="acct-stat-card">
                <div class="acct-stat-card-label">average wpm (last 10 tests)</div>
                <div class="acct-stat-card-val">{Math.round(stats().avgWpm10)}</div>
              </div>

              <div class="acct-stat-card">
                <div class="acct-stat-card-label">highest raw wpm</div>
                <div class="acct-stat-card-val">{Math.round(stats().highRaw)}</div>
              </div>
              <div class="acct-stat-card">
                <div class="acct-stat-card-label">average raw wpm</div>
                <div class="acct-stat-card-val">{Math.round(stats().avgRaw)}</div>
              </div>
              <div class="acct-stat-card">
                <div class="acct-stat-card-label">average raw wpm (last 10 tests)</div>
                <div class="acct-stat-card-val">{Math.round(stats().avgRaw10)}</div>
              </div>

              <div class="acct-stat-card">
                <div class="acct-stat-card-label">highest accuracy</div>
                <div class="acct-stat-card-val">{stats().highAcc.toFixed(1)}%</div>
              </div>
              <div class="acct-stat-card">
                <div class="acct-stat-card-label">avg accuracy</div>
                <div class="acct-stat-card-val">{stats().avgAcc.toFixed(1)}%</div>
              </div>
              <div class="acct-stat-card">
                <div class="acct-stat-card-label">avg accuracy (last 10 tests)</div>
                <div class="acct-stat-card-val">{stats().avgAcc10.toFixed(1)}%</div>
              </div>

              <div class="acct-stat-card">
                <div class="acct-stat-card-label">highest consistency</div>
                <div class="acct-stat-card-val">{stats().highCon.toFixed(1)}%</div>
              </div>
              <div class="acct-stat-card">
                <div class="acct-stat-card-label">avg consistency</div>
                <div class="acct-stat-card-val">{stats().avgCon.toFixed(1)}%</div>
              </div>
              <div class="acct-stat-card">
                <div class="acct-stat-card-label">avg consistency (last 10 tests)</div>
                <div class="acct-stat-card-val">{stats().avgCon10.toFixed(1)}%</div>
              </div>
            </div>

            {/* CSV Export */}
            <div class="acct-csv-row">
              <button class="acct-csv-btn" onClick={() => {
                const r = filteredResults();
                if (r.length === 0) return;
                const headers = "wpm,raw,acc,consistency,mode,duration,timestamp";
                const rows = r.map(t => `${t.wpm},${t.raw},${t.acc},${t.consistency},${t.mode},${t.duration || 0},${t.timestamp}`);
                const csv = [headers, ...rows].join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "results.csv";
                a.click();
                URL.revokeObjectURL(url);
              }}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zm-2 9H9v-6h2v6zm4 0h-2v-4h2v4zm4 0h-2v-2h2v2z"/></svg>
                Export CSV
              </button>
            </div>

            {/* History Table */}
            <div class="acct-history">
              <Show when={recentResults().length > 0} fallback={
                <div class="acct-empty">No tests completed yet. Start typing!</div>
              }>
                <table>
                  <thead>
                    <tr>
                      <td></td>
                      <td>wpm</td>
                      <td>raw</td>
                      <td>accuracy</td>
                      <td>consistency</td>
                      <td>chars</td>
                      <td>mode</td>
                      <td>info</td>
                      <td>date</td>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={recentResults()}>
                      {(r) => {
                        const pbKey = parseModeParts(r.mode).base;
                        const isPb = pbs()[pbKey] && pbs()[pbKey].timestamp === r.timestamp;
                        const d = new Date(r.timestamp);
                        const isCurPb = isPb && pbKey;
                        return (
                          <tr>
                            <td class="acct-td-crown">
                              <Show when={isCurPb}>
                                <svg viewBox="0 0 24 24" fill="currentColor" style="color:var(--main);"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                              </Show>
                            </td>
                            <td class="acct-td-wpm">{Math.round(r.wpm)}</td>
                            <td class="acct-td-raw">{Math.round(r.raw)}</td>
                            <td class="acct-td-acc">{r.acc.toFixed(1)}%</td>
                            <td class="acct-td-cons">{r.consistency.toFixed(1)}%</td>
                            <td class="acct-td-chars">-</td>
                            <td class="acct-td-mode">{r.mode}</td>
                            <td class="acct-td-info">
                              <Show when={r.difficulty === "expert"}>
                                <svg viewBox="0 0 24 24" fill="currentColor" aria-label="expert"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                              </Show>
                              <Show when={r.difficulty === "master"}>
                                <svg viewBox="0 0 24 24" fill="currentColor" aria-label="master"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" transform="scale(0.6) translate(8,8)"/></svg>
                              </Show>
                            </td>
                            <td class="acct-td-date">
                              <div>{d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</div>
                              <div class="acct-td-date-time">{d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</div>
                            </td>
                          </tr>
                        );
                      }}
                    </For>
                  </tbody>
                </table>
                <Show when={filteredResults().length > limit()}>
                  <button class="acct-load-more" onClick={() => setLimit(l => l + 10)}>load more</button>
                </Show>
              </Show>
            </div>

            {/* Account actions */}
            <div class="acct-actions-row">
              <button class="acct-action-btn" onClick={() => props.onNavigate("accountSettings")}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.63-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
                Account settings
              </button>
            </div>

          </div>
        </div>
      </div>
      <EditProfileModal open={showEditProfile()} onClose={() => setShowEditProfile(false)} />
    </div>
  );
}
