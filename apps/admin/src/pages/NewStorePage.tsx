import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { createStore } from '../lib/api';
import { EmptyState } from '../components/ui/States';
import { LocationSection } from '../components/LocationSection';

export function NewStorePage() {
  const { profile } = useAuth();
  const { reload, setCurrentStoreId } = useStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    category: 'General',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'South Africa',
    lat: null as number | null,
    lng: null as number | null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (profile?.role !== 'store_admin' && profile?.role !== 'super_admin') {
    return <EmptyState title="Not authorized" description="Only approved store owners can create new stores." />;
  }

  const isSuperAdmin = profile.role === 'super_admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const store = await createStore(form);
      reload();
      setCurrentStoreId(store.id);
      navigate('/store-settings');
    } catch (err: any) {
      setError(err.message || 'Failed to create store');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex-1 p-4 md:p-8 max-w-lg flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Store</h1>
      <p className="text-sm text-gray-500 -mt-3 mb-2">
        You'll be added as the first admin. You can add more details on the Store Settings page after creating it.
        {!isSuperAdmin && ' A Super Admin needs to approve it before it appears to customers.'}
      </p>

      {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-3 rounded-lg">{error}</p>}

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Store Name *</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="input" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
        <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input" />
      </div>
      <div className="pt-2 border-t border-gray-200">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3">Location</h2>
        <LocationSection
          value={{ address: form.address, city: form.city, state: form.state, postalCode: form.postalCode, lat: form.lat, lng: form.lng }}
          onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
        />
      </div>

      <button type="submit" disabled={submitting} className="mt-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm disabled:opacity-50">
        {submitting ? 'Creating…' : 'Create Store'}
      </button>
    </form>
  );
}
