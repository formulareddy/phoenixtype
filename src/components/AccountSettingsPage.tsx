import { createSignal, createEffect, createMemo, Show, For } from "solid-js";
import { useAuth } from "../lib/AuthProvider";
import {
  updateDisplayName,
  linkGoogleAccount,
  unlinkGoogleAccount,
  linkGithubAccount,
  unlinkGithubAccount,
  deleteUserAccount,
  updateUserEmail,
  updateUserPassword,
  addPasswordAuth,
  removePasswordAuth,
  reauthenticate,
} from "../lib/auth";
import { updateUserDoc, listenUserData, checkNameAvailability, isVerifiedDisplayName } from "../lib/user-store";
import { getFirebaseErrorMessage } from "../lib/firebase-errors";
import { lookupUserByName, rejectFriendRequestsBetween } from "../lib/friends";

interface Props {
  onNavigate: (page: string) => void;
}

type SettingsTab = "account" | "authentication" | "blockedUsers" | "apeKeys" | "dangerZone";

const TABS: { key: SettingsTab; label: string; icon: string }[] = [
  { key: "account", label: "account", icon: "fas fa-user" },
  { key: "authentication", label: "authentication", icon: "fas fa-key" },
  { key: "blockedUsers", label: "blocked users", icon: "fas fa-user-shield" },
  { key: "apeKeys", label: "ape keys", icon: "fas fa-code" },
  { key: "dangerZone", label: "danger zone", icon: "fas fa-exclamation-triangle" },
];

