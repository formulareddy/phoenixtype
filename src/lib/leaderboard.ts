export type LeaderboardTimeframe = "daily" | "weekly" | "monthly" | "yearly" | "all_time";
export type LeaderboardMode = "time" | "words";
export type LeaderboardMode2 = "15" | "30" | "60" | "120" | "10" | "25" | "50" | "100";

export interface LeaderboardSelection {
  type: LeaderboardTimeframe;
  language: string;
  mode: LeaderboardMode;
  mode2: LeaderboardMode2;
  previous: boolean;
  friendsOnly: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  wpm: number;
  acc: number;
  raw: number;
  consistency: number;
  timestamp: number;
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  count: number;
}

export const mode2Options: { mode: LeaderboardMode; value: LeaderboardMode2; label: string }[] = [
  { mode: "time", value: "15", label: "15" },
  { mode: "time", value: "30", label: "30" },
  { mode: "time", value: "60", label: "60" },
  { mode: "time", value: "120", label: "120" },
  { mode: "words", value: "10", label: "10" },
  { mode: "words", value: "25", label: "25" },
  { mode: "words", value: "50", label: "50" },
  { mode: "words", value: "100", label: "100" },
];

export const languages = [
  "english", "english_5k", "spanish", "french", "german",
  "portuguese", "italian", "dutch", "polish", "russian",
];

export const defaultSelection: LeaderboardSelection = {
  type: "all_time",
  language: "english",
  mode: "time",
  mode2: "30",
  previous: false,
  friendsOnly: false,
};
