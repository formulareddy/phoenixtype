import { createSignal, createEffect, Show, For, onCleanup } from "solid-js";
import { getUserData, listenUserData, cacheUser, userCache, calcLevel, calcXpForNextLevel, getBadge } from "../lib/user-store";
import type { UserData } from "../lib/user-store";
import { AVATARS, PREMIUM_AVATARS, PET_AVATARS, ANIMAL_AVATARS, DEFAULT_AVATAR_ID } from "../lib/avatars";
import { useAuth } from "../lib/AuthProvider";
import { sendFriendRequest } from "../lib/friends";
import { showSuccessNotification, showErrorNotification, showNoticeNotification } from "../lib/notifications";

const REPORT_REASONS = [
  "Inappropriate name",
  "Inappropriate bio",
  "Inappropriate social links",
  "Suspected cheating",
] as const;


interface Props {
  uid: string;
  name: string;
  onNavigate: (page: string) => void;
}

function resolveAvatarSrc(data: UserData): string {
  if (data.customAvatar) return data.customAvatar;
  const all = [...AVATARS, ...PREMIUM_AVATARS, ...PET_AVATARS, ...ANIMAL_AVATARS];
  const av = all.find(a => a.id === data.avatarId);
  return av ? av.src : AVATARS[DEFAULT_AVATAR_ID].src;
}

interface PbEntry {
  label: string;
  wpm: number;
  acc: number;
  raw: number;
  cons: number;
  date: string;
}

