import {
  createSignal, createEffect, createMemo, Show, For, onCleanup,
} from "solid-js";
import { useAuth } from "../lib/AuthProvider";
import {
  listenEntries, getUserEntry, getUserRank, getTotalCount,
  listenWeekly, getUserWeeklyData, getFriendUids,
  type LeaderboardEntry,
} from "../lib/leaderboard-store";
import {
  type LeaderboardSelection, type LeaderboardTimeframe,
  type LeaderboardMode, type LeaderboardMode2,
  defaultSelection, mode2Options, languages,
} from "../lib/leaderboard";

/* ─── SVG Icons ─── */
const IcoGlobe = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>;
const IcoCalendar = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>;
const IcoSun = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z"/></svg>;
const IcoClock = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>;
const IcoAlignLeft = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"/></svg>;
const IcoCrown = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l4 5-2 3 2 4H8l2-4-2-3 4-5zM2 22h20v-4H2v4z"/></svg>;
const IcoUser = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>;
const IcoChevronLeft = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>;
const IcoChevronRight = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>;
const IcoHashtag = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 3l-2 18h2l2-18H9zm6 0l-2 18h2l2-18h-2zM4 8h16v2H4V8zm0 6h16v2H4v-2z"/></svg>;
const IcoBackward = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/></svg>;
const IcoForward = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 18V6l8.5 6-8.5 6zM4 18V6l8.5 6L4 18z"/></svg>;
/* ─── Utility ─── */
const labelForType = (t: string) =>
  t === "all_time" ? "all-time english" : t === "weekly" ? "weekly xp" : "daily";

const iconForType = (t: string) =>
  t === "all_time" ? IcoGlobe : t === "weekly" ? IcoCalendar : IcoSun;

const labelForMode = (m: LeaderboardMode, m2: LeaderboardMode2) =>
  `${m} ${m2}`;

const iconForMode = (m: LeaderboardMode) =>
  m === "time" ? IcoClock : IcoAlignLeft;

const titleStr = (s: LeaderboardSelection) => {
  const type = s.type === "all_time" ? "All-time" : s.type === "weekly" ? "Weekly XP" : "Daily";
  const lang = s.type !== "weekly" ? s.language.charAt(0).toUpperCase() + s.language.slice(1).replace(/_/g, " ") : "";
  const mode = s.type !== "weekly" ? ` ${s.mode.charAt(0).toUpperCase() + s.mode.slice(1)} ${s.mode2}` : "";
  const friend = s.friendsOnly ? " Friends" : "";
  return `${type} ${lang}${mode}${friend} Leaderboard`;
};

