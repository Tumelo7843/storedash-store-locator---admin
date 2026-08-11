// StoreDash prices are South African Rand throughout — stored as plain
// decimal numbers (no currency field on any row), formatted at display time
// only. Centralized here so both frontends render prices identically.
export function formatZAR(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(amount);
}
