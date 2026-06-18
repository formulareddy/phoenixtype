import { For, Show, createSignal, createMemo } from "solid-js";
import CustomTextModal from "./CustomTextModal";
import { configStore, setConfig } from "../lib/config-store";
import { showNoticeNotification } from "../lib/notifications";
import { setQuoteSearchOpen } from "../lib/modal-store";
import { areUnsortedArraysEqual } from "../lib/arrays";
import { clearQuoteSelection } from "../lib/quote-store";
import type { TestMode } from "../types";

const TIMES = [15, 30, 60, 120] as const;
const WORDS = [10, 25, 50, 100] as const;

function parseDuration(input: string): number {
  const re = /((-\s*)?\d+(\.\d+)?\s*[hms]?)/g;
  const seconds = [...input.toLowerCase().matchAll(re)]
    .map((match) => {
      const part = match[0];
      const duration = parseFloat(part.replace(/\s+/g, ""));
      if (part.includes("h")) return 3600 * duration;
      if (part.includes("m")) return 60 * duration;
      return duration;
    })
    .reduce((total, dur) => total + dur, 0);
  return Math.floor(seconds);
}

function formatDuration(duration: number): string {
  if (duration < 0) return "Negative time? Really?";
  if (duration === 0) return "Infinite test";
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = duration % 60;
  const parts = [];
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);
  if (seconds > 0) parts.push(`${seconds} second${seconds !== 1 ? "s" : ""}`);
  if (parts.length === 0) return "0 seconds";
  if (parts.length === 3) return `${parts[0]}, ${parts[1]} and ${parts[2]}`;
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return parts[0];
}

const modeIcons: Record<TestMode, string> = {
  time: "fa-clock",
  words: "fa-font",
  quote: "fa-quote-left",
  zen: "fa-mountain",
  custom: "fa-wrench",
};

