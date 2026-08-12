import type { StoreOwnerSummary } from '@storedash/shared';
import { Ban, RotateCcw, ShieldCheck, Store, Users } from 'lucide-react';
import { useState } from 'react';
import { EmptyState, ErrorState, Spinner } from '../components/ui/States';
import { useAuth } from '../context/AuthContext';
import { fetchStoreOwners, reactivateStoreOwner, suspendStoreOwner } from '../lib/api';
import { useAsync } from '../lib/useAsync';

const ROLE_LABEL: Record<string, string> = { store_admin: 'Store Owner', super_admin: 'Super Admin' };

function OwnerRow({ owner, onChanged }: { owner: StoreOwnerSummary; onChanged: () => void }) {
  const { profile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const isSelf = owner.email === profile?.email;

  const handleToggle = async () => {
    setBusy(true);
    setError('');
    try {
      if (owner.suspended) await reactivateStoreOwner(owner.id);
      else await suspendStoreOwner(owner.id);
      onChanged();
    } catch (err: any) {
      setError(err.message || 'Could not update this account.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold text-gray-900">{owner.name || owner.email}</p>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{ROLE_LABEL[owner.role]}</span>
          {owner.suspended && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">Suspended</span>}
        </div>
        <p className="text-xs text-gray-500">{owner.email}</p>
        {owner.managedStores.length > 0 && (
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5 flex-wrap">
            <Store className="size-3 shrink-0" /> {owner.managedStores.map((s) => s.name).join(', ')}
          </p>
        )}
        {error && <p className="text-xs font-semibold text-rose-600 mt-1">{error}</p>}
      </div>

      {owner.role !== 'super_admin' &&
        (isSelf ? (
          <span className="text-xs text-gray-400 font-semibold shrink-0">This is you</span>
        ) : (
          <button
            onClick={handleToggle}
            disabled={busy}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold shrink-0 disabled:opacity-50 ${
              owner.suspended ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700' : 'bg-rose-50 hover:bg-rose-100 text-rose-700'
            }`}
          >
            {owner.suspended ? (
              <>
                <RotateCcw className="size-3.5" /> Reactivate
              </>
            ) : (
              <>
                <Ban className="size-3.5" /> Suspend
              </>
            )}
          </button>
        ))}
    </div>
  );
}

export function StoreOwnersPage() {
  const query = useAsync(() => fetchStoreOwners(), []);

  return (
    <div className="flex-1 p-4 md:p-8 flex flex-col gap-6 max-w-3xl">
      <div className="pb-4 border-b border-gray-200">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Store Owners</h1>
        <p className="text-sm text-gray-500 mt-1">Every approved store owner and platform admin, and the stores they manage.</p>
      </div>

      {query.loading && <Spinner />}
      {query.error && <ErrorState message={query.error} onRetry={query.reload} />}

      {!query.loading &&
        !query.error &&
        (query.data?.length ? (
          <div className="bg-surface border border-gray-200 rounded-2xl divide-y divide-gray-100">
            {query.data.map((owner) => (
              <OwnerRow key={owner.id} owner={owner} onChanged={query.reload} />
            ))}
          </div>
        ) : (
          <EmptyState icon={Users} title="No store owners yet" description="Approve a store-owner application to see them here." />
        ))}

      <div className="flex items-start gap-2 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-xl p-3.5">
        <ShieldCheck className="size-4 shrink-0 mt-0.5" />
        Suspending an account blocks every admin API call immediately, without removing their role or store assignments — reactivate any time to
        restore access exactly as it was.
      </div>
    </div>
  );
}
