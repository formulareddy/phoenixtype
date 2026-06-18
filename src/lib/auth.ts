import {
  auth,
  db,
  googleProvider,
  githubProvider,
  setFirebasePersistence,
  isAuthAvailable,
} from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  updatePassword as fbUpdatePassword,
  updateProfile,
} from "firebase/auth";
import { doc, updateDoc, increment, getDoc, deleteDoc } from "firebase/firestore";
import { getFirebaseErrorMessage } from "./firebase-errors";
import { createUserDoc, checkNameAvailability } from "./user-store";

function getAuth() {
  if (!isAuthAvailable()) throw new Error("Firebase not configured. Set VITE_FIREBASE_* env vars.");
  return auth!;
}

export async function signUp(email: string, password: string, username: string) {
  try {
    const available = await checkNameAvailability(username);
    if (!available) return { data: null, error: "Username already taken" };
    const fbAuth = getAuth();
    const userCred = await createUserWithEmailAndPassword(fbAuth, email, password);
    await updateProfile(userCred.user, { displayName: username });
    await createUserDoc(userCred.user.uid, username, email);
    return { data: userCred, error: null };
  } catch (err: any) {
    return { data: null, error: getFirebaseErrorMessage(err) };
  }
}

export async function signIn(email: string, password: string, rememberMe = true) {
  try {
    const fbAuth = getAuth();
    await setFirebasePersistence(rememberMe);
    const userCred = await signInWithEmailAndPassword(fbAuth, email, password);
    return { data: userCred, error: null };
  } catch (err: any) {
    return { data: null, error: getFirebaseErrorMessage(err) };
  }
}

export async function signInWithProvider(provider: "google" | "github", rememberMe = true) {
  try {
    const fbAuth = getAuth();
    await setFirebasePersistence(rememberMe);
    const p = provider === "google" ? googleProvider! : githubProvider!;
    const result = await signInWithPopup(fbAuth, p);
    return { data: result, error: null };
  } catch (err: any) {
    if (err.code === "auth/popup-closed-by-user") {
      return { data: null, error: null };
    }
    return { data: null, error: getFirebaseErrorMessage(err) };
  }
}

export async function signOut() {
  try {
    const fbAuth = getAuth();
    await fbSignOut(fbAuth);
    return { error: null };
  } catch (err: any) {
    return { error: getFirebaseErrorMessage(err) };
  }
}

export async function resetPassword(email: string) {
  try {
    const fbAuth = getAuth();
    await sendPasswordResetEmail(fbAuth, email);
    return { error: null };
  } catch (err: any) {
    return { error: getFirebaseErrorMessage(err) };
  }
}

export async function updatePassword(password: string) {
  try {
    const fbAuth = getAuth();
    const user = fbAuth.currentUser;
    if (!user) return { error: "No user logged in" };
    await fbUpdatePassword(user, password);
    return { error: null };
  } catch (err: any) {
    return { error: getFirebaseErrorMessage(err) };
  }
}

const TYPING_RESULTS_KEY = "mt-results-user";

