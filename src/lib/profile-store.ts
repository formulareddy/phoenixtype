import { createStore } from "solid-js/store";
import { DEFAULT_AVATAR_ID } from "./avatars";

const PROFILE_KEY = "monkeytype-replica-profile";

export interface UserProfile {
  bio: string;
  keyboard: string;
  github: string;
  twitter: string;
  instagram: string;
  website: string;
  avatarId: number;
  customAvatar: string;
  showActivityOnPublicProfile: boolean;
}

const defaults: UserProfile = {
  bio: "",
  keyboard: "",
  github: "",
  twitter: "",
  instagram: "",
  website: "",
  avatarId: DEFAULT_AVATAR_ID,
  customAvatar: "",
  showActivityOnPublicProfile: true,
};

function loadFromStorage(): UserProfile {
  try {
    const saved = localStorage.getItem(PROFILE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<UserProfile>;
      return { ...defaults, ...parsed };
    }
  } catch { /* ignore */ }
  return { ...defaults };
}

function saveToStorage(profile: UserProfile): void {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch { /* ignore */ }
}

const initial = loadFromStorage();
const [store, setStore] = createStore<UserProfile>(initial);

export { store as profileStore };

export function updateProfile(updates: Partial<UserProfile>): void {
  setStore(updates);
  saveToStorage({ ...store, ...updates });
}

export function getProfile(): UserProfile {
  return { ...store };
}
