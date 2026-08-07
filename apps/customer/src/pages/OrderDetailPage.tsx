import { CheckCircle2 } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ErrorState, Spinner } from '../components/ui/States';
import { fetchMyOrder } from '../lib/api';
import { useAsync } from '../lib/useAsync';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
};

const STATUS_DESCRIPTIONS: Record<string, string> = {
  pending: 'The store has received your order and will confirm it shortly.',
  processing: 'The store is preparing your order.',
  completed: 'Your order is complete.',
  cancelled: 'This order was cancelled.',
};

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const justPlaced = Boolean((location.state as { justPlaced?: boolean } | null)?.justPlaced);
  const query = useAsync(() => fetchMyOrder(Number(id)), [id]);

  if (query.loading) return <Spinner label="Loading order…" />;
  if (query.error) return <ErrorState message={query.error} onRetry={query.reload} />;
  const order = query.data;
  if (!order) return null;

  return (
    <div className="max-w-2xl mx-auto w-full py-8 px-4 flex flex-col gap-6">
      {justPlaced && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
          <CheckCircle2 className="size-6 shrink-0" />
          <div>
            <p className="font-bold text-sm">Order placed!</p>
            <p className="text-xs">We've sent your order to the store.</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order #{order.id}</h1>
          <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_STYLES[order.status]}`}>{order.status}</span>
      </div>

      <p className="text-sm text-gray-600 -mt-2">{STATUS_DESCRIPTIONS[order.status]}</p>

      <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100">
        {order.items.map((item) => (
          <div key={item.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900">{item.productName}</p>
              <p className="text-xs text-gray-500">
                {item.quantity} × ${item.unitPrice.toFixed(2)}
              </p>
            </div>
            <span className="text-sm font-bold text-gray-900">${item.lineTotal.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-600">Total</span>
        <span className="text-lg font-extrabold text-gray-900">${order.totalAmount.toFixed(2)}</span>
      </div>

      <Link to="/orders" className="text-xs font-bold text-primary hover:underline self-start">
        ← Back to orders
      </Link>
    </div>
  );
}
