import { formatZAR } from '@storedash/shared';
import { CheckCircle2 } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ErrorState, Spinner } from '../components/ui/States';
import { fetchMyOrder } from '../lib/api';
import { useAsync } from '../lib/useAsync';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  processing: 'bg-accent/15 text-accent border-accent/30',
  completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  cancelled: 'bg-gray-200 text-gray-500 border-gray-300',
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
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-3">
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

      <div className="bg-surface border border-gray-200 rounded-2xl divide-y divide-gray-100">
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
      </div>

      <div className="bg-surface border border-gray-200 rounded-2xl p-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-600">Total</span>
        <span className="text-lg font-extrabold text-gray-900">{formatZAR(order.totalAmount)}</span>
      </div>

      <Link to="/orders" className="text-xs font-bold text-accent hover:underline self-start">
        ← Back to orders
      </Link>
    </div>
  );
}
