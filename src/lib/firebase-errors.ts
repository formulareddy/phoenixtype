export function getFirebaseErrorMessage(err: any): string {
  const code = err?.code || "";
  const msg = err?.message || "";
  switch (code) {
    case "auth/email-already-in-use":
    case "auth/email-already-exists":
      return "Email already exists";
    case "auth/invalid-email":
      return "Invalid email address";
    case "auth/user-disabled":
    case "auth/account-exists-with-different-credential":
      return "Account disabled";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
      return "Invalid credentials";
    case "auth/weak-password":
      return "Weak password — minimum 6 characters";
    case "auth/too-many-requests":
      return "Too many attempts. Try again later.";
    case "auth/operation-not-allowed":
      return "This sign-in method is not enabled";
    case "auth/popup-blocked":
      return "Popup was blocked by your browser";
    case "auth/network-request-failed":
      return "Network error — check your connection";
    default:
      if (msg.includes("INVALID_LOGIN_CREDENTIALS")) return "Invalid credentials";
      if (msg.includes("WEAK_PASSWORD")) return "Weak password";
      if (msg.includes("EMAIL_EXISTS")) return "Email already exists";
      return msg || "An unknown error occurred";
  }
}