export default function PublicProfilePage(props: Props) {
  const { store } = useAuth();
  const [data, setData] = createSignal<UserData | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [friendReqStatus, setFriendReqStatus] = createSignal<"none" | "sending" | "sent" | "error">("none");
  const [friendReqMsg, setFriendReqMsg] = createSignal("");
  const [showReportForm, setShowReportForm] = createSignal(false);
  const [reportReason, setReportReason] = createSignal("");
  const [reportComment, setReportComment] = createSignal("");
  const [charCount, setCharCount] = createSignal(0);

  const isOwnProfile = () => store.user?.uid === props.uid;

  createEffect(() => {
    const uid = props.uid;
    if (!uid) { setLoading(false); setData(null); return; }

    setLoading(true);
    setData(null);

    let cancelled = false;

    const cached = userCache[uid];
    if (cached) {
      const resolved = cached as UserData | null;
      if (resolved) {
        setData(resolved);
      }
    }

    getUserData(uid).then((d) => {
      if (cancelled) return;
      if (d) {
        cacheUser(uid, d);
        setData(d);
      }
      setLoading(false);
    });

    const unsub = listenUserData(uid, (d) => {
      if (cancelled) return;
      cacheUser(uid, d);
      setData(d);
      if (d) setLoading(false);
    });

    onCleanup(() => {
      cancelled = true;
      unsub?.();
    });
  });

  const d = () => data();
  const lvl = () => calcLevel(d()?.xp || 0);
  const lvlInfo = () => calcXpForNextLevel(d()?.xp || 0);
  const badge = () => getBadge(lvl());

  const timePbs = (): PbEntry[] => {
    const dd = d(); if (!dd) return [];
    const entries: { label: string; wpm: number; acc: number; raw: number; cons: number; date: string }[] = [
      { label: "15 seconds", wpm: dd.pb15wpm, acc: dd.pb15acc, raw: dd.pb15raw, cons: dd.pb15cons, date: dd.pb15date },
      { label: "30 seconds", wpm: dd.pb30wpm, acc: dd.pb30acc, raw: dd.pb30raw, cons: dd.pb30cons, date: dd.pb30date },
      { label: "60 seconds", wpm: dd.pb60wpm, acc: dd.pb60acc, raw: dd.pb60raw, cons: dd.pb60cons, date: dd.pb60date },
      { label: "120 seconds", wpm: dd.pb120wpm, acc: dd.pb120acc, raw: dd.pb120raw, cons: dd.pb120cons, date: dd.pb120date },
    ];
    return entries.filter(e => e.wpm > 0);
  };

  const wordPbs = (): PbEntry[] => {
    const dd = d(); if (!dd) return [];
    const entries: { label: string; wpm: number; acc: number; raw: number; cons: number; date: string }[] = [
      { label: "10 words", wpm: dd.pb10wpm, acc: dd.pb10acc, raw: dd.pb10raw, cons: dd.pb10cons, date: dd.pb10date },
      { label: "25 words", wpm: dd.pb25wpm, acc: dd.pb25acc, raw: dd.pb25raw, cons: dd.pb25cons, date: dd.pb25date },
      { label: "50 words", wpm: dd.pb50wpm, acc: dd.pb50acc, raw: dd.pb50raw, cons: dd.pb50cons, date: dd.pb50date },
      { label: "100 words", wpm: dd.pb100wpm, acc: dd.pb100acc, raw: dd.pb100raw, cons: dd.pb100cons, date: dd.pb100date },
    ];
    return entries.filter(e => e.wpm > 0);
  };

  const bestTimeWpm = () => Math.max(...timePbs().map(e => e.wpm), 0);
  const bestWordWpm = () => Math.max(...wordPbs().map(e => e.wpm), 0);

  function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${Math.floor(seconds % 60)}s`;
    return `${Math.floor(seconds)}s`;
  }

  async function handleSendFriendRequest() {
    if (!store.user || !d()) return;
    const myName = store.user.displayName || store.user.email?.split("@")[0] || "User";
    setFriendReqStatus("sending");
    try {
      await sendFriendRequest(store.user.uid, myName, d()!.displayName);
      setFriendReqStatus("sent");
      showSuccessNotification(`Friend request sent to ${d()!.displayName}`);
    } catch (err: any) {
      setFriendReqStatus("error");
      setFriendReqMsg(err.message || "Failed to send request");
      showErrorNotification(err.message || "Failed to send request");
    }
  }

  async function handleReportSubmit() {
    const reason = reportReason().trim();
    const comment = reportComment().trim();

    if (!reason) {
      showNoticeNotification("Please select a valid report reason");
      return;
    }

    if (!comment) {
      showNoticeNotification("Please provide a comment");
      return;
    }

    if (reason === "Suspected cheating" && d()?.optOutOfLeaderboards) {
      showNoticeNotification(
        "You cannot report this user for suspected cheating as they have opted out of the leaderboards.",
      );
      return;
    }

    if (comment.length > 250) {
      showNoticeNotification(
        `Report comment is ${comment.length - 250} character(s) too long`,
      );
      return;
    }

    try {
      const report = {
        targetUid: props.uid,
        targetName: d()?.displayName || props.name,
        reason,
        comment,
        timestamp: Date.now(),
        reporterUid: store.user?.uid || "anonymous",
      };
      localStorage.setItem("user-reports", JSON.stringify(
        [...JSON.parse(localStorage.getItem("user-reports") || "[]"), report]
      ));
      showSuccessNotification("Report submitted. Thank you!");
      setShowReportForm(false);
      setReportReason("");
      setReportComment("");
    } catch {
      showErrorNotification("Failed to submit report");
    }
  }

  return (
    <div class="page-full">
      <div class="page-full-back" onClick={() => props.onNavigate("test")}>
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
        back
      </div>

      <Show when={!loading() && d()} fallback={
        <div class="profile-page">
          <Show when={loading()}>
            <div class="profile-empty">Loading...</div>
          </Show>
          <Show when={!loading()}>
            <div class="friends-empty">
              <div class="friends-empty-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm1-13h-2v6h2V7zm0 8h-2v2h2v-2z"/></svg>
              </div>
              <div class="friends-empty-text">User not found</div>
            </div>
          </Show>
        </div>
      }>
        <div class="profile-page">
          <div class="profile-header">
            <div>
              <div class="profile-avatar-name">
                <div class="profile-avatar-large">
                  <img src={resolveAvatarSrc(d()!)} alt="avatar" style="width:64px;height:64px;border-radius:50%;object-fit:cover;" />
                </div>
                <div>
                  <div class="profile-name-row">
                    <span class="profile-name">{d()!.displayName}</span>
                    <Show when={d()!.verified}>
                      <img class="verified-badge" src="/badge.svg?v=2"/>
                    </Show>
                    <Show when={d()!.badge1000}>
                      <img class="badge-1000" src="/1000.svg" aria-label="First 1000 user on the site" data-balloon-pos="up" />
                    </Show>
                    <span class="profile-badge" style={{ color: badge().color }} title={badge().label}>
                      {badge().icon} {badge().label}
                    </span>
                  </div>
                  <div class="profile-joined">
                    joined {d()!.joined ? new Date(d()!.joined).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "unknown"}
                  </div>
                  <Show when={d()!.streakLength > 0}>
                    <div class="profile-streak">
                      <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M13 5.08A7 7 0 0118.92 11h3.03c-.47-4.72-4.23-8.48-8.95-8.95v3.03zM18.92 13A7 7 0 0113 18.92v3.03c4.72-.47 8.48-4.23 8.95-8.95h-3.03zM11 18.92c-3.39-.49-6-3.4-6-6.92s2.61-6.43 6-6.92V2.05c-5.05.5-9 4.76-9 9.95s3.95 9.45 9 9.95v-3.03z"/></svg>
                      {d()!.streakLength} day streak
                    </div>
                  </Show>
                </div>
              </div>
              <div class="profile-level-bar">
                <div class="profile-level">{lvl()}</div>
                <div class="profile-xp-bar-track">
                  <div class="profile-xp-bar-fill" style={{ width: `${Math.min((lvlInfo().current / lvlInfo().needed) * 100, 100)}%` }} />
                </div>
                <div class="profile-xp-text">{lvlInfo().current.toLocaleString()} / {lvlInfo().needed.toLocaleString()} XP</div>
              </div>
            </div>
            <Show when={d()!.github || d()!.twitter || d()!.instagram || d()!.website}>
              <div class="profile-socials">
                <Show when={d()!.github}>
                  <a href={`https://github.com/${d()!.github}`} target="_blank" rel="noopener noreferrer" aria-label={d()!.github} data-balloon-pos="up">
                    <svg viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12 24 5.37 18.63 0 12 0z"/></svg>
                  </a>
                </Show>
                <Show when={d()!.twitter}>
                  <a href={`https://x.com/${d()!.twitter}`} target="_blank" rel="noopener noreferrer" aria-label={d()!.twitter} data-balloon-pos="up">
                    <svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </a>
                </Show>
                <Show when={d()!.instagram}>
                  <a href={`https://instagram.com/${d()!.instagram}`} target="_blank" rel="noopener noreferrer" aria-label={d()!.instagram} data-balloon-pos="up">
                    <svg viewBox="0 0 24 24"><path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10m0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6m4.5-3.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>
                  </a>
                </Show>
                <Show when={d()!.website}>
                  <a href={d()!.website} target="_blank" rel="noopener noreferrer" aria-label={d()!.website} data-balloon-pos="up">
                    <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                  </a>
                </Show>
              </div>
            </Show>
          </div>

          <Show when={!isOwnProfile() && store.user}>
            <div class="profile-actions">
              <button
                class="profile-action-btn"
                disabled={friendReqStatus() === "sending" || friendReqStatus() === "sent"}
                onClick={handleSendFriendRequest}
              >
                <Show when={friendReqStatus() === "sent"} fallback={
                  <Show when={friendReqStatus() === "sending"} fallback={<>Send friend request</>}>
                    <>Sending...</>
                  </Show>
                }>
                  <>Request sent</>
                </Show>
              </button>
              <button class="profile-action-btn" onClick={() => setShowReportForm(true)}>
                Report user
              </button>
            </div>
            <Show when={showReportForm()}>
              <div class="simple-modal-overlay" onClick={() => { setShowReportForm(false); setReportReason(""); setReportComment(""); setCharCount(0); }}>
                <div class="simple-modal" style="max-width:800px;" onClick={(e) => e.stopPropagation()}>
                  <div class="simple-modal-header">
                    <div class="simple-modal-title">Report a user</div>
                    <button class="simple-modal-close" onClick={() => { setShowReportForm(false); setReportReason(""); setReportComment(""); setCharCount(0); }}>&times;</button>
                  </div>
                  <div class="simple-modal-body">
                    <p style="color:var(--sub-color);margin-bottom:1rem;">
                      Please report users responsibly and add comments in English only. Misuse
                      may result in you losing access to this feature.
                    </p>
                    <label style="color:var(--sub-color);font-size:0.75rem;">user</label>
                    <div style="font-size:1.5rem;margin-bottom:1rem;">{d()?.displayName || props.name}</div>
                    <label style="color:var(--sub-color);font-size:0.75rem;">reason</label>
                    <select
                      value={reportReason()}
                      onChange={(e) => setReportReason(e.currentTarget.value)}
                      style="background:var(--sub-alt);color:var(--text);border:1px solid transparent;border-radius:var(--roundness);padding:0.5rem 0.75rem;font-size:0.75rem;outline:none;font-family:inherit;width:100%;margin-bottom:1rem;cursor:pointer;"
                    >
                      <option value="">-- Select a reason --</option>
                      <For each={REPORT_REASONS}>{(reason) =>
                        <option value={reason}>{reason}</option>
                      }</For>
                    </select>
                    <label style="color:var(--sub-color);font-size:0.75rem;">comment</label>
                    <textarea
                      placeholder="Comment"
                      value={reportComment()}
                      onInput={(e) => { setReportComment(e.currentTarget.value); setCharCount(e.currentTarget.value.length); }}
                      maxLength={250}
                      style="background:var(--sub-alt);color:var(--text);border:1px solid transparent;border-radius:var(--roundness);padding:0.5rem 0.75rem;font-size:0.75rem;outline:none;font-family:inherit;width:100%;min-height:5rem;resize:vertical;line-height:1.2rem;"
                    />
                    <div style="color:var(--sub-color);font-size:0.7rem;text-align:right;margin-top:0.25rem;">{charCount()}/250</div>
                  </div>
                  <div class="simple-modal-footer">
                    <button onClick={handleReportSubmit}>Report</button>
                    <button onClick={() => { setShowReportForm(false); setReportReason(""); setReportComment(""); setCharCount(0); }}>Cancel</button>
                  </div>
                </div>
              </div>
            </Show>
          </Show>

          <div class="profile-typing-stats">
                <div class="profile-stat-box">
                  <div class="profile-stat-val">{d()!.startedTests.toLocaleString()}</div>
                  <div class="profile-stat-label">tests started</div>
                </div>
                <div class="profile-stat-box">
                  <div class="profile-stat-val">{d()!.completedTests.toLocaleString()}</div>
                  <div class="profile-stat-label">tests completed</div>
                </div>
                <div class="profile-stat-box">
                  <div class="profile-stat-val">{formatTime(d()!.timeTyping)}</div>
                  <div class="profile-stat-label">time typing</div>
                </div>
              </div>

              <Show when={timePbs().length > 0}>
                <div class="profile-section">
                  <div class="profile-section-title">best scores (time)</div>
                  <div class="profile-bests-grid">
                    <For each={timePbs()}>{(pb) =>
                      <div class="profile-best-card" classList={{ "profile-best-top": bestTimeWpm() > 0 && pb.wpm >= bestTimeWpm() }}>
                        <div class="profile-best-mode">{pb.label}</div>
                        <div class="profile-best-wpm">{Math.round(pb.wpm)} wpm</div>
                        <div class="profile-best-acc">{pb.acc.toFixed(1)}% acc</div>
                        <Show when={pb.raw > 0}>
                          <div class="profile-best-detail">raw {Math.round(pb.raw)}</div>
                        </Show>
                        <Show when={pb.cons > 0}>
                          <div class="profile-best-detail">cons {pb.cons.toFixed(1)}%</div>
                        </Show>
                        <Show when={pb.date}>
                          <div class="profile-best-date">{new Date(pb.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</div>
                        </Show>
                      </div>
                    }</For>
                  </div>
                </div>
              </Show>

              <Show when={wordPbs().length > 0}>
                <div class="profile-section">
                  <div class="profile-section-title">best scores (words)</div>
                  <div class="profile-bests-grid">
                    <For each={wordPbs()}>{(pb) =>
                      <div class="profile-best-card" classList={{ "profile-best-top": bestWordWpm() > 0 && pb.wpm >= bestWordWpm() }}>
                        <div class="profile-best-mode">{pb.label}</div>
                        <div class="profile-best-wpm">{Math.round(pb.wpm)} wpm</div>
                        <div class="profile-best-acc">{pb.acc.toFixed(1)}% acc</div>
                        <Show when={pb.raw > 0}>
                          <div class="profile-best-detail">raw {Math.round(pb.raw)}</div>
                        </Show>
                        <Show when={pb.cons > 0}>
                          <div class="profile-best-detail">cons {pb.cons.toFixed(1)}%</div>
                        </Show>
                        <Show when={pb.date}>
                          <div class="profile-best-date">{new Date(pb.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</div>
                        </Show>
                      </div>
                    }</For>
                  </div>
                </div>
              </Show>

              <Show when={d()!.bio}>
                <div class="profile-section">
                  <div class="profile-section-title">bio</div>
                  <div class="profile-bio-value">{d()!.bio}</div>
                </div>
              </Show>

              <Show when={d()!.keyboard}>
                <div class="profile-section">
                  <div class="profile-section-title">keyboard</div>
                  <div class="profile-keyboard-value">{d()!.keyboard}</div>
                </div>
              </Show>

        </div>
      </Show>
    </div>
  );
}
