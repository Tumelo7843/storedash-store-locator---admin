import type { ApprovalStatus, Product, Service, Store } from '@storedash/shared';
import { formatZAR } from '@storedash/shared';
import { Check, MapPin, Package, Sparkles, Store as StoreIcon, X } from 'lucide-react';
import { useState } from 'react';
import { RejectDialog } from '../components/RejectDialog';
import { EmptyState, ErrorState, Spinner } from '../components/ui/States';
import {
  approveProduct,
  approveService,
  approveStore,
  fetchMyProducts,
  fetchMyServices,
  fetchMyStores,
  rejectProduct,
  rejectService,
  rejectStore,
} from '../lib/api';
import { useAsync } from '../lib/useAsync';

type Kind = 'stores' | 'products' | 'services';
const KINDS: Array<{ key: Kind; label: string; icon: typeof StoreIcon }> = [
  { key: 'stores', label: 'Stores', icon: StoreIcon },
  { key: 'products', label: 'Products', icon: Package },
  { key: 'services', label: 'Services', icon: Sparkles },
];
const STATUSES: Array<ApprovalStatus | 'all'> = ['pending', 'approved', 'rejected', 'all'];

const STATUS_STYLES: Record<ApprovalStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
};

function StatusBadge({ status }: { status: ApprovalStatus }) {
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize shrink-0 ${STATUS_STYLES[status]}`}>{status}</span>;
}

interface ItemCardProps {
  title: string;
  subtitle: string;
  meta: string;
  status: ApprovalStatus;
  rejectionReason: string | null;
  onApprove: () => Promise<void>;
  onReject: (reason: string) => Promise<void>;
}

function ItemCard({ title, subtitle, meta, status, rejectionReason, onApprove, onReject }: ItemCardProps) {
  const [busy, setBusy] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [error, setError] = useState('');

  const handleApprove = async () => {
    setBusy(true);
    setError('');
    try {
      await onApprove();
    } catch (err: any) {
      setError(err.message || 'Could not approve this.');
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async (reason: string) => {
    setBusy(true);
    setError('');
    setShowReject(false);
    try {
      await onReject(reason);
    } catch (err: any) {
      setError(err.message || 'Could not reject this.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-gray-900">{title}</p>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
        <StatusBadge status={status} />
      </div>

      <p className="text-xs text-gray-600 inline-flex items-center gap-1.5">
        <MapPin className="size-3.5 text-gray-400 shrink-0" /> {meta}
      </p>

      {status === 'rejected' && rejectionReason && <p className="text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2">Rejected: {rejectionReason}</p>}

      {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

      {status === 'pending' && (
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
          title={`Reject ${title}`}
          description="Let the owner know why. This is shown to them so they can fix and resubmit."
          confirmLabel="Reject"
          onCancel={() => setShowReject(false)}
          onConfirm={handleReject}
        />
      )}
    </div>
  );
}

export function ApprovalsPage() {
  const [kind, setKind] = useState<Kind>('stores');
  const [status, setStatus] = useState<ApprovalStatus | 'all'>('pending');
  const statusParam = status === 'all' ? undefined : status;

  // Needed to label which store a pending product/service belongs to —
  // super_admin's product/service queue spans every store, not just one.
  const storesQuery = useAsync(() => fetchMyStores(), []);
  const storeNameById = new Map((storesQuery.data ?? []).map((s: Store) => [s.id, s.name]));

  const storesListQuery = useAsync(() => fetchMyStores({ approvalStatus: statusParam }), [statusParam]);
  const productsQuery = useAsync(() => fetchMyProducts({ approvalStatus: statusParam, limit: 100 }), [statusParam]);
  const servicesQuery = useAsync(() => fetchMyServices({ approvalStatus: statusParam, limit: 100 }), [statusParam]);

  const activeQuery = kind === 'stores' ? storesListQuery : kind === 'products' ? productsQuery : servicesQuery;

  return (
    <div className="flex-1 p-4 md:p-8 flex flex-col gap-6">
      <div className="pb-4 border-b border-gray-200">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Approvals</h1>
        <p className="text-sm text-gray-500 mt-1">Review stores, products, and services submitted by store owners before they go live.</p>
      </div>

      <div className="flex items-center gap-2">
        {KINDS.map((k) => (
          <button
            key={k.key}
            onClick={() => setKind(k.key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold ${
              kind === k.key ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <k.icon className="size-3.5" /> {k.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap capitalize ${
              status === s ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {activeQuery.loading && <Spinner />}
      {activeQuery.error && <ErrorState message={activeQuery.error} onRetry={activeQuery.reload} />}

      {!activeQuery.loading && !activeQuery.error && kind === 'stores' && (
        (storesListQuery.data?.length ?? 0) > 0 ? (
          <div className="flex flex-col gap-4">
            {storesListQuery.data!.map((store: Store) => (
              <ItemCard
                key={store.id}
                title={store.name}
                subtitle={`${store.category} • Created ${new Date(store.createdAt).toLocaleDateString()}`}
                meta={`${store.address}, ${store.city}, ${store.state} ${store.postalCode}`}
                status={store.approvalStatus}
                rejectionReason={store.rejectionReason}
                onApprove={async () => {
                  await approveStore(store.id);
                  storesListQuery.reload();
                }}
                onReject={async (reason) => {
                  await rejectStore(store.id, reason);
                  storesListQuery.reload();
                }}
              />
            ))}
          </div>
        ) : (
          <EmptyState icon={StoreIcon} title={`No ${status === 'all' ? '' : status} stores`} description="Check back later." />
        )
      )}

      {!activeQuery.loading && !activeQuery.error && kind === 'products' && (
        (productsQuery.data?.items.length ?? 0) > 0 ? (
          <div className="flex flex-col gap-4">
            {productsQuery.data!.items.map((product: Product) => (
              <ItemCard
                key={product.id}
                title={product.name}
                subtitle={`${storeNameById.get(product.storeId) ?? `Store #${product.storeId}`} • ${formatZAR(product.price)} • SKU ${product.sku}`}
                meta={product.category}
                status={product.approvalStatus}
                rejectionReason={product.rejectionReason}
                onApprove={async () => {
                  await approveProduct(product.id);
                  productsQuery.reload();
                }}
                onReject={async (reason) => {
                  await rejectProduct(product.id, reason);
                  productsQuery.reload();
                }}
              />
            ))}
          </div>
        ) : (
          <EmptyState icon={Package} title={`No ${status === 'all' ? '' : status} products`} description="Check back later." />
        )
      )}

      {!activeQuery.loading && !activeQuery.error && kind === 'services' && (
        (servicesQuery.data?.items.length ?? 0) > 0 ? (
          <div className="flex flex-col gap-4">
            {servicesQuery.data!.items.map((service: Service) => (
              <ItemCard
                key={service.id}
                title={service.name}
                subtitle={`${storeNameById.get(service.storeId) ?? `Store #${service.storeId}`} • ${formatZAR(service.price)}`}
                meta={service.category}
                status={service.approvalStatus}
                rejectionReason={service.rejectionReason}
                onApprove={async () => {
                  await approveService(service.id);
                  servicesQuery.reload();
                }}
                onReject={async (reason) => {
                  await rejectService(service.id, reason);
                  servicesQuery.reload();
                }}
              />
            ))}
          </div>
        ) : (
          <EmptyState icon={Sparkles} title={`No ${status === 'all' ? '' : status} services`} description="Check back later." />
        )
      )}
    </div>
  );
}

