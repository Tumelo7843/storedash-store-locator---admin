import { formatZAR } from '@storedash/shared';
import { DollarSign, Package, ShoppingCart, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, Spinner } from '../components/ui/States';
import { useStore } from '../context/StoreContext';
import { fetchDashboard } from '../lib/api';
import { useAsync } from '../lib/useAsync';

export function DashboardPage() {
  const { currentStore, loading: storeLoading } = useStore();
  const query = useAsync(() => (currentStore ? fetchDashboard(currentStore.id) : Promise.reject(new Error('no store'))), [currentStore?.id]);
  const [hovered, setHovered] = useState<number | null>(null);

  if (storeLoading) return <Spinner label="Loading your stores…" />;
  if (!currentStore) return <EmptyState title="No store selected" description="Select or create a store to see its dashboard." />;
  if (query.loading) return <Spinner label="Loading dashboard…" />;
  if (query.error) return <ErrorState message={query.error} onRetry={query.reload} />;
  const metrics = query.data;
  if (!metrics) return null;

  const maxSales = Math.max(1, ...metrics.salesByDay.map((d) => d.sales));

  return (
    <div className="flex-1 p-4 md:p-8 flex flex-col gap-6">
      <div className="pb-2 border-b border-gray-200">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">{currentStore.name} — last 30 days</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={DollarSign} label="Revenue (completed orders)" value={formatZAR(metrics.totalRevenue)} accent="blue" />
        <MetricCard icon={ShoppingCart} label="Total Orders" value={metrics.ordersCount.toLocaleString()} accent="purple" />
        <MetricCard icon={Package} label="Active Products" value={metrics.activeProductsCount.toLocaleString()} accent="amber" />
        <MetricCard icon={Sparkles} label="Active Services" value={metrics.activeServicesCount.toLocaleString()} accent="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Completed Sales — Last 30 Days</h2>
          {metrics.salesByDay.length === 0 ? (
            <EmptyState title="No completed orders yet" description="Sales will appear here once orders are marked completed." />
          ) : (
            <div className="h-56 w-full flex items-end gap-1.5 pt-6 pb-2 border-b border-gray-100 overflow-x-auto">
              {metrics.salesByDay.map((day, idx) => (
                <div
                  key={day.date}
                  onMouseEnter={() => setHovered(idx)}
                  onMouseLeave={() => setHovered(null)}
                  className="flex-1 min-w-[8px] h-full flex flex-col items-center justify-end relative"
                >
                  {hovered === idx && (
                    <div className="absolute -top-8 bg-gray-900 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap z-10">
                      {day.date}: {formatZAR(day.sales)}
                    </div>
                  )}
                  <div
                    style={{ height: `${Math.max(4, (day.sales / maxSales) * 100)}%` }}
                    className="w-full rounded-t bg-gradient-to-t from-blue-700/80 to-blue-500/80 hover:from-blue-600 hover:to-blue-400"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-surface border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
            <Link to="/orders" className="text-xs font-bold text-primary hover:underline">
              See all
            </Link>
          </div>
          {metrics.recentOrders.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No orders yet.</p>
          ) : (
            <div className="flex flex-col divide-y divide-gray-100">
              {metrics.recentOrders.map((order) => (
                <Link key={order.id} to={`/orders/${order.id}`} className="py-3 flex items-center justify-between hover:bg-gray-50 -mx-2 px-2 rounded-lg">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">#{order.id} — {order.customerName}</p>
                    <p className="text-[11px] text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">{formatZAR(order.totalAmount)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, accent }: { icon: typeof DollarSign; label: string; value: string; accent: 'blue' | 'purple' | 'amber' | 'emerald' }) {
  const accents = {
    blue: 'bg-blue-500/10 text-blue-500',
    purple: 'bg-purple-500/10 text-purple-500',
    amber: 'bg-amber-500/10 text-amber-500',
    emerald: 'bg-emerald-500/10 text-emerald-500',
  };
  return (
    <div className="bg-surface border border-gray-200 rounded-xl p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</span>
        <div className={`p-2 rounded-lg ${accents[accent]}`}>
          <Icon className="size-5" />
        </div>
      </div>
      <h3 className="text-2xl font-bold tracking-tight text-gray-900 mt-3">{value}</h3>
    </div>
  );
}
