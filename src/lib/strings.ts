const TYPOGRAPHY_MAP: Record<string, string> = {
  "\u201C": '"',
  "\u201D": '"',
  "\u201E": '"',
  "\u2018": "'",
  "\u2019": "'",
  "\u201A": "'",
  "\u2013": "-",
  "\u2014": "-",
  "\u2026": "...",
};

export function cleanTypographySymbols(text: string): string {
  return text
    .split("")
    .map((ch) => TYPOGRAPHY_MAP[ch] ?? ch)
    .join("");
}

export function replaceControlCharacters(text: string): string {
  return text
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\0/g, "\0");
}