export default function TestConfig() {
  const c = configStore;
  const [showDurationModal, setShowDurationModal] = createSignal(false);
  const [durationInput, setDurationInput] = createSignal("");
  const [showWordsModal, setShowWordsModal] = createSignal(false);
  const [showCustomModal, setShowCustomModal] = createSignal(false);
  const [wordsInput, setWordsInput] = createSignal("");

  const puncNumDisabled = () => c.mode === "zen" || c.mode === "quote";
  const isCustomTime = () => !(TIMES as readonly number[]).includes(c.time);
  const isCustomWords = () => !(WORDS as readonly number[]).includes(c.wordCount);

  const parsedDuration = createMemo(() => parseDuration(durationInput()));
  const durationPreview = createMemo(() => formatDuration(parsedDuration()));

  function applyDuration() {
    const val = parsedDuration();
    if (isNaN(val) || val < 0 || !isFinite(val)) {
      showNoticeNotification("Custom time must be a positive number or zero");
      return;
    }
    setConfig("time", val);
    setShowDurationModal(false);
    if (val >= 1800) {
      showNoticeNotification("Stay safe and take breaks!");
    } else if (val === 0) {
      showNoticeNotification("Infinite time! Make sure to use Bail Out from the command line to save your result.");
    }
  }

  return (
    <div class="test-config">
      {/* Punc & Num (left section) - hidden in zen, visible but disabled in quote */}
      <Show when={c.mode !== "zen"}>
      <div class="tc-section tc-section-punc">
        <div class="tc-card">
          <TCButton
            icon="fa-at"
            text="punctuation"
            active={c.punctuation}
            disabled={puncNumDisabled()}
            onClick={() => { setConfig("punctuation", !c.punctuation); }}
          />
          <TCButton
            icon="fa-hashtag"
            text="numbers"
            active={c.numbers}
            disabled={puncNumDisabled()}
            onClick={() => { setConfig("numbers", !c.numbers); }}
          />
        </div>
      </div>
      </Show>

      {/* Mode (center section) */}
      <div class="tc-section">
        <div class="tc-card">
          <For each={["time", "words", "quote", "zen", "custom"] as const}>
            {(m) => (
              <TCButton
                icon={modeIcons[m]}
                text={m}
                active={c.mode === m}
                onClick={() => setConfig("mode", m)}
              />
            )}
          </For>
        </div>
      </div>

      {/* Mode2 (right section) */}
      <Show when={c.mode === "time"}>
        <div class="tc-section">
          <div class="tc-card">
            <For each={TIMES}>
              {(t) => (
                <TCButton
                  text={`${t}`}
                  active={c.time === t}
                  onClick={() => setConfig("time", t)}
                />
              )}
            </For>
            <TCButton
              icon="fa-tools"
              active={isCustomTime()}
              onClick={() => { setDurationInput(String(c.time)); setShowDurationModal(true); }}
            />
          </div>
        </div>
      </Show>

      <Show when={c.mode === "words"}>
        <div class="tc-section">
          <div class="tc-card">
            <For each={WORDS}>
              {(n) => (
                <TCButton
                  text={`${n}`}
                  active={c.wordCount === n}
                  onClick={() => setConfig("wordCount", n)}
                />
              )}
            </For>
            <TCButton
              icon="fa-tools"
              active={isCustomWords()}
              onClick={() => { setWordsInput(String(c.wordCount)); setShowWordsModal(true); }}
            />
          </div>
        </div>
      </Show>

      <Show when={c.mode === "quote"}>
        <div class="tc-section">
          <div class="tc-card">
            <TCButton
              text="all"
              active={areUnsortedArraysEqual(c.quoteLength, [0, 1, 2, 3])}
              onClick={() => { clearQuoteSelection(); setConfig("quoteLength", [0, 1, 2, 3]); }}
            />
            <TCButton
              text="short"
              active={areUnsortedArraysEqual(c.quoteLength, [0])}
              onClick={() => { clearQuoteSelection(); setConfig("quoteLength", [0]); }}
            />
            <TCButton
              text="medium"
              active={areUnsortedArraysEqual(c.quoteLength, [1])}
              onClick={() => { clearQuoteSelection(); setConfig("quoteLength", [1]); }}
            />
            <TCButton
              text="long"
              active={areUnsortedArraysEqual(c.quoteLength, [2])}
              onClick={() => { clearQuoteSelection(); setConfig("quoteLength", [2]); }}
            />
            <TCButton
              text="thicc"
              active={areUnsortedArraysEqual(c.quoteLength, [3])}
              onClick={() => { clearQuoteSelection(); setConfig("quoteLength", [3]); }}
            />
            <TCButton
              icon="fa-search"
              onClick={() => setQuoteSearchOpen(true)}
            />
          </div>
        </div>
      </Show>

      <Show when={c.mode === "custom"}>
        <div class="tc-section">
          <div class="tc-card">
            <TCButton text="change" onClick={() => setShowCustomModal(true)} />
          </div>
        </div>
      </Show>

      <Show when={showDurationModal()}>
        <div class="tc-overlay" onClick={() => setShowDurationModal(false)}>
          <div class="tc-modal" onClick={(e) => e.stopPropagation()}>
            <div class="tc-modal-title">Test Duration</div>
            <form class="tc-modal-form" onSubmit={(e) => { e.preventDefault(); applyDuration(); }}>
              <div class="tc-modal-preview">{durationPreview()}</div>
              <input class="tc-input" type="text" name="customDuration" id="customDuration" placeholder="duration"
                value={durationInput()}
                onInput={(e) => setDurationInput(e.currentTarget.value)}
              />
              <div class="tc-modal-tip">
                You can use &ldquo;h&rdquo; for hours and &ldquo;m&rdquo; for minutes,
                for example &ldquo;1h30m&rdquo;.
                <br /><br />
                You can start an infinite test by inputting 0. Then, to stop the test,
                use the Bail Out feature:
                <br />(<kbd>esc</kbd> or <kbd>ctrl/cmd</kbd> + <kbd>shift</kbd> +
                <kbd>p</kbd> &gt; Bail Out)
              </div>
              <button class="tc-modal-btn" type="submit">apply</button>
            </form>
          </div>
        </div>
      </Show>

      <Show when={showWordsModal()}>
        <div class="tc-overlay" onClick={() => setShowWordsModal(false)}>
          <div class="tc-modal" onClick={(e) => e.stopPropagation()}>
            <div class="tc-modal-title">Custom Word Amount</div>
            <form class="tc-modal-form" onSubmit={(e) => { e.preventDefault(); const v = parseInt(wordsInput()); if (v > 0 && isFinite(v)) { setConfig("wordCount", v); setShowWordsModal(false); } }}>
              <input class="tc-input" type="number" name="customWords" id="customWords" min="1" placeholder="word count"
                value={wordsInput()}
                onInput={(e) => setWordsInput(e.currentTarget.value)}
              />
              <button class="tc-modal-btn" type="submit">apply</button>
            </form>
          </div>
        </div>
      </Show>

      <Show when={showCustomModal()}>
        <CustomTextModal
          onClose={() => setShowCustomModal(false)}
          onApply={() => {}}
        />
      </Show>

    </div>
  );
}

function TCButton(props: {
  icon?: string;
  text?: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      class="tc-btn"
      classList={{ active: props.active, disabled: props.disabled }}
      disabled={props.disabled}
      onClick={props.disabled ? undefined : props.onClick}
    >
      {props.icon && <i class={`fas ${props.icon}`} />}
      {props.text}
    </button>
  );
}
