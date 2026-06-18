import { createStore } from "solid-js/store";
import { getQuotes } from "./quotes";

interface SelectedQuote {
  text: string;
  source: string;
  id: number;
}

const [quoteStore, setQuoteStore] = createStore<{ selected: SelectedQuote | null; favorites: number[] }>({
  selected: null,
  favorites: [],
});

export { quoteStore, setQuoteStore };

export function selectQuote(text: string, source: string, id: number): void {
  setQuoteStore("selected", { text, source, id });
  window.dispatchEvent(new CustomEvent("quoteSelected", { detail: { text, source, id } }));
}

export function clearQuoteSelection(): void {
  setQuoteStore("selected", null);
}

export function toggleFavorite(id: number): void {
  if (quoteStore.favorites.includes(id)) {
    setQuoteStore("favorites", quoteStore.favorites.filter(f => f !== id));
  } else {
    setQuoteStore("favorites", [...quoteStore.favorites, id]);
  }
}

export function autoSelectQuote(quoteLength: number[]): void {
  const allowedGroups = new Set(quoteLength);
  const candidates = getQuotes().filter(q => allowedGroups.has(q.length));
  if (candidates.length === 0) return;
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  selectQuote(pick.text, pick.source, pick.id);
}
