import { createSignal, createEffect, Show, onMount, onCleanup } from "solid-js";
import type { RandomTheme } from "./types";
import { AuthProvider, useAuth } from "./lib/AuthProvider";
import { saveTypingResult, updateUserStats } from "./lib/auth";
import { updateLeaderboardEntry, updateWeeklyXp } from "./lib/leaderboard-store";
import AccountPage from "./components/AccountPage";
import AccountSettingsPage from "./components/AccountSettingsPage";
import FriendsPage from "./components/FriendsPage";
import PublicProfilePage from "./components/PublicProfilePage";
import { useResults } from "./lib/results-store";
import { configStore, getConfig, setConfig, setFullConfig, setModeSilent } from "./lib/config-store";
import { setText, setLimitMode, restoreFromSnapshot, customTextStore } from "./lib/custom-text-store";
import type { CustomTextSettings } from "./lib/custom-text-store";
import { themes } from "./types";
import fileStorage from "./lib/file-storage";
import Header from "./components/Header";
import TestConfig from "./components/TestConfig";
import TypingTest, { getLastWords, getPracticeWords } from "./components/TypingTest";
import Results from "./components/Results";
import Footer from "./components/Footer";
import CommandLine from "./components/CommandLine";
import QuoteSearchModal from "./components/QuoteSearchModal";
import { quoteSearchOpen, setQuoteSearchOpen } from "./lib/modal-store";
import { focusActive, setFocusActive } from "./lib/focus-store";
import LoginPage from "./components/LoginPage";
import LeaderboardPage from "./components/LeaderboardPage";
import AboutPage from "./components/AboutPage";
import AiPage from "./components/AiPage";
import SettingsPage from "./components/SettingsPage";
import TermsPage from "./components/TermsPage";
import SecurityPage from "./components/SecurityPage";
import PrivacyPage from "./components/PrivacyPage";
import Notifications from "./components/Notifications";
import type { TestStats } from "./types";
import { FONT_CDN, SYSTEM_FONTS, fontFamilyName } from "./lib/fonts";

type Page = "test" | "login" | "account" | "accountSettings" | "friends" | "publicProfile" | "leaderboards" | "about" | "ai" | "settings" | "terms" | "security" | "privacy";

