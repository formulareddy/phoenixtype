import { For, Show, createSignal, createResource } from "solid-js";
import { configStore, setConfig, setFullConfig } from "../lib/config-store";
import { getDefaultConfig, themes, KNOWN_FONTS } from "../types";
import { showSuccessNotification, showErrorNotification } from "../lib/notifications";
import { fontFamilyName } from "../lib/fonts";
import { previewClick, previewError, playClick, playTimeWarning as playTimeWarningSound } from "../lib/sound-controller";
import fileStorage from "../lib/file-storage";
import type {
  KeymapLayout,
  KeymapMode,
  OppositeShiftMode,
  StopOnError,
  ConfidenceMode,
  IndicateTypos,
  CompositDisplay,
  Difficulty,
  QuickRestart,
  RepeatQuotes,
  SingleListCommandLine,
  MinWpm,
  MinAcc,
  MinBurst,
  CaretStyle,
  SmoothCaret,
  PaceCaret,
  TimerStyle,
  LiveStyle,
  TimerColor,
  TimerOpacity,
  HighlightMode,
  TapeMode,
  TypedEffect,
  TypingSpeedUnit,
  RandomTheme,
  CustomBackgroundSize,
  ShowAverage,
  PlaySoundOnClick,
  PlaySoundOnError,
  PlayTimeWarning,
  KeymapStyle,
  KeymapLegendStyle,
  KeymapShowTopRow,
  Ads,
} from "../types";

const SORTED_THEMES = [...themes].sort((a, b) => {
  const hexToLuma = (h: string) => {
    const r = parseInt(h.slice(1, 3), 16) / 255;
    const g = parseInt(h.slice(3, 5), 16) / 255;
    const b = parseInt(h.slice(5, 7), 16) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  return hexToLuma(b.colors[0]) - hexToLuma(a.colors[0]);
});

const CARET_STYLES: CaretStyle[] = ["off", "default", "block", "outline", "underline"];
const SMOOTH_CARET: SmoothCaret[] = ["off", "slow", "medium", "fast"];
const PACE_CARET: PaceCaret[] = ["off", "average", "pb", "tagPb", "last", "custom", "daily"];
const TIMER_STYLES: TimerStyle[] = ["off", "bar", "text", "mini", "flash_text", "flash_mini"];
const LIVE_STYLES: LiveStyle[] = ["off", "text", "mini"];
const TIMER_COLORS: TimerColor[] = ["black", "sub", "text", "main"];
const TIMER_OPACITIES: TimerOpacity[] = ["0.25", "0.5", "0.75", "1"];
const HIGHLIGHT_MODES: HighlightMode[] = ["off", "letter", "word", "next_word", "next_two_words", "next_three_words"];
const TAPE_MODES: TapeMode[] = ["off", "letter", "word"];
const TYPED_EFFECTS: TypedEffect[] = ["keep", "hide", "fade", "dots"];
const TYPING_SPEED_UNITS: TypingSpeedUnit[] = ["wpm", "cpm", "wps", "cps", "wph"];
const KEYMAP_STYLES: KeymapStyle[] = ["staggered", "alice", "matrix", "split", "split_matrix", "steno", "steno_matrix"];
const KEYMAP_LEGEND_STYLES: KeymapLegendStyle[] = ["lowercase", "uppercase", "blank", "dynamic"];
const KEYMAP_SHOW_TOP_ROWS: KeymapShowTopRow[] = ["always", "layout", "never"];

function LinkSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
      <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
    </svg>
  );
}

function ChevronSvg(props: { class?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24" class={props.class}>
      <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
    </svg>
  );
}

function Setting(props: {
  settingKey: string;
  icon: string;
  title: string;
  description?: any;
  inputs?: any;
  fullWidthInputs?: any;
}) {
  return (
    <div class="setting group" data-setting-key={props.settingKey}>
      <div class="setting-title-row">
        <span class="setting-icon" innerHTML={props.icon}></span>
        <span class="setting-title-text">{props.title}</span>
        <button class="setting-link-btn" tabIndex={-1}
          onClick={() => {
            const url = `${window.location.pathname}?highlight=${props.settingKey}`;
            window.history.replaceState({}, "", url);
            navigator.clipboard.writeText(window.location.toString());
          }}>
          <LinkSvg />
        </button>
      </div>
      <Show when={props.inputs !== undefined}>
        <div class="setting-grid">
          <Show when={props.description !== undefined && props.description !== ""}>
            <div class="setting-desc">{props.description}</div>
          </Show>
          <div class="setting-inputs">{props.inputs}</div>
        </div>
      </Show>
      <Show when={props.fullWidthInputs !== undefined}>
        <div class="setting-fullwidth">{props.fullWidthInputs}</div>
      </Show>
    </div>
  );
}

function Section(props: { id: string; title: string; children: any }) {
  const [open, setOpen] = createSignal(true);
  return (
    <div id={`group_${props.id}`}>
      <button class="setting-section-btn" onClick={() => setOpen((o) => !o)}>
        <ChevronSvg class={`setting-chevron ${open() ? "" : "closed"}`} />
        <span>{props.title}</span>
      </button>
      <Show when={open()}>
        <div class="setting-section-body">
          {props.children}
          <div class="setting-section-spacer" />
        </div>
      </Show>
    </div>
  );
}

function Btn(props: {
  value: string;
  active: boolean;
  onClick: () => void;
  label?: string;
  danger?: boolean;
}) {
  return (
    <button
      class={`sd-btn${props.active ? " active" : ""}${props.danger ? " danger" : ""}`}
      data-value={props.value}
      onClick={props.onClick}
    >
      {props.label ?? props.value}
    </button>
  );
}

function Toggle(props: { value: boolean; onChange: (v: boolean) => void; offLabel?: string; onLabel?: string }) {
  return (
    <div class="sd-btn-group">
      <Btn value="off" active={!props.value} onClick={() => props.onChange(false)} label={props.offLabel ?? "off"} />
      <Btn value="on" active={props.value} onClick={() => props.onChange(true)} label={props.onLabel ?? "on"} />
    </div>
  );
}

