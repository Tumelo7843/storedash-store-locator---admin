// Deliberately simple (not RFC 5322) — this is instant client-side feedback,
// not the real validity check. Firebase's own auth/invalid-email rejection
// (and, for sign-up, the account actually needing to receive a verification
// email) is the real backstop.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

// Minimum 7 characters plus a mix of letters and numbers — enforced client-side
// for immediate feedback; Firebase's own auth/weak-password check is the real
// backstop (see authErrors.ts).
export function passwordError(password: string): string | null {
  if (password.length < 7) return 'Password must be at least 7 characters.';
  if (!/[A-Za-z]/.test(password)) return 'Password must include at least one letter.';
  if (!/[0-9]/.test(password)) return 'Password must include at least one number.';
  return null;
}

export function passwordStrength(password: string): 'weak' | 'medium' | 'strong' {
  let score = 0;
  if (password.length >= 7) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 2) return 'weak';
  if (score <= 3) return 'medium';
  return 'strong';
}