const secondsToString = (total: number, long = false, showHours = false): string => {
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (d > 0) return `${d} days, ${pad(h)}:${pad(m)}:${pad(s)}`;
  if (showHours || h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
};

function pad(n: number) { return n.toString().padStart(2, "0"); }

/* ─── Sidebar ─── */
function Sidebar(props: {
  selection: LeaderboardSelection;
  onSelect: (s: LeaderboardSelection) => void;
}) {
  const t = () => props.selection;
  const update = (patch: Partial<LeaderboardSelection>) =>
    props.onSelect({ ...t(), ...patch });

  return (
    <div class="lb-sidebar-inner">
      {/* Timeframe */}
      <div class="lb-sb-group">
        {(["daily", "weekly", "all_time"] as const).map((id) => (
          <button
            classList={{ "lb-sb-btn": true, active: t().type === id }}
            onClick={() => update({ type: id, previous: false })}
          >
            <span class="lb-sb-ico">{iconForType(id)}</span>
            <span>{labelForType(id)}</span>
          </button>
        ))}
      </div>

      {/* Mode selector (not weekly) — show ALL modes like monkeytype */}
      <Show when={t().type !== "weekly"}>
        <div class="lb-sb-group">
          {mode2Options.map((o) => (
            <button
              classList={{ "lb-sb-btn": true, active: t().mode === o.mode && t().mode2 === o.value }}
              onClick={() => update({ mode: o.mode, mode2: o.value })}
            >
              <span class="lb-sb-ico">{iconForMode(o.mode)}</span>
              <span>{labelForMode(o.mode, o.value)}</span>
            </button>
          ))}
        </div>
      </Show>

      {/* Language selector (daily & all_time) */}
      <Show when={t().type === "daily" || t().type === "all_time"}>
        <div class="lb-sb-group">
          {languages.slice(0, 6).map((l) => (
            <button
              classList={{ "lb-sb-btn": true, active: t().language === l }}
              onClick={() => update({ language: l })}
            >
              <span class="lb-sb-ico">{IcoGlobe}</span>
              <span>{l.replace(/_/g, " ")}</span>
            </button>
          ))}
        </div>
      </Show>

      {/* Friends only toggle */}
      <div class="lb-sb-group">
        <button
          classList={{ "lb-sb-btn": true, active: t().friendsOnly }}
          onClick={() => update({ friendsOnly: !t().friendsOnly })}
        >
          <span class="lb-sb-ico">{IcoUser}</span>
          <span>{t().friendsOnly ? "friends only" : "everyone"}</span>
        </button>
      </div>
    </div>
  );
}

/* ─── Title ─── */
function Title(props: {
  selection: LeaderboardSelection;
  onPrevious: () => void;
}) {
  const s = () => props.selection;

  const sub = createMemo(() => {
    if (s().type === "daily") {
      const d = s().previous ? new Date(Date.now() - 86400000) : new Date();
      return {
        dateString: `${d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} UTC`,
        btnText: s().previous ? "show today" : "show yesterday",
        btnIco: s().previous ? IcoForward : IcoBackward,
      };
    }
    if (s().type === "weekly") {
      const day = 1000 * 86400;
      const now = Date.now();
      const offset = s().previous ? 7 * day : 0;
      const mon = new Date(now - ((now + 4 * day) % (7 * day)) + offset);
      const sun = new Date(mon.getTime() + 6 * day);
      return {
        dateString: `${mon.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} - ${sun.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} UTC`,
        btnText: s().previous ? "show this week" : "show last week",
        btnIco: s().previous ? IcoForward : IcoBackward,
      };
    }
    return null;
  });

  return (
    <div class="lb-title-section">
      <h2 class="lb-title-text">{titleStr(s())}</h2>
      <Show when={sub()}>
        {(ss) => (
          <div class="lb-title-row">
            <span class="lb-title-date">{ss().dateString}</span>
            <span class="lb-title-sep" />
            <button class="lb-title-btn" onClick={props.onPrevious}>
              <span class="lb-sb-ico">{ss().btnIco}</span>
              {ss().btnText}
            </button>
          </div>
        )}
      </Show>
    </div>
  );
}

/* ─── NextUpdate ─── */
function NextUpdate(props: { type: LeaderboardTimeframe }) {
  const [tick, setTick] = createSignal(Date.now());
  createEffect(() => {
    const iv = setInterval(() => setTick(Date.now()), 1000);
    onCleanup(() => clearInterval(iv));
  });

  const text = createMemo(() => {
    const now = new Date(tick());
    if (props.type === "daily") {
      const end = new Date(now);
      end.setUTCHours(23, 59, 59, 999);
      const diff = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
      return `Next reset in: ${pad(Math.floor(diff / 3600))}:${pad(Math.floor((diff % 3600) / 60))}:${pad(diff % 60)}`;
    }
    if (props.type === "weekly") {
      const day = 86400000;
      const nowMs = tick();
      const nextMon = new Date(nowMs + ((7 - ((nowMs + 4 * day) % (7 * day)) / day) * day) % (7 * day) || 7 * day);
      nextMon.setUTCHours(0, 0, 0, 0);
      const diff = Math.max(0, Math.floor((nextMon.getTime() - nowMs) / 1000));
      return `Next reset in: ${secondsToString(diff, true, true)}`;
    }
    if (props.type === "all_time") {
      const min = 14 - now.getMinutes() % 15;
      const sec = 60 - now.getSeconds();
      const total = min * 60 + sec;
      return `Next update in: ${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
    }
    return "";
  });

  return <div class="lb-next-update">{text()}</div>;
}

/* ─── Navigation ─── */
function Navigation(props: {
  currentPage: number;
  lastPage: number;
  hasUserPage: boolean;
  isLoading: boolean;
  onPageChange: (p: number) => void;
  onUserPage: () => void;
}) {
  return (
    <div class="lb-nav">
      <Show when={props.isLoading}>
        <div class="lb-nav-loading" />
      </Show>
      <button class="lb-nav-btn" disabled={props.currentPage === 0} onClick={() => props.onPageChange(0)} title="First page">
        {IcoCrown}
      </button>
      <Show when={props.hasUserPage}>
        <button class="lb-nav-btn" onClick={props.onUserPage} title="Your page">
          {IcoUser}
        </button>
      </Show>
      <button class="lb-nav-btn" disabled={props.currentPage === 0} onClick={() => props.onPageChange(props.currentPage - 1)} title="Previous page">
        {IcoChevronLeft}
      </button>
      <button class="lb-nav-btn lb-nav-current" disabled title={`Page ${props.currentPage + 1}`}>
        {IcoHashtag} {props.currentPage + 1}
      </button>
      <button class="lb-nav-btn" disabled={props.currentPage + 1 >= props.lastPage} onClick={() => props.onPageChange(props.currentPage + 1)} title="Next page">
        {IcoChevronRight}
      </button>
    </div>
  );
}

/* ─── Table ─── */
function Table(props: {
  entries: (LeaderboardEntry & { rank: number })[];
  friendsOnly: boolean;
  yourName: string | null;
  onRowMount?: (el: HTMLElement) => void;
  hideHeader?: boolean;
  userOverride?: boolean;
  totalEntries?: number;
  compact?: boolean;
  weekly?: boolean;
}) {
  return (
    <div classList={{ "lb-table-wrap": true, compact: !!props.compact }}>
      <table class="lb-table">
        <Show when={!props.hideHeader}>
          <thead>
            <tr>
              <Show when={props.friendsOnly}>
                <th class="lb-c-fr" aria-label="Friends rank" />
              </Show>
              <th class="lb-c-rank">#</th>
              <th class="lb-c-name">name</th>
              <th class="lb-c-wpm">{props.weekly ? "xp" : "wpm"}</th>
              <Show when={!props.weekly}>
                <th class="lb-c-acc">accuracy</th>
                <th class="lb-c-raw lb-col-xl">raw</th>
                <th class="lb-c-con lb-col-xl">consistency</th>
                <th class="lb-c-date lb-col-lg">date</th>
              </Show>
            </tr>
          </thead>
        </Show>
        <tbody>
          <For each={props.entries}>
            {(entry, idx) => {
              const isYou = props.yourName !== null && entry.displayName === props.yourName;
              const rank = entry.rank;
              return (
                <tr
                  classList={{ "lb-row-you": isYou }}
                  ref={(el) => {
                    if (isYou && props.onRowMount) props.onRowMount(el);
                  }}
                  data-state={isYou ? "selected" : undefined}
                >
                  <Show when={props.friendsOnly}>
                    <td class="lb-c-fr" />
                  </Show>
                  <td class="lb-c-rank">
                    <Show
                      when={rank === 1}
                      fallback={rank}
                    ><span class="lb-crown">{IcoCrown}</span></Show>
                  </td>
                  <td class="lb-c-name">
                    <Show when={props.userOverride}>
                      <div class="lb-cell-text">
                        <div>You {(() => {
                          const total = props.totalEntries ?? 1;
                          const pct = (rank / total) * 100;
                          return rank === 1 ? "(GOAT)" : `(Top ${pct.toFixed(2)}%)`;
                        })()}</div>
                      </div>
                    </Show>
                    <Show when={!props.userOverride}>
                      <span class="lb-name-text">{entry.displayName}</span>
                    </Show>
                  </td>
                  <td class="lb-c-wpm"><span class="lb-val-wpm">{entry.wpm.toFixed(2)}</span></td>
                  <Show when={!props.weekly}>
                    <td class="lb-c-acc"><span class="lb-val-sub">{entry.acc.toFixed(2)}%</span></td>
                    <td class="lb-c-raw lb-col-xl"><span class="lb-val-sub">{entry.raw.toFixed(2)}</span></td>
                    <td class="lb-c-con lb-col-xl"><span class="lb-val-sub">{entry.consistency.toFixed(2)}%</span></td>
                    <td class="lb-c-date lb-col-lg">
                      <div class="lb-date-block">
                        <div>{new Date(entry.timestamp).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}</div>
                        <div class="lb-date-time">{new Date(entry.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</div>
                      </div>
                    </td>
                  </Show>
                </tr>
              );
            }}
          </For>
        </tbody>
      </table>
      <Show when={props.entries.length === 0 && !props.hideHeader}>
        <div class="lb-empty">No entries found ¯\_(ツ)_/¯</div>
      </Show>
    </div>
  );
}

/* ─── UserRank ─── */
function UserRank(props: {
  entry: (LeaderboardEntry & { rank: number }) | null;
  total: number;
  yourName: string | null;
  weekly?: boolean;
}) {
  const data = () => props.entry;

  return (
    <div class="lb-userrank">
      <Show
        when={data() !== null}
        fallback={
          <div class="lb-ur-fallback">
            <Show when={props.yourName}>
              <span>Not qualified</span>
            </Show>
            <Show when={!props.yourName}>
              <span>Sign in to track your rank</span>
            </Show>
          </div>
        }
      >
        <div class="lb-ur-inner">
          <Table
            entries={[data()!]}
            friendsOnly={false}
            yourName={props.yourName}
            totalEntries={props.total}
            hideHeader
            userOverride
            compact
            weekly={props.weekly}
          />
        </div>
      </Show>
    </div>
  );
}

/* ─── Main Page ─── */
interface Props { onBack: () => void; }

export default function LeaderboardPage(props: Props) {
  const { store } = useAuth();
  const [sel, setSel] = createSignal<LeaderboardSelection>(defaultSelection);
  const [page, setPage] = createSignal(0);
  const [scrollToUser, setScrollToUser] = createSignal(false);
  const [rawEntries, setRawEntries] = createSignal<LeaderboardEntry[]>([]);
  const [totalCount, setTotalCount] = createSignal(0);
  const [userEntry, setUserEntry] = createSignal<LeaderboardEntry | null>(null);
  const [userRank, setUserRank] = createSignal(0);

  const [loading, setLoading] = createSignal(true);
  const [friendsUids, setFriendsUids] = createSignal<string[]>([]);

  // Fetch friend UIDs when friendsOnly is toggled
  createEffect(() => {
    const s = sel();
    if (s.friendsOnly && store.user) {
      getFriendUids(store.user.uid).then(setFriendsUids);
    } else {
      setFriendsUids([]);
    }
  });

  createEffect(() => {
    const s = sel();
    const fUids = friendsUids();
    setLoading(true);
    setRawEntries([]);
    setUserEntry(null);
    setUserRank(0);
    if (s.type === "weekly") {
      const unsub = listenWeekly(s.previous, (entries) => {
        setRawEntries(entries.map(e => ({ ...e, wpm: e.xp, acc: 0, raw: 0, consistency: 0, timestamp: 0 } as LeaderboardEntry)));
        setTotalCount(entries.length);
        setLoading(false);
      }, fUids);
      onCleanup(() => unsub);
      return;
    }
    const unsub = listenEntries(s.mode, s.mode2, s.language, s.type, s.previous, 100, (entries) => {
      setRawEntries(entries);
      setLoading(false);
    }, fUids);
    onCleanup(() => unsub?.());
  });

  createEffect(() => {
    const s = sel();
    const fUids = friendsUids();
    if (!store.user) { setUserEntry(null); setUserRank(0); return; }
    if (s.type === "weekly") {
      getUserWeeklyData(store.user.uid, s.previous, fUids).then(data => {
        if (data.xp > 0) {
          setUserEntry({ uid: store.user!.uid, displayName: store.user!.displayName || "", wpm: data.xp, acc: 0, raw: 0, consistency: 0, timestamp: 0 });
          setUserRank(data.rank);
          setTotalCount(data.total);
        } else {
          setUserEntry(null);
          setUserRank(0);
          setTotalCount(0);
        }
      });
      return;
    }
    getUserEntry(store.user.uid, s.mode, s.mode2, s.language, s.type, s.previous, fUids).then(setUserEntry);
    getUserRank(store.user.uid, s.mode, s.mode2, s.language, s.type, s.previous, fUids).then(r => {
      setUserRank(r.rank);
      setTotalCount(r.total);
    });
  });

  const pageSize = 10;
  const totalPages = createMemo(() => Math.max(1, Math.ceil(totalCount() / pageSize)));
  const currentPage = createMemo(() => Math.min(page(), totalPages() - 1));
  const pageEntries = createMemo(() => {
    const start = currentPage() * pageSize;
    return rawEntries().slice(start, start + pageSize).map((e, i) => ({ ...e, rank: start + i + 1 }));
  });

  const yourName = createMemo(() => store.user?.displayName || null);

  const yourEntry = createMemo(() => userEntry());

  const userPageIndex = createMemo(() => {
    const r = userRank();
    if (r === 0) return undefined;
    return Math.max(0, Math.ceil((r - 1) / pageSize));
  });

  function handlePageChange(p: number) {
    setPage(p);
  }

  function handleUserPage() {
    const up = userPageIndex();
    if (up !== undefined) {
      setPage(up);
      setScrollToUser(true);
    }
  }

  return (
    <div class="page-full">
      <button class="page-full-back" onClick={props.onBack}>
        {IcoChevronLeft}
        back
      </button>
      <div class="lb-page">
        <div class="lb-content-grid">
          {/* Sidebar */}
          <div class="lb-sidebar-col">
            <Sidebar
              selection={sel()}
              onSelect={(s) => { setSel(s); setPage(0); }}
            />
          </div>

          {/* Main */}
          <div class="lb-main-col">
            <Title
              selection={sel()}
              onPrevious={() => setSel((s) => ({ ...s, previous: !s.previous }))}
            />

            <Show when={yourName() !== null}>
              <UserRank
                entry={yourEntry() ? { ...yourEntry()!, rank: userRank() } : null}
                total={totalCount()}
                yourName={yourName()}
                weekly={sel().type === "weekly"}
              />
            </Show>

            <div class="lb-toolbar-row">
              <NextUpdate type={sel().type} />
              <Navigation
                currentPage={currentPage()}
                lastPage={totalPages()}
                hasUserPage={userPageIndex() !== undefined && userPageIndex() !== currentPage()}
                isLoading={loading()}
                onPageChange={handlePageChange}
                onUserPage={handleUserPage}
              />
            </div>

            <Table
              entries={pageEntries()}
              friendsOnly={sel().friendsOnly}
              yourName={yourName()}
              weekly={sel().type === "weekly"}
              onRowMount={(el) => {
                if (scrollToUser()) {
                  requestAnimationFrame(() => {
                    el.scrollIntoView({ block: "center", behavior: "smooth" });
                    setScrollToUser(false);
                  });
                }
              }}
            />

            <div class="lb-toolbar-row lb-toolbar-bottom">
              <div />
              <Navigation
                currentPage={currentPage()}
                lastPage={totalPages()}
                hasUserPage={userPageIndex() !== undefined}
                isLoading={loading()}
                onPageChange={handlePageChange}
                onUserPage={handleUserPage}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
