import { createStore } from "solid-js/store";

export type NotificationLevel = "error" | "notice" | "success";

export type Notification = {
  id: number;
  message: string;
  level: NotificationLevel;
  timestamp: number;
};

let nextId = 0;
const [notifications, setNotifications] = createStore<Notification[]>([]);
const timers = new Map<number, ReturnType<typeof setTimeout>>();

export function getNotifications(): Notification[] {
  return notifications;
}

export function removeNotification(id: number): void {
  const t = timers.get(id);
  if (t) { clearTimeout(t); timers.delete(id); }
  setNotifications((prev) => prev.filter((n) => n.id !== id));
}

export function clearAllNotifications(): void {
  for (const [, t] of timers) clearTimeout(t);
  timers.clear();
  setNotifications([]);
}

function addNotification(message: string, level: NotificationLevel, durationMs = 3000): number {
  const id = nextId++;
  setNotifications((prev) => [{ id, message, level, timestamp: Date.now() }, ...prev]);
  if (durationMs > 0) {
    timers.set(id, setTimeout(() => removeNotification(id), durationMs + 250));
  }
  return id;
}

export function showSuccessNotification(message: string, durationMs?: number): number {
  return addNotification(message, "success", durationMs);
}

export function showErrorNotification(message: string, durationMs?: number): number {
  return addNotification(message, "error", durationMs ?? 0);
}

export function showNoticeNotification(message: string, durationMs?: number): number {
  return addNotification(message, "notice", durationMs);
}
