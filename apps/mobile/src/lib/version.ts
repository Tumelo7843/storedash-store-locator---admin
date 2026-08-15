// Dotted-numeric version comparator (good enough for the "x.y.z" strings used
// by app.config.ts's `version` and EAS build versioning). Non-numeric/missing
// segments are treated as 0, so "1.2" and "1.2.0" compare equal.
export function isNewerVersion(current: string, latest: string): boolean {
  const a = current.split('.').map((n) => parseInt(n, 10) || 0);
  const b = latest.split('.').map((n) => parseInt(n, 10) || 0);
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    if (bv > av) return true;
    if (bv < av) return false;
  }
  return false;
}
