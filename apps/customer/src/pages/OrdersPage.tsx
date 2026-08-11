import { LogIn, Receipt } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, Spinner } from '../components/ui/States';
import { useAuth } from '../context/AuthContext';
import { fetchMyOrders } from '../lib/api';
import { useAsync } from '../lib/useAsync';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  processing: 'bg-accent/15 text-accent border-accent/30',
  completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  cancelled: 'bg-gray-200 text-gray-500 border-gray-300',
};

export function OrdersPage() {
  const { profile, loading: authLoading, signInWithGoogle } = useAuth();
  const query = useAsync(() => fetchMyOrders(), [profile?.id]);

  if (!authLoading && !profile) {
    return (
      <div className="max-w-md mx-auto w-full py-16">
        <EmptyState
          icon={LogIn}
          title="Sign in to view your orders"
          description="Your order history is tied to your account."
          action={
            <button onClick={signInWithGoogle} className="mt-3 px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90">
              Sign in with Google
            </button>
          }
        />
      </div>
    );
  }

  if (authLoading || query.loading) return <Spinner label="Loading your orders…" />;
  if (query.error) return <ErrorState message={query.error} onRetry={query.reload} />;

  const orders = query.data?.items ?? [];
  if (orders.length === 0) {
    return (
      <div className="max-w-md mx-auto w-full py-16">
        <EmptyState icon={Receipt} title="No orders yet" description="Orders you place will show up here." />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto w-full py-8 px-4 flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Your Orders</h1>
      <div className="flex flex-col gap-3">
        {orders.map((order) => (
          <Link
            key={order.id}
            to={`/orders/${order.id}`}
            className="bg-surface border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:border-accent/50 transition-colors"
          >
            <div>
              <p className="text-sm font-bold text-gray-900">Order #{order.id}</p>
              <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-0.5">{order.items.length} item{order.items.length === 1 ? '' : 's'}</p>
            </div>
            <div className="text-right flex flex-col items-end gap-1.5">
              <span className="text-sm font-extrabold text-gray-900">${order.totalAmount.toFixed(2)}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLES[order.status]}`}>{order.status}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
