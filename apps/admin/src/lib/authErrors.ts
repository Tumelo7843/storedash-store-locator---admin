// Firebase Auth throws errors shaped { code: 'auth/xyz', message: '...' } —
// the raw message is developer-facing ("Firebase: Error (auth/wrong-password).")
// so every sign-in surface should go through this instead of err.message.
export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  switch (code) {
    case 'auth/invalid-email':
      return 'That email address looks invalid.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return 'Incorrect email or password.';
    case 'auth/user-not-found':
      return 'No account found with this email. Sign up as a customer first, then request store-owner access.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact the platform administrator.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error — check your connection and try again.';
    case 'auth/missing-password':
      return 'Please enter a password.';
    default:
      return (err as Error)?.message?.replace(/^Firebase:\s*/, '').replace(/\s*\(auth\/[\w-]+\)\.?$/, '') || 'Something went wrong. Please try again.';
  }
}
