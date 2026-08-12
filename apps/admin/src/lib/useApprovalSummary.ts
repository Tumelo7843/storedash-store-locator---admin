import { useEffect, useState } from 'react';
import type { ApprovalSummary } from '@storedash/shared';
import { fetchApprovalSummary } from './api';

const POLL_MS = 30_000;

// Powers the sidebar's pending-request badges. Polling (not push) is enough
// here — a 30s-stale count on a notification badge is a fine tradeoff against
// building out a live-update channel for something this low-stakes.
export function useApprovalSummary(enabled: boolean): ApprovalSummary | null {
  const [summary, setSummary] = useState<ApprovalSummary | null>(null);

  useEffect(() => {
    if (!enabled) {
      setSummary(null);
      return;
    }
    let cancelled = false;
    const load = () => {
      fetchApprovalSummary()
        .then((data) => {
          if (!cancelled) setSummary(data);
        })
        .catch(() => {
          // Badge just stays at its last known value on a transient failure.
        });
    };
    load();
    const interval = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [enabled]);

  return summary;
}
