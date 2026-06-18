import { createSignal, createMemo, Show } from "solid-js";
import { signUp, signIn, signInWithProvider, resetPassword } from "../lib/auth";
import { useAuth } from "../lib/AuthProvider";
import { checkNameAvailability } from "../lib/user-store";

interface Props {
  onBack: () => void;
  onLogin: () => void;
}

function Spinner() {
  return (
    <svg class="auth-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <circle cx="12" cy="12" r="10" stroke-dasharray="31.4 31.4" stroke-linecap="round" />
    </svg>
  );
}

export default function LoginPage(props: Props) {
  const { refresh } = useAuth();

  // Register fields
  const [rUsername, setRUsername] = createSignal("");
  const [rEmail, setREmail] = createSignal("");
  const [rVerifyEmail, setRVerifyEmail] = createSignal("");
  const [rPassword, setRPassword] = createSignal("");
  const [rVerifyPw, setRVerifyPw] = createSignal("");
  const [rSubmitted, setRSubmitted] = createSignal(false);
  const [rError, setRError] = createSignal("");
  const [rLoading, setRLoading] = createSignal(false);
  const [rSuccess, setRSuccess] = createSignal(false);

  // Login fields
  const [lEmail, setLEmail] = createSignal("");
  const [lPassword, setLPassword] = createSignal("");
  const [lRemember, setLRemember] = createSignal(true);
  const [lError, setLError] = createSignal("");
  const [lloading, setLLoading] = createSignal(false);

  // Forgot password
  const [showForgot, setShowForgot] = createSignal(false);
  const [fpEmail, setFpEmail] = createSignal("");
  const [fpError, setFpError] = createSignal("");
  const [fpLoading, setFpLoading] = createSignal(false);
  const [fpSuccess, setFpSuccess] = createSignal(false);

  // Username availability (checked onBlur — zero reads while typing)
  const [rUsernameAvail, setRUsernameAvail] = createSignal<boolean | null>(null);
  const [rUsernameAvailChecking, setRUsernameAvailChecking] = createSignal(false);

  async function checkUsernameOnBlur() {
    const name = rUsername().trim();
    if (!name || rUsernameErr()) { setRUsernameAvail(null); return; }
    setRUsernameAvailChecking(true);
    const avail = await checkNameAvailability(name);
    setRUsernameAvail(avail);
    setRUsernameAvailChecking(false);
  }

  // Password visibility
  const [showPwR, setShowPwR] = createSignal(false);
  const [showPwRVerify, setShowPwRVerify] = createSignal(false);
  const [showPwL, setShowPwL] = createSignal(false);

  function rFieldErr(field: () => string, validate: (v: string) => string) {
    return createMemo(() => {
      const v = field();
      if (!v && !rSubmitted()) return "";
      if (!v) return "required";
      return validate(v);
    });
  }

  const rUsernameErr = rFieldErr(rUsername, (v) => {
    if (v.length < 3) return "minimum 3 characters";
    if (v.length > 16) return "maximum 16 characters";
    if (!/^[a-zA-Z0-9_]+$/.test(v)) return "letters, numbers, underscore only";
    return "";
  });
  const rEmailErr = rFieldErr(rEmail, (v) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "invalid email"
  );
  const rVerifyEmailErr = createMemo(() => {
    const v = rVerifyEmail();
    if (!v && !rSubmitted()) return "";
    if (!v) return "required";
    return v === rEmail() ? "" : "emails do not match";
  });
  const rPasswordErr = rFieldErr(rPassword, (v) => {
    if (v.length < 8) return "minimum 8 characters";
    if (!/[A-Z]/.test(v)) return "needs uppercase letter";
    if (!/[a-z]/.test(v)) return "needs lowercase letter";
    if (!/[0-9]/.test(v)) return "needs a number";
    if (!/[^A-Za-z0-9]/.test(v)) return "needs a special character";
    return "";
  });
  const rVerifyPwErr = createMemo(() => {
    const v = rVerifyPw();
    if (!v && !rSubmitted()) return "";
    if (!v) return "required";
    return v === rPassword() ? "" : "passwords do not match";
  });
  const lEmailErr = createMemo(() => {
    if (!lEmail()) return lError() ? "email required" : "";
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lEmail()) ? "" : "invalid email";
  });

  const rFormValid = () =>
    rUsername() && !rUsernameErr() && rUsernameAvail() === true &&
    rEmail() && !rEmailErr() &&
    rVerifyEmail() && !rVerifyEmailErr() &&
    rPassword() && !rPasswordErr() &&
    rVerifyPw() && !rVerifyPwErr();

  const passwordStrength = createMemo(() => {
    const p = rPassword();
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[a-z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  });

  const strengthLabel = () =>
    ["", "weak", "fair", "good", "strong", "perfect"][passwordStrength()];

  function resetAll() {
    setRUsername(""); setREmail(""); setRVerifyEmail(""); setRPassword(""); setRVerifyPw("");
    setRSubmitted(false); setRError(""); setRLoading(false); setRSuccess(false);
    setLEmail(""); setLPassword(""); setLRemember(true);
    setLError(""); setLLoading(false);
    setShowForgot(false); setFpEmail(""); setFpError(""); setFpLoading(false); setFpSuccess(false);
    setShowPwR(false); setShowPwRVerify(false); setShowPwL(false);
  }

  async function handleRegister(e: Event) {
    e.preventDefault();
    setRError("");
    setRSubmitted(true);

    if (!rFormValid()) return;
    setRLoading(true);

    const result = await signUp(rEmail(), rPassword(), rUsername());
    if (result.error) {
      setRError(result.error);
      setRLoading(false);
      return;
    }
    setRSuccess(true);
    setRLoading(false);
  }

  async function handleLogin(e: Event) {
    e.preventDefault();
    setLError("");
    if (!lEmail() || !lPassword()) { setLError("email and password required"); return; }
    setLLoading(true);

    const result = await signIn(lEmail(), lPassword(), lRemember());
    if (result.error) {
      setLError(result.error);
      setLLoading(false);
      return;
    }
    await refresh();
    resetAll();
    props.onLogin();
  }

  async function handleGoogle() {
    const r = await signInWithProvider("google");
    if (r.error) setLError(r.error);
  }

  async function handleGitHub() {
    const r = await signInWithProvider("github");
    if (r.error) setLError(r.error);
  }

  async function handleForgot(e: Event) {
    e.preventDefault();
    setFpError(""); setFpSuccess(false);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fpEmail())) {
      setFpError("enter a valid email");
      return;
    }
    setFpLoading(true);
    const result = await resetPassword(fpEmail());
    if (result.error) {
      setFpError(result.error);
      setFpLoading(false);
      return;
    }
    setFpSuccess(true);
    setFpLoading(false);
  }

  const showPwIcon = (on: boolean) => on
    ? <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>
    : <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>;

  return (
    <div class="page-full">
      <div class="page-full-back" onClick={props.onBack}>
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
        back
      </div>
      <div class="login-page">
        {/* ── Register ── */}
        <div class="login-col">
          <div class="login-col-title">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            register
          </div>

          <Show when={rSuccess()}>
            <div class="auth-success-screen" style="padding:0">
              <div class="auth-success-icon">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              </div>
              <div class="auth-success-title">Account created!</div>
              <div class="auth-success-sub">Check your email for verification</div>
              <button class="auth-btn" onClick={props.onLogin}>sign in</button>
            </div>
          </Show>

          <Show when={!rSuccess()}>
            <form class="auth-form" onSubmit={handleRegister} novalidate>
              <Show when={rError()}>
                <div class="auth-error">{rError()}</div>
              </Show>
              <input
                class={`auth-input${rUsernameErr() || rUsernameAvail() === false ? " auth-input-error" : ""}`}
                type="text" placeholder="username"
                value={rUsername()}
                onInput={(e) => setRUsername(e.currentTarget.value)}
                onBlur={checkUsernameOnBlur}
                autocomplete="username" required
              />
              <Show when={rUsernameErr()}>
                <div class="auth-field-err">{rUsernameErr()}</div>
              </Show>
              <Show when={rUsernameAvailChecking()}>
                <div class="auth-field-err" style="color:var(--sub)">checking...</div>
              </Show>
              <Show when={rUsernameAvail() === false}>
                <div class="auth-field-err">username already taken</div>
              </Show>
              <input
                class={`auth-input${rEmailErr() ? " auth-input-error" : ""}`}
                type="email" placeholder="email"
                value={rEmail()}
                onInput={(e) => setREmail(e.currentTarget.value)}
                autocomplete="email" required
              />
              <Show when={rEmailErr()}>
                <div class="auth-field-err">{rEmailErr()}</div>
              </Show>
              <input
                class={`auth-input${rVerifyEmailErr() ? " auth-input-error" : ""}`}
                type="email" placeholder="verify email"
                value={rVerifyEmail()}
                onInput={(e) => setRVerifyEmail(e.currentTarget.value)}
                autocomplete="email" required
              />
              <Show when={rVerifyEmailErr()}>
                <div class="auth-field-err">{rVerifyEmailErr()}</div>
              </Show>
              <div class="auth-pw-wrap">
                <input
                  class={`auth-input${rPasswordErr() ? " auth-input-error" : ""}`}
                  type={showPwR() ? "text" : "password"}
                  placeholder="password"
                  value={rPassword()}
                  onInput={(e) => setRPassword(e.currentTarget.value)}
                  autocomplete="new-password" required
                />
                <button type="button" class="auth-pw-toggle" onClick={() => setShowPwR(s => !s)} tabIndex={-1}>
                  {showPwIcon(showPwR())}
                </button>
              </div>
              <Show when={rPasswordErr()}>
                <div class="auth-field-err">{rPasswordErr()}</div>
              </Show>
              <Show when={rPassword().length > 0}>
                <div class="auth-strength">
                  <div class="auth-strength-bar">
                    <div class={`auth-strength-fill strength-${strengthLabel()}`} style={{ width: `${(passwordStrength() / 5) * 100}%` }} />
                  </div>
                  <span class="auth-strength-label">{strengthLabel()}</span>
                </div>
              </Show>
              <div class="auth-pw-wrap">
                <input
                  class={`auth-input${rVerifyPwErr() ? " auth-input-error" : ""}`}
                  type={showPwRVerify() ? "text" : "password"}
                  placeholder="verify password"
                  value={rVerifyPw()}
                  onInput={(e) => setRVerifyPw(e.currentTarget.value)}
                  autocomplete="new-password" required
                />
                <button type="button" class="auth-pw-toggle" onClick={() => setShowPwRVerify(s => !s)} tabIndex={-1}>
                  {showPwIcon(showPwRVerify())}
                </button>
              </div>
              <Show when={rVerifyPwErr()}>
                <div class="auth-field-err">{rVerifyPwErr()}</div>
              </Show>
              <button class="auth-btn" type="submit" disabled={rLoading() || !rFormValid()}>
                {rLoading() ? <><Spinner /> signing up...</> : "sign up"}
              </button>
            </form>
          </Show>
        </div>

        {/* ── Separator ── */}
        <div class="login-sep">
          <div class="login-sep-line" />
          <div class="login-sep-text">or</div>
          <div class="login-sep-line" />
        </div>

        {/* ── Login ── */}
        <div class="login-col">
          <div class="login-col-title">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v2H6v-2zm0 4h8v2H6v-2zm10 0h2v2h-2v-2zm-6-4h8v2h-8v-2z"/></svg>
            sign in
          </div>

          <div class="auth-providers">
            <button class="auth-provider-btn" type="button" onClick={handleGoogle}>
              <svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google
            </button>
            <button class="auth-provider-btn" type="button" onClick={handleGitHub}>
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              GitHub
            </button>
          </div>

          <div class="auth-or">
            <div class="auth-or-line" />
            <div class="auth-or-text">or</div>
            <div class="auth-or-line" />
          </div>

          <form class="auth-form" onSubmit={handleLogin} novalidate>
            <Show when={lError()}>
              <div class="auth-error">{lError()}</div>
            </Show>
            <input
              class={`auth-input${lEmailErr() ? " auth-input-error" : ""}`}
              type="email" placeholder="email"
              value={lEmail()}
              onInput={(e) => setLEmail(e.currentTarget.value)}
              autocomplete="email" required
            />
            <div class="auth-pw-wrap">
              <input
                class="auth-input"
                type={showPwL() ? "text" : "password"}
                placeholder="password"
                value={lPassword()}
                onInput={(e) => setLPassword(e.currentTarget.value)}
                autocomplete="current-password" required
              />
              <button type="button" class="auth-pw-toggle" onClick={() => setShowPwL(s => !s)} tabIndex={-1}>
                {showPwIcon(showPwL())}
              </button>
            </div>
            <label class="auth-remember">
              <input type="checkbox" checked={lRemember()} onChange={(e) => setLRemember(e.currentTarget.checked)} />
              <div>remember me</div>
            </label>
            <button class="auth-btn" type="submit" disabled={lloading()}>
              {lloading() ? <><Spinner /> signing in...</> : "sign in"}
            </button>
          </form>

          <button class="auth-text-btn" type="button" onClick={() => setShowForgot(s => !s)}>forgot password?</button>

          <Show when={showForgot()}>
            <Show when={fpSuccess} fallback={
              <form class="auth-forgot-form" onSubmit={handleForgot}>
                <Show when={fpError()}>
                  <div class="auth-error" style="margin-bottom:0.25rem">{fpError()}</div>
                </Show>
                <div class="auth-forgot-row">
                  <input
                    class="auth-input"
                    type="email" placeholder="email for reset"
                    value={fpEmail()}
                    onInput={(e) => setFpEmail(e.currentTarget.value)}
                    autocomplete="email"
                  />
                  <button class="auth-btn auth-btn-sm" type="submit" disabled={fpLoading()}>
                    {fpLoading() ? <Spinner /> : "Send"}
                  </button>
                </div>
              </form>
            }>
              <div class="auth-success" style="margin-top:0.5rem;font-size:0.8rem">
                Check your email for the reset link
              </div>
            </Show>
          </Show>
        </div>
      </div>
    </div>
  );
}
