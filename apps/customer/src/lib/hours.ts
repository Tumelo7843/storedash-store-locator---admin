import type { DayHours, OpeningHours } from '@storedash/shared';

const DAY_KEYS: (keyof OpeningHours)[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
export const DAY_LABELS: Record<keyof OpeningHours, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

// Returns null when the store hasn't configured hours yet — callers must
// render "Hours not available" rather than guessing open/closed.
export function isStoreOpenNow(openingHours: OpeningHours | null, now = new Date()): boolean | null {
  if (!openingHours) return null;
  const key = DAY_KEYS[now.getDay()];
  const today: DayHours = openingHours[key];
  if (!today || today.closed) return false;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const open = toMinutes(today.open);
  const close = toMinutes(today.close);
  // Handles hours that cross midnight (e.g. open 18:00, close 02:00).
  if (close <= open) return nowMinutes >= open || nowMinutes < close;
  return nowMinutes >= open && nowMinutes < close;
}

export function formatDayHours(day: DayHours | undefined): string {
  if (!day || day.closed) return 'Closed';
  return `${formatTime(day.open)} – ${formatTime(day.close)}`;
}

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour12} ${period}` : `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

export const ORDERED_DAY_KEYS: (keyof OpeningHours)[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
