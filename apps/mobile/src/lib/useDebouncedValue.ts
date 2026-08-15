import { useEffect, useState } from 'react';

// Delays reflecting `value` until it stops changing for `delayMs` — used to
// avoid firing a paginated API request (which resets to page 1) on every
// keystroke in a search box.
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
