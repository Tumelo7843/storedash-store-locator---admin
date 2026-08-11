// Deliberately simple (not RFC 5322) — instant client-side feedback only.
// Firebase's own auth/invalid-email rejection is the real backstop.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}
