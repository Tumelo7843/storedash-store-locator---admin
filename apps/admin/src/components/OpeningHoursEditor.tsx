import type { DayHours, OpeningHours } from '@storedash/shared';

const DAYS: Array<{ key: keyof OpeningHours; label: string }> = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
];

export const DEFAULT_HOURS: OpeningHours = {
  mon: { open: '09:00', close: '17:00', closed: false },
  tue: { open: '09:00', close: '17:00', closed: false },
  wed: { open: '09:00', close: '17:00', closed: false },
  thu: { open: '09:00', close: '17:00', closed: false },
  fri: { open: '09:00', close: '17:00', closed: false },
  sat: { open: '09:00', close: '17:00', closed: true },
  sun: { open: '09:00', close: '17:00', closed: true },
};

export function OpeningHoursEditor({ value, onChange }: { value: OpeningHours; onChange: (value: OpeningHours) => void }) {
  const updateDay = (key: keyof OpeningHours, patch: Partial<DayHours>) => {
    onChange({ ...value, [key]: { ...value[key], ...patch } });
  };

  return (
    <div className="flex flex-col gap-2">
      {DAYS.map(({ key, label }) => {
        const day = value[key];
        return (
          <div key={key} className="grid grid-cols-[100px_auto_1fr_auto_1fr] items-center gap-2 text-sm">
            <span className="font-semibold text-gray-700">{label}</span>
            <label className="flex items-center gap-1.5 text-xs text-gray-500">
              <input type="checkbox" checked={!day.closed} onChange={(e) => updateDay(key, { closed: !e.target.checked })} className="size-3.5 rounded" />
              Open
            </label>
            <input
              type="time"
              value={day.open}
              disabled={day.closed}
              onChange={(e) => updateDay(key, { open: e.target.value })}
              className="input py-1.5 disabled:opacity-40"
            />
            <span className="text-center text-gray-400 text-xs">to</span>
            <input
              type="time"
              value={day.close}
              disabled={day.closed}
              onChange={(e) => updateDay(key, { close: e.target.value })}
              className="input py-1.5 disabled:opacity-40"
            />
          </div>
        );
      })}
    </div>
  );
}
