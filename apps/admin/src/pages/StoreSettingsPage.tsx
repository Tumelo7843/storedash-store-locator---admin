import type { OpeningHours, Store } from '@storedash/shared';
import { CheckCircle2, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ApprovalStatusBanner } from '../components/ApprovalStatusBanner';
import { ImageUploadField } from '../components/ImageUploadField';
import { LocationSection } from '../components/LocationSection';
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

      <ApprovalStatusBanner status={currentStore.approvalStatus} rejectionReason={currentStore.rejectionReason} />

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
          <ImageUploadField label="Logo Image" value={form.imageUrl ?? ''} onChange={(url) => set('imageUrl', url)} folder="stores" />
          <ImageUploadField label="Banner Image" value={form.bannerUrl ?? ''} onChange={(url) => set('bannerUrl', url)} folder="stores" />
        </div>
        <Field label="Store Status">
          <select value={form.status} onChange={(e) => set('status', e.target.value as Store['status'])} className="input bg-surface">
            <option value="active">Active (visible to customers)</option>
            <option value="inactive">Inactive (hidden from customers)</option>
          </select>
        </Field>
      </Section>

      <Section title="Location">
        <LocationSection
          value={{ address: form.address, city: form.city, state: form.state, postalCode: form.postalCode, lat: form.lat, lng: form.lng }}
          onChange={(patch) => setForm((prev) => (prev ? { ...prev, ...patch } : prev))}
          resetKey={currentStore.id}
        />
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
    <div className="bg-surface border border-gray-200 rounded-2xl p-6 flex flex-col gap-4">
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
