import { createContext, useContext, onMount, onCleanup } from "solid-js";
import { createStore } from "solid-js/store";
import type { ParentComponent } from "solid-js";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { auth, isAuthAvailable } from "./firebase";
import { signOut, migrateLocalResults } from "./auth";
import { createUserDoc } from "./user-store";
import { showSuccessNotification } from "./notifications";

interface AuthStore {
  user: User | null;
  loading: boolean;
  enabled: boolean;
}

const AuthContext = createContext<{
  store: AuthStore;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}>();

export const AuthProvider: ParentComponent = (props) => {
  const [store, setStore] = createStore<AuthStore>({
    user: null,
    loading: true,
    enabled: isAuthAvailable(),
  });

  async function refresh() {
    if (!auth) { setStore({ loading: false }); return; }
    const user = auth.currentUser;
    setStore({ user, loading: false, enabled: true });
  }

  async function logout() {
    const err = await signOut();
    setStore({ user: null, loading: false });
    if (!err?.error) showSuccessNotification("Signed out");
  }

  onMount(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setStore({ user, loading: false, enabled: true });
      });
      onCleanup(() => unsubscribe());
      /* Create Firestore user doc after auth state settles */
      const unsubMeta = onAuthStateChanged(auth, async (user) => {
        if (!user) return;
        const name = user.displayName || user.email?.split("@")[0] || "User";
        await createUserDoc(user.uid, name, user.email || undefined);
        await migrateLocalResults(user.uid);
      });
      onCleanup(() => unsubMeta());
    } else {
      setStore({ loading: false });
    }
  });

  return (
    <AuthContext.Provider value={{ store, refresh, logout }}>
      {props.children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