function FontFamilyInputs(props: { hasLocalFont: () => boolean | undefined; refetch: () => void }) {
  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <div class="grid gap-2 self-end">
      <Show when={!props.hasLocalFont()}
        fallback={
          <button class="sd-btn danger"
            onClick={async () => {
              await fileStorage.deleteFile("LocalFontFamilyFile");
              props.refetch();
              window.dispatchEvent(new CustomEvent("configChange", { detail: { key: "fontFamily", value: configStore.fontFamily } }));
            }}>
            remove local font
          </button>
        }>
        <>
          <input type="file" id="customFontUploadSolid"
            accept="font/woff,font/woff2,font/ttf,font/otf"
            style="display:none"
            onChange={async (e) => {
              const input = e.target as HTMLInputElement;
              const file = input.files?.[0];
              if (!file) return;
              if (!/font\/(woff|woff2|ttf|otf)/.exec(file.type) && !/\.(woff|woff2|ttf|otf)$/i.exec(file.name)) {
                alert("Unsupported font format, must be woff, woff2, ttf or otf.");
                input.value = "";
                return;
              }
              const dataUrl = await readFileAsDataURL(file);
              await fileStorage.storeFile("LocalFontFamilyFile", dataUrl);
              props.refetch();
              window.dispatchEvent(new CustomEvent("configChange", { detail: { key: "fontFamily", value: configStore.fontFamily } }));
              input.value = "";
            }} />
          <label for="customFontUploadSolid"
            class="sd-btn"
            style="cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:0.5em;width:100%;">
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/></svg>
            use local font
          </label>
        </>
      </Show>
    </div>
  );
}

function FontFamilyGrid(props: { hasLocalFont: () => boolean | undefined }) {
  const [customInput, setCustomInput] = createSignal(false);
  const [customVal, setCustomVal] = createSignal("");

  const isCustomFont = () =>
    !(KNOWN_FONTS as readonly string[]).includes(configStore.fontFamily);

  const sorted = [...KNOWN_FONTS].filter(f => f !== "monospace").sort((a, b) => {
    const da = a.replace(/_/g, " ").toLowerCase();
    const db = b.replace(/_/g, " ").toLowerCase();
    return da.localeCompare(db);
  });

  return (
    <Show when={!props.hasLocalFont()}>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(13.5rem,1fr));gap:0.5rem;">
        <For each={sorted}>
          {(option) => {
            const displayString = option.replace(/_/g, " ");
            const fontFamily = fontFamilyName(option);
            return (
              <div style={`font-family: "${fontFamily}"`}>
                <button class={`sd-btn${configStore.fontFamily === option ? " active" : ""}`}
                  style="width:100%;"
                  onClick={() => setConfig("fontFamily" as any, option)}>
                  {displayString}
                </button>
              </div>
            );
          }}
        </For>
        <button class={`sd-btn${isCustomFont() ? " active" : ""}`}
          style="width:100%;"
          onClick={() => setCustomInput(!customInput())}>
          {isCustomFont() ? `custom (${configStore.fontFamily.replace(/_/g, " ")})` : "custom"}
        </button>
      </div>
      <Show when={customInput()}>
        <div style="display:flex;gap:0.5rem;margin-top:0.5rem;">
          <input type="text" class="sd-input" placeholder="font name" value={customVal()}
            onInput={(e) => setCustomVal(e.currentTarget.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { setConfig("fontFamily" as any, customVal().trim().replace(/\s+/g, "_")); setCustomInput(false); setCustomVal(""); } }}
            style="flex:1;" />
          <button class="sd-btn active"
            onClick={() => { setConfig("fontFamily" as any, customVal().trim().replace(/\s+/g, "_")); setCustomInput(false); setCustomVal(""); }}>
            apply
          </button>
        </div>
      </Show>
    </Show>
  );
}

function FontFamilyWrapper() {
  const [hasLocalFont, { refetch }] = createResource(async () =>
    fileStorage.hasFile("LocalFontFamilyFile"),
  );
  return (
    <Setting settingKey="fontFamily" icon="&#128196;" title="font family" description={<>Change the font family used by the website.<br /><span style="font-size:0.75rem;color:var(--sub);">Note: Local fonts are not sent to the server and will not persist across devices.</span></>}
      inputs={<FontFamilyInputs hasLocalFont={hasLocalFont} refetch={refetch} />}
      fullWidthInputs={<FontFamilyGrid hasLocalFont={hasLocalFont} />} />
  );
}

function SimpleModal(props: {
  open: boolean;
  title: string;
  children: any;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  confirmDanger?: boolean;
}) {
  return (
    <Show when={props.open}>
      <div class="simple-modal-overlay" onClick={props.onClose}>
        <div class="simple-modal" onClick={(e) => e.stopPropagation()}>
          <div class="simple-modal-header">
            <span>{props.title}</span>
            <button class="simple-modal-close" onClick={props.onClose}>&times;</button>
          </div>
          <div class="simple-modal-body">{props.children}</div>
          <Show when={props.onConfirm}>
            <div class="simple-modal-footer">
              <button class="sd-btn" onClick={props.onClose}>cancel</button>
              <button class={`sd-btn${props.confirmDanger ? " danger" : ""}`} onClick={props.onConfirm}>
                {props.confirmText ?? "confirm"}
              </button>
            </div>
          </Show>
        </div>
      </div>
    </Show>
  );
}