export default function AccountSettingsPage(props: Props) {
  const { store, refresh } = useAuth();
  const [tab, setTab] = createSignal<SettingsTab>("account");
  const [displayName, setDisplayName] = createSignal(store.user?.displayName || "");
  const [msg, setMsg] = createSignal({ type: "", text: "" });

  createEffect(() => {
    if (store.user?.displayName) setDisplayName(store.user.displayName);
  });
  const [confirmResetPbs, setConfirmResetPbs] = createSignal(false);
  const [showDeleteModal, setShowDeleteModal] = createSignal(false);
  const [showResetModal, setShowResetModal] = createSignal(false);
  const [streakOffset, setStreakOffset] = createSignal(0);
  const [streakSet, setStreakSet] = createSignal(false);
  const [lbOptOut, setLbOptOut] = createSignal(false);
  const [showPasswordForm, setShowPasswordForm] = createSignal(false);
  const [newPassword, setNewPassword] = createSignal("");
  const [showEmailForm, setShowEmailForm] = createSignal(false);
  const [newEmail, setNewEmail] = createSignal("");
  const [showPasswordUpdateForm, setShowPasswordUpdateForm] = createSignal(false);
  const [currentPassword, setCurrentPassword] = createSignal("");
  const [newPasswordValue, setNewPasswordValue] = createSignal("");
  const [confirmRemoveGoogle, setConfirmRemoveGoogle] = createSignal(false);
  const [confirmRemoveGithub, setConfirmRemoveGithub] = createSignal(false);
  const [confirmRemovePassword, setConfirmRemovePassword] = createSignal(false);
  const [blockedUsers, setBlockedUsers] = createSignal<string[]>([]);
  const [blockInput, setBlockInput] = createSignal("");
  const [apeKeys, setApeKeys] = createSignal<{ name: string; key: string; created: number; modified: number; lastUsed: number; active: boolean }[]>([]);
  const [newKeyName, setNewKeyName] = createSignal("");
  const [lastCreatedKey, setLastCreatedKey] = createSignal<{ name: string; key: string } | null>(null);
  const [visibleKeys, setVisibleKeys] = createSignal<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = createSignal("");
  const [discordLinked, setDiscordLinked] = createSignal(false);
  const [lastNameChange, setLastNameChange] = createSignal(0);
  const [nameAvail, setNameAvail] = createSignal<boolean | null>(null);
  const [nameAvailChecking, setNameAvailChecking] = createSignal(false);

  const nameErr = createMemo(() => {
    const v = displayName().trim();
    if (!v) return "";
    if (isVerifiedDisplayName(store.user?.displayName || "")) return "";
    if (v.length < 3) return "minimum 3 characters";
    if (v.length > 16) return "maximum 16 characters";
    if (!/^[a-zA-Z0-9_]+$/.test(v)) return "letters, numbers, underscore only";
    return "";
  });

  createEffect(() => {
    if (!store.user?.uid) return;
    const unsub = listenUserData(store.user.uid, (data) => {
      if (!data) return;
      if (data.streakHourOffset !== undefined) {
        setStreakOffset(data.streakHourOffset);
        setStreakSet(true);
      }
      if (data.optOutOfLeaderboards) setLbOptOut(true);
      if (data.blockedUsers) setBlockedUsers(data.blockedUsers);
      if (data.apeKeys) setApeKeys(data.apeKeys);
      if (data.discordLinked) setDiscordLinked(true);
      if (data.lastNameChange) setLastNameChange(data.lastNameChange);
    });
    return unsub ? unsub : undefined;
  });

  function nameChangeRemaining(): number {
    const lc = lastNameChange();
    if (!lc) return 0;
    return 30 - Math.floor((Date.now() - lc) / (24 * 60 * 60 * 1000));
  }

  function showMsg(type: string, text: string) {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 4000);
  }

  async function checkNameOnBlur() {
    const name = displayName().trim();
    if (!name || nameErr() || name === store.user?.displayName) { setNameAvail(null); return; }
    setNameAvailChecking(true);
    const avail = await checkNameAvailability(name, store.user?.uid);
    setNameAvail(avail);
    setNameAvailChecking(false);
  }

  async function handleUpdateDisplayName() {
    const name = displayName().trim();
    if (!name || !store.user?.uid) return;
    if (name === store.user.displayName) return;
    if (nameErr()) { showMsg("error", nameErr()); return; }
    const isVerified = isVerifiedDisplayName(store.user?.displayName || "");
    if (!isVerified) {
      const lastChange = lastNameChange();
      if (lastChange && Date.now() - lastChange < 30 * 24 * 60 * 60 * 1000) {
        const remaining = Math.ceil((30 * 24 * 60 * 60 * 1000 - (Date.now() - lastChange)) / (24 * 60 * 60 * 1000));
        showMsg("error", `You can change your name again in ${remaining} day${remaining === 1 ? "" : "s"}.`);
        return;
      }
    }
    const available = await checkNameAvailability(name, store.user.uid);
    if (!available) { showMsg("error", "Username already taken"); return; }
    const err = await updateDisplayName(name);
    if (err) showMsg("error", getFirebaseErrorMessage(err));
    else {
      await updateUserDoc(store.user.uid, { displayName: name, displayNameLower: name.toLowerCase(), lastNameChange: Date.now() } as any);
      setLastNameChange(Date.now());
      showMsg("success", "Display name updated!");
    }
  }

  async function handleAddPassword() {
    if (!newPassword().trim()) return;
    if (!store.user?.email) { showMsg("error", "No email on account"); return; }
    if (newPassword().length < 8) { showMsg("error", "minimum 8 characters"); return; }
    const err = await addPasswordAuth(newPassword().trim());
    if (err) showMsg("error", getFirebaseErrorMessage(err));
    else {
      showMsg("success", "Password authentication added!");
      setShowPasswordForm(false);
      setNewPassword("");
      await refresh();
    }
  }

  async function handleUpdateEmail() {
    const email = newEmail().trim();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showMsg("error", "invalid email"); return; }
    const err = await updateUserEmail(email);
    if (err) showMsg("error", getFirebaseErrorMessage(err));
    else {
      showMsg("success", "Verification email sent to new address!");
      setShowEmailForm(false);
      setNewEmail("");
      await refresh();
    }
  }

  async function handleUpdatePassword() {
    const cur = currentPassword();
    const npw = newPasswordValue();
    if (!cur || !npw) return;
    if (!store.user?.email) { showMsg("error", "No email on account"); return; }
    if (npw.length < 8) { showMsg("error", "minimum 8 characters"); return; }
    const err = await updateUserPassword(cur, npw);
    if (err) showMsg("error", getFirebaseErrorMessage(err));
    else {
      showMsg("success", "Password updated!");
      setShowPasswordUpdateForm(false);
      setCurrentPassword("");
      setNewPasswordValue("");
      await refresh();
    }
  }

  async function handleRemovePassword() {
    const err = await removePasswordAuth();
    if (err) showMsg("error", getFirebaseErrorMessage(err));
    else {
      showMsg("success", "Password authentication removed.");
      setConfirmRemovePassword(false);
      await refresh();
    }
  }

  async function handleLinkGoogle() {
    const err = await linkGoogleAccount();
    if (err) showMsg("error", getFirebaseErrorMessage(err));
    else {
      showMsg("success", "Google account linked!");
      await refresh();
    }
  }

  async function handleUnlinkGoogle() {
    const err = await unlinkGoogleAccount();
    if (err) showMsg("error", getFirebaseErrorMessage(err));
    else {
      showMsg("success", "Google account unlinked!");
      setConfirmRemoveGoogle(false);
      await refresh();
    }
  }

  async function handleLinkGithub() {
    const err = await linkGithubAccount();
    if (err) showMsg("error", getFirebaseErrorMessage(err));
    else {
      showMsg("success", "GitHub account linked!");
      await refresh();
    }
  }

  async function handleUnlinkGithub() {
    const err = await unlinkGithubAccount();
    if (err) showMsg("error", getFirebaseErrorMessage(err));
    else {
      showMsg("success", "GitHub account unlinked!");
      setConfirmRemoveGithub(false);
      await refresh();
    }
  }

  async function handleDeleteAccount(password?: string) {
    const reauthErr = await reauthenticate(password);
    if (reauthErr) { setShowDeleteModal(false); showMsg("error", getFirebaseErrorMessage(reauthErr)); return; }
    const err = await deleteUserAccount();
    if (err) { setShowDeleteModal(false); showMsg("error", getFirebaseErrorMessage(err)); return; }
    showMsg("success", "Account deleted.");
    setTimeout(() => props.onNavigate("test"), 1500);
  }

  async function handleSetStreakOffset() {
    if (!store.user) return;
    await updateUserDoc(store.user.uid, { streakHourOffset: streakOffset() } as any);
    setStreakSet(true);
    showMsg("success", "Streak hour offset set!");
  }

  async function handleOptOutLb() {
    if (!store.user) return;
    await updateUserDoc(store.user.uid, { optOutOfLeaderboards: true } as any);
    setLbOptOut(true);
    showMsg("success", "Opted out of leaderboards.");
  }

  async function handleResetPbs() {
    if (!store.user) return;
    const clear: Record<string, any> = {
      pb15wpm: 0, pb15acc: 0, pb15raw: 0, pb15cons: 0, pb15date: "",
      pb30wpm: 0, pb30acc: 0, pb30raw: 0, pb30cons: 0, pb30date: "",
      pb60wpm: 0, pb60acc: 0, pb60raw: 0, pb60cons: 0, pb60date: "",
      pb120wpm: 0, pb120acc: 0, pb120raw: 0, pb120cons: 0, pb120date: "",
      pb10wpm: 0, pb10acc: 0, pb10raw: 0, pb10cons: 0, pb10date: "",
      pb25wpm: 0, pb25acc: 0, pb25raw: 0, pb25cons: 0, pb25date: "",
      pb50wpm: 0, pb50acc: 0, pb50raw: 0, pb50cons: 0, pb50date: "",
      pb100wpm: 0, pb100acc: 0, pb100raw: 0, pb100cons: 0, pb100date: "",
    };
    await updateUserDoc(store.user.uid, clear);
    setConfirmResetPbs(false);
    showMsg("success", "Personal bests reset!");
  }

  async function handleResetAccount(password?: string) {
    if (!store.user) return;
    const reauthErr = await reauthenticate(password);
    if (reauthErr) { setShowResetModal(false); showMsg("error", getFirebaseErrorMessage(reauthErr)); return; }
    const reset: Record<string, any> = {
      startedTests: 0, completedTests: 0, timeTyping: 0, xp: 0,
      streakLength: 0, streakMaxLength: 0, lastTestDate: "",
      personalBests: {}, lbOptOut: false, streakHourOffset: 0,
      optOutOfLeaderboards: false, discordLinked: false, discordId: "",
      avatar: "", bio: "", keyboard: "", socials: {},
    };
    await updateUserDoc(store.user.uid, reset as any);
    setShowResetModal(false);
    showMsg("success", "Account reset!");
  }

  async function handleDiscordLink() {
    if (!store.user) return;
    await updateUserDoc(store.user.uid, { discordLinked: true } as any);
    setDiscordLinked(true);
    showMsg("success", "Discord account linked!");
  }

  async function handleDiscordUnlink() {
    if (!store.user) return;
    await updateUserDoc(store.user.uid, { discordLinked: false } as any);
    setDiscordLinked(false);
    showMsg("success", "Discord account unlinked!");
  }

  async function handleAddBlocked() {
    const name = blockInput().trim();
    if (!name || !store.user) return;
    if (name === store.user.displayName) { showMsg("error", "You cannot block yourself"); return; }
    if (blockedUsers().includes(name)) { showMsg("error", "User already blocked"); return; }
    const user = await lookupUserByName(name);
    if (!user) { showMsg("error", "User not found"); return; }
    const updated = [...blockedUsers(), name];
    await updateUserDoc(store.user.uid, { blockedUsers: updated } as any);
    await rejectFriendRequestsBetween(store.user.uid, user.uid);
    setBlockedUsers(updated);
    setBlockInput("");
    showMsg("success", `"${name}" blocked`);
  }

  async function handleRemoveBlocked(name: string) {
    if (!store.user) return;
    const updated = blockedUsers().filter(n => n !== name);
    await updateUserDoc(store.user.uid, { blockedUsers: updated } as any);
    setBlockedUsers(updated);
    showMsg("success", `"${name}" unblocked`);
  }

  async function handleGenerateApeKey() {
    const name = newKeyName().trim();
    if (!name || !store.user) return;
    const key = "ape_key_" + Array.from(crypto.getRandomValues(new Uint8Array(24)), b => b.toString(36).padStart(2, "0")).join("");
    const entry = { name, key, created: Date.now(), modified: Date.now(), lastUsed: 0, active: true };
    const updated = [...apeKeys(), entry];
    await updateUserDoc(store.user.uid, { apeKeys: updated } as any);
    setApeKeys(updated);
    setNewKeyName("");
    setLastCreatedKey({ name, key });
    showMsg("success", "Ape key generated!");
  }

  async function handleCopyKey(key: string) {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(""), 2000);
    } catch { /* ignore */ }
  }

  function toggleKeyVisibility(name: string) {
    const next = new Set(visibleKeys());
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setVisibleKeys(next);
  }

  async function handleRevokeApeKey(name: string) {
    if (!store.user) return;
    const updated = apeKeys().filter(k => k.name !== name);
    await updateUserDoc(store.user.uid, { apeKeys: updated } as any);
    setApeKeys(updated);
    showMsg("success", "Ape key revoked!");
  }

  async function handleToggleApeKey(name: string) {
    if (!store.user) return;
    const updated = apeKeys().map(k => k.name === name ? { ...k, active: !k.active } : k);
    await updateUserDoc(store.user.uid, { apeKeys: updated } as any);
    setApeKeys(updated);
  }

  function handleRevokeAllTokens() {
    showMsg("success", "All tokens revoked!");
  }

  const providers = () => {
    if (!store.user) return { google: false, github: false, password: false, count: 0 };
    const hasPassword = store.user.providerData.some(p => p?.providerId === "password");
    const hasGoogle = store.user.providerData.some(p => p?.providerId === "google.com");
    const hasGithub = store.user.providerData.some(p => p?.providerId === "github.com");
    return {
      google: hasGoogle,
      github: hasGithub,
      password: hasPassword,
      count: [hasPassword, hasGoogle, hasGithub].filter(Boolean).length,
    };
  };

  function DangerActionModal(p: {
    open: boolean;
    title: string;
    description: string;
    confirmText: string;
    buttonText: string;
    requiresPassword: boolean;
    onClose: () => void;
    onConfirm: (password?: string) => Promise<void>;
  }) {
    const [pwd, setPwd] = createSignal("");
    const [agreed, setAgreed] = createSignal(false);
    const [loading, setLoading] = createSignal(false);
    const [error, setError] = createSignal("");

    const displayButtonText = () => p.requiresPassword ? p.buttonText : `reauthenticate to ${p.buttonText}`;

    async function handleConfirm() {
      setLoading(true);
      setError("");
      try {
        await p.onConfirm(p.requiresPassword ? pwd() : undefined);
        handleClose();
      } catch (err: any) {
        setError(err.message || String(err));
        setLoading(false);
      }
    }

    function handleClose() {
      if (loading()) return;
      setPwd(""); setAgreed(false); setError("");
      p.onClose();
    }

    return (
      <Show when={p.open}>
        <div class="simple-modal-overlay" onClick={handleClose}>
          <div class="simple-modal" onClick={(e) => e.stopPropagation()}>
            <div class="simple-modal-header">
              <span>{p.title}</span>
              <button class="simple-modal-close" onClick={handleClose} disabled={loading()}>&times;</button>
            </div>
            <div class="simple-modal-body">
              <p style="font-size:0.8rem;color:var(--sub);margin-bottom:1rem;">{p.description}</p>
              <Show when={p.requiresPassword}>
                <input type="password" placeholder="Current password" value={pwd()}
                  onInput={(e) => setPwd(e.currentTarget.value)}
                  style="width:100%;padding:0.5rem;margin-bottom:0.75rem;background:var(--bg);color:var(--text);border:1px solid var(--sub-alt);border-radius:var(--roundness);outline:none;font-family:inherit;font-size:0.8rem;" />
              </Show>
              <label style="display:flex;align-items:flex-start;gap:0.5rem;font-size:0.75rem;color:var(--sub);cursor:pointer;line-height:1.4;">
                <input type="checkbox" checked={agreed()} onChange={(e) => setAgreed(e.currentTarget.checked)}
                  style="margin-top:0.15rem;accent-color:var(--main);" />
                <span>{p.confirmText}</span>
              </label>
              <Show when={error()}>
                <p style="color:var(--error);font-size:0.75rem;margin-top:0.5rem;">{error()}</p>
              </Show>
            </div>
            <div class="simple-modal-footer">
              <button class="sd-btn" onClick={handleClose} disabled={loading()}>cancel</button>
              <button class="sd-btn danger" onClick={handleConfirm}
                disabled={!agreed() || loading() || (p.requiresPassword && !pwd())}>
                {loading() ? "..." : displayButtonText()}
              </button>
            </div>
          </div>
        </div>
      </Show>
    );
  }

  return (
    <div class="page-full">
      <div class="page-full-back" onClick={() => props.onNavigate("account")}>
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
        back to account
      </div>

      {/* Message */}
      <Show when={msg().text}>
        <div class={`acct-msg acct-msg-${msg().type}`}>{msg().text}</div>
      </Show>

      <div class="pageAccountSettings">
        <div class="main">
          {/* ── Sidebar Tabs ── */}
          <div class="tabs">
            <For each={TABS}>
              {(t) => (
                <button
                  class="text"
                  classList={{ active: tab() === t.key }}
                  onClick={() => setTab(t.key)}
                >
                  <i class={t.icon}></i>
                  {t.label}
                </button>
              )}
            </For>
          </div>

          {/* ── Content ── */}
          <div class="right">
            {/* ══════ ACCOUNT TAB ══════ */}
            <div class="tab" classList={{ hidden: tab() !== "account" }} data-tab="account">
              {/* Discord Integration */}
              <div class="section">
                <div class="title">
                  <i class="fab fa-discord"></i>
                  <span>discord integration</span>
                </div>
                <div class="text">
                  When you connect your monkeytype account to your Discord account,
                  you will be automatically assigned a new role every time you
                  achieve a new personal best in a 60 second test. If you link your
                  accounts before joining the Discord server, the bot
                  <i> will not</i> give you a role.
                </div>
                <Show when={!discordLinked()} fallback={
                  <div class="info">
                    <div>
                      <i class="fas fa-check"></i>
                      Your accounts are linked!
                    </div>
                    <div class="discordButtonGroup">
                      <button class="textButton" onClick={handleDiscordLink}>
                        <i class="fas fa-sync-alt"></i>
                        Update avatar
                      </button>
                      <button class="textButton" onClick={handleDiscordUnlink}>
                        <i class="fas fa-unlink"></i>
                        Unlink
                      </button>
                    </div>
                  </div>
                }>
                  <div class="buttons">
                    <button onClick={handleDiscordLink}>link</button>
                  </div>
                </Show>
              </div>

              {/* Update Account Name */}
              <div class="section">
                <div class="title">
                  <i class="fas fa-user"></i>
                  <span>update account name</span>
                </div>
                <div class="text">
                  Change the name of your account.
                  <span class="red"> You can only do this once every 30 days.</span>
                </div>
                <Show when={nameChangeRemaining() > 0 && !isVerifiedDisplayName(store.user?.displayName || "")}>
                  <div class="info" style="margin-bottom:0.5rem;">
                    <i class="fas fa-clock"></i>
                    {nameChangeRemaining()} day{nameChangeRemaining() === 1 ? "" : "s"} remaining until you can change your name again.
                  </div>
                </Show>
                <div class="buttons">
                  <input
                    type="text"
                    placeholder="display name"
                    value={displayName()}
                    onInput={(e) => { setDisplayName(e.currentTarget.value); setNameAvail(null); }}
                    onBlur={checkNameOnBlur}
                    onKeyDown={(e) => e.key === "Enter" && handleUpdateDisplayName()}
                    class={nameErr() || nameAvail() === false ? "auth-input-error" : ""}
                    style="background:var(--sub-alt);color:var(--text);border:1px solid transparent;border-radius:var(--roundness);padding:0.5rem 0.75rem;font-size:0.75rem;outline:none;font-family:inherit;width:100%;"
                  />
                  <button onClick={handleUpdateDisplayName} disabled={!!nameErr() || nameAvailChecking() || nameAvail() === false}>update name</button>
                </div>
                <Show when={nameErr()}>
                  <div class="auth-field-err">{nameErr()}</div>
                </Show>
                <Show when={nameAvailChecking()}>
                  <div class="auth-field-err" style="color:var(--sub)">checking...</div>
                </Show>
                <Show when={nameAvail() === false}>
                  <div class="auth-field-err">username already taken</div>
                </Show>
              </div>

              {/* Set Streak Hour Offset */}
              <div class="section">
                <div class="title">
                  <i class="fas fa-clock"></i>
                  <span>set streak hour offset</span>
                </div>
                <div class="text">
                  Streaks reset at midnight UTC by default. If this is not
                  convenient for you (for example if it means that streaks reset in
                  the middle of the day), you can change the hour offset here.
                  <span class="red"> You can only do this once!</span>
                </div>
                <Show when={!streakSet()} fallback={
                  <div class="info">
                    <i class="fas fa-exclamation-triangle"></i>
                    You have already set your streak hour offset to <span>{streakOffset()}</span>.
                  </div>
                }>
                  <div class="buttons">
                    <input
                      type="number"
                      min="-12"
                      max="14"
                      placeholder="offset"
                      value={streakOffset()}
                      onInput={(e) => setStreakOffset(parseInt(e.currentTarget.value) || 0)}
                      style="background:var(--sub-alt);color:var(--text);border:1px solid transparent;border-radius:var(--roundness);padding:0.5rem 0.75rem;font-size:0.75rem;outline:none;font-family:inherit;width:6rem;"
                    />
                    <button onClick={handleSetStreakOffset}>update hour offset</button>
                  </div>
                </Show>
              </div>

              {/* Opt out of Leaderboards */}
              <div class="section">
                <div class="title">
                  <i class="fas fa-crown"></i>
                  <span>opt out of leaderboards</span>
                </div>
                <div class="text">
                  Use this if you frequently trigger the anticheat (for example if
                  using stenography) to opt out of leaderboards.
                  <span class="red"> You can't undo this action!</span>
                </div>
                <Show when={lbOptOut()}>
                  <div class="info">
                    <i class="fas fa-exclamation-triangle"></i>
                    You have opted out of leaderboards.
                  </div>
                </Show>
                <Show when={!lbOptOut()}>
                  <div class="buttons">
                    <button onClick={handleOptOutLb}>opt out</button>
                  </div>
                </Show>
              </div>

              {/* Reset Personal Bests */}
              <div class="section">
                <div class="title">
                  <i class="fas fa-crown"></i>
                  <span>reset personal bests</span>
                </div>
                <div class="text">
                  Resets all your personal bests (but doesn't delete any tests from
                  your history).
                  <span class="red"> You can't undo this!</span>
                </div>
                <Show when={!confirmResetPbs()} fallback={
                  <div class="buttons">
                    <button class="danger" onClick={handleResetPbs}>confirm</button>
                    <button onClick={() => setConfirmResetPbs(false)}>cancel</button>
                  </div>
                }>
                  <div class="buttons">
                    <button class="danger" onClick={() => setConfirmResetPbs(true)}>reset personal bests</button>
                  </div>
                </Show>
              </div>
            </div>

            {/* ══════ AUTHENTICATION TAB ══════ */}
            <div class="tab" classList={{ hidden: tab() !== "authentication" }} data-tab="authentication">
              {/* Password Auth Settings */}
              <div class="section passwordAuthSettings">
                <div class="title">
                  <i class="fas fa-lock"></i>
                  <span>password authentication settings</span>
                </div>
                <div class="text">
                  Add password authentication, update your password or email.
                </div>
                <div class="buttons vertical">
                  <Show when={providers().password} fallback={
                    <Show when={!showPasswordForm()} fallback={
                      <>
                        <input
                          type="password"
                          placeholder="new password"
                          value={newPassword()}
                          onInput={(e) => setNewPassword(e.currentTarget.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleAddPassword()}
                          style="background:var(--sub-alt);color:var(--text);border:1px solid transparent;border-radius:var(--roundness);padding:0.5rem 0.75rem;font-size:0.75rem;outline:none;font-family:inherit;width:100%;"
                        />
                        <button id="addPasswordAuth" onClick={handleAddPassword}>add password authentication</button>
                        <button onClick={() => { setShowPasswordForm(false); setNewPassword(""); }}>cancel</button>
                      </>
                    }>
                      <button id="addPasswordAuth" onClick={() => setShowPasswordForm(true)}>add password authentication</button>
                    </Show>
                  }>
                    <Show when={!showEmailForm()} fallback={
                      <>
                        <input
                          type="email"
                          placeholder="new email"
                          value={newEmail()}
                          onInput={(e) => setNewEmail(e.currentTarget.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleUpdateEmail()}
                          style="background:var(--sub-alt);color:var(--text);border:1px solid transparent;border-radius:var(--roundness);padding:0.5rem 0.75rem;font-size:0.75rem;outline:none;font-family:inherit;width:100%;"
                        />
                        <button id="emailPasswordAuth" onClick={handleUpdateEmail}>update email</button>
                        <button onClick={() => { setShowEmailForm(false); setNewEmail(""); }}>cancel</button>
                      </>
                    }>
                      <button id="emailPasswordAuth" onClick={() => setShowEmailForm(true)}>update email</button>
                    </Show>
                    <Show when={!showPasswordUpdateForm()} fallback={
                      <>
                        <input
                          type="password"
                          placeholder="current password"
                          value={currentPassword()}
                          onInput={(e) => setCurrentPassword(e.currentTarget.value)}
                          style="background:var(--sub-alt);color:var(--text);border:1px solid transparent;border-radius:var(--roundness);padding:0.5rem 0.75rem;font-size:0.75rem;outline:none;font-family:inherit;width:100%;"
                        />
                        <input
                          type="password"
                          placeholder="new password"
                          value={newPasswordValue()}
                          onInput={(e) => setNewPasswordValue(e.currentTarget.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleUpdatePassword()}
                          style="background:var(--sub-alt);color:var(--text);border:1px solid transparent;border-radius:var(--roundness);padding:0.5rem 0.75rem;font-size:0.75rem;outline:none;font-family:inherit;width:100%;margin-top:0.35rem;"
                        />
                        <button id="passPasswordAuth" onClick={handleUpdatePassword}>update password</button>
                        <button onClick={() => { setShowPasswordUpdateForm(false); setCurrentPassword(""); setNewPasswordValue(""); }}>cancel</button>
                      </>
                    }>
                      <button id="passPasswordAuth" onClick={() => setShowPasswordUpdateForm(true)}>update password</button>
                    </Show>
                    <Show when={providers().count > 1}>
                      <Show when={!confirmRemovePassword()} fallback={
                        <>
                          <button class="danger" onClick={handleRemovePassword}>confirm</button>
                          <button onClick={() => setConfirmRemovePassword(false)}>cancel</button>
                        </>
                      }>
                        <button id="removePasswordAuth" class="danger" onClick={() => setConfirmRemovePassword(true)}>remove password authentication</button>
                      </Show>
                    </Show>
                  </Show>
                </div>
              </div>

              {/* Google Auth Settings */}
              <div class="section googleAuthSettings">
                <div class="title">
                  <i class="fab fa-google"></i>
                  <span>google authentication settings</span>
                </div>
                <div class="text">Add or remove Google authentication.</div>
                <div class="buttons vertical">
                  <Show when={providers().google} fallback={
                    <button id="addGoogleAuth" onClick={handleLinkGoogle}>add google authentication</button>
                  }>
                    <Show when={!confirmRemoveGoogle()} fallback={
                      <>
                        <button id="removeGoogleAuth" class="danger" onClick={handleUnlinkGoogle}>confirm</button>
                        <button onClick={() => setConfirmRemoveGoogle(false)}>cancel</button>
                      </>
                    }>
                      <button id="removeGoogleAuth" class="danger" disabled={providers().count <= 1} onClick={() => setConfirmRemoveGoogle(true)}>remove google authentication</button>
                    </Show>
                  </Show>
                </div>
              </div>

              {/* GitHub Auth Settings */}
              <div class="section githubAuthSettings">
                <div class="title">
                  <i class="fab fa-github"></i>
                  <span>github authentication settings</span>
                </div>
                <div class="text">Add or remove GitHub authentication.</div>
                <div class="buttons vertical">
                  <Show when={providers().github} fallback={
                    <button id="addGithubAuth" onClick={handleLinkGithub}>add github authentication</button>
                  }>
                    <Show when={!confirmRemoveGithub()} fallback={
                      <>
                        <button id="removeGithubAuth" class="danger" onClick={handleUnlinkGithub}>confirm</button>
                        <button onClick={() => setConfirmRemoveGithub(false)}>cancel</button>
                      </>
                    }>
                      <button id="removeGithubAuth" class="danger" disabled={providers().count <= 1} onClick={() => setConfirmRemoveGithub(true)}>remove github authentication</button>
                    </Show>
                  </Show>
                </div>
              </div>

              {/* Revoke All Tokens */}
              <div class="section">
                <div class="title">
                  <i class="fas fa-user-slash"></i>
                  <span>revoke all tokens</span>
                </div>
                <div class="text">
                  Revokes all tokens connected to your account. Do this if you think
                  someone else has access to your account.
                  <br />
                  <span class="red"> This will log you out of all devices.</span>
                </div>
                <div class="buttons">
                  <button class="danger" onClick={handleRevokeAllTokens}>revoke all tokens</button>
                </div>
              </div>
            </div>

            {/* ══════ BLOCKED USERS TAB ══════ */}
            <div class="tab" classList={{ hidden: tab() !== "blockedUsers" }} data-tab="blockedUsers">
              <div class="section">
                <div class="title">
                  <i class="fas fa-user-shield"></i>
                  <span>blocked users</span>
                </div>
                <div class="text">
                  Blocked users cannot send you friend requests.
                </div>
                <div class="buttons">
                  <input
                    type="text"
                    placeholder="username"
                    value={blockInput()}
                    onInput={(e) => setBlockInput(e.currentTarget.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddBlocked()}
                    style="background:var(--sub-alt);color:var(--text);border:1px solid transparent;border-radius:var(--roundness);padding:0.5rem 0.75rem;font-size:0.75rem;outline:none;font-family:inherit;width:100%;"
                  />
                  <button onClick={handleAddBlocked}>block user</button>
                </div>
              </div>
              <Show when={blockedUsers().length === 0}>
                <div class="acct-settings-note" style="color:var(--sub);font-size:0.8rem;">No blocked users.</div>
              </Show>
              <div class="blocked-users-list">
                <For each={blockedUsers()}>
                  {(name) => (
                    <div class="blocked-user-row">
                      <span class="blocked-user-name">{name}</span>
                      <button class="textButton" onClick={() => handleRemoveBlocked(name)}>
                        <i class="fas fa-times"></i>
                      </button>
                    </div>
                  )}
                </For>
              </div>
            </div>

            {/* ══════ APE KEYS TAB ══════ */}
            <div class="tab" classList={{ hidden: tab() !== "apeKeys" }} data-tab="apeKeys">
              <div class="section apeKeys">
                <div class="title">
                  <i class="fas fa-key"></i>
                  <span>ape keys</span>
                </div>
                <div class="text">
                  Generate Ape Keys to access certain API endpoints
                  <span style="display: inline-flex">
                    (
                    <a href="https://api.monkeytype.com/docs" target="_blank" rel="noopener" style="color:var(--main);">
                      documentation
                    </a>
                    ).&nbsp;
                  </span>
                  More endpoints will be added in the future.
                </div>
                <div class="buttons">
                  <input
                    type="text"
                    placeholder="key name"
                    value={newKeyName()}
                    onInput={(e) => setNewKeyName(e.currentTarget.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleGenerateApeKey()}
                    style="background:var(--sub-alt);color:var(--text);border:1px solid transparent;border-radius:var(--roundness);padding:0.5rem 0.75rem;font-size:0.75rem;outline:none;font-family:inherit;width:100%;"
                  />
                  <button onClick={handleGenerateApeKey}>generate new key</button>
                </div>
              </div>

              <Show when={lastCreatedKey()}>
                <div class="ape-key-reveal">
                  <div class="ape-key-reveal-title">Key generated!</div>
                  <div class="ape-key-reveal-name">{lastCreatedKey()!.name}</div>
                  <div class="ape-key-reveal-value">
                    <code>{lastCreatedKey()!.key}</code>
                    <button class="textButton" onClick={() => handleCopyKey(lastCreatedKey()!.key)}>
                      <i class="fas fa-copy"></i>
                    </button>
                    <span class="ape-key-reveal-note">Make sure to copy your API key now. You won't be able to see it again!</span>
                  </div>
                  <button onClick={() => setLastCreatedKey(null)}>dismiss</button>
                </div>
              </Show>

              <Show when={apeKeys().length > 0}>
                <table>
                  <thead>
                    <tr>
                      <td width="1px">active</td>
                      <td>name</td>
                      <td>key</td>
                      <td>created on</td>
                      <td>modified on</td>
                      <td>last used on</td>
                      <td width="1px"></td>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={apeKeys()}>
                      {(key) => (
                        <tr>
                          <td style="text-align:center;">
                            <input type="checkbox" checked={key.active} onChange={() => handleToggleApeKey(key.name)} style="accent-color:var(--main);cursor:pointer;" />
                          </td>
                          <td>{key.name}</td>
                          <td class="ape-key-cell">
                            <code class="ape-key-value">{visibleKeys().has(key.name) ? key.key : key.key.slice(0, 12) + "…"}</code>
                            <div class="ape-key-actions">
                              <button class="textButton" onClick={() => toggleKeyVisibility(key.name)} title={visibleKeys().has(key.name) ? "Hide" : "Show"}>
                                <i class={`fas fa-eye${visibleKeys().has(key.name) ? "" : "-slash"}`}></i>
                              </button>
                              <button class="textButton" onClick={() => handleCopyKey(key.key)} title="Copy">
                                <i class="fas fa-copy"></i>
                              </button>
                              <Show when={copiedKey() === key.key}>
                                <span class="ape-key-copied">copied!</span>
                              </Show>
                            </div>
                          </td>
                          <td>{key.created ? new Date(key.created).toLocaleDateString() : "-"}</td>
                          <td>{key.modified ? new Date(key.modified).toLocaleDateString() : "-"}</td>
                          <td>{key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : "never"}</td>
                          <td>
                            <button class="textButton danger" onClick={() => handleRevokeApeKey(key.name)}>
                              <i class="fas fa-times"></i>
                            </button>
                          </td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </Show>
            </div>

            {/* ══════ DANGER ZONE TAB ══════ */}
            <div class="tab" classList={{ hidden: tab() !== "dangerZone" }} data-tab="dangerZone">
              <div class="section danger">
                <div class="title">
                  <i class="fas fa-redo-alt"></i>
                  <span>reset account</span>
                </div>
                <div class="text">
                  Completely resets your account to a blank state.
                  <br />
                  <span class="red"> You can't undo this action!</span>
                </div>
                <div class="buttons">
                  <button class="danger" onClick={() => setShowResetModal(true)}>reset account</button>
                </div>
              </div>

              <div class="section danger">
                <div class="title">
                  <i class="fas fa-trash"></i>
                  <span>delete account</span>
                </div>
                <div class="text">
                  Deletes your account and all data connected to it.
                  <br />
                  <span class="red"> You can't undo this action!</span>
                </div>
                <div class="buttons">
                  <button class="danger" onClick={() => setShowDeleteModal(true)}>delete account</button>
                </div>
              </div>
            </div>

            <DangerActionModal
              open={showResetModal()}
              title="Reset account"
              description="Completely resets your account to a blank state. You can't undo this action!"
              confirmText="I understand that my account will be completely reset and that this cannot be undone."
              buttonText="reset"
              requiresPassword={providers().password}
              onClose={() => setShowResetModal(false)}
              onConfirm={handleResetAccount}
            />

            <DangerActionModal
              open={showDeleteModal()}
              title="Delete account"
              description="Deletes your account and all data connected to it. You can't undo this action!"
              confirmText="I understand that all my data will be deleted and cannot be recovered."
              buttonText="delete"
              requiresPassword={providers().password}
              onClose={() => setShowDeleteModal(false)}
              onConfirm={handleDeleteAccount}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
