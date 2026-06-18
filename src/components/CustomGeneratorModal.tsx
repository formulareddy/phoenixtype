import { createSignal } from "solid-js";
import { showNoticeNotification } from "../lib/notifications";

type IncomingData = { splitText: string[]; set: boolean } | null;

interface Props {
  onData: (data: IncomingData) => void;
  onClose: () => void;
}

const PRESETS: Record<string, { display: string; characters: string[] }> = {
  alphas: { display: "a-z", characters: "abcdefghijklmnopqrstuvwxyz".split("") },
  numbers: { display: "0-9", characters: "0123456789".split("") },
  symbols: { display: "symbols", characters: "!@#$%^&*()_+-=[]{}|;:',.<>?/`~".split("") },
  bigrams: {
    display: "bigrams",
    characters: ["th","he","in","er","an","re","on","at","en","nd","ed","es","or","te","st","ar","ou","it","al","as"],
  },
  trigrams: {
    display: "trigrams",
    characters: ["the","and","ing","ion","tio","ent","ati","for","her","ter","ate","ver","all","con","res","are","rea","int"],
  },
};

const PRESET_KEYS = Object.keys(PRESETS);

export default function CustomGeneratorModal(props: Props) {
  const [preset, setPreset] = createSignal(PRESET_KEYS[0]);
  const [charSet, setCharSet] = createSignal("");
  const [minLen, setMinLen] = createSignal("2");
  const [maxLen, setMaxLen] = createSignal("5");
  const [wordCount, setWordCount] = createSignal("100");

  function applyPreset() {
    const p = PRESETS[preset()];
    if (p) setCharSet(p.characters.join(" "));
  }

  function generate(exact: boolean) {
    const input = charSet().trim();
    if (input === "") { showNoticeNotification("Character set cannot be empty"); return; }
    const chars = input.split(/\s+/);
    const min = parseInt(minLen()) || 2;
    const max = parseInt(maxLen()) || 5;
    const count = parseInt(wordCount()) || 100;
    const words: string[] = [];
    for (let i = 0; i < count; i++) {
      const len = Math.floor(Math.random() * (max - min + 1)) + min;
      let w = "";
      for (let j = 0; j < len; j++) {
        w += chars[Math.floor(Math.random() * chars.length)];
      }
      words.push(w);
    }
    props.onData({ splitText: words, set: exact });
    props.onClose();
  }

  return (
    <div class="tc-overlay" onClick={props.onClose}>
      <div class="ct-modal ct-modal--sm" onClick={e => e.stopPropagation()}>
        <form class="wf-form" onSubmit={e => { e.preventDefault(); generate(true); }}>
          <div class="wf-col">
            <div class="wf-label">presets</div>
            <div class="wf-preset-row">
              <select class="ct-input wf-select" value={preset()} onChange={e => setPreset(e.currentTarget.value)}>
                {PRESET_KEYS.map(k => <option value={k}>{PRESETS[k].display}</option>)}
              </select>
              <button type="button" class="ct-btn" onClick={applyPreset}>apply</button>
            </div>
          </div>
          <div class="wf-col">
            <div class="wf-label">character set</div>
            <textarea class="ct-textarea wf-textarea" placeholder="Enter characters or strings separated by spaces"
              value={charSet()} onInput={e => setCharSet(e.currentTarget.value)}
            />
          </div>
          <div class="wf-grid">
            <div class="wf-col">
              <div class="wf-label">min length</div>
              <input class="ct-input" type="number" min="1" placeholder="min"
                value={minLen()} onInput={e => setMinLen(e.currentTarget.value)}
              />
            </div>
            <div class="wf-col">
              <div class="wf-label">max length</div>
              <input class="ct-input" type="number" min="1" placeholder="max"
                value={maxLen()} onInput={e => setMaxLen(e.currentTarget.value)}
              />
            </div>
          </div>
          <div class="wf-col">
            <div class="wf-label">word count</div>
            <input class="ct-input" type="number" min="1" placeholder="word count"
              value={wordCount()} onInput={e => setWordCount(e.currentTarget.value)}
            />
          </div>
          <div class="wf-bottom">
            <div class="wf-label wf-hint">"Set" replaces current text, "Add" appends.</div>
            <div class="wf-actions">
              <button type="submit" class="ct-btn ct-btn-wide" onClick={() => generate(true)}>set</button>
              <button type="button" class="ct-btn ct-btn-wide" onClick={() => generate(false)}>add</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
