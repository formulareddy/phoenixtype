import { createSignal, createEffect, createMemo, For, Show } from "solid-js";
import { searchQuotes } from "../lib/quotes";
import { quoteStore, selectQuote, toggleFavorite } from "../lib/quote-store";
import { submissionStore, submitQuote, approveSubmission, rejectSubmission, reportQuote, REPORT_REASONS } from "../lib/submission-store";
import type { Quote } from "../lib/quotes";

const LENGTH_GROUPS = [
  { label: "all", value: -1 },
  { label: "short", value: 0 },
  { label: "medium", value: 1 },
  { label: "long", value: 2 },
  { label: "thicc", value: 3 },
] as const;

const GROUPS_WITHOUT_ALL = LENGTH_GROUPS.filter(g => g.value !== -1);

const PAGE_SIZE = 100;

type View = "search" | "submit" | "approve" | "report";

interface Props {
  onClose: () => void;
}

export default function QuoteSearchModal(props: Props) {
  const [view, setView] = createSignal<View>("search");

  /* ── search view state ── */
  const [searchText, setSearchText] = createSignal("");
  const [lengthFilter, setLengthFilter] = createSignal<number[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = createSignal(false);
  const [currentPage, setCurrentPage] = createSignal(1);
  const [filtered, setFiltered] = createSignal<Quote[]>([]);

  createEffect(() => {
    const text = searchText();
    const groups = lengthFilter().length > 0 ? lengthFilter() : [0, 1, 2, 3];
    const favs = showFavoritesOnly() ? quoteStore.favorites : [];
    const result = searchQuotes(text, groups, favs);
    setFiltered(result.quotes);
    setCurrentPage(1);
  });

  function onSearchInput(el: HTMLInputElement) {
    el.addEventListener("input", () => setSearchText(el.value));
  }

  const totalPages = () => Math.max(1, Math.ceil(filtered().length / PAGE_SIZE));
  const page = () => Math.min(currentPage(), totalPages());
  const pageQuotes = () => filtered().slice((page() - 1) * PAGE_SIZE, page() * PAGE_SIZE);

  function toggleLengthGroup(value: number) {
    if (value === -1) { setLengthFilter([]); return; }
    setLengthFilter(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  }

  function applyQuote(quote: Quote) {
    selectQuote(quote.text, quote.source, quote.id);
    props.onClose();
  }

  function handleOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains("qs-overlay")) {
      props.onClose();
    }
  }

  /* ── submit view state ── */
  const [submitText, setSubmitText] = createSignal("");
  const [submitSource, setSubmitSource] = createSignal("");
  const [submitLength, setSubmitLength] = createSignal(1);
  const [submitError, setSubmitError] = createSignal("");

  function handleSubmit(e: Event) {
    e.preventDefault();
    setSubmitError("");
    const text = submitText().trim();
    const source = submitSource().trim();
    if (!text) { setSubmitError("Quote text is required"); return; }
    if (text.length < 60) { setSubmitError("Quote must be at least 60 characters"); return; }
    if (!source) { setSubmitError("Source is required"); return; }
    submitQuote(text, source, submitLength());
    setSubmitText("");
    setSubmitSource("");
    setSubmitLength(1);
    setView("search");
  }

  const submitRemaining = () => 250 - submitText().length;

  /* ── approve view ── */
  const pendingList = createMemo(() => submissionStore.pending);
  const approvedList = createMemo(() => submissionStore.approved);

  /* ── report view state ── */
  const [reportQuoteId, setReportQuoteId] = createSignal(0);
  const [reportQuoteText, setReportQuoteText] = createSignal("");
  const [reportReason, setReportReason] = createSignal<string>(REPORT_REASONS[0]);
  const [reportComment, setReportComment] = createSignal("");

  function openReport(quote: Quote) {
    setReportQuoteId(quote.id);
    setReportQuoteText(quote.text);
    setReportReason(REPORT_REASONS[0]);
    setReportComment("");
    setView("report");
  }

  function handleReportSubmit(e: Event) {
    e.preventDefault();
    reportQuote(reportQuoteId(), reportQuoteText(), reportReason(), reportComment().trim());
    setView("search");
  }

  return (
    <div class="qs-overlay" onClick={handleOverlayClick}>
      <div class="qs-modal" onClick={(e) => e.stopPropagation()}>
        <div class="qs-header">
          <div class="qs-title">
            <Show when={view() === "search"} fallback={
              <button class="qs-back-btn" onClick={() => setView("search")}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                <span>{view() === "submit" ? "Submit a quote" : view() === "approve" ? "Approve quotes" : "Report quote"}</span>
              </button>
            }>Quote search</Show></div>
          <div class="qs-header-buttons">
            <button class="qs-header-btn" onClick={() => setView("submit")}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
              Submit a quote
            </button>
            <button class="qs-header-btn" onClick={() => setView("approve")}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              Approve quotes
            </button>
          </div>
        </div>

        <Show when={view() === "search"}>
          <div class="qs-controls">
            <div class="qs-search-wrapper">
              <svg class="qs-search-icon" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <input
                ref={onSearchInput}
                class="qs-search-input"
                type="text"
                name="quoteSearch"
                id="quoteSearch"
                placeholder="filter by text, source or id"
              />
            </div>
            <div class="qs-filters">
              <For each={LENGTH_GROUPS}>
                {(g) => (
                  <button
                    class="qs-filter-btn"
                    classList={{ active: g.value === -1 ? lengthFilter().length === 0 : lengthFilter().includes(g.value) }}
                    onClick={() => toggleLengthGroup(g.value)}
                  >{g.label}</button>
                )}
              </For>
              <button
                class="qs-filter-btn qs-filter-btn--icon"
                classList={{ active: showFavoritesOnly() }}
                onClick={() => setShowFavoritesOnly(o => !o)}
                title="Show favorites only"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="qs-results">
            <Show when={pageQuotes().length > 0} fallback={<div class="qs-empty">No quotes found</div>}>
              <For each={pageQuotes()}>
                {(q) => (
                  <div class="qs-result" onClick={() => applyQuote(q)}>
                    <div class="qs-result-text">&ldquo;{q.text}&rdquo;</div>
                    <div class="qs-result-meta">
                      <span class="qs-result-source">&mdash; {q.source}</span>
                      <span class="qs-result-badge">{LENGTH_GROUPS.find(g => g.value === q.length)?.label ?? q.length}</span>
                      <span class="qs-result-id">#{q.id}</span>
                      <button
                        class="qs-fav-btn"
                        classList={{ active: quoteStore.favorites.includes(q.id) }}
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(q.id); }}
                        title={quoteStore.favorites.includes(q.id) ? "Remove from favorites" : "Add to favorites"}
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                      </button>
                      <button
                        class="qs-report-btn"
                        onClick={(e) => { e.stopPropagation(); openReport(q); }}
                        title="Report this quote"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </For>
            </Show>
          </div>

          <div class="qs-footer">
            <button class="qs-page-btn" disabled={page() <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
            </button>
            <div class="qs-page-info">
              Page {page()} of {totalPages()} ({filtered().length} quote{filtered().length !== 1 ? "s" : ""})
            </div>
            <button class="qs-page-btn" disabled={page() >= totalPages()} onClick={() => setCurrentPage(p => Math.min(totalPages(), p + 1))}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
            </button>
          </div>
        </Show>

        <Show when={view() === "submit"}>
          <form class="qs-form" onSubmit={handleSubmit}>
            <ul class="qs-form-rules">
              <li>Do not include content that contains any libelous or otherwise unlawful, abusive or obscene text.</li>
              <li>Verify quotes added aren't duplicates of any already present.</li>
              <li>Please do not add extremely short quotes (less than 60 characters).</li>
              <li><b>Submitting low quality quotes or misusing this form will cause you to lose access to this feature.</b></li>
            </ul>
            <label class="qs-field">
              <span class="qs-field-label">quote</span>
              <div class="qs-field-input-wrap">
                <textarea
                  class="qs-textarea"
                  value={submitText()}
                  onInput={(e) => setSubmitText(e.currentTarget.value)}
                  maxLength={250}
                  autocomplete="off"
                  dir="auto"
                />
                <span class="qs-char-count" classList={{ error: submitRemaining() < 0 }}>{submitRemaining()}</span>
              </div>
            </label>
            <label class="qs-field">
              <span class="qs-field-label">source</span>
              <input
                class="qs-input"
                type="text"
                value={submitSource()}
                onInput={(e) => setSubmitSource(e.currentTarget.value)}
                autocomplete="off"
                name="quoteSource"
              />
            </label>
            <label class="qs-field">
              <span class="qs-field-label">length</span>
              <select class="qs-select" value={submitLength()} onChange={(e) => setSubmitLength(Number(e.currentTarget.value))}>
                <For each={GROUPS_WITHOUT_ALL}>
                  {(g) => <option value={g.value}>{g.label}</option>}
                </For>
              </select>
            </label>
            <Show when={submitError()}>
              <div class="qs-form-error">{submitError()}</div>
            </Show>
            <button type="submit" class="qs-submit-btn">Submit</button>
          </form>
        </Show>

        <Show when={view() === "approve"}>
          <div class="qs-approve-list">
            <Show when={pendingList().length === 0} fallback={
              <For each={pendingList()}>
                {(sub) => (
                  <div class="qs-approve-item">
                    <textarea class="qs-textarea" readonly value={sub.text} />
                    <div class="qs-approve-meta">
                      <span class="qs-result-source">&mdash; {sub.source}</span>
                      <span class="qs-result-badge">{LENGTH_GROUPS.find(g => g.value === sub.length)?.label ?? sub.length}</span>
                      <span class="qs-result-id">#{sub.id}</span>
                    </div>
                    <div class="qs-approve-actions">
                      <button class="qs-approve-btn qs-approve-btn--approve" onClick={() => approveSubmission(sub.id)}>
                        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                        Approve
                      </button>
                      <button class="qs-approve-btn qs-approve-btn--reject" onClick={() => rejectSubmission(sub.id)}>
                        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </For>
            }>
              <div class="qs-empty">No pending submissions</div>
            </Show>
            <Show when={approvedList().length > 0}>
              <div class="qs-approved-section">
                <div class="qs-approved-title">Previously approved ({approvedList().length})</div>
                <For each={approvedList()}>
                  {(sub) => (
                    <div class="qs-approve-item qs-approved-item">
                      <div class="qs-result-text">&ldquo;{sub.text}&rdquo;</div>
                      <div class="qs-approve-meta">
                        <span class="qs-result-source">&mdash; {sub.source}</span>
                        <span class="qs-result-badge">{LENGTH_GROUPS.find(g => g.value === sub.length)?.label ?? sub.length}</span>
                        <span class="qs-result-id">#{sub.id}</span>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </div>
        </Show>

        <Show when={view() === "report"}>
          <form class="qs-form" onSubmit={handleReportSubmit}>
            <p class="qs-form-rules">Please report quotes responsibly - misuse may result in you losing access to this feature. <span class="qs-form-error">Please add comments in English only.</span></p>
            <label class="qs-field">
              <span class="qs-field-label">quote</span>
              <div class="qs-report-quote-text">&ldquo;{reportQuoteText()}&rdquo;</div>
            </label>
            <label class="qs-field">
              <span class="qs-field-label">reason</span>
              <select class="qs-select" value={reportReason()} onChange={(e) => setReportReason(e.currentTarget.value)}>
                <For each={REPORT_REASONS}>
                  {(r) => <option value={r}>{r}</option>}
                </For>
              </select>
            </label>
            <label class="qs-field">
              <span class="qs-field-label">comment</span>
              <div class="qs-field-input-wrap">
                <textarea
                  class="qs-textarea"
                  value={reportComment()}
                  onInput={(e) => setReportComment(e.currentTarget.value)}
                  autocomplete="off"
                />
                <span class="qs-char-count" classList={{ error: 250 - reportComment().length < 0 }}>{250 - reportComment().length}</span>
              </div>
            </label>
            <button type="submit" class="qs-submit-btn">Submit report</button>
          </form>
        </Show>
      </div>
    </div>
  );
}
