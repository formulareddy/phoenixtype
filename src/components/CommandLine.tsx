import { createSignal, createMemo, createEffect, onMount, onCleanup } from "solid-js";
import { configStore, setConfig, setFullConfig } from "../lib/config-store";
import { getDefaultConfig } from "../types";

interface Props {
  open: boolean;
  onClose: () => void;
  onRestart: () => void;
}

interface Cmd {
  id: string;
  label: string;
  action: () => void;
}

export default function CommandLine(props: Props) {
  let inputRef: HTMLInputElement | undefined;

  const [query, setQuery] = createSignal("");

  const commands = createMemo(() => {
    const q = query().toLowerCase();
    const c = configStore;
    const all: Cmd[] = [
      { id: "restart", label: "Restart Test", action: () => { props.onRestart(); props.onClose(); } },
      { id: "punct", label: `${c.punctuation ? "Disable" : "Enable"} Punctuation`, action: () => { setConfig("punctuation", !c.punctuation); props.onClose(); } },
      { id: "nums", label: `${c.numbers ? "Disable" : "Enable"} Numbers`, action: () => { setConfig("numbers", !c.numbers); props.onClose(); } },
      { id: "time15", label: "Time 15", action: () => { setConfig("time", 15); setConfig("mode", "time"); props.onClose(); } },
      { id: "time30", label: "Time 30", action: () => { setConfig("time", 30); setConfig("mode", "time"); props.onClose(); } },
      { id: "time60", label: "Time 60", action: () => { setConfig("time", 60); setConfig("mode", "time"); props.onClose(); } },
      { id: "time120", label: "Time 120", action: () => { setConfig("time", 120); setConfig("mode", "time"); props.onClose(); } },
      { id: "words10", label: "Words 10", action: () => { setConfig("wordCount", 10); setConfig("mode", "words"); props.onClose(); } },
      { id: "words25", label: "Words 25", action: () => { setConfig("wordCount", 25); setConfig("mode", "words"); props.onClose(); } },
      { id: "words50", label: "Words 50", action: () => { setConfig("wordCount", 50); setConfig("mode", "words"); props.onClose(); } },
      { id: "words100", label: "Words 100", action: () => { setConfig("wordCount", 100); setConfig("mode", "words"); props.onClose(); } },
      { id: "diffNormal", label: "Difficulty: Normal", action: () => { setConfig("difficulty", "normal"); props.onClose(); } },
      { id: "diffExpert", label: "Difficulty: Expert", action: () => { setConfig("difficulty", "expert"); props.onClose(); } },
      { id: "diffMaster", label: "Difficulty: Master", action: () => { setConfig("difficulty", "master"); props.onClose(); } },
    ];
    if (!q) return all;
    return all.filter(c => c.label.toLowerCase().includes(q));
  });

  const [selectedIdx, setSelectedIdx] = createSignal(0);

  createEffect(() => { commands(); setSelectedIdx(0); });

  function handleKey(e: KeyboardEvent) {
    if (!props.open) return;
    if (e.key === "Escape") { e.preventDefault(); props.onClose(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, commands().length - 1)); return; }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); return; }
    if (e.key === "Enter") { e.preventDefault(); const cmds = commands(); if (cmds[selectedIdx()]) cmds[selectedIdx()].action(); return; }
    if (e.key === "Tab") { e.preventDefault(); const cmds = commands(); if (cmds[selectedIdx()]) cmds[selectedIdx()].action(); return; }
  }

  onMount(() => {
    document.addEventListener("keydown", handleKey);
    setTimeout(() => { if (inputRef) inputRef.focus(); }, 10);
  });

  onCleanup(() => {
    document.removeEventListener("keydown", handleKey);
  });

  return (
    <div class="command-line-overlay" style={{ display: props.open ? "flex" : "none" }} onClick={props.onClose}>
      <div class="command-line" onClick={e => e.stopPropagation()}>
        <input
          ref={inputRef}
          class="command-line-input"
          type="text"
          placeholder="Type a command..."
          value={query()}
          onInput={e => setQuery((e.target as HTMLInputElement).value)}
          onFocus={e => (e.target as HTMLInputElement).select()}
        />
        <div class="command-list">
          {commands().map((cmd, i) => (
            <div
              class={`command-item ${i === selectedIdx() ? "selected" : ""}`}
              onClick={() => { cmd.action(); }}
              onMouseEnter={() => setSelectedIdx(i)}
            >
              {cmd.label}
            </div>
          ))}
          {commands().length === 0 && <div class="command-empty">No matching commands</div>}
        </div>
      </div>
    </div>
  );
}
