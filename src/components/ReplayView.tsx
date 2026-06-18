import { createSignal, onCleanup, onMount } from "solid-js";
import type { ReplayEvent } from "../types";

interface Props {
  replayData: ReplayEvent[];
  words: string[];
}

export default function ReplayView(props: Props) {
  let wordsRef: HTMLDivElement | undefined;
  let timeouts: ReturnType<typeof setTimeout>[] = [];
  let wordPos = 0;
  let curPos = 0;
  let targetWordPos = 0;
  let targetCurPos = 0;
  let correctCount = 0;
  let finished = false;

  const [isPlaying, setIsPlaying] = createSignal(false);
  const [replayTime, setReplayTime] = createSignal(0);
  const [replayWpm, setReplayWpm] = createSignal(0);

  function buildWords() {
    if (!wordsRef) return;
    wordsRef.innerHTML = "";
    let wordCount = 0;
    for (const ev of props.replayData) {
      if (ev.action === "backWord") wordCount--;
      else if (ev.action === "submitCorrectWord" || ev.action === "submitErrorWord") wordCount++;
    }
    const maxWords = Math.min(wordCount + 1, props.words.length);
    for (let i = 0; i < maxWords; i++) {
      const wordEl = document.createElement("div");
      wordEl.className = "word";
      for (const ch of props.words[i]) {
        const letter = document.createElement("letter");
        letter.textContent = ch;
        wordEl.appendChild(letter);
      }
      wordsRef!.appendChild(wordEl);
    }
  }

  function processEvent(item: ReplayEvent, nosound = false) {
    const words = wordsRef;
    if (!words) return;
    let activeWord = words.children[wordPos] as HTMLElement;
    if (!activeWord) return;

    if (item.action === "correctLetter") {
      const letter = activeWord.children[curPos] as HTMLElement;
      if (letter) letter.classList.add("correct");
      curPos++;
      correctCount++;
    } else if (item.action === "incorrectLetter") {
      let el: HTMLElement | null;
      if (curPos >= activeWord.children.length) {
        el = document.createElement("letter");
        el.classList.add("extra", "incorrect");
        el.textContent = typeof item.value === "string" ? item.value : "";
        activeWord.appendChild(el);
      }
      el = activeWord.children[curPos] as HTMLElement;
      if (el) el.classList.add("incorrect");
      curPos++;
    } else if (item.action === "setLetterIndex" && typeof item.value === "number") {
      curPos = item.value;
      const letters = [...activeWord.children];
      for (let i = curPos; i < letters.length; i++) {
        const el = letters[i] as HTMLElement;
        if (el.classList.contains("extra")) {
          el.remove();
        } else {
          el.className = "";
        }
      }
    } else if (item.action === "submitCorrectWord") {
      wordPos++;
      curPos = 0;
    } else if (item.action === "submitErrorWord") {
      activeWord.classList.add("error");
      wordPos++;
      curPos = 0;
    } else if (item.action === "backWord") {
      wordPos--;
      activeWord = words.children[wordPos] as HTMLElement;
      if (activeWord) {
        curPos = activeWord.children.length;
        while ((activeWord.children[curPos - 1] as HTMLElement)?.className === "") curPos--;
        activeWord.classList.remove("error");
      }
    }
  }

  function loadOldReplay(): number {
    curPos = 0;
    wordPos = 0;
    correctCount = 0;
    let startIndex = 0;
    for (let i = 0; i < props.replayData.length; i++) {
      if (wordPos < targetWordPos || (wordPos === targetWordPos && curPos < targetCurPos)) {
        processEvent(props.replayData[i], true);
        startIndex = i + 1;
      }
    }
    return startIndex;
  }

  function clearAllTimeouts() {
    for (const t of timeouts) clearTimeout(t);
    timeouts = [];
  }

  function pause() {
    clearAllTimeouts();
    targetCurPos = curPos;
    targetWordPos = wordPos;
    setIsPlaying(false);
  }

  function play() {
    if (finished) {
      wordPos = 0;
      curPos = 0;
      targetWordPos = 0;
      targetCurPos = 0;
      correctCount = 0;
      finished = false;
      buildWords();
    }

    const startIndex = loadOldReplay();
    if (startIndex >= props.replayData.length) return;

    setIsPlaying(true);
    const lastTime = props.replayData[startIndex].time;
    const lastEvTime = props.replayData[props.replayData.length - 1].time;

    let swTime = Math.round(lastTime / 1000);
    const swEndTime = Math.round(lastEvTime / 1000);
    const swIntervals: ReturnType<typeof setTimeout>[] = [];
    while (swTime <= swEndTime) {
      const t = swTime;
      swIntervals.push(
        setTimeout(() => {
          setReplayTime(t);
          const wpm = t > 0 ? Math.round((correctCount / 5) / (t / 60)) : 0;
          setReplayWpm(wpm);
        }, t * 1000 - lastTime)
      );
      swTime++;
    }
    timeouts.push(...swIntervals);

    for (let i = startIndex; i < props.replayData.length; i++) {
      const ev = props.replayData[i];
      const delay = ev.time - lastTime;
      timeouts.push(
        setTimeout(() => {
          processEvent(ev);
        }, delay)
      );
    }

    timeouts.push(
      setTimeout(() => {
        targetCurPos = 0;
        targetWordPos = 0;
        setIsPlaying(false);
        finished = true;
        const finalTime = Math.round(lastEvTime / 1000);
        setReplayTime(finalTime);
        setReplayWpm(Math.round((correctCount / 5) / (finalTime / 60)));
      }, lastEvTime - lastTime)
    );
  }

  function togglePlay() {
    if (isPlaying()) {
      pause();
    } else {
      play();
    }
  }

  function handleWordClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target) return;
    const letter = target.closest("letter") as HTMLElement;
    if (!letter) return;
    if (!wordsRef) return;

    pause();
    const wordEl = letter.parentElement as HTMLElement;
    const wordIdx = [...wordsRef.children].indexOf(wordEl);
    const letterIdx = [...wordEl.children].indexOf(letter);
    if (wordIdx >= 0 && letterIdx >= 0) {
      targetWordPos = wordIdx;
      targetCurPos = letterIdx;
      buildWords();
      loadOldReplay();
    }
  }

  function handleRestart() {
    pause();
    wordPos = 0;
    curPos = 0;
    targetWordPos = 0;
    targetCurPos = 0;
    correctCount = 0;
    finished = false;
    setReplayTime(0);
    setReplayWpm(0);
    buildWords();
  }

  onMount(() => {
    buildWords();
  });

  onCleanup(() => {
    clearAllTimeouts();
  });

  return (
    <div id="resultReplay">
      <div class="title">
        <span>watch replay</span>
        <button
          id="playpauseReplayButton"
          class="textButton"
          onClick={togglePlay}
          aria-label={isPlaying() ? "Pause replay" : "Start replay"}
          data-balloon-pos="up"
        >
          <i class={`fas ${isPlaying() ? "fa-pause" : "fa-play"}`}></i>
        </button>
        <button
          class="textButton"
          onClick={handleRestart}
          aria-label="Restart replay"
          data-balloon-pos="up"
        >
          <i class="fas fa-redo"></i>
        </button>
        <p id="replayStats">{replayWpm()}wpm {replayTime()}s</p>
      </div>
      <div id="replayWordsWrapper">
        <div id="replayWords" class="words" ref={wordsRef} onClick={handleWordClick}></div>
      </div>
    </div>
  );
}