export default function SettingsPage() {
  const c = () => configStore;

  const [showImportModal, setShowImportModal] = createSignal(false);
  const [importJson, setImportJson] = createSignal("");
  const [showResetModal, setShowResetModal] = createSignal(false);
  const [showExportModal, setShowExportModal] = createSignal(false);
  const [exportJson, setExportJson] = createSignal("");

  function set<K extends keyof typeof configStore>(key: K, val: (typeof configStore)[K]) {
    setConfig(key as any, val as any);
  }

  const btns = (opts: string[], key: keyof typeof configStore, labels?: Record<string, string>) => (
    <div class="sd-btn-group">
      {opts.map((v) => (
        <Btn
          value={v}
          active={(c() as any)[key] === v}
          onClick={() => set(key as any, v as any)}
          label={labels?.[v]}
        />
      ))}
    </div>
  );

  return (
    <div class="page pageSettings" id="pageSettings">
      <div class="settings-inner">
        {/* Quick Nav */}
        <div class="qn-wrap">
          <div class="qn-grid">
            <a href="#group_behavior" class="qn-btn">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></svg>
              behavior
            </a>
            <a href="#group_input" class="qn-btn">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M20 5H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 12H4V7h16v10z"/></svg>
              input
            </a>
            <a href="#group_sound" class="qn-btn">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
              sound
            </a>
            <a href="#group_caret" class="qn-btn">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M7 24l4-10H4l9-14h2l-3 10h8z"/></svg>
              caret
            </a>
            <a href="#group_appearance" class="qn-btn">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10zm0-18c4.42 0 8 3.58 8 8 0 4.42-3.58 8-8 8s-8-3.58-8-8c0-4.42 3.58-8 8-8z"/></svg>
              appearance
            </a>
            <a href="#group_theme" class="qn-btn">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M20 15.31L23.31 12 20 8.69V4h-4.69L12 .69 8.69 4H4v4.69L.69 12 4 15.31V20h4.69L12 23.31 15.31 20H20v-4.69zM12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/></svg>
              theme
            </a>
            <a href="#group_hideElements" class="qn-btn">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
              hide elements
            </a>
            <a href="#group_dangerZone" class="qn-btn">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
              danger zone
            </a>
          </div>
        </div>

        {/* Tip */}
        <Show when={c().showKeyTips}>
          <div class="settings-tip">
            tip: You can also change all these settings quickly using the
            command line
            <br />( <kbd>ctrl/cmd</kbd> + <kbd>shift</kbd> + <kbd>p</kbd> or <kbd>esc</kbd> )
          </div>
        </Show>

        {/* Sections */}
        <div class="sections">

          {/* ===== BEHAVIOR ===== */}
          <Section id="behavior" title="behavior">
            <Setting
              settingKey="difficulty"
              icon="&#9733;"
              title="test difficulty"
              description="Normal is the classic typing test experience. Expert fails the test if you submit (press space) an incorrect word. Master fails if you press a single incorrect key (meaning you have to achieve 100% accuracy)."
              inputs={btns(["normal", "expert", "master"] as Difficulty[], "difficulty")}
            />

            <Setting
              settingKey="quickRestart"
              icon="&#8635;"
              title="quick restart"
              description={<span>Press <kbd>tab</kbd>, <kbd>esc</kbd> or <kbd>enter</kbd> to quickly restart the test, or to quickly jump to the test page. These options disable tab navigation on most parts of the website. Using the "esc" option will move opening the commandline to the <kbd>tab</kbd> key.</span>}
              inputs={btns(["off", "tab", "esc", "enter"] as QuickRestart[], "quickRestart")}
            />

            <Setting
              settingKey="repeatQuotes"
              icon="&#8635;"
              title="repeat quotes"
              description="This setting changes the restarting behavior when typing in quote mode. Changing it to 'typing' will repeat the quote if you restart while typing."
              inputs={btns(["off", "typing"] as RepeatQuotes[], "repeatQuotes")}
            />

            <Setting
              settingKey="blindMode"
              icon="&#128064;"
              title="blind mode"
              description="No errors or incorrect words are highlighted. Helps you to focus on raw speed. If enabled, quick end is recommended."
              inputs={<Toggle value={c().blindMode} onChange={(v) => set("blindMode", v)} />}
            />

            <Setting
              settingKey="alwaysShowWordsHistory"
              icon="&#9776;"
              title="always show words history"
              description="This option will automatically show the words history at the end of the test. Can cause slight lag with a lot of words."
              inputs={<Toggle value={c().alwaysShowWordsHistory} onChange={(v) => set("alwaysShowWordsHistory", v)} />}
            />

            <Setting
              settingKey="singleListCommandLine"
              icon="&#9776;"
              title="single list command line"
              description={<span>When enabled, it will show the command line with all commands in a single list instead of submenu arrangements. Selecting 'manual' will expose all commands only after typing <kbd>&gt;</kbd>.</span>}
              inputs={btns(["manual", "on"] as SingleListCommandLine[], "singleListCommandLine")}
            />

            <Setting
              settingKey="minWpm"
              icon="&#9885;"
              title="min speed"
              description="Automatically fails a test if your speed falls below a threshold."
              inputs={
                <div class="sd-input-group">
                  <Show when={c().minWpm === "custom"}>
                    <input type="number" placeholder="min speed" class="sd-input" min="0" value={c().minWpmCustomSpeed} onInput={(e) => set("minWpmCustomSpeed", parseInt(e.currentTarget.value) || 0)} />
                  </Show>
                  {btns(["off", "custom"] as MinWpm[], "minWpm")}
                </div>
              }
            />

            <Setting
              settingKey="minAcc"
              icon="&#9885;"
              title="min accuracy"
              description="Automatically fails a test if your accuracy falls below a threshold."
              inputs={
                <div class="sd-input-group">
                  <Show when={c().minAcc === "custom"}>
                    <input type="number" placeholder="min accuracy" class="sd-input" min="0" value={c().minAccCustom} onInput={(e) => set("minAccCustom", parseInt(e.currentTarget.value) || 0)} />
                  </Show>
                  {btns(["off", "custom"] as MinAcc[], "minAcc")}
                </div>
              }
            />

            <Setting
              settingKey="minBurst"
              icon="&#9885;"
              title="min burst"
              description="Automatically fails a test if your raw for a single word falls below this threshold. Selecting 'flex' allows for this threshold to automatically decrease for longer words."
              inputs={
                <div class="sd-input-group">
                  <Show when={c().minBurst !== "off"}>
                    <input type="number" placeholder="min burst" class="sd-input" min="0" value={c().minBurstCustomSpeed} onInput={(e) => set("minBurstCustomSpeed", parseInt(e.currentTarget.value) || 0)} />
                  </Show>
                  {btns(["off", "fixed", "flex"] as MinBurst[], "minBurst")}
                </div>
              }
            />

            <Setting
              settingKey="britishEnglish"
              icon="&#127760;"
              title="british english"
              description="When enabled, the website will use the British spelling instead of American. Note that this might not replace all words correctly."
              inputs={<Toggle value={c().britishEnglish} onChange={(v) => set("britishEnglish", v)} />}
            />

            <Setting
              settingKey="language"
              icon="&#127760;"
              title="language"
              description="Change in which language you want to type."
              inputs={
                <select class="sd-select" value={c().language} onChange={(e) => set("language", e.currentTarget.value)}>
                  <option value="english">english</option>
                  <option value="english_advanced">english advanced</option>
                  <option value="code">code</option>
                  <option value="code_javascript">code javascript</option>
                </select>
              }
            />
          </Section>

          {/* ===== INPUT ===== */}
          <Section id="input" title="input">
            <Setting settingKey="freedomMode" icon="&#10002;" title="freedom mode" description="Allows you to delete any word, even if it was typed correctly." inputs={<Toggle value={c().freedomMode} onChange={(v) => set("freedomMode", v)} />} />
            <Setting settingKey="strictSpace" icon="&#8722;" title="strict space" description="Pressing space at the beginning of a word will insert a space character when this mode is enabled." inputs={<Toggle value={c().strictSpace} onChange={(v) => set("strictSpace", v)} />} />
            <Setting settingKey="oppositeShiftMode" icon="&#8646;" title="opposite shift mode" description={<span>This mode will force you to use opposite <kbd>shift</kbd> keys for shifting. Using an incorrect one will count as an error.</span>} inputs={btns(["off", "on", "keymap"] as OppositeShiftMode[], "oppositeShiftMode")} />
            <Setting settingKey="stopOnError" icon="&#9995;" title="stop on error" description="Letter mode will stop input when pressing any incorrect letters. Word mode will not allow you to continue to the next word until you correct all mistakes." inputs={btns(["off", "word", "letter"] as StopOnError[], "stopOnError")} />
            <Setting settingKey="confidenceMode" icon="&#9003;" title="confidence mode" description="When enabled, you will not be able to go back to previous words to fix mistakes. When turned up to the max, you won't be able to backspace at all." inputs={btns(["off", "on", "max"] as ConfidenceMode[], "confidenceMode")} />
            <Setting settingKey="quickEnd" icon="&#9197;" title="quick end" description="This only applies to the words mode - when enabled, the test will end as soon as the last word has been typed, even if it's incorrect." inputs={<Toggle value={c().quickEnd} onChange={(v) => set("quickEnd", v)} />} />
            <Setting settingKey="indicateTypos" icon="&#10069;" title="indicate typos" description='Shows typos that you have made. "Below" shows what you typed below the letters, "replace" will replace the letters with the ones you typed and "both" will do the same as replace and below, but it will show the correct letters below your mistakes.' inputs={btns(["off", "below", "replace", "both"] as IndicateTypos[], "indicateTypos")} />
            <Setting settingKey="hideExtraLetters" icon="&#128064;" title="hide extra letters" description="Hides extra letters. This will completely avoid words jumping lines (due to changing width), but might feel a bit confusing when you press a key and nothing happens." inputs={<Toggle value={c().hideExtraLetters} onChange={(v) => set("hideExtraLetters", v)} />} />
            <Setting settingKey="compositionDisplay" icon="&#127760;" title="composition display" description='Change how composition is displayed. "off" will just underline the letter if composition is active. "below" will show the composed character below the test. "replace" will replace the letter in the test with the composed character.' inputs={btns(["off", "below", "replace"] as CompositDisplay[], "compositionDisplay")} />
            <Setting settingKey="lazyMode" icon="&#128054;" title="lazy mode" description="Replaces accents / diacritics / special characters with their normal letter equivalents." inputs={<Toggle value={c().lazyMode} onChange={(v) => set("lazyMode", v)} />} />
            <Setting settingKey="layout" icon="&#9000;" title="layout emulator" description="With this setting you can emulate other layouts. This setting is best kept off, as it can break things like dead keys and alt layers." inputs={
              <select class="sd-select" value={c().layout} onChange={(e) => set("layout", e.currentTarget.value)}>
                <option value="default">off (default)</option>
                <option value="qwerty">qwerty</option>
                <option value="dvorak">dvorak</option>
                <option value="colemak">colemak</option>
                <option value="colemak_dh">colemak dh</option>
                <option value="colemak_dhk">colemak dhk</option>
                <option value="colemak_dh_matrix">colemak dh matrix</option>
                <option value="workman">workman</option>
                <option value="norman">norman</option>
                <option value="halmak">halmak</option>
                <option value="qwertz">qwertz</option>
                <option value="azerty">azerty</option>
                <option value="azerty_AFNOR">azerty AFNOR</option>
                <option value="bepo">bepo</option>
                <option value="uk_qwerty">uk qwerty</option>
                <option value="spanish_qwerty">spanish qwerty</option>
                <option value="italian_qwerty">italian qwerty</option>
                <option value="swedish_qwerty">swedish qwerty</option>
                <option value="norwegian_qwerty">norwegian qwerty</option>
                <option value="danish_qwerty">danish qwerty</option>
                <option value="portuguese_pt_qwerty_iso">portuguese pt qwerty iso</option>
                <option value="japanese_hiragana">japanese hiragana</option>
                <option value="russian">russian</option>
                <option value="korean">korean</option>
                <option value="carian">carian</option>
              </select>
            } />
            <Setting settingKey="codeUnindentOnBackspace" icon="&lt;/&gt;" title="code unindent on backspace" description="Automatically go back to the previous line when deleting line leading tab characters. Only works in code languages." inputs={<Toggle value={c().codeUnindentOnBackspace} onChange={(v) => set("codeUnindentOnBackspace", v)} />} />
          </Section>

          {/* ===== SOUND ===== */}
          <Section id="sound" title="sound">
            <Setting settingKey="soundVolume" icon="&#128265;" title="sound volume" description="Change the volume of the sound effects." inputs={
              <div class="sd-range">
                <span class="sd-range-val">{c().soundVolume.toFixed(1)}</span>
                <input type="range" min={0} max={1} step={0.1} value={c().soundVolume}
                  onInput={(e) => {
                    const v = parseFloat(e.currentTarget.value);
                    set("soundVolume", v);
                    if (c().playSoundOnClick === "off") previewClick("1"); else playClick();
                  }} />
              </div>
            } />
            <Setting settingKey="playSoundOnClick" icon="&#128266;" title="play sound on click" description="Plays a short sound when you press a key."
              fullWidthInputs={
                <div class="sd-btn-group sd-btn-group-wide">
                  {(["off", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26"] as const).map((v) => {
                    const labels: Record<string, string> = { off: "off", "1": "click", "2": "beep", "3": "pop", "4": "nk creams", "5": "typewriter", "6": "osu", "7": "hitmarker", "8": "sine", "9": "sawtooth", "10": "square", "11": "triangle", "12": "pentatonic", "13": "wholetone", "14": "fist fight", "15": "rubber keys", "16": "fart", "17": "akko lavenders", "18": "cherrymx black abs", "19": "cherrymx black pbt", "20": "cherrymx blue abs", "21": "cherrymx blue pbt", "22": "cherrymx brown pbt", "23": "kalih box white", "24": "razer green", "25": "tealios v2", "26": "trust gxt" };
                    const vc = v as PlaySoundOnClick;
                    return <Btn value={v} active={c().playSoundOnClick === v} onClick={async () => { await previewClick(vc); if (c().playSoundOnClick !== v) set("playSoundOnClick", v); }} label={labels[v]} />;
                  })}
                </div>
              } />
            <Setting settingKey="playSoundOnError" icon="&#128263;" title="play sound on error" description="Plays a short sound if you press an incorrect key or press space too early."
              fullWidthInputs={
                <div class="sd-btn-group sd-btn-group-wide">
                  {(["off", "1", "2", "3", "4"] as PlaySoundOnError[]).map((v) => {
                    const labels: Record<string, string> = { off: "off", "1": "damage", "2": "triangle", "3": "square", "4": "missed punch" };
                    return <Btn value={v} active={c().playSoundOnError === v} onClick={async () => { await previewError(v); if (c().playSoundOnError !== v) set("playSoundOnError", v); }} label={labels[v]} />;
                  })}
                </div>
              } />
            <Setting settingKey="playTimeWarning" icon="&#9888;" title="play time warning" description="Play a short warning sound if you are close to the end of a timed test."
              fullWidthInputs={
                <div class="sd-btn-group sd-btn-group-wide">
                  {(["off", "1", "3", "5", "10"] as PlayTimeWarning[]).map((v) => {
                    const labels: Record<string, string> = { off: "off", "1": "1 second", "3": "3 seconds", "5": "5 seconds", "10": "10 seconds" };
                    return <Btn value={v} active={c().playTimeWarning === v} onClick={() => { if (c().playTimeWarning !== v) { set("playTimeWarning", v); if (v !== "off") playTimeWarningSound(); } }} label={labels[v]} />;
                  })}
                </div>
              } />
          </Section>

          {/* ===== CARET ===== */}
          <Section id="caret" title="caret">
            <Setting settingKey="smoothCaret" icon='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 512" width="16" height="16" fill="currentColor"><path d="M96 0c-17.7 0-32 14.3-32 32s14.3 32 32 32h24l.1 160H80c-17.7 0-32 14.3-32 32s14.3 32 32 32h40l.1 160H96c-17.7 0-32 14.3-32 32s14.3 32 32 32h64c17.7 0 32-14.3 32-32s-14.3-32-32-32h-8l-.1-160H144c17.7 0 32-14.3 32-32s-14.3-32-32-32h-8l-.1-160H160c17.7 0 32-14.3 32-32s-14.3-32-32-32H96z"/></svg>' title="smooth caret" description="The caret will move smoothly between letters and words." inputs={btns(SMOOTH_CARET, "smoothCaret")} />
            <Setting settingKey="caretStyle" icon='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 512" width="16" height="16" fill="currentColor"><path d="M96 0c-17.7 0-32 14.3-32 32s14.3 32 32 32h24l.1 160H80c-17.7 0-32 14.3-32 32s14.3 32 32 32h40l.1 160H96c-17.7 0-32 14.3-32 32s14.3 32 32 32h64c17.7 0 32-14.3 32-32s-14.3-32-32-32h-8l-.1-160H144c17.7 0 32-14.3 32-32s-14.3-32-32-32h-8l-.1-160H160c17.7 0 32-14.3 32-32s-14.3-32-32-32H96z"/></svg>' title="caret style" description="Change the style of the caret during the test."
              fullWidthInputs={
                <div class="sd-btn-group">
                  {CARET_STYLES.map((v) => (
                    <Btn value={v} active={c().caretStyle === v} onClick={() => set("caretStyle", v)}
                      label={v === "off" ? "off" : v === "default" ? "|" : v === "block" ? "\u25A0" : v === "outline" ? "\u25A3" : v === "underline" ? "_" : v} />
                  ))}
                </div>
              } />
            <Setting settingKey="paceCaret" icon='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 512" width="16" height="16" fill="currentColor"><path d="M96 0c-17.7 0-32 14.3-32 32s14.3 32 32 32h24l.1 160H80c-17.7 0-32 14.3-32 32s14.3 32 32 32h40l.1 160H96c-17.7 0-32 14.3-32 32s14.3 32 32 32h64c17.7 0 32-14.3 32-32s-14.3-32-32-32h-8l-.1-160H144c17.7 0 32-14.3 32-32s-14.3-32-32-32h-8l-.1-160H160c17.7 0 32-14.3 32-32s-14.3-32-32-32H96z"/></svg>' title="pace caret" description="Displays a second caret that moves at constant speed. The 'average' option averages the speed of last 10 results. The 'tag pb' option takes the highest PB of any active tag. The 'daily' option takes the highest speed of the last 24 hours." inputs={
              <div class="sd-input-group">
                <input type="number" placeholder="wpm" class="sd-input" min="0" value={c().paceCaretCustomSpeed} onInput={(e) => { set("paceCaretCustomSpeed", parseInt(e.currentTarget.value) || 0); if (c().paceCaret === "off") set("paceCaret", "custom"); }} />
                {btns(PACE_CARET, "paceCaret", { tagPb: "tag pb" })}
              </div>
            } />
            <Setting settingKey="repeatedPace" icon='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 512" width="16" height="16" fill="currentColor"><path d="M96 0c-17.7 0-32 14.3-32 32s14.3 32 32 32h24l.1 160H80c-17.7 0-32 14.3-32 32s14.3 32 32 32h40l.1 160H96c-17.7 0-32 14.3-32 32s14.3 32 32 32h64c17.7 0 32-14.3 32-32s-14.3-32-32-32h-8l-.1-160H144c17.7 0 32-14.3 32-32s-14.3-32-32-32h-8l-.1-160H160c17.7 0 32-14.3 32-32s-14.3-32-32-32H96z"/></svg>' title="repeated pace" description="When repeating a test, a pace caret will automatically be enabled for one test with the speed of your previous test. It does not override the pace caret if it's already enabled." inputs={<Toggle value={c().repeatedPace} onChange={(v) => set("repeatedPace", v)} />} />
            <Setting settingKey="paceCaretStyle" icon='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 512" width="16" height="16" fill="currentColor"><path d="M96 0c-17.7 0-32 14.3-32 32s14.3 32 32 32h24l.1 160H80c-17.7 0-32 14.3-32 32s14.3 32 32 32h40l.1 160H96c-17.7 0-32 14.3-32 32s14.3 32 32 32h64c17.7 0 32-14.3 32-32s-14.3-32-32-32h-8l-.1-160H144c17.7 0 32-14.3 32-32s-14.3-32-32-32h-8l-.1-160H160c17.7 0 32-14.3 32-32s-14.3-32-32-32H96z"/></svg>' title="pace caret style" description="Change the style of the pace caret during the test."
              fullWidthInputs={
                <div class="sd-btn-group">
                  {CARET_STYLES.map((v) => (
                    <Btn value={v} active={c().paceCaretStyle === v} onClick={() => set("paceCaretStyle", v)}
                      label={v === "off" ? "off" : v === "default" ? "|" : v === "block" ? "\u25A0" : v === "outline" ? "\u25A3" : v === "underline" ? "_" : v} />
                  ))}
                </div>
              } />
          </Section>

          {/* ===== APPEARANCE ===== */}
          <Section id="appearance" title="appearance">
            <Setting settingKey="timerStyle" icon="&#9679;" title="live progress style" description='Change the style of the timer/word count during a test. "Flash" styles will briefly show the timer in timed modes every 15 seconds.'
              fullWidthInputs={
                <div class="sd-btn-group sd-btn-group-wide">
                  {TIMER_STYLES.map((v) => (
                    <Btn value={v} active={c().timerStyle === v} onClick={() => set("timerStyle", v)} label={v.replace(/_/g, " ")} />
                  ))}
                </div>
              } />
            <Setting settingKey="liveSpeedStyle" icon="&#8599;" title="live speed style" description="Change the style of the live speed displayed during the test." inputs={btns(LIVE_STYLES, "liveSpeedStyle")} />
            <Setting settingKey="liveAccStyle" icon="&#8599;" title="live accuracy style" description="Change the style of the live accuracy displayed during the test." inputs={btns(LIVE_STYLES, "liveAccStyle")} />
            <Setting settingKey="liveBurstStyle" icon="&#8599;" title="live burst style" description="Change the style of the live burst speed displayed during the test." inputs={btns(LIVE_STYLES, "liveBurstStyle")} />
            <Setting settingKey="timerColor" icon="&#9679;" title="live stats color" description="Change the color of the progress, live speed, accuracy and burst text." inputs={btns(TIMER_COLORS, "timerColor")} />
            <Setting settingKey="timerOpacity" icon="&#9679;" title="live stats opacity" description="Change the opacity of the progress, live speed, burst and accuracy text." inputs={btns(TIMER_OPACITIES, "timerOpacity")} />
            <Setting settingKey="highlightMode" icon="&#9986;" title="highlight mode" description="Change what is highlighted during the test."
              fullWidthInputs={
                <div class="sd-btn-group sd-btn-group-wide">
                  {HIGHLIGHT_MODES.map((v) => (
                    <Btn value={v} active={c().highlightMode === v} onClick={() => set("highlightMode", v)} label={v.replace(/_/g, " ")} />
                  ))}
                </div>
              } />
            <Setting settingKey="typedEffect" icon="&#128065;" title="typed effect" description="Change how typed words are shown." inputs={btns(TYPED_EFFECTS, "typedEffect")} />
            <Setting settingKey="tapeMode" icon="&#127912;" title="tape mode" description="Only shows one line which scrolls horizontally. Setting this to 'word' will make it scroll after every word and 'letter' will scroll after every keypress." inputs={btns(TAPE_MODES, "tapeMode")} />
            <Setting settingKey="tapeMargin" icon="&#127912;" title="tape margin" description="When in tape mode, set the carets position from the left edge of the typing test as a percentage (for example, 50% centers it)." inputs={
              <input type="number" placeholder="tape margin" class="sd-input" min="10" max="90" value={c().tapeMargin} onInput={(e) => set("tapeMargin", parseInt(e.currentTarget.value) || 50)} />
            } />
            <Setting settingKey="smoothLineScroll" icon="&#9776;" title="smooth line scroll" description="When enabled, the line transition will be animated." inputs={<Toggle value={c().smoothLineScroll} onChange={(v) => set("smoothLineScroll", v)} />} />
            <Setting settingKey="showAllLines" icon="&#9776;" title="show all lines" description="When enabled, the website will show all lines for word, custom and quote mode tests - otherwise the lines will be limited to 3, and will automatically scroll." inputs={<Toggle value={c().showAllLines} onChange={(v) => set("showAllLines", v)} />} />
            <Setting settingKey="alwaysShowDecimalPlaces" icon="00" title="always show decimal places" description="Always shows decimal places for values on the result page, without the need to hover over the stats." inputs={<Toggle value={c().alwaysShowDecimalPlaces} onChange={(v) => set("alwaysShowDecimalPlaces", v)} />} />
            <Setting settingKey="typingSpeedUnit" icon="&#8599;" title="typing speed unit" description="Display typing speed in the specified unit." inputs={btns(TYPING_SPEED_UNITS, "typingSpeedUnit")} />
            <Setting settingKey="startGraphsAtZero" icon="&#128200;" title="start graphs at zero" description="Force graph axis to always start at zero, no matter what the data is. Turning this off may exaggerate the value changes." inputs={<Toggle value={c().startGraphsAtZero} onChange={(v) => set("startGraphsAtZero", v)} />} />
            <Setting settingKey="maxLineWidth" icon="&#8596;" title="max line width" description="Change the maximum width of the typing test, measured in characters. Setting this to 0 will align the words to the edges of the content area." inputs={
              <input type="number" placeholder="max line width" class="sd-input" min="0" value={c().maxLineWidth} onInput={(e) => set("maxLineWidth", parseInt(e.currentTarget.value) || 0)} />
            } />
            <Setting settingKey="fontSize" icon="&#128196;" title="font size" description="Change the font size of the test words." inputs={
              <input type="number" placeholder="font size" class="sd-input" value={c().fontSize} onInput={(e) => set("fontSize", parseFloat(e.currentTarget.value) || 2)} />
            } />
            <FontFamilyWrapper />
            <Setting settingKey="keymapMode" icon="&#9000;" title="keymap" description="Displays your current layout while taking a test. React shows what you pressed and Next shows what you need to press next." inputs={btns(["off", "static", "react", "next"] as KeymapMode[], "keymapMode")} />
            <Show when={c().keymapMode !== "off"}>
              <Setting settingKey="keymapStyle" icon="&#9000;" title="keymap style" description="Change the style of the keymap."
                fullWidthInputs={
                  <div class="sd-btn-group sd-btn-group-wide">
                    {KEYMAP_STYLES.map((v) => (
                      <Btn value={v} active={c().keymapStyle === v} onClick={() => set("keymapStyle", v)} label={v.replace(/_/g, " ")} />
                    ))}
                  </div>
                } />
              <Setting settingKey="keymapLegendStyle" icon="&#9000;" title="keymap legend style" description="Change the legend style of the keymap."
                fullWidthInputs={btns(KEYMAP_LEGEND_STYLES, "keymapLegendStyle") as any} />
              <Setting settingKey="keymapShowTopRow" icon="&#9000;" title="keymap show top row" description="Control when the top row is shown on the keymap."
                fullWidthInputs={
                  <div class="sd-btn-group sd-btn-group-wide">
                    {KEYMAP_SHOW_TOP_ROWS.map((v) => (
                      <Btn value={v} active={c().keymapShowTopRow === v} onClick={() => set("keymapShowTopRow", v)} label={v === "layout" ? "layout dependent" : v} />
                    ))}
                  </div>
                } />
              <Setting settingKey="keymapLayout" icon="&#9000;" title="keymap layout" description="Controls which layout is displayed on the keymap." inputs={
                <select class="sd-select" value={c().keymapLayout} onChange={(e) => set("keymapLayout", e.currentTarget.value as KeymapLayout)}>
                  <option value="overrideSync">emulator sync</option>
                  <option value="qwerty">qwerty</option>
                  <option value="dvorak">dvorak</option>
                  <option value="colemak">colemak</option>
                  <option value="workman">workman</option>
                </select>
              } />
              <Setting settingKey="keymapSize" icon="&#9000;" title="keymap size" description="Change the size of the keymap." inputs={
                <div class="sd-range">
                  <span class="sd-range-val">{c().keymapSize.toFixed(1)}</span>
                  <input type="range" min={0.5} max={3.5} step={0.1} value={c().keymapSize} onInput={(e) => set("keymapSize", parseFloat(e.currentTarget.value))} />
                </div>
              } />
            </Show>
          </Section>

          {/* ===== THEME ===== */}
          <Section id="theme" title="theme">
            <Setting settingKey="flipTestColors" icon="&#9681;" title="flip test colors" description="By default, typed text is brighter than the future text. When enabled, the colors will be flipped and the future text will be brighter than the already typed text." inputs={<Toggle value={c().flipTestColors} onChange={(v) => set("flipTestColors", v)} />} />
            <Setting settingKey="colorfulMode" icon="&#127912;" title="colorful mode" description="When enabled, the test words will use the main color, instead of the text color, making the website more colorful." inputs={<Toggle value={c().colorfulMode} onChange={(v) => set("colorfulMode", v)} />} />
            <Setting settingKey="customBackground" icon="&#128247;" title="custom background" description="Set an image url or local image to be a custom background image." inputs={
              <div class="sd-input-group">
                <input type="text" placeholder="image url" class="sd-input sd-input-wide" value={c().customBackground} onInput={(e) => set("customBackground", e.currentTarget.value)} />
                {btns(["cover", "contain", "max"] as CustomBackgroundSize[], "customBackgroundSize")}
              </div>
            } />
            <Setting settingKey="autoSwitchTheme" icon="&#127912;" title="auto switch theme" description="Enabling this will automatically switch the theme between light and dark depending on the system theme." inputs={<Toggle value={c().autoSwitchTheme} onChange={(v) => set("autoSwitchTheme", v)} />} />
            <Setting settingKey="randomTheme" icon="&#128256;" title="randomize theme" description="After completing a test, the theme will be set to a random one. The random themes are not saved to your config."
              fullWidthInputs={btns(["off", "on", "fav", "light", "dark", "auto", "custom"] as RandomTheme[], "randomTheme", { fav: "favorite" }) as any} />

            {/* Theme selector */}
            <Setting
              settingKey="theme"
              icon="&#127912;"
              title="theme"
              description="Select the theme or create your own."
              inputs={
                <div class="sd-btn-group sd-btn-group-cols2">
                  <button class={`sd-btn${!c().customTheme ? " active" : ""}`} onClick={() => set("customTheme", false)}>preset</button>
                  <button class={`sd-btn${c().customTheme ? " active" : ""}`} onClick={() => set("customTheme", true)}>custom</button>
                </div>
              }
              fullWidthInputs={
                <>
                  <Show when={!c().customTheme}>
                    <div class="theme-grid">
                      <For each={SORTED_THEMES}>
                        {(t) => (
                          <button class={`theme-card${c().theme === t.name ? " active" : ""}`}
                            onClick={() => set("theme", t.name)}
                            style={{ "--t-bg": t.colors[0], "--t-main": t.colors[1], "--t-sub": t.colors[3], "--t-text": t.colors[2] }}>
                            <div class="theme-card-name">{t.label}</div>
                            <div class="theme-card-dots">
                              <span class="theme-dot" style="background:var(--t-bg)"></span>
                              <span class="theme-dot" style="background:var(--t-main)"></span>
                              <span class="theme-dot" style="background:var(--t-sub)"></span>
                            </div>
                          </button>
                        )}
                      </For>
                    </div>
                  </Show>
                  <Show when={c().customTheme}>
                    <div class="custom-theme">
                      <div class="custom-colors">
                        {[{ key: "background", idx: 0 }, { key: "sub alt", idx: 4 }, { key: "main", idx: 1 }, { key: "sub", idx: 3 }, { key: "caret", idx: 2 }, { key: "text", idx: 5 }, { key: "error", idx: 6 }, { key: "extra error", idx: 7 }].map(({ key, idx }) => (
                          <div class="custom-color-row">
                            <label>{key}</label>
                            <div class="custom-color-picker">
                              <input type="text" class="sd-input" value={c().customThemeColors[idx]} onInput={(e) => { const colors = [...c().customThemeColors]; colors[idx] = e.currentTarget.value; set("customThemeColors", colors as any); }} />
                              <input type="color" value={c().customThemeColors[idx]} onInput={(e) => { const colors = [...c().customThemeColors]; colors[idx] = e.currentTarget.value; set("customThemeColors", colors as any); }} />
                            </div>
                          </div>
                        ))}
                        <div class="custom-color-section-label">when colorful mode is enabled:</div>
                        {[{ key: "error", idx: 8 }, { key: "extra error", idx: 9 }].map(({ key, idx }) => (
                          <div class="custom-color-row">
                            <label>{key}</label>
                            <div class="custom-color-picker">
                              <input type="text" class="sd-input" value={c().customThemeColors[idx]} onInput={(e) => { const colors = [...c().customThemeColors]; colors[idx] = e.currentTarget.value; set("customThemeColors", colors as any); }} />
                              <input type="color" value={c().customThemeColors[idx]} onInput={(e) => { const colors = [...c().customThemeColors]; colors[idx] = e.currentTarget.value; set("customThemeColors", colors as any); }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Show>
                </>
              }
            />
          </Section>

          {/* ===== HIDE ELEMENTS ===== */}
          <Section id="hideElements" title="hide elements">
            <Setting settingKey="showKeyTips" icon="&#10068;" title="key tips" description="Shows the keybind tips at the bottom of the page." inputs={<Toggle value={c().showKeyTips} onChange={(v) => set("showKeyTips", v)} offLabel="hide" onLabel="show" />} />
            <Setting settingKey="showOutOfFocusWarning" icon="&#10069;" title="out of focus warning" description="Shows an out of focus reminder after 1 second of being 'out of focus' (not being able to type)." inputs={<Toggle value={c().showOutOfFocusWarning} onChange={(v) => set("showOutOfFocusWarning", v)} offLabel="hide" onLabel="show" />} />
            <Setting settingKey="capsLockWarning" icon="&#9888;" title="caps lock warning" description="Displays a warning when caps lock is on." inputs={<Toggle value={c().capsLockWarning} onChange={(v) => set("capsLockWarning", v)} offLabel="hide" onLabel="show" />} />
            <Setting settingKey="showAverage" icon="&#128200;" title="average" description="Displays your average speed and/or accuracy over the last 10 tests." inputs={btns(["off", "speed", "acc", "both"] as ShowAverage[], "showAverage")} />
          </Section>

          {/* ===== DANGER ZONE ===== */}
          <Section id="dangerZone" title="danger zone">
            <Setting settingKey="importExport" icon="&#9881;" title="import/export settings" description="Import or export the settings as JSON." inputs={
              <div class="sd-btn-group sd-btn-group-cols2">
                <button class="sd-btn" onClick={() => {
                  const json = JSON.stringify(c(), null, 2);
                  setExportJson(json);
                  setShowExportModal(true);
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(json)
                      .then(() => showSuccessNotification("Settings copied to clipboard"))
                      .catch(() => {});
                  }
                }}>export</button>
                <button class="sd-btn" onClick={() => { setImportJson(""); setShowImportModal(true); }}>import</button>
              </div>
            } />
            <Setting settingKey="ads" icon="&#128250;" title="ads" description='You can disable or enable ads at any time. "Result" will show one ad on the result page, "on" will add floating vertical banners, and "sellout" will add multiple ads on every page. (changes will take effect after a refresh).' inputs={btns(["off", "result", "on", "sellout"] as Ads[], "ads")} />
            <Setting settingKey="resetSettings" icon="&#8635;" title="reset settings" description={<span>Resets settings to the default (but doesn not touch your tags and presets).<br /><span class="text-error">You can not undo this action!</span></span>} inputs={
              <button class="sd-btn danger" onClick={() => setShowResetModal(true)}>reset settings</button>
            } />
          </Section>

          <SimpleModal open={showImportModal()} title="import settings" onClose={() => { setShowImportModal(false); setImportJson(""); }}
            onConfirm={() => {
              try {
                const parsed = JSON.parse(importJson());
                setFullConfig({ ...getDefaultConfig(), ...parsed });
                setShowImportModal(false);
                setImportJson("");
                showSuccessNotification("Settings imported");
              } catch {
                showErrorNotification("Failed to import settings: invalid JSON");
              }
            }} confirmText="import">
            <textarea class="simple-modal-textarea" placeholder="Paste settings JSON here..." rows={10}
              value={importJson()} onInput={(e) => setImportJson(e.currentTarget.value)} />
          </SimpleModal>

          <SimpleModal open={showResetModal()} title="Are you sure?" onClose={() => setShowResetModal(false)}
            onConfirm={() => {
              setFullConfig(getDefaultConfig());
              setShowResetModal(false);
              showSuccessNotification("Settings reset to defaults");
            }} confirmText="reset" confirmDanger>
            <p>This will reset all settings to their defaults. This cannot be undone!</p>
          </SimpleModal>

          <SimpleModal open={showExportModal()} title="config JSON" onClose={() => { setShowExportModal(false); setExportJson(""); }}>
            <textarea class="simple-modal-textarea" rows={10} readonly
              value={exportJson()} onClick={(e) => (e.target as HTMLTextAreaElement).select()} />
          </SimpleModal>

        </div>
      </div>
    </div>
  );
}
