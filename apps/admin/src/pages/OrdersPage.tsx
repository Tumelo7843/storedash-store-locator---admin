import type { OrderStatus } from '@storedash/shared';
import { formatZAR } from '@storedash/shared';
import { ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, Spinner } from '../components/ui/States';
import { useStore } from '../context/StoreContext';
import { fetchAdminOrders } from '../lib/api';
import { useAsync } from '../lib/useAsync';

const STATUSES: Array<OrderStatus | 'all'> = ['all', 'pending', 'processing', 'completed', 'cancelled'];
const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
};

export function OrdersPage() {
  const { currentStore } = useStore();
  const [status, setStatus] = useState<OrderStatus | 'all'>('all');

  const query = useAsync(
    () =>
      currentStore
        ? fetchAdminOrders({ storeId: currentStore.id, status: status === 'all' ? undefined : status, limit: 100 })
        : Promise.reject(new Error('no store')),
    [currentStore?.id, status],
  );

  if (!currentStore) return <EmptyState title="No store selected" description="Select or create a store first." />;

  return (
    <div className="flex-1 p-4 md:p-8 flex flex-col gap-6">
      <div className="pb-4 border-b border-gray-200">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500 mt-1">{currentStore.name}</p>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap capitalize ${
              status === s ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {query.loading && <Spinner />}
      {query.error && <ErrorState message={query.error} onRetry={query.reload} />}

      {!query.loading && !query.error && (
        query.data?.items.length ? (
          <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100">
            {query.data.items.map((order) => (
              <Link key={order.id} to={`/orders/${order.id}`} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    #{order.id} — {order.customerName}
                  </p>
                  <p className="text-xs text-gray-500">{order.customerEmail}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {new Date(order.createdAt).toLocaleString()} • {order.items.length} item{order.items.length === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="text-right flex flex-col items-end gap-1.5">
                  <span className="text-sm font-extrabold text-gray-900">{formatZAR(order.totalAmount)}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLES[order.status]}`}>{order.status}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState icon={ShoppingBag} title="No orders yet" description="Orders placed by customers will show up here." />
        )
      )}
    </div>
  );
}
