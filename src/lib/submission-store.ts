import { createStore } from "solid-js/store";

interface Submission {
  text: string;
  source: string;
  length: number;
  id: number;
  timestamp: number;
}

export interface QuoteReport {
  quoteId: number;
  quoteText: string;
  reason: string;
  comment: string;
  timestamp: number;
}

const STORAGE_KEY_PENDING = "qs_pending_submissions";
const STORAGE_KEY_APPROVED = "qs_approved_quotes";
const STORAGE_KEY_REPORTS = "qs_reports";

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch { /* ignore quota errors */ }
}

const initialPending = loadFromStorage<Submission[]>(STORAGE_KEY_PENDING, []);
const initialApproved = loadFromStorage<Submission[]>(STORAGE_KEY_APPROVED, []);
const initialReports = loadFromStorage<QuoteReport[]>(STORAGE_KEY_REPORTS, []);

let nextId = Math.max(1, ...initialPending.map(s => s.id), ...initialApproved.map(s => s.id)) + 1;

function getNextId(): number {
  return nextId++;
}

const [submissionStore, setSubmissionStore] = createStore<{
  pending: Submission[];
  approved: Submission[];
  reports: QuoteReport[];
}>({
  pending: initialPending,
  approved: initialApproved,
  reports: initialReports,
});

export { submissionStore as submissionStore };

export function submitQuote(text: string, source: string, length: number): void {
  const sub: Submission = { text, source, length, id: getNextId(), timestamp: Date.now() };
  setSubmissionStore("pending", [...submissionStore.pending, sub]);
  saveToStorage(STORAGE_KEY_PENDING, submissionStore.pending);
}

export function approveSubmission(id: number): Submission | undefined {
  const idx = submissionStore.pending.findIndex(s => s.id === id);
  if (idx === -1) return;
  const sub = submissionStore.pending[idx];
  setSubmissionStore("pending", submissionStore.pending.filter(s => s.id !== id));
  setSubmissionStore("approved", [...submissionStore.approved, sub]);
  saveToStorage(STORAGE_KEY_PENDING, submissionStore.pending);
  saveToStorage(STORAGE_KEY_APPROVED, submissionStore.approved);
  return sub;
}

export function rejectSubmission(id: number): void {
  setSubmissionStore("pending", submissionStore.pending.filter(s => s.id !== id));
  saveToStorage(STORAGE_KEY_PENDING, submissionStore.pending);
}

export function getApprovedQuotes(): Submission[] {
  return submissionStore.approved;
}

const REPORT_REASONS = ["Grammatical error", "Duplicate quote", "Inappropriate content", "Low quality content", "Incorrect source"] as const;
export { REPORT_REASONS };

export function reportQuote(quoteId: number, quoteText: string, reason: string, comment: string): void {
  const report: QuoteReport = { quoteId, quoteText, reason, comment, timestamp: Date.now() };
  setSubmissionStore("reports", [...submissionStore.reports, report]);
  saveToStorage(STORAGE_KEY_REPORTS, submissionStore.reports);
}