function isLightTheme(themeName: string): boolean {
  const t = themes.find(t => t.name === themeName);
  if (!t) return false;
  const bg = t.colors[0];
  const r = parseInt(bg.slice(1, 3), 16);
  const g = parseInt(bg.slice(3, 5), 16);
  const b = parseInt(bg.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
}

function pickRandomTheme(mode: RandomTheme, favThemes: string[]): string | null {
  let pool: string[];
  switch (mode) {
    case "on":
      pool = themes.map(t => t.name);
      break;
    case "fav":
      pool = favThemes.length > 0 ? [...favThemes] : themes.map(t => t.name);
      break;
    case "light":
      pool = themes.filter(t => isLightTheme(t.name)).map(t => t.name);
      break;
    case "dark":
      pool = themes.filter(t => !isLightTheme(t.name)).map(t => t.name);
      break;
    case "auto": {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      pool = themes.filter(t => isLightTheme(t.name) === !isDark).map(t => t.name);
      break;
    }
    case "custom":
      pool = themes.map(t => t.name);
      break;
    default:
      return null;
  }
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

let _savedPracticeMode: string | null = null;
let _savedCustomText: CustomTextSettings | null = null;

function AppContent() {
  const { store } = useAuth();
  const { addResult } = useResults();
  const [testKey, setTestKey] = createSignal(0);
  const [result, setResult] = createSignal<TestStats | null>(null);
  const [showingResult, setShowingResult] = createSignal(false);
  const [repeatWordset, setRepeatWordset] = createSignal<string[] | null>(null);
  const [cmdOpen, setCmdOpen] = createSignal(false);
  const [activePage, setActivePage] = createSignal<Page>("test");
  const [profileUid, setProfileUid] = createSignal<string>("");
  const [profileName, setProfileName] = createSignal<string>("");

  createEffect(() => {
    if (!store.loading && store.user) {
      const redirect = sessionStorage.getItem("oauthRedirect");
      if (redirect) {
        sessionStorage.removeItem("oauthRedirect");
        setActivePage("test");
      }
    }
  });

  createEffect(() => {
    if (!store.loading && window.location.pathname === "/auth/callback") {
      window.history.replaceState({}, "", "/");
    }
  });

  createEffect(() => {
    const c = configStore;
    const root = document.documentElement;
    let colors: string[];
    if (c.customTheme) {
      colors = c.customThemeColors;
    } else {
      const t = themes.find(t => t.name === c.theme);
      if (t) {
        colors = [...t.colors];
        colors[2] = colors[2] || colors[1];
        colors[3] = colors[3] || colors[0];
        colors[4] = colors[4] || colors[0];
        colors[5] = colors[5] || colors[3];
        colors[6] = colors[6] || "#ca4754";
        colors[7] = colors[7] || "#7e2a33";
      } else {
        return;
      }
    }
    root.style.setProperty("--bg", colors[0]);
    root.style.setProperty("--main", colors[1]);
    root.style.setProperty("--caret", colors[2]);
    root.style.setProperty("--sub", colors[3]);
    root.style.setProperty("--sub-alt", colors[4]);
    root.style.setProperty("--fg", colors[5]);
    root.style.setProperty("--text", colors[5]);
    root.style.setProperty("--error", colors[6]);
    root.style.setProperty("--error-extra", colors[7]);
    root.style.setProperty("--correct", colors[5]);
    root.style.setProperty("--incorrect", colors[6]);
    root.style.setProperty("--extra", colors[6]);
    root.style.setProperty("--untyped", colors[3]);
    root.style.setProperty("--missing", colors[7]);
  });

  createEffect(() => {
    const c = configStore;
    if (!c.autoSwitchTheme) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const target = mq.matches ? c.themeDark : c.themeLight;
      if (c.theme !== target) {
        setConfig("theme", target);
      }
    };
    handler();
    mq.addEventListener("change", handler);
    onCleanup(() => mq.removeEventListener("change", handler));
  });

  const loadedUrls = new Set<string>();

  function loadCSS(url: string) {
    if (loadedUrls.has(url)) return;
    loadedUrls.add(url);
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;
    document.head.appendChild(link);
  }

  async function applyFontFamily() {
    const root = document.documentElement;
    const rawFont = configStore.fontFamily;
    let font = fontFamilyName(rawFont);

    const localFont = await fileStorage.getFile("LocalFontFamilyFile");
    const customStyle = document.getElementById("custom-font-face");
    if (localFont === undefined) {
      if (customStyle) customStyle.remove();
      const cdn = FONT_CDN[rawFont];
      if (cdn) {
        loadCSS(cdn.url);
      } else if (!SYSTEM_FONTS.has(font)) {
        loadCSS(
          `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, "+")}:wght@300;400;500;700&display=swap`,
        );
      }
    } else {
      font = "LOCALCUSTOM";
      if (!customStyle) {
        const style = document.createElement("style");
        style.id = "custom-font-face";
        document.head.appendChild(style);
      }
      const el = document.getElementById("custom-font-face")!;
      el.textContent = `
        @font-face {
          font-family: LOCALCUSTOM;
          src: url(${localFont});
          font-weight: 400;
          font-style: normal;
          font-display: block;
        }`;
    }

    root.style.setProperty(
      "--font",
      `"${font}", "Roboto Mono", monospace`,
    );
  }

  createEffect(() => {
    applyFontFamily();
  });

  function restart() { setRepeatWordset(null); setShowingResult(false); setResult(null); setTestKey(k => k + 1); }
  function handleNextTest() {
    if (_savedPracticeMode) {
      if (_savedCustomText) {
        restoreFromSnapshot(_savedCustomText);
        _savedCustomText = null;
      }
      setConfig("mode", _savedPracticeMode as any);
      _savedPracticeMode = null;
      return;
    }
    restart();
  }
  function handleRepeatTest() { const words = getLastWords(); setRepeatWordset(words); setShowingResult(false); setResult(null); setTestKey(k => k + 1); }
  function handlePracticeTest() {
    const words = getPracticeWords();
    if (words.length === 0) return;
    _savedPracticeMode = configStore.mode;
    _savedCustomText = { ...customTextStore, text: [...customTextStore.text] };
    setText(words);
    setLimitMode("word");
    setModeSilent("custom");
    restart();
  }

  async function handleComplete(s: TestStats) {
    setResult(s);
    setShowingResult(true);
    const baseMode = s.mode;
    const name = store.user?.email?.split("@")[0] || undefined;
    const modeVal = configStore.mode === "time" ? String(configStore.time) : configStore.mode === "words" ? String(configStore.wordCount) : undefined;
    addResult(s.wpm, s.accuracy, s.raw, s.consistency, baseMode, name, s.difficulty, s.language, s.punctuation, s.numbers, configStore.funbox, modeVal);
    if (store.user) {
      await saveTypingResult({
        mode: baseMode,
        wpm: s.wpm,
        accuracy: s.accuracy,
        raw: s.raw,
        consistency: s.consistency,
        correctChars: s.correctChars,
        incorrectChars: s.incorrectChars,
        extraChars: s.extraChars,
        missedChars: s.missedChars,
        duration: s.elapsed,
      });
      await updateUserStats(store.user.uid, s.wpm, s.accuracy, s.raw, s.consistency, s.elapsed, baseMode);
      if (modeVal) {
        await updateLeaderboardEntry(
          store.user.uid, store.user.displayName || name || "User",
          baseMode.split(" ")[0], modeVal, s.language,
          s.wpm, s.accuracy, s.raw, s.consistency,
        );
        await updateWeeklyXp(
          store.user.uid, store.user.displayName || name || "User",
          s.wpm, s.accuracy,
        );
      }
    }
    const rt = configStore.randomTheme;
    if (rt !== "off") {
      const pick = pickRandomTheme(rt, configStore.favThemes);
      if (pick && pick !== configStore.theme) {
        setConfig("theme", pick);
      }
    }
  }

  function handleGlobalKey(e: KeyboardEvent) {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "p") {
      e.preventDefault();
      setCmdOpen(o => !o);
      return;
    }
    if (activePage() !== "test") return;
    const inCmdLine = (e.target as HTMLElement).closest(".command-line, .command-line-overlay");
    if (e.key === "Escape" && !inCmdLine) { e.preventDefault(); setCmdOpen(o => !o); return; }
    if (cmdOpen() || inCmdLine) return;
    if (e.key === "Tab" || e.key === "Enter") { e.preventDefault(); handleNextTest(); }
  }

  const RESTART_KEYS = new Set(["mode", "time", "wordCount", "punctuation", "numbers", "difficulty", "quoteLength"]);

  let lastMousePos = { x: 0, y: 0 };

  function onMouseMove(e: MouseEvent) {
    if (Math.abs(e.clientX - lastMousePos.x) > 3 || Math.abs(e.clientY - lastMousePos.y) > 3) {
      setFocusActive(false);
    }
    lastMousePos = { x: e.clientX, y: e.clientY };
  }

  function onFocusTyping() {
    setFocusActive(true);
  }

  createEffect(() => {
    document.body.style.cursor = focusActive() ? "none" : "";
  });

  function onConfigChange(e: Event) {
    const detail = (e as CustomEvent).detail;
    if (detail && detail.key && RESTART_KEYS.has(detail.key)) {
      handleNextTest();
    }
  }

  function onQuoteSelected() { handleNextTest(); }

  onMount(() => {
    document.addEventListener("keydown", handleGlobalKey);
    window.addEventListener("configChange", onConfigChange);
    window.addEventListener("quoteSelected", onQuoteSelected);
    document.addEventListener("mousemove", onMouseMove);
    window.addEventListener("focusTyping", onFocusTyping);
  });
  onCleanup(() => {
    document.removeEventListener("keydown", handleGlobalKey);
    window.removeEventListener("configChange", onConfigChange);
    window.removeEventListener("quoteSelected", onQuoteSelected);
    document.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("focusTyping", onFocusTyping);
  });

  return (
    <div class="app dark" data-focused={focusActive() ? "" : undefined}>
      <Header activePage={activePage()} onNavigate={setActivePage} onRestart={handleNextTest} onViewOwnProfile={() => { if (store.user?.uid) { setProfileUid(store.user.uid); setProfileName(store.user.displayName || ""); setActivePage("publicProfile"); } }} />
      <Notifications />
      <Show when={quoteSearchOpen()}>
        <QuoteSearchModal onClose={() => setQuoteSearchOpen(false)} />
      </Show>
      <Show when={activePage() === "test"}>
        <TestConfig />
        <main class="main">
          <Show when={!showingResult()} fallback={<Results stats={result()!} onRestart={handleNextTest} onRepeat={handleRepeatTest} onPractice={handlePracticeTest} />}>
            <TypingTest restartKey={testKey()} onComplete={handleComplete} repeatWords={repeatWordset() ?? undefined} isPractice={!!_savedPracticeMode} />
          </Show>
        </main>
        <Footer onNavigate={setActivePage} />
        <CommandLine
          open={cmdOpen()}
          onClose={() => setCmdOpen(false)}
          onRestart={handleNextTest}
        />
      </Show>
      <Show when={activePage() === "login"}>
        <LoginPage onBack={() => setActivePage("test")} onLogin={() => setActivePage("test")} />
      </Show>
      <Show when={activePage() === "account"}>
        <AccountPage onNavigate={setActivePage} />
      </Show>
      <Show when={activePage() === "accountSettings"}>
        <AccountSettingsPage onNavigate={setActivePage} />
      </Show>
      <Show when={activePage() === "friends"}>
        <FriendsPage onNavigate={setActivePage} onViewProfile={(uid, name) => { setProfileUid(uid); setProfileName(name || ""); setActivePage("publicProfile"); }} />
      </Show>
      <Show when={activePage() === "publicProfile"}>
        <PublicProfilePage uid={profileUid()} name={profileName()} onNavigate={setActivePage} />
      </Show>
      <Show when={activePage() === "leaderboards"}>
        <LeaderboardPage onBack={() => setActivePage("test")} />
      </Show>
      <Show when={activePage() === "about"}>
        <AboutPage />
      </Show>
      <Show when={activePage() === "ai"}>
        <AiPage />
      </Show>
      <Show when={activePage() === "settings"}>
        <SettingsPage />
      </Show>
      <Show when={activePage() === "terms"}>
        <TermsPage />
      </Show>
      <Show when={activePage() === "security"}>
        <SecurityPage />
      </Show>
      <Show when={activePage() === "privacy"}>
        <PrivacyPage />
      </Show>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
