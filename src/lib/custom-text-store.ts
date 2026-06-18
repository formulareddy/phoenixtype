import { createStore } from "solid-js/store";

export type CustomTextMode = "repeat" | "shuffle" | "random";
export type CustomTextLimitMode = "word" | "time" | "section";

export interface CustomTextSettings {
  text: string[];
  mode: CustomTextMode;
  limit: { value: number; mode: CustomTextLimitMode };
  pipeDelimiter: boolean;
}

const STORAGE_KEY = "monkeytype-replica-custom-text";

function load(): CustomTextSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* */ }
  return {
    text: ["The", "quick", "brown", "fox", "jumps", "over", "the", "lazy", "dog"],
    mode: "repeat",
    limit: { value: 9, mode: "word" },
    pipeDelimiter: false,
  };
}

function save(settings: CustomTextSettings): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch { /* */ }
}

const initial = load();
const [store, setStore] = createStore<CustomTextSettings>({ ...initial });

export { store as customTextStore };

export function getText(): string[] {
  return store.text;
}

export function setText(text: string[]): void {
  const next = { ...store, text, limit: { ...store.limit, value: text.length, mode: store.limit.mode } };
  setStore(next);
  save(next);
}

export function setMode(mode: CustomTextMode): void {
  const next = { ...store, mode, limit: { ...store.limit, value: store.text.length } };
  setStore(next);
  save(next);
}

export function setLimitValue(value: number): void {
  const next = { ...store, limit: { ...store.limit, value } };
  setStore(next);
  save(next);
}

export function setLimitMode(mode: CustomTextLimitMode): void {
  const next = { ...store, limit: { ...store.limit, mode } };
  setStore(next);
  save(next);
}

export function setPipeDelimiter(v: boolean): void {
  const next = { ...store, pipeDelimiter: v };
  setStore(next);
  save(next);
}

export function restoreFromSnapshot(snapshot: CustomTextSettings): void {
  const next = { ...snapshot };
  setStore(next);
  save(next);
}
