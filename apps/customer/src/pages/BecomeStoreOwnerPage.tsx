import type { StoreOwnerApplication } from '@storedash/shared';
import { CheckCircle2, Clock, ShieldCheck, Store as StoreIcon, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, Spinner } from '../components/ui/States';
import { useAuth } from '../context/AuthContext';
import { env } from '../lib/env';
import { fetchMyApplications, submitStoreOwnerApplication, type StoreOwnerApplicationInput } from '../lib/api';
import { useAsync } from '../lib/useAsync';

const EMPTY_FORM: StoreOwnerApplicationInput = {
  businessName: '',
  category: 'General',
  description: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'South Africa',
  phone: '',
  email: '',
};

function StatusBanner({ application }: { application: StoreOwnerApplication }) {
  if (application.status === 'pending') {
    return (
      <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-5 flex items-start gap-3">
        <Clock className="size-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-gray-900">Application pending review</p>
          <p className="text-xs text-gray-500 mt-1">
            Thanks for applying! The StoreDash team is reviewing your application for <strong>{application.businessName}</strong>. We'll notify you by
            email once a decision is made.
          </p>
        </div>
      </div>
    );
  }

  if (application.status === 'approved') {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-5 flex items-start gap-3">
        <CheckCircle2 className="size-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900">You're approved!</p>
          <p className="text-xs text-gray-500 mt-1">
            <strong>{application.businessName}</strong> is live on StoreDash and you're now a store owner. Sign in to the admin dashboard to manage
            products, services, and orders.
          </p>
          {env.adminUrl && (
            <a
              href={env.adminUrl}
              className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-bold"
            >
              <ShieldCheck className="size-3.5" /> Go to admin dashboard
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-rose-500/10 border border-rose-500/25 rounded-2xl p-5 flex items-start gap-3">
      <XCircle className="size-5 text-rose-400 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-bold text-gray-900">Application not approved</p>
        <p className="text-xs text-gray-500 mt-1">
          Your application for <strong>{application.businessName}</strong> wasn't approved
          {application.rejectionReason ? `: ${application.rejectionReason}` : '.'}
        </p>
        <p className="text-xs text-gray-500 mt-1">You're welcome to review the details and submit a new application below.</p>
      </div>
    </div>
  );
}

function ApplicationForm({ onSubmitted }: { onSubmitted: () => void }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (key: keyof StoreOwnerApplicationInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await submitStoreOwnerApplication(form);
      onSubmitted();
    } catch (err: any) {
      setError(err.message || 'Could not submit your application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-gray-200 rounded-2xl p-5 sm:p-6 flex flex-col gap-4">
      {error && <p className="text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2.5">{error}</p>}

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Business name *</label>
        <input value={form.businessName} onChange={set('businessName')} required className="input" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Category *</label>
          <input value={form.category} onChange={set('category')} placeholder="Grocery, Fashion, Electronics…" required className="input" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Business phone *</label>
          <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+27 82 123 4567" required className="input" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Business email *</label>
        <input type="email" value={form.email} onChange={set('email')} required className="input" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
        <textarea value={form.description} onChange={set('description')} rows={3} className="input resize-none" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Street address *</label>
        <input value={form.address} onChange={set('address')} required className="input" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">City *</label>
          <input value={form.city} onChange={set('city')} required className="input" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Province *</label>
          <input value={form.state} onChange={set('state')} placeholder="Gauteng" required className="input" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Postal code *</label>
          <input value={form.postalCode} onChange={set('postalCode')} required className="input" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Country</label>
        <input value={form.country} onChange={set('country')} required className="input" />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Submitting…' : 'Submit application'}
      </button>
    </form>
  );
}

export function BecomeStoreOwnerPage() {
  const { profile, loading: authLoading } = useAuth();
  const query = useAsync(() => (profile ? fetchMyApplications() : Promise.resolve([])), [profile?.id]);

  if (authLoading || query.loading) return <Spinner />;

  if (!profile) {
    return (
      <EmptyState
        icon={StoreIcon}
        title="Sign in first"
        description="Sign in to your StoreDash account to apply for store-owner access."
        action={
          <Link to="/sign-in" className="mt-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-bold">
            Sign in
          </Link>
        }
      />
    );
  }

  if (query.error) return <ErrorState message={query.error} onRetry={query.reload} />;

  const applications = query.data ?? [];
  const latest = applications[0];
  const showForm = !latest || latest.status === 'rejected';

  return (
    <div className="max-w-xl mx-auto w-full py-10 px-4 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Become a store owner</h1>
        <p className="text-sm text-gray-500 mt-1">
          Tell us about your business. A StoreDash administrator will review your application and, once approved, you'll be able to manage your
          store's products, services, and orders from the admin dashboard.
        </p>
      </div>

      {latest && <StatusBanner application={latest} />}

      {showForm && <ApplicationForm onSubmitted={query.reload} />}
    </div>
  );
}
