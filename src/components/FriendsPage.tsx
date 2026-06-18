import { createSignal, createEffect, For, Show, onCleanup } from "solid-js";
import { useAuth } from "../lib/AuthProvider";
import { friendsStore, listenFriends, stopListening, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, cancelFriendRequest, removeFriend } from "../lib/friends";
import { showSuccessNotification, showErrorNotification, showNoticeNotification } from "../lib/notifications";

interface Props {
  onNavigate: (page: string) => void;
  onViewProfile: (uid: string, name?: string) => void;
}

export default function FriendsPage(props: Props) {
  const { store } = useAuth();
  const [adding, setAdding] = createSignal(false);
  const [friendName, setFriendName] = createSignal("");

  createEffect(() => {
    listenFriends(store.user?.uid || null);
  });

  onCleanup(() => {
    stopListening();
  });

  function formatDate(ts: number): string {
    const diff = Date.now() - ts;
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "today";
    if (days === 1) return "1 day";
    if (days < 30) return `${days} days`;
    const months = Math.floor(days / 30);
    if (months === 1) return "1 month";
    return `${months} months`;
  }

  function avatarLetter(name: string): string {
    return (name?.charAt(0) || "?").toUpperCase();
  }

  async function handleAdd() {
    const name = friendName().trim();
    if (!name || !store.user) return;
    const displayName = store.user.displayName || store.user.email?.split("@")[0] || "User";
    try {
      await sendFriendRequest(store.user.uid, displayName, name);
      showSuccessNotification(`Friend request sent to "${name}"`);
      setFriendName("");
      setAdding(false);
    } catch (err: any) {
      showErrorNotification(err.message || "Failed to send friend request");
    }
  }

  async function handleAccept(item: Parameters<typeof acceptFriendRequest>[0]) {
    try {
      await acceptFriendRequest(item);
      showSuccessNotification(`You are now friends with ${item.fromName}`);
    } catch (err: any) {
      showErrorNotification(err.message || "Failed to accept request");
    }
  }

  async function handleReject(item: Parameters<typeof rejectFriendRequest>[0]) {
    try {
      await rejectFriendRequest(item);
      showNoticeNotification(`Friend request from ${item.fromName} rejected`);
    } catch (err: any) {
      showErrorNotification(err.message || "Failed to reject request");
    }
  }

  async function handleCancel(item: Parameters<typeof cancelFriendRequest>[0]) {
    try {
      await cancelFriendRequest(item);
      showSuccessNotification(`Friend request to ${item.toName} cancelled`);
    } catch (err: any) {
      showErrorNotification(err.message || "Failed to cancel request");
    }
  }

  async function handleRemove(friend: Parameters<typeof removeFriend>[1]) {
    if (!store.user) return;
    try {
      await removeFriend(store.user.uid, friend);
      showSuccessNotification(`${friend.name} removed from friends`);
    } catch (err: any) {
      showErrorNotification(err.message || "Failed to remove friend");
    }
  }

  return (
    <div class="page-full">
      <div class="page-full-back" onClick={() => props.onNavigate("test")}>
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
        back
      </div>

      <div class="friends-page">
        <div class="friends-title">friends</div>

        <div class="friends-toolbar">
          <button class="friends-add-btn" onClick={() => setAdding(true)}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            Add a friend
          </button>
        </div>

        <Show when={adding()}>
          <div class="friends-add-modal">
            <div class="friends-add-input-wrap">
              <input
                type="text"
                class="friends-add-input"
                placeholder="Enter username..."
                value={friendName()}
                onInput={(e) => setFriendName(e.currentTarget.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") { setAdding(false); setFriendName(""); } }}
                autofocus
              />
              <button class="friends-add-submit" onClick={handleAdd}>Send</button>
              <button class="friends-add-cancel" onClick={() => { setAdding(false); setFriendName(""); }}>Cancel</button>
            </div>
          </div>
        </Show>

        <Show when={friendsStore.incoming.length > 0}>
          <div class="friends-section">
            <div class="friends-section-title">incoming requests</div>
            <For each={friendsStore.incoming}>
              {(req) => (
                <div class="friend-row friend-request-row">
                  <div class="friend-avatar">{avatarLetter(req.fromName)}</div>
                  <div class="friend-name">{req.fromName}</div>
                  <div class="friend-actions">
                    <button class="friend-action-btn accept-btn" title="Accept" onClick={() => handleAccept(req)}>
                      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    </button>
                    <button class="friend-action-btn reject-btn" title="Reject" onClick={() => handleReject(req)}>
                      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                    </button>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>

        <Show when={friendsStore.outgoing.length > 0}>
          <div class="friends-section">
            <div class="friends-section-title">outgoing requests</div>
            <For each={friendsStore.outgoing}>
              {(req) => (
                <div class="friend-row friend-request-row">
                  <div class="friend-avatar">{avatarLetter(req.toName)}</div>
                  <div class="friend-name">{req.toName}</div>
                  <div class="friend-actions">
                    <button class="friend-action-btn cancel-btn" title="Cancel" onClick={() => handleCancel(req)}>
                      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                    </button>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>

        <Show when={friendsStore.friends.length > 0} fallback={
          <div class="friends-empty">
            <div class="friends-empty-icon">
              <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
            </div>
            <div class="friends-empty-text">You don't have any friends :(</div>
            <div class="friends-empty-sub">Search for a user to add them as a friend!</div>
          </div>
        }>
          <div class="friends-section">
            <div class="friends-section-title">all friends ({friendsStore.friends.length})</div>
            <For each={friendsStore.friends}>
              {(f) => (
                <div class="friend-row">
                  <div class="friend-avatar">{avatarLetter(f.name)}</div>
                  <div class="friend-info" onClick={() => props.onViewProfile(f.uid, f.name)} style="cursor:pointer;">
                    <div class="friend-name">{f.name}</div>
                    <div class="friend-meta">
                      <span>friends for {formatDate(f.addedAt)}</span>
                    </div>
                  </div>
                  <div class="friend-actions">
                    <button class="friend-action-btn" title="View profile" onClick={() => props.onViewProfile(f.uid, f.name)}>
                      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
                    </button>
                    <button class="friend-action-btn remove-btn" title="Remove friend" onClick={() => handleRemove(f)}>
                      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2.46-9.12l1.41-1.41L12 10.59l2.12-2.12 1.41 1.41L13.41 12l2.12 2.12-1.41 1.41L12 13.41l-2.12 2.12-1.41-1.41L10.59 12l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    </button>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>
    </div>
  );
}
