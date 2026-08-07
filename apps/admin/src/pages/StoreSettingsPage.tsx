import type { OpeningHours, Store } from '@storedash/shared';
import { CheckCircle2, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DEFAULT_HOURS, OpeningHoursEditor } from '../components/OpeningHoursEditor';
import { EmptyState } from '../components/ui/States';
import { useStore } from '../context/StoreContext';
import { updateStore } from '../lib/api';

type FormState = Omit<Store, 'id' | 'createdAt' | 'updatedAt' | 'openingHours'> & { openingHours: OpeningHours };

function toFormState(store: Store): FormState {
  return { ...store, openingHours: store.openingHours ?? DEFAULT_HOURS };
}

export function StoreSettingsPage() {
  const { currentStore, reload } = useStore();
  const [form, setForm] = useState<FormState | null>(currentStore ? toFormState(currentStore) : null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentStore) setForm(toFormState(currentStore));
  }, [currentStore?.id]);

  if (!currentStore || !form) return <EmptyState title="No store selected" description="Select or create a store first." />;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      await updateStore(currentStore.id, form);
      setSaved(true);
      reload();
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save store settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex-1 p-4 md:p-8 flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Store Settings</h1>
          <p className="text-sm text-gray-500 mt-1">{currentStore.name}</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <CheckCircle2 className="size-4" /> Saved
            </span>
          )}
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-bold disabled:opacity-50">
            <Save className="size-4" /> {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-3 rounded-lg">{error}</p>}

      <Section title="Profile">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Store Name">
            <input value={form.name} onChange={(e) => set('name', e.target.value)} required className="input" />
          </Field>
          <Field label="Category">
            <input value={form.category} onChange={(e) => set('category', e.target.value)} className="input" />
          </Field>
        </div>
        <Field label="Description">
          <textarea value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} rows={3} className="input" />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Logo / Image URL">
            <input value={form.imageUrl ?? ''} onChange={(e) => set('imageUrl', e.target.value)} className="input" />
          </Field>
          <Field label="Banner Image URL">
            <input value={form.bannerUrl ?? ''} onChange={(e) => set('bannerUrl', e.target.value)} className="input" />
          </Field>
        </div>
        <Field label="Store Status">
          <select value={form.status} onChange={(e) => set('status', e.target.value as Store['status'])} className="input bg-white">
            <option value="active">Active (visible to customers)</option>
            <option value="inactive">Inactive (hidden from customers)</option>
          </select>
        </Field>
      </Section>

      <Section title="Location">
        <Field label="Street Address">
          <input value={form.address} onChange={(e) => set('address', e.target.value)} required className="input" />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="City">
            <input value={form.city} onChange={(e) => set('city', e.target.value)} required className="input" />
          </Field>
          <Field label="State">
            <input value={form.state} onChange={(e) => set('state', e.target.value)} required className="input" />
          </Field>
          <Field label="Postal Code">
            <input value={form.postalCode} onChange={(e) => set('postalCode', e.target.value)} required className="input" />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Latitude">
            <input
              type="number"
              step="any"
              value={form.lat ?? ''}
              onChange={(e) => set('lat', e.target.value === '' ? null : Number(e.target.value))}
              className="input"
            />
          </Field>
          <Field label="Longitude">
            <input
              type="number"
              step="any"
              value={form.lng ?? ''}
              onChange={(e) => set('lng', e.target.value === '' ? null : Number(e.target.value))}
              className="input"
            />
          </Field>
        </div>
        <p className="text-xs text-gray-400 -mt-2">
          Leave blank if unknown — the store won't appear on the customer map until coordinates are set. Find coordinates by searching your address on{' '}
          <a href="https://www.openstreetmap.org" target="_blank" rel="noreferrer" className="text-primary hover:underline">
            openstreetmap.org
          </a>{' '}
          and copying the lat/lon from the URL.
        </p>
      </Section>

      <Section title="Contact">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Phone">
            <input value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} className="input" />
          </Field>
          <Field label="Email">
            <input type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} className="input" />
          </Field>
        </div>
      </Section>

      <Section title="Fulfillment">
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <input type="checkbox" checked={form.pickupAvailable} onChange={(e) => set('pickupAvailable', e.target.checked)} className="size-4 rounded" />
            Pickup available
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <input type="checkbox" checked={form.deliveryAvailable} onChange={(e) => set('deliveryAvailable', e.target.checked)} className="size-4 rounded" />
            Delivery available
          </label>
        </div>
      </Section>

      <Section title="Opening Hours">
        <OpeningHoursEditor value={form.openingHours} onChange={(hours) => set('openingHours', hours)} />
      </Section>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4">
      <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
