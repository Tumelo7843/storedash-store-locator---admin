import { Trash2, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import { EmptyState, ErrorState, Spinner } from '../components/ui/States';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { addStoreAdmin, fetchStoreAdmins, removeStoreAdmin } from '../lib/api';
import { useAsync } from '../lib/useAsync';

export function AdminsPage() {
  const { currentStore } = useStore();
  const { profile } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const query = useAsync(() => (currentStore ? fetchStoreAdmins(currentStore.id) : Promise.reject(new Error('no store'))), [currentStore?.id]);

  if (!currentStore) return <EmptyState title="No store selected" description="Select or create a store first." />;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await addStoreAdmin(currentStore.id, email.trim().toLowerCase());
      setEmail('');
      query.reload();
    } catch (err: any) {
      setError(err.message || 'Could not add this admin.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (userId: number, adminEmail: string) => {
    if (!confirm(`Remove ${adminEmail} as an admin of ${currentStore.name}?`)) return;
    await removeStoreAdmin(currentStore.id, userId);
    query.reload();
  };

  return (
    <div className="flex-1 p-4 md:p-8 flex flex-col gap-6 max-w-2xl">
      <div className="pb-4 border-b border-gray-200">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Store Admins</h1>
        <p className="text-sm text-gray-500 mt-1">People who can manage {currentStore.name}</p>
      </div>

      <form onSubmit={handleAdd} className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-3">
        <label className="text-xs font-semibold text-gray-700">Add an admin by email</label>
        <p className="text-xs text-gray-400 -mt-2">The person must have signed in to StoreDash (as a customer or admin) at least once before you can grant them access.</p>
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            required
            className="input"
          />
          <button type="submit" disabled={submitting} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-bold whitespace-nowrap disabled:opacity-50">
            <UserPlus className="size-4" /> Add
          </button>
        </div>
        {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
      </form>

      {query.loading && <Spinner />}
      {query.error && <ErrorState message={query.error} onRetry={query.reload} />}

      {!query.loading && !query.error && (
        query.data?.length ? (
          <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100">
            {query.data.map((admin) => (
              <div key={admin.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-900">{admin.name || admin.email}</p>
                  <p className="text-xs text-gray-500">{admin.email}</p>
                </div>
                {admin.email !== profile?.email && (
                  <button onClick={() => handleRemove(admin.userId, admin.email)} className="p-2 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50">
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={Users} title="No admins yet" />
        )
      )}
    </div>
  );
}
