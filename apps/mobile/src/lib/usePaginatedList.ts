import type { Paginated } from '@storedash/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../api/client';

interface PaginatedListState<T> {
  items: T[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  reload: () => void;
}

// Shared page size for every paginated list in the app — comfortably under
// the backend's max of 100 (backend/src/validators/common.ts), sized for one
// screenful-plus of cards per fetch.
export const PAGE_SIZE = 20;

// Infinite-scroll data source: fetches page 1 whenever `deps` change
// (resetting accumulated items), and appends subsequent pages via
// `loadMore()` — pages already loaded are never evicted, so scrolling back
// up always shows already-fetched cards instantly (FlatList's own
// windowing/recycling handles the rendering side of that).
export function usePaginatedList<T>(fetchPage: (page: number) => Promise<Paginated<T>>, deps: unknown[]): PaginatedListState<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(1);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    pageRef.current = 1;
    setLoading(true);
    setError(null);
    fetchPage(1)
      .then((res) => {
        if (cancelled) return;
        setItems(res.items);
        setHasMore(res.page < res.totalPages);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
        setItems([]);
        setHasMore(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, resetKey]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    const nextPage = pageRef.current + 1;
    setLoadingMore(true);
    fetchPage(nextPage)
      .then((res) => {
        pageRef.current = nextPage;
        setItems((prev) => [...prev, ...res.items]);
        setHasMore(res.page < res.totalPages);
      })
      .catch(() => {
        // A failed "load more" just stops further pagination quietly — the
        // list the user already has keeps working; there's no need to
        // surface a blocking error for a background next-page fetch.
        setHasMore(false);
      })
      .finally(() => setLoadingMore(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, loading, loadingMore, hasMore]);

  return { items, loading, loadingMore, error, hasMore, loadMore, reload: () => setResetKey((k) => k + 1) };
}
