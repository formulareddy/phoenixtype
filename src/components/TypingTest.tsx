import { createSignal, createMemo, createEffect, onCleanup, onMount, on, Show } from "solid-js";
import { generateWords } from "../lib/words";
import { configStore } from "../lib/config-store";
import { quoteStore, autoSelectQuote } from "../lib/quote-store";
import { getText, customTextStore } from "../lib/custom-text-store";
import { playClick, playError, playTimeWarning } from "../lib/sound-controller";
import type { TestStats, CharStatus, WordData, ReplayEvent } from "../types";

function getCustomTexts(): string[] {
  const source = getText();
  if (source.length === 0) return [""];
  const { mode, limit } = customTextStore;
  const pipeDelimiter = customTextStore.pipeDelimiter;

  if (limit.mode === "section") {
    const result: string[] = [];
    const maxSections = limit.value;
    const history: string[] = [];
    let sectionCount = 0;
    while (sectionCount < maxSections && result.length < 500) {
      let section: string;
      if (mode === "repeat") {
        section = source[sectionCount % source.length];
      } else if (mode === "shuffle") {
        section = source[Math.floor(Math.random() * source.length)];
      } else {
        do {
          section = source[Math.floor(Math.random() * source.length)];
        } while (
          sectionCount > 0 && sectionCount < maxSections &&
          (section === history[history.length - 1] ||
           section === history[history.length - 2])
        );
      }
      history.push(section);
      section = section.replace(/ +/g, " ");
      if (pipeDelimiter && section.includes(" ")) {
        const words = section.split(" ");
        for (const w of words) result.push(w);
      } else {
        result.push(section);
      }
      sectionCount++;
    }
    return result;
  }

  const n = limit.mode === "word" ? limit.value : 250;
  if (mode === "repeat") {
    const result: string[] = [];
    while (result.length < n) {
      result.push(source[result.length % source.length]);
    }
    return result;
  }
  if (mode === "shuffle") {
    const result: string[] = [];
    let pool = [...source];
    let idx = 0;
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    while (result.length < n) {
      if (idx >= pool.length) {
        idx = 0;
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
      }
      result.push(pool[idx]);
      idx++;
    }
    return result;
  }
  if (mode === "random") {
    const result: string[] = [];
    while (result.length < n) {
      result.push(source[Math.floor(Math.random() * source.length)]);
    }
    return result;
  }
  return [...source];
}

function buildWordData(texts: string[]): WordData[] {
  return texts.map((t, i) => ({ text: t, typed: "", status: i === 0 ? "active" : "upcoming" }));
}

import type { ChartDataPoint, WordResult } from "../types";

let _lastWordData: WordData[] = [];
let _lastWordResults: WordResult[] = [];

export function getLastWords(): string[] {
  return _lastWordData.map(w => w.text);
}

export function getPracticeWords(): string[] {
  const missed = _lastWordData.filter(w => w.status === "error").map(w => w.text);
  const slow = _lastWordResults.filter(w => w.category === "slow").map(w => w.text);
  const combined = [...new Set([...missed, ...slow])];
  return combined.length > 0 ? combined : _lastWordData.map(w => w.text);
}

function computeStats(words: WordData[], startTime: number | null, onlyCompleted: boolean = false): TestStats {
  let correctChars = 0, incorrectChars = 0, extraChars = 0, missedChars = 0;
  let totalTyped = 0;
  for (const w of words) {
    if (onlyCompleted && w.status !== "correct" && w.status !== "error") continue;
    const t = w.typed, txt = w.text;
    for (let i = 0; i < Math.max(t.length, txt.length); i++) {
      if (i >= txt.length) { extraChars++; totalTyped++; continue; }
      if (i >= t.length) { missedChars++; continue; }
      if (t[i] === txt[i]) { correctChars++; totalTyped++; }
      else { incorrectChars++; totalTyped++; }
    }
  }
  const elapsed = startTime ? (Date.now() - startTime) / 1000 : 1;
  const totalEntries = correctChars + incorrectChars;
  const wpm = elapsed > 0 ? ((correctChars / 5) / (elapsed / 60)) : 0;
  const raw = elapsed > 0 ? ((totalTyped / 5) / (elapsed / 60)) : 0;
  const accuracy = totalEntries > 0 ? (correctChars / totalEntries) * 100 : (correctChars > 0 ? 100 : 0);
  const totalKeystrokes = totalTyped;
  const keyConsistency = totalTyped > 0 ? 100 - ((incorrectChars + extraChars) / totalTyped * 100) : 100;
  const consistency = keyConsistency;
  return { wpm, raw, accuracy, correctChars, incorrectChars, extraChars, missedChars, totalKeystrokes, elapsed, consistency, keyConsistency, chartData: [], wordHistory: [], mode: "", language: "", punctuation: false, numbers: false, difficulty: "" };
}

