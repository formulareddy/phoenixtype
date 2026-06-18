import { createSignal, Show, onMount, onCleanup } from "solid-js";
import { useAuth } from "../lib/AuthProvider";
import { togglePanel, panelOpen } from "./Notifications";
import { getNotifications } from "../lib/notifications";
import { friendsStore } from "../lib/friends";
import { isVerifiedDisplayName } from "../lib/user-store";

interface Props {
  activePage: string;
  onNavigate: (page: string) => void;
  onRestart: () => void;
  onViewOwnProfile?: () => void;
}

export default function Header(props: Props) {
  const { store, logout } = useAuth();
  const [showMenu, setShowMenu] = createSignal(false);
  const userName = () => store.user?.displayName || store.user?.email?.split("@")[0] || "";
  let menuRef: HTMLDivElement | undefined;

  function closeMenu(e: MouseEvent) {
    if (menuRef && !menuRef.contains(e.target as Node)) setShowMenu(false);
  }

  function handleItemClick(page: string) {
    setShowMenu(false);
    props.onNavigate(page);
  }

  async function handleSignOut() {
    await logout();
    setShowMenu(false);
    props.onNavigate("test");
  }

  onMount(() => {
    document.addEventListener("mousedown", closeMenu);
  });
  onCleanup(() => {
    document.removeEventListener("mousedown", closeMenu);
  });

  return (
    <header>
      <a class="logo" href="/" onClick={(e) => { e.preventDefault(); props.onNavigate("test"); }}>
        <svg class="logo-icon" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(0,64) scale(0.1,-0.1)">
            <path d="M40 526 c0 -29 36 -76 58 -76 12 0 13 -3 4 -12 -9 -9 -19 -10 -42 -1 -34 13 -34 13 -18 -22 6 -14 21 -27 32 -30 12 -2 30 -6 41 -8 16 -3 12 -8 -20 -21 -34 -16 -37 -19 -21 -28 10 -6 34 -8 53 -5 35 6 35 6 18 -14 -24 -26 -12 -36 22 -18 16 7 32 15 36 17 4 2 5 -8 1 -22 -8 -31 4 -33 40 -5 22 18 27 18 32 5 3 -8 -4 -27 -15 -42 -36 -45 -26 -53 32 -26 55 27 76 47 77 74 0 14 4 13 26 -7 34 -32 48 -32 40 0 -7 28 5 33 24 10 12 -15 50 -21 50 -8 0 4 -10 18 -22 31 l-23 25 22 -12 c26 -13 63 -14 82 -2 11 7 5 13 -25 27 -31 13 -35 18 -19 21 11 2 29 6 41 8 11 3 26 16 32 30 16 35 16 35 -18 22 -23 -9 -33 -8 -42 1 -9 9 -8 12 4 12 22 0 58 47 58 76 l0 23 -35 -20 c-20 -12 -59 -24 -88 -28 l-52 -6 3 -51 c3 -55 -14 -82 -43 -70 -24 9 -45 68 -38 109 3 19 1 43 -5 53 -9 16 -10 16 -16 -2 -3 -11 -19 -28 -36 -37 -24 -15 -30 -25 -30 -53 0 -19 5 -34 10 -34 6 0 10 7 10 15 0 8 5 15 10 15 14 0 13 -43 -2 -58 -16 -16 -53 -15 -67 2 -6 7 -10 35 -9 62 l3 49 -52 6 c-29 4 -68 16 -88 28 l-35 20 0 -23z m140 -55 c3 -1 5 -25 5 -53 0 -29 3 -51 6 -48 4 3 16 -3 26 -13 12 -10 30 -16 44 -13 13 3 30 5 37 5 7 1 10 6 7 11 -11 17 25 24 38 7 17 -22 63 -29 78 -11 6 7 15 12 18 9 8 -5 11 11 11 68 0 28 4 37 18 38 9 1 27 3 40 4 24 2 26 -15 2 -23 -8 -3 -10 0 -5 9 5 8 4 10 0 6 -11 -10 -16 -39 -5 -32 4 2 16 -5 26 -17 11 -12 14 -19 9 -16 -14 9 -48 -18 -40 -31 3 -6 -5 -16 -19 -22 -14 -7 -23 -16 -19 -22 4 -6 1 -7 -6 -3 -7 5 -21 0 -33 -11 -12 -10 -18 -12 -14 -5 4 7 1 12 -8 12 -9 0 -16 5 -16 10 0 6 -5 10 -12 10 -6 0 -8 -3 -5 -7 4 -3 -2 -12 -13 -20 -11 -8 -20 -20 -20 -27 0 -8 -7 -19 -14 -26 -13 -10 -14 -7 -10 14 6 33 -29 60 -57 43 -14 -9 -21 -9 -31 1 -6 6 -19 12 -28 12 -9 0 -25 10 -36 22 -10 12 -13 18 -5 13 21 -12 2 16 -22 34 -18 13 -18 14 3 36 16 17 18 25 9 30 -8 6 -10 4 -4 -5 5 -8 3 -11 -5 -8 -8 2 -15 9 -17 14 -3 8 31 11 67 5z"/>
            <path d="M371 211 c-11 -45 -11 -53 5 -80 23 -38 38 -29 30 18 -6 34 -5 35 9 17 14 -19 15 -19 15 10 0 16 -10 42 -23 57 l-23 29 -13 -51z"/>
            <path d="M298 191 c-40 -29 -58 -58 -58 -98 l0 -25 29 31 c16 17 33 31 39 31 12 0 35 54 30 72 -2 11 -12 8 -40 -11z"/>
            <path d="M328 120 c-9 -14 -16 -40 -16 -58 1 -33 1 -33 20 -14 14 14 19 30 16 58 l-3 39 -17 -25z"/>
          </g>
        </svg>
        <span class="logo-text">
          <span class="logo-text-main">phoenixtype</span>
          <span class="logo-text-top">rise faster</span>
        </span>
      </a>
      <nav class="header-nav">
        <button class="header-nav-btn" title="keyboard" data-page="test" onClick={() => {
          props.onNavigate("test");
          props.onRestart();
        }}>
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 5H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 12H4V7h16v10zM6 9h2v2H6V9zm4 0h2v2h-2V9zm4 0h2v2h-2V9zm-8 4h2v2H6v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z"/></svg>
        </button>
        <button class="header-nav-btn" title="leaderboards" data-page="leaderboards" onClick={() => props.onNavigate("leaderboards")}>
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/></svg>
        </button>
        <button class="header-nav-btn" title="about" data-page="about" onClick={() => props.onNavigate("about")}>
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
        </button>
        <button class="header-nav-btn" title="settings" data-page="settings" onClick={() => props.onNavigate("settings")}>
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.63-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
        </button>
      </nav>
      <div class="header-right">
        <button class={`header-icon-btn notif-bell ${panelOpen() ? "active" : ""}`} title="Notifications" onClick={togglePanel}>
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
          <Show when={getNotifications().length > 0}>
            <span class="notif-bubble" />
          </Show>
        </button>
        <div class="account-wrap" ref={menuRef}>
          <Show when={store.user} fallback={
            <button class="header-icon-btn" title="Account" onClick={() => props.onNavigate("login")}>
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            </button>
          }>
            <div class="view-account" onClick={() => setShowMenu(o => !o)}>
              <div class="account-avatar">{(store.user!.email?.charAt(0) || "?").toUpperCase()}</div>
              <span class="account-name">{userName()}</span>
              <Show when={isVerifiedDisplayName(userName())}>
                <img class="verified-badge" src="/badge.svg?v=2"/>
              </Show>
            </div>
            <div class="account-dropdown" data-open={showMenu()}>
              <div class="account-dropdown-spacer" />
              <div class="account-dropdown-items">
                <div class="account-dropdown-item" onClick={() => handleItemClick("account")}>
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>
                  User stats
                </div>
                <div class="account-dropdown-item" onClick={() => handleItemClick("friends")}>
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                  Friends
                  <Show when={friendsStore.incoming.length > 0}>
                    <span class="friends-nav-badge">{friendsStore.incoming.length}</span>
                  </Show>
                </div>
                <div class="account-dropdown-item" onClick={() => { setShowMenu(false); props.onViewOwnProfile?.(); }}>
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                  Public profile
                </div>
                <div class="account-dropdown-item" onClick={() => handleItemClick("accountSettings")}>
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.12-.1.17-.26.12-.4l-1.92-3.32c-.09-.16-.28-.22-.44-.17l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.02-.12-.12-.21-.24-.21h-3.84c-.12 0-.22.09-.24.21l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.16-.05-.34 0-.44.17l-1.92 3.32c-.08.14-.04.3.12.4l2.03 1.58c-.05.3-.07.63-.07.94s.02.64.07.94l-2.03 1.58c-.16.1-.2.26-.12.4l1.92 3.32c.09.16.28.22.44.17l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.02.12.12.21.24.21h3.84c.12 0 .22-.09.24-.21l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.16.05.34 0 .44-.17l1.92-3.32c.08-.14.04-.3-.12-.4l-2.03-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
                  Account settings
                </div>
                <div class="account-dropdown-item account-dropdown-signout" onClick={handleSignOut}>
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
                  Sign out
                </div>
              </div>
            </div>
          </Show>
        </div>
        <button class="icon-btn" title="AI Help" onClick={() => props.onNavigate("ai")}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.5 4.50012C5.84315 4.50012 4.5 5.84327 4.5 7.50012C4.5 8.06878 4.65822 8.60049 4.93304 9.05362C3.54727 9.31868 2.5 10.5371 2.5 12.0001C2.5 13.4631 3.54727 14.6816 4.93304 14.9466M7.5 4.50012C7.5 3.11941 8.61929 2.00012 10 2.00012C11.3807 2.00012 12.5 3.11941 12.5 4.50012V6.00012M7.5 4.50012C7.5 5.31803 7.89278 6.0442 8.5 6.50031M4.93304 14.9466C4.65822 15.3998 4.5 15.9315 4.5 16.5001C4.5 18.157 5.84315 19.5001 7.5 19.5001C7.5 20.8808 8.61929 22.0001 10 22.0001C11.3807 22.0001 12.5 20.8808 12.5 19.5001V18.0001M4.93304 14.9466C5.28948 14.3589 5.84207 13.9034 6.5 13.6708" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M17.5 9H15.5C14.5572 9 14.0858 9 13.7929 9.29289C13.5 9.58579 13.5 10.0572 13.5 11V13C13.5 13.9428 13.5 14.4142 13.7929 14.7071C14.0858 15 14.5572 15 15.5 15H17.5C18.4428 15 18.9142 15 19.2071 14.7071C19.5 14.4142 19.5 13.9428 19.5 13V11C19.5 10.0572 19.5 9.58579 19.2071 9.29289C18.9142 9 18.4428 9 17.5 9Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M15 15V17M18 15V17M15 7V9M18 7V9M13.5 10.5H11.5M13.5 13.5H11.5M21.5 10.5H19.5M21.5 13.5H19.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </header>
  );
}
