import rawQuotesData from "./quotes-data.json";
import { getApprovedQuotes } from "./submission-store";

export interface Quote {
  id: number;
  text: string;
  source: string;
  length: number;
}

export interface QuoteDataFile {
  language: string;
  groups: [number, number][];
  quotes: { text: string; source: string; length: number; id: number }[];
}

export interface SearchResult {
  quotes: Quote[];
  matchedTerms: string[];
}

const data = rawQuotesData as QuoteDataFile;

const groups = data.groups;

function charLengthToGroup(charLength: number): number {
  for (let i = 0; i < groups.length; i++) {
    if (charLength >= groups[i][0] && charLength <= groups[i][1]) {
      return i;
    }
  }
  return groups.length - 1;
}

const staticQuotes: Quote[] = data.quotes.map(q => ({
  text: q.text,
  source: q.source,
  length: charLengthToGroup(q.length),
  id: q.id,
}));

function getAllQuotes(): Quote[] {
  const approved = getApprovedQuotes().map(a => ({
    text: a.text,
    source: a.source,
    length: a.length,
    id: a.id,
  }));
  return approved.length > 0 ? [...staticQuotes, ...approved] : staticQuotes;
}

export function getQuotes(): Quote[] {
  return getAllQuotes();
}

export function getQuoteById(id: number): Quote | undefined {
  return getAllQuotes().find(q => q.id === id);
}

export function getQuotesByLength(groupsIn: number[]): Quote[] {
  return getAllQuotes().filter(q => groupsIn.includes(q.length));
}

export function parseSearchQuery(input: string): { exactPhrases: string[]; terms: string[] } {
  const exactPhrases: string[] = [];
  const terms: string[] = [];
  let remaining = input.trim();
  const phraseRe = /"([^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = phraseRe.exec(remaining)) !== null) {
    exactPhrases.push(match[1].toLowerCase());
  }
  remaining = remaining.replace(phraseRe, "").trim();
  if (remaining) {
    for (const t of remaining.split(/\s+/)) {
      const clean = t.toLowerCase();
      if (clean) terms.push(clean);
    }
  }
  return { exactPhrases, terms };
}

export function searchQuotes(text: string, lengthGroups: number[], favorites: number[]): SearchResult {
  let results = getQuotesByLength(lengthGroups);
  if (favorites.length > 0) {
    results = results.filter(q => favorites.includes(q.id));
  }
  const trimmed = text.trim();
  if (!trimmed) return { quotes: results, matchedTerms: [] };

  const idMatch = /^(\d+)$/.exec(trimmed);
  if (idMatch) {
    const id = parseInt(idMatch[1], 10);
    const found = results.filter(q => q.id === id);
    if (found.length > 0) return { quotes: found, matchedTerms: [`#${id}`] };
  }

  const { exactPhrases, terms } = parseSearchQuery(trimmed);
  if (exactPhrases.length === 0 && terms.length === 0) return { quotes: results, matchedTerms: [] };

  const matchedTermsSet = new Set<string>();
  const filtered = results.filter(q => {
    const lower = q.text.toLowerCase();
    const sourceLower = q.source.toLowerCase();

    for (const phrase of exactPhrases) {
      if (!lower.includes(phrase) && !sourceLower.includes(phrase)) return false;
    }
    for (const t of terms) {
      if (!lower.includes(t) && !sourceLower.includes(t)) return false;
    }

    exactPhrases.forEach(p => matchedTermsSet.add(p));
    terms.forEach(t => matchedTermsSet.add(t));
    return true;
  });

  return { quotes: filtered, matchedTerms: Array.from(matchedTermsSet) };
}

export function highlightText(text: string, matchedTerms: string[]): string {
  if (matchedTerms.length === 0) return text;
  const escaped = matchedTerms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(${escaped.join("|")})`, "gi");
  return text.replace(pattern, '<span class="qs-matched">$1</span>');
}
