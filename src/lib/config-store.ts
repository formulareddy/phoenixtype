import { createStore, reconcile } from "solid-js/store";
import type { FullConfig } from "../types";
import { getDefaultConfig } from "../types";

const CONFIG_KEY = "monkeytype-replica-config";

function loadFromStorage(): FullConfig {
  try {
    const saved = localStorage.getItem(CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as FullConfig;
      return { ...getDefaultConfig(), ...parsed };
    }
  } catch { /* ignore */ }
  return getDefaultConfig();
}

function saveToStorage(config: FullConfig): void {
  try { localStorage.setItem(CONFIG_KEY, JSON.stringify(config)); } catch { /* ignore */ }
}

const initial = loadFromStorage();
const [store, setStore] = createStore<FullConfig>(initial);

saveToStorage(initial);

export { store as configStore };

export function getConfig(): FullConfig {
  return store;
}

type OverrideFn = (value: any, currentConfig: FullConfig) => Partial<FullConfig>;

const configOverrides: Partial<Record<keyof FullConfig, OverrideFn>> = {
  freedomMode: (value) => {
    if (value) return { confidenceMode: "off" } as any;
    return {};
  },
  confidenceMode: (value) => {
    if (value !== "off") return { freedomMode: false, stopOnError: "off" } as any;
    return {};
  },
  stopOnError: (value) => {
    if (value !== "off") return { confidenceMode: "off" } as any;
    return {};
  },
  mode: (value, currentConfig) => {
    if (value === "custom" || value === "quote" || value === "zen") {
      return { punctuation: false, numbers: false } as any;
    }
    return {};
  },
  tapeMode: (value) => {
    if (value !== "off") return { showAllLines: false } as any;
    return {};
  },
  keymapLayout: (_value, currentConfig) => {
    if (currentConfig.keymapMode === "off") return { keymapMode: "static" } as any;
    return {};
  },
  keymapStyle: (_value, currentConfig) => {
    if (currentConfig.keymapMode === "off") return { keymapMode: "static" } as any;
    return {};
  },
  keymapLegendStyle: (_value, currentConfig) => {
    if (currentConfig.keymapMode === "off") return { keymapMode: "static" } as any;
    return {};
  },
  keymapShowTopRow: (_value, currentConfig) => {
    if (currentConfig.keymapMode === "off") return { keymapMode: "static" } as any;
    return {};
  },
  keymapSize: (_value, currentConfig) => {
    if (currentConfig.keymapMode === "off") return { keymapMode: "static" } as any;
    return {};
  },
  theme: () => ({ customTheme: false } as any),
};

export function setConfig<K extends keyof FullConfig>(key: K, value: FullConfig[K]): void {
  const current: FullConfig = { ...store as any, [key]: value };
  setStore(key, value);

  const override = configOverrides[key] as OverrideFn | undefined;
  if (override) {
    const overrides = override(value, current);
    for (const [ok, ov] of Object.entries(overrides)) {
      if (current[ok as keyof FullConfig] !== ov) {
        setConfig(ok as keyof FullConfig, ov as any);
      }
    }
  }

  saveToStorage({ ...store as any });
  window.dispatchEvent(new CustomEvent("configChange", { detail: { key, value } }));
}

export function setFullConfig(config: FullConfig): void {
  setStore(reconcile(config));
  saveToStorage(config);
  window.dispatchEvent(new CustomEvent("configChange", { detail: { key: "__full", value: null } }));
}

export function setModeSilent(mode: FullConfig["mode"]): void {
  setStore("mode", mode);
}
