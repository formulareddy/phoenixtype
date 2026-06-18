export const FONT_CDN: Record<string, { family: string; url: string }> = {
  Cascadia_Mono:    { family: "Cascadia Code",     url: "https://cdn.jsdelivr.net/npm/@fontsource/cascadia-code@5.2.3/400.css" },
  Open_Dyslexic:    { family: "OpenDyslexic",      url: "https://cdn.jsdelivr.net/npm/@fontsource/opendyslexic@5.2.5/400.css" },
  CommitMono:       { family: "Commit Mono",       url: "https://cdn.jsdelivr.net/npm/@fontsource/commit-mono@5.2.5/400.css" },
  Mononoki:         { family: "Mononoki",          url: "https://cdn.jsdelivr.net/npm/@fontsource/mononoki@5.2.5/400.css" },
  Adwaita_Mono:     { family: "Adwaita Mono",      url: "https://cdn.jsdelivr.net/npm/@fontsource/adwaita-mono@5.2.1/400.css" },
};

export const SYSTEM_FONTS = new Set([
  "monospace", "Courier", "Georgia", "Comic Sans MS",
]);

export function fontFamilyName(rawFont: string): string {
  const cdn = FONT_CDN[rawFont];
  if (cdn) return cdn.family;
  return rawFont.replace(/_/g, " ");
}
