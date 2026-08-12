import type { ApplicationStatus, StoreOwnerApplicationWithApplicant } from '@storedash/shared';
import { Check, ClipboardList, Mail, MapPin, Phone, X } from 'lucide-react';
import { useState } from 'react';
import { RejectDialog } from '../components/RejectDialog';
import { EmptyState, ErrorState, Spinner } from '../components/ui/States';
import { approveApplication, fetchApplications, rejectApplication } from '../lib/api';
import { useAsync } from '../lib/useAsync';

const STATUSES: Array<ApplicationStatus | 'all'> = ['pending', 'approved', 'rejected', 'all'];

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
};

function ApplicationCard({ application, onChanged }: { application: StoreOwnerApplicationWithApplicant; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [error, setError] = useState('');

  const handleApprove = async () => {
    setBusy(true);
    setError('');
    try {
      await approveApplication(application.id);
      onChanged();
    } catch (err: any) {
      setError(err.message || 'Could not approve this application.');
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async (reason: string) => {
    setBusy(true);
    setError('');
    setShowReject(false);
    try {
      await rejectApplication(application.id, reason);
      onChanged();
    } catch (err: any) {
      setError(err.message || 'Could not reject this application.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-surface border border-gray-200 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-gray-900">{application.businessName}</p>
          <p className="text-xs text-gray-500">
            Applied by {application.applicantName || application.applicantEmail} • {new Date(application.createdAt).toLocaleDateString()}
          </p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize shrink-0 ${STATUS_STYLES[application.status]}`}>
          {application.status}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-gray-600">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="size-3.5 text-gray-400 shrink-0" />
          {application.address}, {application.city}, {application.state} {application.postalCode}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Phone className="size-3.5 text-gray-400 shrink-0" /> {application.phone}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Mail className="size-3.5 text-gray-400 shrink-0" /> {application.email}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ClipboardList className="size-3.5 text-gray-400 shrink-0" /> {application.category}
        </span>
      </div>

      {application.description && <p className="text-xs text-gray-600 border-t border-gray-100 pt-2.5">{application.description}</p>}

      {application.status === 'rejected' && application.rejectionReason && (
        <p className="text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2">Rejected: {application.rejectionReason}</p>
      )}

      {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

      {application.status === 'pending' && (
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleApprove}
            disabled={busy}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50"
          >
            <Check className="size-3.5" /> Approve
          </button>
          <button
            onClick={() => setShowReject(true)}
            disabled={busy}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold disabled:opacity-50"
          >
            <X className="size-3.5" /> Reject
          </button>
        </div>
      )}

      {showReject && (
        <RejectDialog
          title="Reject application"
          description="Let the applicant know why. This is shown to them on their account page."
          confirmLabel="Reject application"
          onCancel={() => setShowReject(false)}
          onConfirm={handleReject}
        />
      )}
    </div>
  );
}

export function ApplicationsPage() {
  const [status, setStatus] = useState<ApplicationStatus | 'all'>('pending');
  const query = useAsync(() => fetchApplications(status === 'all' ? undefined : status), [status]);

  return (
    <div className="flex-1 p-4 md:p-8 flex flex-col gap-6">
      <div className="pb-4 border-b border-gray-200">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Store-Owner Applications</h1>
        <p className="text-sm text-gray-500 mt-1">Review requests from customers who want to list a business on StoreDash.</p>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap capitalize ${
              status === s ? 'bg-primary text-white' : 'bg-surface border border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {query.loading && <Spinner />}
      {query.error && <ErrorState message={query.error} onRetry={query.reload} />}

      {!query.loading &&
        !query.error &&
        (query.data?.length ? (
          <div className="flex flex-col gap-4">
            {query.data.map((application) => (
              <ApplicationCard key={application.id} application={application} onChanged={query.reload} />
            ))}
          </div>
        ) : (
          <EmptyState icon={ClipboardList} title={`No ${status === 'all' ? '' : status} applications`} description="Check back later." />
        ))}
    </div>
  );
}
