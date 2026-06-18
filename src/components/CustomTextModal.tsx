import { createSignal, Show, JSX } from "solid-js";
import { configStore, setConfig } from "../lib/config-store";
import { showNoticeNotification, showErrorNotification } from "../lib/notifications";
import { cleanTypographySymbols, replaceControlCharacters } from "../lib/strings";
import {
  customTextStore,
  setText,
  setMode,
  setLimitValue,
  setLimitMode,
  setPipeDelimiter,
} from "../lib/custom-text-store";
import type { CustomTextMode } from "../lib/custom-text-store";
import WordFilterModal from "./WordFilterModal";
import CustomGeneratorModal from "./CustomGeneratorModal";

interface Props {
  onClose: () => void;
  onApply: () => void;
}

type Mode = "simple" | CustomTextMode;
type SubModal = "wordFilter" | "customGenerator" | null;

const MODE_OPTIONS: { value: Mode; label: string }[] = [
  { value: "simple", label: "simple" },
  { value: "repeat", label: "repeat" },
  { value: "shuffle", label: "shuffle" },
  { value: "random", label: "random" },
];

function initMode(): Mode {
  const m = customTextStore.mode;
  const lm = customTextStore.limit.mode;
  if (m === "repeat" && lm !== "time" && customTextStore.limit.value === customTextStore.text.length) {
    return "simple";
  }
  return m;
}

function SettingsGroup(props: {
  icon: string;
  title: string;
  sub: string;
  children: JSX.Element;
}) {
  return (
    <div class="ct-sg">
      <div class="ct-sg-title">
        <i class={`fas ${props.icon} fa-fw`}></i> {props.title}
      </div>
      <div class="ct-sg-sub">{props.sub}</div>
      {props.children}
    </div>
  );
}

