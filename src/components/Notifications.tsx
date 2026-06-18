import { createSignal, For, Show, onCleanup, createEffect } from "solid-js";
import { getNotifications, removeNotification, clearAllNotifications } from "../lib/notifications";

export const [panelOpen, setPanelOpen] = createSignal(false);

export function togglePanel() { setPanelOpen((o) => !o); }
export function closePanel() { setPanelOpen(false); }

export default function Notifications() {
  const toasts = () => getNotifications().slice(0, 5);

  let panelRef: HTMLDivElement | undefined;

  function handleClick(e: MouseEvent) {
    if (panelRef && !panelRef.contains(e.target as Node) && !(e.target as HTMLElement).closest(".notif-bell")) {
      setPanelOpen(false);
    }
  }

  onCleanup(() => document.removeEventListener("click", handleClick));
  createEffect(() => { if (panelOpen()) document.addEventListener("click", handleClick); else document.removeEventListener("click", handleClick); });

  const levelClass = (lvl: string) =>
    lvl === "error" ? "notif-toast--error" :
    lvl === "success" ? "notif-toast--success" : "notif-toast--notice";

  return (
    <>
      <div class="notif-toasts">
        <For each={toasts()}>
          {(n) => (
            <div class={`notif-toast ${levelClass(n.level)}`} onClick={() => removeNotification(n.id)}>
              <span class="notif-toast-msg">{n.message}</span>
            </div>
          )}
        </For>
      </div>

      <Show when={panelOpen()}>
        <div class="notif-panel" ref={panelRef}>
          <div class="notif-panel-header">
            <span>Notifications</span>
            <Show when={getNotifications().length > 0}>
              <button class="notif-panel-clear" onClick={() => clearAllNotifications()}>clear all</button>
            </Show>
          </div>
          <div class="notif-panel-body">
            <For each={getNotifications()} fallback={<div class="notif-panel-empty">Nothing to show</div>}>
              {(n) => (
                <div class={`notif-panel-item notif-panel-item--${n.level}`}>
                  <div class="notif-panel-item-msg">{n.message}</div>
                  <button class="notif-panel-item-dismiss" onClick={() => removeNotification(n.id)}>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                  </button>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>
    </>
  );
}
