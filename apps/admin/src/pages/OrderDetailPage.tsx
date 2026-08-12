import type { OrderStatus } from '@storedash/shared';
import { formatZAR } from '@storedash/shared';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ErrorState, Spinner } from '../components/ui/States';
import { fetchAdminOrder, updateOrderStatus } from '../lib/api';
import { useAsync } from '../lib/useAsync';

const STATUSES: OrderStatus[] = ['pending', 'processing', 'completed', 'cancelled'];
const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  processing: 'bg-primary/10 text-primary border-primary/20',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
};

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const query = useAsync(() => fetchAdminOrder(Number(id)), [id]);
  const [updating, setUpdating] = useState(false);

  if (query.loading) return <Spinner label="Loading order…" />;
  if (query.error) return <ErrorState message={query.error} onRetry={query.reload} />;
  const order = query.data;
  if (!order) return null;

  const handleStatusChange = async (status: OrderStatus) => {
    setUpdating(true);
    try {
      await updateOrderStatus(order.id, status);
      query.reload();
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 max-w-3xl">
      <Link to="/orders" className="text-xs font-bold text-primary hover:underline">
        ← Back to orders
      </Link>

      <div className="flex items-center justify-between mt-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order #{order.id}</h1>
          <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_STYLES[order.status]}`}>{order.status}</span>
      </div>

      <div className="bg-surface border border-gray-200 rounded-2xl p-5 mb-6">
        <h2 className="text-sm font-bold text-gray-800 mb-2">Customer</h2>
        <p className="text-sm text-gray-900">{order.customerName}</p>
        <p className="text-xs text-gray-500">{order.customerEmail}</p>
      </div>

      <div className="bg-surface border border-gray-200 rounded-2xl divide-y divide-gray-100 mb-6">
        {order.items.map((item) => (
          <div key={item.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900">{item.productName}</p>
              <p className="text-xs text-gray-500">
                {item.quantity} × {formatZAR(item.unitPrice)}
              </p>
            </div>
            <span className="text-sm font-bold text-gray-900">{formatZAR(item.lineTotal)}</span>
          </div>
        ))}
        <div className="p-4 flex items-center justify-between bg-gray-50">
          <span className="text-sm font-semibold text-gray-600">Total</span>
          <span className="text-lg font-extrabold text-gray-900">{formatZAR(order.totalAmount)}</span>
        </div>
      </div>

      <div className="bg-surface border border-gray-200 rounded-2xl p-5">
        <h2 className="text-sm font-bold text-gray-800 mb-3">Update Status</h2>
        <div className="flex flex-wrap items-center gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              disabled={updating || s === order.status}
              onClick={() => handleStatusChange(s)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold capitalize transition-colors disabled:cursor-default ${
                s === order.status ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