export async function saveTypingResult(data: {
  mode: string;
  wpm: number;
  accuracy: number;
  raw: number;
  consistency: number;
  correctChars: number;
  incorrectChars: number;
  extraChars: number;
  missedChars: number;
  duration: number;
}) {
  try {
    const fbAuth = getAuth();
    const user = fbAuth.currentUser;
    if (!user) return { error: null };

    const key = `${TYPING_RESULTS_KEY}-${user.uid}`;
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    existing.push({
      id: generateId(),
      name: user.displayName || user.email?.split("@")[0] || "user",
      wpm: data.wpm,
      acc: data.accuracy,
      raw: data.raw,
      consistency: data.consistency,
      mode: data.mode,
      duration: data.duration,
      timestamp: Date.now(),
    });
    localStorage.setItem(key, JSON.stringify(existing));
    return { error: null };
  } catch (err: any) {
    console.warn("Failed to save typing result:", err.message);
    return { error: err.message };
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export async function updateDisplayName(name: string) {
  try {
    const fbAuth = getAuth();
    const user = fbAuth.currentUser;
    if (!user) return "No user logged in";
    await updateProfile(user, { displayName: name });
    return null;
  } catch (err: any) {
    return err.code || err.message;
  }
}

export async function sendEmailVerification() {
  try {
    const fbAuth = getAuth();
    const user = fbAuth.currentUser;
    if (!user) return "No user logged in";
    const { sendEmailVerification: fbSendEmailVerification } = await import("firebase/auth");
    await fbSendEmailVerification(user);
    return null;
  } catch (err: any) {
    return err.code || err.message;
  }
}

export async function sendPasswordReset(email: string) {
  return resetPassword(email);
}

export async function updateUserEmail(newEmail: string) {
  try {
    const fbAuth = getAuth();
    const user = fbAuth.currentUser;
    if (!user) return "No user logged in";
    const { verifyBeforeUpdateEmail } = await import("firebase/auth");
    await verifyBeforeUpdateEmail(user, newEmail);
    return null;
  } catch (err: any) {
    return err.code || err.message;
  }
}

export async function updateUserPassword(
  currentPassword: string,
  newPassword: string,
) {
  try {
    const fbAuth = getAuth();
    const user = fbAuth.currentUser;
    if (!user) return "No user logged in";
    const { EmailAuthProvider, reauthenticateWithCredential } = await import(
      "firebase/auth"
    );
    const credential = EmailAuthProvider.credential(
      user.email!,
      currentPassword,
    );
    await reauthenticateWithCredential(user, credential);
    const { updatePassword: fbUpdatePassword2 } = await import("firebase/auth");
    await fbUpdatePassword2(user, newPassword);
    return null;
  } catch (err: any) {
    return err.code || err.message;
  }
}

export async function addPasswordAuth(password: string) {
  try {
    const fbAuth = getAuth();
    const user = fbAuth.currentUser;
    if (!user) return "No user logged in";
    const { EmailAuthProvider, linkWithCredential } = await import(
      "firebase/auth"
    );
    const credential = EmailAuthProvider.credential(user.email!, password);
    await linkWithCredential(user, credential);
    return null;
  } catch (err: any) {
    return err.code || err.message;
  }
}

export async function removePasswordAuth() {
  try {
    const fbAuth = getAuth();
    const user = fbAuth.currentUser;
    if (!user) return "No user logged in";
    const { unlink } = await import("firebase/auth");
    await unlink(user, "password");
    return null;
  } catch (err: any) {
    return err.code || err.message;
  }
}

export async function linkGoogleAccount() {
  try {
    const fbAuth = getAuth();
    const user = fbAuth.currentUser;
    if (!user) return "No user logged in";
    const { linkWithPopup } = await import("firebase/auth");
    await linkWithPopup(user, googleProvider!);
    return null;
  } catch (err: any) {
    if (err.code === "auth/popup-closed-by-user") return "Popup was closed before linking completed";
    if (err.code === "auth/credential-already-in-use") {
      return "This account is already linked to another user.";
    }
    return err.code || err.message;
  }
}

export async function unlinkGoogleAccount() {
  try {
    const fbAuth = getAuth();
    const user = fbAuth.currentUser;
    if (!user) return "No user logged in";
    const { unlink } = await import("firebase/auth");
    await unlink(user, "google.com");
    return null;
  } catch (err: any) {
    return err.code || err.message;
  }
}

export async function linkGithubAccount() {
  try {
    const fbAuth = getAuth();
    const user = fbAuth.currentUser;
    if (!user) return "No user logged in";
    const { linkWithPopup } = await import("firebase/auth");
    await linkWithPopup(user, githubProvider!);
    return null;
  } catch (err: any) {
    if (err.code === "auth/popup-closed-by-user") return "Popup was closed before linking completed";
    if (err.code === "auth/credential-already-in-use") {
      return "This account is already linked to another user.";
    }
    return err.code || err.message;
  }
}

export async function unlinkGithubAccount() {
  try {
    const fbAuth = getAuth();
    const user = fbAuth.currentUser;
    if (!user) return "No user logged in";
    const { unlink } = await import("firebase/auth");
    await unlink(user, "github.com");
    return null;
  } catch (err: any) {
    return err.code || err.message;
  }
}

export async function deleteUserAccount() {
  try {
    const fbAuth = getAuth();
    const user = fbAuth.currentUser;
    if (!user) return "No user logged in";
    const key = `${TYPING_RESULTS_KEY}-${user.uid}`;
    localStorage.removeItem(key);
    if (db) await deleteDoc(doc(db, "users", user.uid));
    const { deleteUser } = await import("firebase/auth");
    await deleteUser(user);
    return null;
  } catch (err: any) {
    return err.code || err.message;
  }
}

export async function migrateLocalResults(uid: string) {
  if (!db) return;
  const key = `${TYPING_RESULTS_KEY}-${uid}`;
  const raw = localStorage.getItem(key);
  if (!raw) return;
  let results: any[];
  try { results = JSON.parse(raw); } catch { return; }
  if (!results || results.length === 0) return;

  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists() || (snap.data()?.completedTests || 0) > 0) return;

  const pbModes: Record<string, string> = {
    "15": "pb15", "30": "pb30", "60": "pb60", "120": "pb120",
    "10": "pb10", "25": "pb25", "50": "pb50", "100": "pb100",
  };

  let completedTests = 0;
  let timeTyping = 0;
  let totalXp = 0;
  const pbs: Record<string, { wpm: number; acc: number; raw: number; cons: number; date: string }> = {};

  for (const r of results) {
    completedTests++;
    timeTyping += r.duration || 0;
    totalXp += Math.round((r.wpm || 0) * ((r.acc || 0) / 100) * 10);

    const parts = (r.mode || "").split(" ");
    const baseMode = parts[0];
    const val = parts[1];
    const prefix = pbModes[val];
    if ((baseMode === "time" || baseMode === "words") && prefix) {
      const wpm = r.wpm || 0;
      if (!pbs[prefix] || wpm > pbs[prefix].wpm) {
        pbs[prefix] = {
          wpm,
          acc: r.acc || 0,
          raw: r.raw || 0,
          cons: r.consistency || 0,
          date: r.timestamp ? new Date(r.timestamp).toISOString().slice(0, 10) : "",
        };
      }
    }
  }

  const lastTestDate = results[results.length - 1]?.timestamp
    ? new Date(results[results.length - 1].timestamp).toISOString().slice(0, 10)
    : "";

  const updates: Record<string, any> = {
    startedTests: completedTests,
    completedTests,
    timeTyping,
    xp: totalXp,
    lastTestDate,
    streakLength: 1,
    streakMaxLength: 1,
  };

  for (const [prefix, pb] of Object.entries(pbs)) {
    updates[prefix + "wpm"] = pb.wpm;
    updates[prefix + "acc"] = pb.acc;
    updates[prefix + "raw"] = pb.raw;
    updates[prefix + "cons"] = pb.cons;
    updates[prefix + "date"] = pb.date;
  }

  try { await updateDoc(ref, updates); } catch { /* ignore */ }
}

export async function updateUserStats(uid: string, wpm: number, acc: number, raw: number, cons: number, duration: number, mode: string) {
  if (!db) return;
  const today = new Date().toISOString().slice(0, 10);
  const ref = doc(db, "users", uid);

  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data() as Record<string, any>;

  if (!data.completedTests) {
    await migrateLocalResults(uid);
    return;
  }

  const updates: Record<string, any> = {
    startedTests: increment(1),
    completedTests: increment(1),
    timeTyping: increment(duration),
  };

  const pbModes: Record<string, string> = {
    "15": "pb15", "30": "pb30", "60": "pb60", "120": "pb120",
    "10": "pb10", "25": "pb25", "50": "pb50", "100": "pb100",
  };

  const baseMode = mode.split(" ")[0];
  const val = mode.split(" ")[1];
  if ((baseMode === "time" || baseMode === "words") && val && pbModes[val]) {
    const prefix = pbModes[val];
    const curWpm = data[prefix + "wpm"] || 0;
    if (wpm > 0 && wpm > curWpm) {
      updates[prefix + "wpm"] = wpm;
      updates[prefix + "acc"] = acc;
      updates[prefix + "raw"] = raw;
      updates[prefix + "cons"] = cons;
      updates[prefix + "date"] = today;
    }
  }

  const xpGain = Math.round(wpm * (acc / 100) * 10);
  updates.xp = increment(xpGain);

  const lastDate = data.lastTestDate || "";
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (lastDate === today) {
    /* already counted today, don't increment streak */
  } else if (lastDate === yesterday) {
    updates.streakLength = increment(1);
  } else {
    updates.streakLength = 1;
  }
  if (data.streakMaxLength && (data.streakLength || 0) + 1 > data.streakMaxLength) {
    updates.streakMaxLength = (data.streakLength || 0) + 1;
  }
  updates.lastTestDate = today;
  try {
    await updateDoc(ref, updates);
  } catch { /* ignore */ }
}

export async function reauthenticate(password?: string) {
  try {
    const fbAuth = getAuth();
    const user = fbAuth.currentUser;
    if (!user) return "No user logged in";

    const providerIds = user.providerData.map(p => p?.providerId);
    const hasPassword = providerIds.includes("password");
    const hasGoogle = providerIds.includes("google.com");
    const hasGithub = providerIds.includes("github.com");

    if (hasPassword) {
      if (!password) return "Password required for reauthentication";
      if (!user.email) return "No email on account";
      const { EmailAuthProvider, reauthenticateWithCredential } = await import("firebase/auth");
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
    } else if (hasGoogle) {
      const { GoogleAuthProvider, reauthenticateWithPopup } = await import("firebase/auth");
      await reauthenticateWithPopup(user, new GoogleAuthProvider());
    } else if (hasGithub) {
      const { GithubAuthProvider, reauthenticateWithPopup } = await import("firebase/auth");
      await reauthenticateWithPopup(user, new GithubAuthProvider());
    }

    return null;
  } catch (err: any) {
    if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
      return "Incorrect password";
    }
    return err.code || err.message || String(err);
  }
}
