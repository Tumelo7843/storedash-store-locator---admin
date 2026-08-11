// Firebase Auth throws errors shaped { code: 'auth/xyz', message: '...' } —
// the raw message is developer-facing ("Firebase: Error (auth/wrong-password).")
// so every sign-in/sign-up surface should go through this instead of err.message.
export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in instead.';
    case 'auth/invalid-email':
      return 'That email address looks invalid.';
    case 'auth/weak-password':
      return 'Password is too weak — use at least 7 characters, mixing letters and numbers.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return 'Incorrect email or password.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact support if you think this is a mistake.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled.';
    case 'auth/network-request-failed':
      return 'Network error — check your connection and try again.';
    case 'auth/invalid-phone-number':
      return 'That phone number looks invalid. Use international format, e.g. +27 82 123 4567.';
    case 'auth/invalid-verification-code':
      return 'That code is incorrect. Double-check the SMS and try again.';
    case 'auth/code-expired':
      return 'That code has expired. Request a new one.';
    case 'auth/missing-password':
      return 'Please enter a password.';
    default:
      return (err as Error)?.message?.replace(/^Firebase:\s*/, '').replace(/\s*\(auth\/[\w-]+\)\.?$/, '') || 'Something went wrong. Please try again.';
  }
}