interface Props {
  onComplete: (stats: TestStats) => void;
  restartKey?: number;
  repeatWords?: string[];
  isPractice?: boolean;
}

export default function TypingTest(props: Props) {
  const totalWords = () => configStore.mode === "words" ? configStore.wordCount + 5 : configStore.mode === "quote" ? (quoteStore.selected?.text.split(/\s+/).length ?? 50) : configStore.mode === "custom" && customTextStore.limit.mode === "word" ? customTextStore.limit.value : 250;
  let initWords = buildWordData(generateWords(totalWords(), configStore.punctuation, configStore.numbers));

  const [words, setWords] = createSignal<WordData[]>(initWords);
  const [startTime, setStartTime] = createSignal<number | null>(null);
  const [isFinished, setIsFinished] = createSignal(false);
  const [timer, setTimer] = createSignal(configStore.mode === "time" ? configStore.time : 0);
  const [lastKeyTime, setLastKeyTime] = createSignal(0);
  const [showFocusHint, setShowFocusHint] = createSignal(false);
  const [capsLock, setCapsLock] = createSignal(false);
  let isFirstMount = true;

  let wordContainer: HTMLDivElement | undefined;
  let timerId: ReturnType<typeof setInterval> | null = null;
  let inactivityCheckId: ReturnType<typeof setInterval> | null = null;

  const chartDataRef: ChartDataPoint[] = [];
  let lastSecRef = -1;
  let lastElapsedRef = 0;
  let lastCorrectRef = 0;
  let lastIncorrectRef = 0;
  let lastExtraRef = 0;

  let replayDataRef: ReplayEvent[] = [];
  let replayWordsRef: string[] = [];
  let replayStartTime = 0;
  let replayRecording = false;

  function addReplayEvent(action: ReplayEvent["action"], value?: string | number) {
    if (!replayRecording) return;
    replayDataRef.push({ action, value, time: performance.now() - replayStartTime });
  }

  function recordChartSnapshot() {
    if (!startTime()) return;
    const elapsed = (Date.now() - startTime()!) / 1000;
    const sec = Math.floor(elapsed);
    if (sec <= lastSecRef) return;

    const cw = words();
    let correctChars = 0, incorrectChars = 0, extraChars = 0, totalTyped = 0;
    for (const w of cw) {
      const t = w.typed, txt = w.text;
      for (let i = 0; i < Math.max(t.length, txt.length); i++) {
        if (i >= txt.length) { extraChars++; totalTyped++; continue; }
        if (i >= t.length) continue;
        if (t[i] === txt[i]) { correctChars++; totalTyped++; }
        else { incorrectChars++; totalTyped++; }
      }
    }

    if (lastSecRef >= 0) {
      const deltaCorrect = correctChars - lastCorrectRef;
      const deltaIncorrect = (incorrectChars - lastIncorrectRef) + (extraChars - lastExtraRef);
      const deltaSec = elapsed - lastElapsedRef;
      const burst = deltaCorrect > 0 ? (deltaCorrect / 5) / (deltaSec / 60) : 0;
      const cWpm = elapsed > 0 ? ((correctChars / 5) / (elapsed / 60)) : 0;
      const cRaw = elapsed > 0 ? ((totalTyped / 5) / (elapsed / 60)) : 0;

      chartDataRef.push({
        wpm: cWpm,
        raw: cRaw,
        burst: Math.max(0, burst),
        err: Math.max(0, deltaIncorrect),
      });
    } else {
      // Skip first snapshot (t≈0); just initialize tracking refs
      lastSecRef = sec;
      lastElapsedRef = elapsed;
      lastCorrectRef = correctChars;
      lastIncorrectRef = incorrectChars;
      lastExtraRef = extraChars;
      return;
    }

    lastSecRef = sec;
    lastElapsedRef = elapsed;
    lastCorrectRef = correctChars;
    lastIncorrectRef = incorrectChars;
    lastExtraRef = extraChars;
  }

  const activeIdx = createMemo(() => words().findIndex(w => w.status === "active"));
  const input = createMemo(() => { const i = activeIdx(); return i >= 0 ? words()[i].typed : ""; });
  const stats = createMemo(() => computeStats(words(), startTime(), true));

  function init() {
    let texts: string[];
    if (props.repeatWords && props.repeatWords.length > 0) {
      texts = props.repeatWords;
    } else {
      if (configStore.mode === "quote" && !quoteStore.selected) {
        autoSelectQuote(configStore.quoteLength);
      }
      if (configStore.mode === "quote" && quoteStore.selected) {
        texts = quoteStore.selected.text.split(/\s+/);
      } else if (configStore.mode === "zen") {
        texts = [""];
      } else if (configStore.mode === "custom") {
        texts = getCustomTexts();
      } else {
        texts = generateWords(totalWords(), configStore.punctuation, configStore.numbers);
      }
    }
    initWords = buildWordData(texts);
    if (initWords.length > 0) initWords[0] = { ...initWords[0], activeAt: Date.now() };
    setWords(initWords);
    setStartTime(null);
    setIsFinished(false);
    setTimer(props.repeatWords ? 0 : configStore.mode === "time" ? configStore.time : configStore.mode === "custom" && customTextStore.limit.mode === "time" ? customTextStore.limit.value : 0);
    setLastKeyTime(0);
    if (timerId) { clearInterval(timerId); timerId = null; }
    chartDataRef.length = 0;
    lastSecRef = -1;
    lastElapsedRef = 0;
    lastCorrectRef = 0;
    lastIncorrectRef = 0;
    lastExtraRef = 0;
    replayDataRef = [];
    replayWordsRef = initWords.map(w => w.text);
    replayRecording = false;
    requestAnimationFrame(() => { if (wordContainer) { wordContainer.scrollTop = 0; } });
  }

  let lastWarnTime = -1;

  createEffect(() => {
    if (!props.repeatWords && (configStore.mode === "time" || (configStore.mode === "custom" && customTextStore.limit.mode === "time")) && timer() <= 0 && startTime() && !isFinished()) {
      finish();
    }
  });

  createEffect(() => {
    const t = timer();
    const warn = parseInt(configStore.playTimeWarning);
    if (startTime() && !isNaN(warn) && t === warn && t !== lastWarnTime) {
      lastWarnTime = t;
      playTimeWarning();
    }
    if (t !== warn) lastWarnTime = -1;
  });

  createEffect(on(() => props.restartKey, () => { init(); lastWarnTime = -1; }));

  function finish() {
    _lastWordData = words();
    setIsFinished(true);
    if (timerId) { clearInterval(timerId); timerId = null; }
    setShowFocusHint(false);
    recordChartSnapshot();
    const s = computeStats(words(), startTime());
    const overallWpm = s.wpm;
    const wordHistory: WordResult[] = [];
    for (const w of words()) {
      if (w.status === "upcoming" || w.status === "active") continue;
      let speed = 0;
      let category: "fast" | "ok" | "slow" | "missed" = "ok";
      if (w.activeAt && w.doneAt) {
        const duration = (w.doneAt - w.activeAt) / 1000;
        if (duration > 0) {
          const correctCharsInWord = [...w.typed].filter((c, i) => c === w.text[i]).length;
          speed = (correctCharsInWord / 5) / (duration / 60);
        }
      }
      if (w.status === "error") {
        category = "missed";
      } else if (speed > 0 && overallWpm > 0) {
        const ratio = speed / overallWpm;
        if (ratio < 0.7) category = "slow";
        else if (ratio > 1.3) category = "fast";
      }
      wordHistory.push({
        text: w.text,
        typed: w.typed,
        status: w.status === "correct" ? "correct" : "incorrect",
        speed: Math.round(speed),
        category,
      });
    }
    _lastWordResults = wordHistory;
    const cfg = configStore;
    const val = cfg.mode === "time" ? String(cfg.time) : cfg.mode === "words" ? String(cfg.wordCount) : "";
    const baseMode = props.isPractice ? "practice" : cfg.mode + (val ? " " + val : "") + (cfg.punctuation ? " punctuation" : "") + (cfg.numbers ? " numbers" : "");
    replayRecording = false;
    props.onComplete({
      ...s,
      chartData: chartDataRef,
      wordHistory,
      mode: baseMode,
      language: cfg.language,
      punctuation: cfg.punctuation,
      numbers: cfg.numbers,
      difficulty: cfg.difficulty,
      replayData: replayDataRef,
      replayWords: replayWordsRef,
    });
  }

  function handleKey(e: KeyboardEvent) {
    if (isFinished() || e.ctrlKey || e.altKey || e.metaKey) return;
    if (wordContainer && !wordContainer.contains(e.target as Node)) return;

    // Zen mode: Shift+Enter finishes
    if (configStore.mode === "zen" && e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      finish();
      return;
    }

    setLastKeyTime(Date.now());
    setCapsLock(e.getModifierState("CapsLock"));
    if (showFocusHint()) {
      setShowFocusHint(false);
    }

    const idx = activeIdx();
    if (idx < 0) return;

    // Focus mode: typing triggers focus
    window.dispatchEvent(new CustomEvent("focusTyping"));

    if (e.key === "Backspace") {
      if (configStore.difficulty === "expert" || configStore.difficulty === "master") return;
      e.preventDefault();
      playClick();
      const w = words();
      const wTypedLen = w[idx].typed.length;
      const curEmpty = wTypedLen === 0 && idx > 0;
      if (wTypedLen > 0) {
        addReplayEvent("setLetterIndex", wTypedLen - 1);
      } else if (idx > 0) {
        addReplayEvent("backWord");
      }
      setWords(w => {
        const next = [...w];
        if (next[idx].typed.length > 0) {
          next[idx] = { ...next[idx], typed: next[idx].typed.slice(0, -1) };
        } else if (idx > 0) {
          const prev = idx - 1;
          next[prev] = { ...next[prev], status: "active", typed: next[prev].typed.slice(0, -1) };
          next[idx] = { ...next[idx], status: "upcoming" };
        }
        return next;
      });
      if (curEmpty) {
        requestAnimationFrame(() => {
          const el = wordContainer?.querySelector(".word.active") as HTMLElement | null;
          if (el) el.scrollIntoView({ block: "nearest" });
        });
      }
      return;
    }

    if (e.key === " ") {
      e.preventDefault();
      const w = words();
      const cur = w[idx];
      if (cur.typed === "") return;

      if (configStore.mode === "zen") {
        setWords(w => { const next = [...w]; next[idx] = { ...next[idx], status: "correct" }; next.push({ text: "", typed: "", status: "active" }); return next; });
        return;
      }

      const isCorrect = cur.typed === cur.text;
      addReplayEvent(isCorrect ? "submitCorrectWord" : "submitErrorWord");
      const next = [...w];
      next[idx] = { ...next[idx], status: isCorrect ? "correct" : "error", doneAt: Date.now() };

      if (idx + 1 >= next.length) {
        if (props.repeatWords) {
          finish(); return;
        }
        const isTimeMode = configStore.mode === "time" || (configStore.mode === "custom" && customTextStore.limit.mode === "time");
        if (isTimeMode) {
          const newWords = generateWords(250, configStore.punctuation, configStore.numbers);
          for (const nw of newWords) {
            next.push({ text: nw, typed: "", status: "upcoming" });
          }
        } else {
          finish(); return;
        }
      }
      next[idx + 1] = { ...next[idx + 1], status: "active", activeAt: Date.now() };
      setWords(next);

      requestAnimationFrame(() => {
        if (wordContainer) {
          const activeEl = wordContainer.querySelector(".word.active") as HTMLElement | null;
          if (activeEl) {
            const rect = activeEl.getBoundingClientRect();
            const contRect = wordContainer.getBoundingClientRect();
            if (rect.bottom > contRect.bottom) {
              wordContainer.scrollTop += rect.bottom - contRect.bottom + 40;
            }
          }
        }
      });

      recordChartSnapshot();

      if (configStore.mode === "words" && idx + 1 >= configStore.wordCount) {
        finish();
      } else if (configStore.mode === "quote" && idx + 1 >= words().length) {
        finish();
      } else if (configStore.mode === "custom" && customTextStore.limit.mode === "word" && idx + 1 >= customTextStore.limit.value) {
        finish();
      }
      return;
    }

    if (e.key.length === 1) {
      if (!startTime()) {
        e.preventDefault();
        setStartTime(Date.now());
        replayStartTime = performance.now();
        replayRecording = true;
        if (!props.repeatWords && (configStore.mode === "time" || (configStore.mode === "custom" && customTextStore.limit.mode === "time"))) {
          timerId = setInterval(() => setTimer(t => t - 1), 1000);
        }
      }
      e.preventDefault();
      if (configStore.mode === "zen") {
        setWords(w => {
          const next = [...w];
          next[idx] = { ...next[idx], typed: next[idx].typed + e.key, text: next[idx].text + e.key };
          return next;
        });
        return;
      }
      const expected = words()[idx].text[words()[idx].typed.length];
      const isCorrect = expected === e.key;
      if (isCorrect || configStore.playSoundOnError === "off") {
        playClick();
        addReplayEvent("correctLetter");
      } else {
        playError();
        addReplayEvent("incorrectLetter", e.key);
      }
      setWords(w => {
        const next = [...w];
        next[idx] = { ...next[idx], typed: next[idx].typed + e.key };
        return next;
      });
      recordChartSnapshot();
    }
  }

  function handleKeyUp(e: KeyboardEvent) {
    setCapsLock(e.getModifierState("CapsLock"));
  }

  onMount(() => {
    if (isFirstMount && configStore.showOutOfFocusWarning) { setShowFocusHint(true); isFirstMount = false; }
    document.addEventListener("keydown", handleKey);
    document.addEventListener("keyup", handleKeyUp);
    setTimeout(() => { if (wordContainer) wordContainer.focus(); }, 50);
    inactivityCheckId = setInterval(() => {
      if (startTime() && !isFinished() && lastKeyTime() > 0 && Date.now() - lastKeyTime() > 5000 && configStore.showOutOfFocusWarning) {
        setShowFocusHint(true);
      }
    }, 1000);
  });

  onCleanup(() => {
    document.removeEventListener("keydown", handleKey);
    document.removeEventListener("keyup", handleKeyUp);
    if (timerId) clearInterval(timerId);
    if (inactivityCheckId) clearInterval(inactivityCheckId);
  });

  const s = () => stats();
  const t = () => timer();

  return (
    <div class="typing-test">
      <div class="stats-bar">
        <div class="stat"><span class="stat-label">wpm</span><span class="stat-value">{Math.round(s().wpm)}</span></div>
        <div class="stat"><span class="stat-label">acc</span><span class="stat-value">{s().accuracy.toFixed(1)}%</span></div>
        <div class="stat"><span class="stat-label">raw</span><span class="stat-value">{Math.round(s().raw)}</span></div>
        <div class="stat spacer"></div>
        <div class="stat timer-stat">
          <span class="stat-value">{configStore.mode === "time" || (configStore.mode === "custom" && customTextStore.limit.mode === "time") ? `${t()}s` : configStore.mode === "zen" ? `${activeIdx() + 1}` : configStore.mode === "quote" ? `${activeIdx() + 1}/${words().length}` : configStore.mode === "custom" ? `${activeIdx() + 1}/${customTextStore.limit.value}` : `${activeIdx() + 1}/${configStore.wordCount}`}</span>
        </div>
      </div>

      {configStore.capsLockWarning && capsLock() && (
        <div class="caps-lock-warning">caps lock is on</div>
      )}
      <div class={`word-container ${configStore.difficulty === "master" ? "blind" : ""}`} ref={wordContainer} tabIndex={-1}>
        <div class="words">
          {words().map((w) => (
            <span class={`word ${w.status}`}>
              {w.text.split("").map((ch, i) => {
                let st: CharStatus = "untyped";
                if (w.status === "correct") {
                  st = "correct";
                } else if (w.status === "error") {
                  st = i < w.typed.length ? (w.typed[i] === ch ? "correct" : "incorrect") : "missing";
                } else if (w.status === "active") {
                  st = i < w.typed.length ? (w.typed[i] === ch ? "correct" : "incorrect") : "untyped";
                }
                const showCaret = w.status === "active" && i === input().length && input().length < w.text.length;
                return (
                  <>{showCaret && <span class="caret"></span>}<span class={`char char-${st}`}>{ch}</span></>
                );
              })}
              {(w.status === "active" || w.status === "error") && w.typed.length > w.text.length && (
                <span class="char char-extra">{w.typed.slice(w.text.length)}</span>
              )}
              {w.status === "active" && input().length >= w.text.length && <span class="caret"></span>}
            </span>
          ))}
        </div>
        {showFocusHint() && <div class="focus-hint">click here or press any key to focus<svg class="focus-arrow" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg></div>}
      </div>
      <Show when={configStore.mode === "quote" && quoteStore.selected}>
        <div class="quote-source">&mdash; {quoteStore.selected!.source}</div>
      </Show>
    </div>
  );
}
