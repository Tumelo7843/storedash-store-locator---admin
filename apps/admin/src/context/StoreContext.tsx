import type { Store } from '@storedash/shared';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { fetchMyStores } from '../lib/api';
import { useAuth } from './AuthContext';

interface StoreContextValue {
  stores: Store[];
  currentStore: Store | null;
  setCurrentStoreId: (id: number) => void;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const STORAGE_KEY = 'storedash_admin_current_store';
const StoreContext = createContext<StoreContextValue | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { isAuthorized } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [currentStoreId, setCurrentStoreIdState] = useState<number | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Number(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!isAuthorized) {
      setStores([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetchMyStores()
      .then((list) => {
        setStores(list);
        setCurrentStoreIdState((prev) => {
          if (prev && list.some((s) => s.id === prev)) return prev;
          return list[0]?.id ?? null;
        });
      })
      .catch(() => setError('Could not load your stores.'))
      .finally(() => setLoading(false));
  }, [isAuthorized, reloadKey]);

  const setCurrentStoreId = (id: number) => {
    setCurrentStoreIdState(id);
    localStorage.setItem(STORAGE_KEY, String(id));
  };

  const currentStore = stores.find((s) => s.id === currentStoreId) ?? null;

  return (
    <StoreContext.Provider value={{ stores, currentStore, setCurrentStoreId, loading, error, reload: () => setReloadKey((k) => k + 1) }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