export default function CustomTextModal(props: Props) {
  const s = customTextStore;
  const [textInput, setTextInput] = createSignal(
    s.text.join(s.pipeDelimiter ? "|" : " ")
  );
  const [selectedMode, setSelectedMode] = createSignal<Mode>(initMode());
  const [limitWord, setLimitWord] = createSignal("");
  const [limitTime, setLimitTime] = createSignal("");
  const [limitSection, setLimitSection] = createSignal("");
  const [usePipe, setUsePipe] = createSignal(s.pipeDelimiter);

  let textareaRef: HTMLTextAreaElement | undefined;
  let fileInputRef: HTMLInputElement | undefined;
  const [subModal, setSubModal] = createSignal<SubModal>(null);

  function handleChainedData(data: { splitText: string[]; set: boolean } | null) {
    if (!data) return;
    const joinDelim = usePipe() ? "|" : " ";
    const incoming = data.splitText.join(joinDelim);
    if (data.set) {
      setTextInput(incoming);
    } else {
      setTextInput(t => t ? `${t} ${incoming}` : incoming);
    }
    if (data.set) {
      const len = data.splitText.length;
      setLimitWord(String(len));
      setLimitTime("");
      setLimitSection("");
    }
  }

  function cleanUpText(): string[] {
    let t = textInput();
    if (!t) return [];
    t = t.normalize();
    t = t.replace(/[\u2000-\u200A\u202F\u205F\u00A0]/g, " ");
    t = t.replace(/ +/gm, " ");
    t = t.replace(/( *(\r\n|\r|\n) *)/g, "\n ");
    return t.split(usePipe() ? "|" : " ").filter(w => w !== "");
  }

  function handleApply() {
    const raw = textInput();
    if (raw === "") { showNoticeNotification("Text cannot be empty"); return; }

    const activeLimits = [limitWord(), limitTime(), limitSection()].filter(l => l !== "");
    if (activeLimits.length > 1) { showNoticeNotification("You can only specify one limit"); return; }

    if (selectedMode() !== "simple" && limitWord() === "" && limitTime() === "" && limitSection() === "") {
      showNoticeNotification("You need to specify a limit"); return;
    }

    if (limitWord() === "0" || limitTime() === "0" || limitSection() === "0") {
      showNoticeNotification("Infinite test! Make sure to use Bail Out from the command line to save your result.");
    }

    const words = cleanUpText();
    if (words.length === 0) { showNoticeNotification("Text cannot be empty"); return; }
    const mode = selectedMode();
    const pipe = usePipe();

    if (mode === "simple") setMode("repeat");
    else setMode(mode as CustomTextMode);
    setPipeDelimiter(pipe);
    setText(words);

    if (mode === "simple" && pipe) {
      setLimitMode("section"); setLimitValue(words.length);
    } else if (mode === "simple") {
      setLimitMode("word"); setLimitValue(words.length);
    } else if (limitWord()) {
      setLimitMode("word"); setLimitValue(parseInt(limitWord()));
    } else if (limitTime()) {
      setLimitMode("time"); setLimitValue(parseInt(limitTime()));
    } else if (limitSection()) {
      setLimitMode("section"); setLimitValue(parseInt(limitSection()));
    }

    if (configStore.mode !== "custom") setConfig("mode", "custom");
    window.dispatchEvent(new CustomEvent("configChange", { detail: { key: "mode", value: "custom" } }));
    props.onApply();
    props.onClose();
  }

  function handleModeChange(val: string) {
    const prev = selectedMode();
    if (val === "simple") {
      setSelectedMode("simple");
      setLimitWord(""); setLimitTime(""); setLimitSection("");
    } else {
      setSelectedMode(val as Mode);
      if (prev === "simple") {
        const len = cleanUpText().length;
        setLimitTime("");
        if (usePipe()) setLimitSection(String(len));
        else setLimitWord(String(len));
      }
    }
  }

  function handleDelimiterChange(pipe: boolean) {
    const curPipe = usePipe();
    let newText = textInput()
      .split(curPipe ? "|" : " ")
      .join(pipe ? "|" : " ");
    newText = newText.replace(/\n /g, "\n");
    setTextInput(newText);
    setUsePipe(pipe);
    if (pipe && limitWord()) setLimitWord("");
    if (!pipe && limitSection()) setLimitSection("");
  }

  function handleTextareaKeydown(e: KeyboardEvent) {
    if (e.key === "Tab") {
      e.preventDefault();
      const area = e.currentTarget as HTMLTextAreaElement;
      const start = area.selectionStart;
      const end = area.selectionEnd;
      area.value = area.value.substring(0, start) + "\t" + area.value.substring(end);
      area.selectionStart = area.selectionEnd = start + 1;
      setTextInput(area.value);
    }
  }

  function handleTextareaKeypress(e: KeyboardEvent) {
    if (e.code === "Enter" && e.ctrlKey) {
      e.preventDefault();
      handleApply();
    }
  }

  function handleFileOpen() {
    const file = fileInputRef?.files?.[0];
    if (!file) return;
    if (file.type !== "text/plain") {
      showErrorNotification("File is not a text file");
      return;
    }
    const reader = new FileReader();
    reader.readAsText(file, "UTF-8");
    reader.onload = (e) => {
      setTextInput(e.target?.result as string);
      if (fileInputRef) fileInputRef.value = "";
    };
    reader.onerror = () => showErrorNotification("Failed to read file");
  }

  function applyRemoveZeroWidth() {
    setTextInput(t => t.replace(/[\u200B-\u200D\u2060\uFEFF]/g, ""));
  }

  function applyRemoveFancyTypography() {
    setTextInput(t => cleanTypographySymbols(t));
  }

  function applyReplaceControlChars() {
    setTextInput(t => replaceControlCharacters(t));
  }

  function applyReplaceNewlines(mode: "space" | "periodSpace") {
    setTextInput(t => {
      let text = t;
      if (mode === "periodSpace") {
        text = text.replace(/\n/gm, ". ");
        text = text.replace(/\.\. /gm, ". ");
      } else {
        text = text.replace(/\n/gm, " ");
      }
      return text.replace(/ +/gm, " ");
    });
  }

  function handleOkKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleApply();
    }
  }

  const isSimple = () => selectedMode() === "simple";
  const showWordLimit = () => !usePipe() && !isSimple();
  const showSectionLimit = () => usePipe() && !isSimple();

  return (
    <div class="tc-overlay" onClick={props.onClose}>
      <div class="ct-modal" onClick={e => e.stopPropagation()}>
        <form class="ct-form" onSubmit={e => { e.preventDefault(); handleApply(); }}>
          {/* Left column: textarea */}
          <div class="ct-main">
            {/* Top buttons */}
            <div class="ct-top-buttons">
              <button type="button" class="ct-side-btn" onClick={() => showNoticeNotification("Save not implemented")}>
                <i class="fas fa-save"></i> save
              </button>
              <button type="button" class="ct-side-btn" onClick={() => showNoticeNotification("Saved texts not implemented")}>
                <i class="fas fa-folder"></i> saved texts
              </button>
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              class="ct-textarea"
              placeholder="type or paste your custom text"
              value={textInput()}
              onInput={e => setTextInput(e.currentTarget.value)}
              onKeyDown={handleTextareaKeydown}
              onKeyPress={handleTextareaKeypress}
            />

            {/* Apply button */}
            <button type="submit" class="ct-apply-btn" tabIndex={0} onKeyDown={handleOkKeyDown}>ok</button>
          </div>

          {/* Right column: settings sidebar */}
          <div class="ct-sidebar">
            {/* Mode */}
            <SettingsGroup icon="fa-cog" title="Mode" sub="Change the way words are generated.">
              <div class="ct-btn-row">
                {MODE_OPTIONS.map(opt => (
                  <button
                    type="button"
                    class="ct-btn"
                    classList={{ active: selectedMode() === opt.value }}
                    onClick={() => handleModeChange(opt.value)}
                  >{opt.label}</button>
                ))}
              </div>
            </SettingsGroup>

            {/* Limit */}
            <SettingsGroup icon="fa-step-forward" title="Limit" sub="Control how many words to generate or for how long you want to type.">
              <div class="ct-limit-row">
                <Show when={showWordLimit()}>
                  <input class="ct-input" type="number" min="0" placeholder="words"
                    value={limitWord()} disabled={isSimple()}
                    onInput={e => { setLimitWord(e.currentTarget.value); setLimitTime(""); setLimitSection(""); }}
                  />
                </Show>
                <Show when={showSectionLimit()}>
                  <input class="ct-input" type="number" min="0" placeholder="sections"
                    value={limitSection()} disabled={isSimple()}
                    onInput={e => { setLimitSection(e.currentTarget.value); setLimitWord(""); setLimitTime(""); }}
                  />
                </Show>
                <span class="ct-or">or</span>
                <input class="ct-input" type="number" min="0" placeholder="time"
                  value={limitTime()} disabled={isSimple()}
                  onInput={e => { setLimitTime(e.currentTarget.value); setLimitWord(""); setLimitSection(""); }}
                />
              </div>
            </SettingsGroup>

            {/* Word delimiter */}
            <SettingsGroup icon="fa-grip-lines-vertical" title="Word delimiter" sub="Change how words are separated. Using the pipe delimiter allows you to randomize groups of words.">
              <div class="ct-btn-row">
                <button type="button" class="ct-btn" classList={{ active: !usePipe() }} onClick={() => handleDelimiterChange(false)}>space</button>
                <button type="button" class="ct-btn" classList={{ active: usePipe() }} onClick={() => handleDelimiterChange(true)}>pipe</button>
              </div>
            </SettingsGroup>

            <div class="ct-sep"></div>

            {/* File & tools */}
            <div class="ct-side-btn-list">
              <input ref={fileInputRef} type="file" class="ct-file-input" accept=".txt" onChange={handleFileOpen} />
              <button type="button" class="ct-side-btn" onClick={() => fileInputRef?.click()}>
                <i class="fas fa-file-import"></i> open file
              </button>
              <button type="button" class="ct-side-btn" onClick={() => setSubModal("wordFilter")}>
                <i class="fas fa-filter"></i> words filter
              </button>
              <button type="button" class="ct-side-btn" onClick={() => setSubModal("customGenerator")}>
                <i class="fas fa-cogs"></i> custom generator
              </button>
            </div>

            {/* Remove zero-width */}
            <SettingsGroup icon="fa-text-width" title="Remove zero-width characters" sub="Fully remove zero-width characters.">
              <button type="button" class="ct-btn ct-btn-full" onClick={applyRemoveZeroWidth}>apply</button>
            </SettingsGroup>

            {/* Remove fancy typography */}
            <SettingsGroup icon="fa-pen-fancy" title="Remove fancy typography" sub={'Standardises typography symbols (for example \u201c and \u201d become ")'}>
              <button type="button" class="ct-btn ct-btn-full" onClick={applyRemoveFancyTypography}>apply</button>
            </SettingsGroup>

            {/* Replace control characters */}
            <SettingsGroup icon="fa-code" title="Replace control characters" sub="Replace control characters (\n becomes a new line and \t becomes a tab)">
              <button type="button" class="ct-btn ct-btn-full" onClick={applyReplaceControlChars}>apply</button>
            </SettingsGroup>

            {/* Replace new lines with spaces */}
            <SettingsGroup icon="fa-level-down-alt" title="Replace new lines with spaces" sub="Replace all new line characters with spaces. Can automatically add periods to the end of lines if you wish.">
              <div class="ct-btn-row">
                <button type="button" class="ct-btn ct-btn-wide" onClick={() => applyReplaceNewlines("space")}>space</button>
                <button type="button" class="ct-btn ct-btn-wide" onClick={() => applyReplaceNewlines("periodSpace")}>period + space</button>
              </div>
            </SettingsGroup>
          </div>
        </form>
      </div>

      <Show when={subModal() === "wordFilter"}>
        <WordFilterModal
          onData={handleChainedData}
          onClose={() => setSubModal(null)}
        />
      </Show>
      <Show when={subModal() === "customGenerator"}>
        <CustomGeneratorModal
          onData={handleChainedData}
          onClose={() => setSubModal(null)}
        />
      </Show>
    </div>
  );
}
