import React, { useState } from 'react';
import {
  DollarSign,
  Store as StoreIcon,
  Package,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Calendar,
  Plus,
  ArrowUpRight,
  ChevronDown,
  ExternalLink,
  Activity,
  Layers,
  Sparkles,
  MapPin,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { DashboardMetrics, Store, Product } from '../types';

interface DashboardViewProps {
  metrics: DashboardMetrics | null;
  storesList?: Store[];
  productsList?: Product[];
  onNavigate: (tab: string) => void;
  onOpenAddProduct: () => void;
  onOpenAddStore: () => void;
  isDark?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  storesList = [],
  productsList = [],
  onNavigate,
  onOpenAddProduct,
  onOpenAddStore,
  isDark = true,
}) => {
  const [timePeriod, setTimePeriod] = useState('This Week');
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null);
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<number | 'all'>('all');

  const defaultMetrics = {
    totalRevenue: '$1,250,345',
    revenueChange: '+2.5%',
    activeStores: 82,
    activeStoresChange: '+1.2%',
    totalProducts: 4120,
    totalProductsChange: '+0.5%',
    newOrdersToday: 156,
    newOrdersChange: '-3.1%',
    sales30Days: '$48,230.50',
    sales30DaysChange: '+12.4%',
    salesChart: [
      { label: 'Week 1', sales: 12500 },
      { label: 'Week 2', sales: 24800 },
      { label: 'Week 3', sales: 38200 },
      { label: 'Week 4', sales: 48230 },
    ],
    topStores: [
      { id: 1, name: 'ElectroHub', category: 'Electronics', revenue: 12450 },
      { id: 2, name: 'FashionForward', category: 'Apparel', revenue: 9820 },
      { id: 3, name: 'HomeGoods Haven', category: 'Home', revenue: 8150 },
      { id: 4, name: 'BookNook', category: 'Books', revenue: 6780 },
      { id: 5, name: 'Sportify', category: 'Sports', revenue: 5330 },
    ],
  };

  const data = metrics || defaultMetrics;

  const activities = [
    { id: 1, title: 'New Store Registered', desc: 'Oak Avenue Store was activated in Los Angeles.', time: '10 mins ago', type: 'store' },
    { id: 2, title: 'Low Stock Alert', desc: 'Aura Wireless Headphones is low on stock (9 units remaining).', time: '1 hour ago', type: 'alert' },
    { id: 3, title: 'Bulk Inventory Sync', desc: 'Main Street Branch updated 120 grocery items.', time: '3 hours ago', type: 'product' },
    { id: 4, title: 'High Order Volume', desc: 'Lakeside Mall hit 50 orders today.', time: '5 hours ago', type: 'order' },
  ];

  return (
    <div className={`flex-1 min-h-screen p-4 md:p-8 flex flex-col gap-6 transition-colors duration-200 ${
      isDark ? 'bg-[#101922] text-gray-100' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Top Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b ${
        isDark ? 'border-gray-800' : 'border-gray-200'
      }`}>
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Admin Dashboard
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Welcome back, Admin! Here's an overview of your stores and inventory.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative inline-block text-left">
            <button
              onClick={() => {
                const next = timePeriod === 'This Week' ? 'Last Month' : timePeriod === 'Last Month' ? 'Custom Range' : 'This Week';
                setTimePeriod(next);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
                isDark ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100 shadow-2xs'
              }`}
            >
              <Calendar className="size-4 text-blue-400" />
              <span>{timePeriod}</span>
              <ChevronDown className="size-4 text-gray-400" />
            </button>
          </div>

          <button
            onClick={onOpenAddStore}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-colors shadow-md shadow-blue-500/20"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">Add Store</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className={`rounded-xl p-5 flex flex-col justify-between border transition-all shadow-xs ${
          isDark ? 'bg-[#18232e] border-gray-800/80 hover:border-gray-700' : 'bg-white border-gray-200 hover:border-gray-300'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Total Revenue
            </span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <DollarSign className="size-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {data.totalRevenue}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-emerald-500">
              <TrendingUp className="size-3.5" />
              <span>{data.revenueChange} from last month</span>
            </div>
          </div>
        </div>

        {/* Active Stores */}
        <div
          onClick={() => onNavigate('stores')}
          className={`rounded-xl p-5 flex flex-col justify-between border cursor-pointer transition-all shadow-xs group ${
            isDark ? 'bg-[#18232e] border-gray-800/80 hover:border-blue-500/50' : 'bg-white border-gray-200 hover:border-blue-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Active Stores
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:scale-105 transition-transform">
              <StoreIcon className="size-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {data.activeStores}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-emerald-500">
              <TrendingUp className="size-3.5" />
              <span>{data.activeStoresChange} new locations</span>
            </div>
          </div>
        </div>

        {/* Total Products */}
        <div
          onClick={() => onNavigate('products')}
          className={`rounded-xl p-5 flex flex-col justify-between border cursor-pointer transition-all shadow-xs group ${
            isDark ? 'bg-[#18232e] border-gray-800/80 hover:border-blue-500/50' : 'bg-white border-gray-200 hover:border-blue-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Total Products
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 group-hover:scale-105 transition-transform">
              <Package className="size-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {data.totalProducts.toLocaleString()}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-emerald-500">
              <TrendingUp className="size-3.5" />
              <span>{data.totalProductsChange} in catalog</span>
            </div>
          </div>
        </div>

        {/* New Orders Today */}
        <div className={`rounded-xl p-5 flex flex-col justify-between border transition-all shadow-xs ${
          isDark ? 'bg-[#18232e] border-gray-800/80 hover:border-gray-700' : 'bg-white border-gray-200 hover:border-gray-300'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              New Orders Today
            </span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
              <ShoppingCart className="size-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {data.newOrdersToday}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-rose-500">
              <TrendingDown className="size-3.5" />
              <span>{data.newOrdersChange} from yesterday</span>
            </div>
          </div>
        </div>
      </div>

      {/* Managed Stores & Associated Products Section */}
      <div className={`rounded-xl p-6 border shadow-xs flex flex-col gap-5 ${
        isDark ? 'bg-[#18232e] border-gray-800/80 text-white' : 'bg-white border-gray-200 text-gray-900'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-gray-800/60">
          <div>
            <div className="flex items-center gap-2">
              <StoreIcon className="size-5 text-primary" />
              <h2 className="text-lg font-bold">Managed Stores & Products Catalog</h2>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Overview of stores under admin management and the active products listed per store.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAddStore}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>Add Store</span>
            </button>
            <button
              onClick={onOpenAddProduct}
              className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* Store Selection Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedStoreFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedStoreFilter === 'all'
                ? 'bg-primary text-white shadow-md'
                : isDark
                ? 'bg-gray-800/80 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Stores ({storesList.length})
          </button>
          {storesList.map((st) => {
            const count = productsList.filter((p) => p.storeId === st.id).length;
            const isSelected = selectedStoreFilter === st.id;
            return (
              <button
                key={st.id}
                onClick={() => setSelectedStoreFilter(st.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-white shadow-md'
                    : isDark
                    ? 'bg-gray-800/80 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{st.name}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-blue-500/10 text-primary'
                  }`}
                >
                  {count} items
                </span>
              </button>
            );
          })}
        </div>

        {/* Grid of Managed Stores with their Products */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-1">
          {storesList
            .filter((st) => selectedStoreFilter === 'all' || st.id === selectedStoreFilter)
            .map((st) => {
              const storeProducts = productsList.filter((p) => p.storeId === st.id);
              return (
                <div
                  key={st.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                    isDark ? 'bg-gray-900/60 border-gray-800' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={
                            st.imageUrl ||
                            'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=300&q=80'
                          }
                          alt={st.name}
                          className="size-11 rounded-lg object-cover bg-gray-800 border border-gray-700"
                        />
                        <div>
                          <h3 className="text-sm font-bold leading-tight">{st.name}</h3>
                          <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="size-3 text-primary" />
                            <span>
                              {st.address}, {st.city}
                            </span>
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {st.category}
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-800/40">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Products Sold Here ({storeProducts.length})
                        </span>
                        <button
                          onClick={() => onNavigate('products')}
                          className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                        >
                          Manage Catalog →
                        </button>
                      </div>

                      {storeProducts.length === 0 ? (
                        <p className="text-xs text-gray-500 py-2 italic">No products assigned to this store yet.</p>
                      ) : (
                        <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto pr-1 scrollbar-thin">
                          {storeProducts.slice(0, 4).map((p) => (
                            <div
                              key={p.id}
                              className={`p-2 rounded-lg flex items-center justify-between text-xs ${
                                isDark
                                  ? 'bg-gray-800/80 text-gray-200 border border-gray-700/60'
                                  : 'bg-white text-gray-800 border border-gray-200'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <Package className="size-3.5 text-primary shrink-0" />
                                <span className="font-semibold truncate">{p.name}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-bold text-emerald-500">${p.price}</span>
                                <span className="text-[10px] text-gray-400">({p.stock} in stock)</span>
                              </div>
                            </div>
                          ))}
                          {storeProducts.length > 4 && (
                            <p className="text-[11px] text-primary font-semibold text-center pt-1">
                              + {storeProducts.length - 4} more products in inventory
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate('products')}
                    className="w-full py-2 px-3 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-200 text-xs font-bold transition-all border border-gray-700 flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
                  >
                    <span>Manage Store Products</span>
                    <ChevronRight className="size-3.5" />
                  </button>
                </div>
              );
            })}
        </div>
      </div>

      {/* Main Content Area: Chart + Top Stores */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart Section (2 cols) */}
        <div className={`lg:col-span-2 rounded-xl p-6 flex flex-col justify-between border shadow-xs ${
          isDark ? 'bg-[#18232e] border-gray-800/80 text-white' : 'bg-white border-gray-200 text-gray-900'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Sales Over Last 30 Days
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.sales30Days}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  {data.sales30DaysChange}
                </span>
              </div>
            </div>
            <button className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              <span>View Report</span>
              <ArrowUpRight className="size-3.5" />
            </button>
          </div>

          {/* Interactive Bar Chart Visualization */}
          <div className={`h-64 w-full flex items-end gap-3 md:gap-6 pt-6 pb-2 px-2 border-b relative ${
            isDark ? 'border-gray-800' : 'border-gray-100'
          }`}>
            {data.salesChart.map((item, idx) => {
              const maxSales = 50000;
              const heightPercent = Math.min(100, Math.max(15, (item.sales / maxSales) * 100));
              const isHovered = hoveredWeek === idx;

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredWeek(idx)}
                  onMouseLeave={() => setHoveredWeek(null)}
                  className="flex-1 h-full flex flex-col items-center justify-end group cursor-pointer relative"
                >
                  {/* Tooltip */}
                  {isHovered && (
                    <div className="absolute -top-10 bg-gray-900 text-white text-xs px-2.5 py-1 rounded-md shadow-xl whitespace-nowrap z-20 border border-gray-700 animate-in fade-in zoom-in-95">
                      ${item.sales.toLocaleString()}
                    </div>
                  )}

                  {/* Bar */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[64px] rounded-t-lg transition-all duration-300 relative overflow-hidden ${
                      isHovered
                        ? 'bg-gradient-to-t from-blue-600 to-cyan-400 shadow-lg shadow-blue-500/30'
                        : 'bg-gradient-to-t from-blue-700/80 to-blue-500/80 hover:from-blue-600 hover:to-blue-400'
                    }`}
                  >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* X-Axis Labels */}
          <div className={`flex justify-between px-2 pt-3 text-xs font-semibold ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {data.salesChart.map((item, idx) => (
              <span key={idx} className="flex-1 text-center">
                {item.label}
              </span>
            ))}
          </div>
        </div>

        {/* Top 5 Stores Section (1 col) */}
        <div className={`rounded-xl p-6 flex flex-col border shadow-xs ${
          isDark ? 'bg-[#18232e] border-gray-800/80' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Top 5 Stores</h2>
            <button
              onClick={() => onNavigate('stores')}
              className="text-xs font-bold text-primary hover:underline"
            >
              See All
            </button>
          </div>

          <div className={`flex flex-col divide-y ${isDark ? 'divide-gray-800/60' : 'divide-gray-100'}`}>
            {data.topStores.map((store, index) => (
              <div
                key={store.id || index}
                onClick={() => onNavigate('stores')}
                className={`py-3 flex items-center justify-between px-2 rounded-lg cursor-pointer transition-colors ${
                  isDark ? 'hover:bg-gray-800/40' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold w-4 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    #{index + 1}
                  </span>
                  <div className={`size-8 rounded-lg flex items-center justify-center text-primary font-bold text-xs border overflow-hidden ${
                    isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'
                  }`}>
                    {store.imageUrl ? (
                      <img src={store.imageUrl} alt={store.name} className="size-full object-cover" loading="lazy" />
                    ) : (
                      store.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold leading-snug ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {store.name}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{store.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-500">${store.revenue.toLocaleString()}</p>
                  <p className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Monthly Rev</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity & Quick Action Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed (2 cols) */}
        <div className={`lg:col-span-2 rounded-xl p-6 border shadow-xs ${
          isDark ? 'bg-[#18232e] border-gray-800/80' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="size-5 text-blue-500" />
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Recent System Activity</h2>
            </div>
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Real-time sync</span>
          </div>

          <div className="flex flex-col gap-3">
            {activities.map((act) => (
              <div
                key={act.id}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                  isDark ? 'bg-gray-900/40 border-gray-800/60' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="size-2 rounded-full bg-primary mt-2 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{act.title}</h4>
                    <span className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{act.time}</span>
                  </div>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{act.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions (1 col) */}
        <div className={`rounded-xl p-6 flex flex-col justify-between border shadow-xs ${
          isDark ? 'bg-[#18232e] border-gray-800/80' : 'bg-white border-gray-200'
        }`}>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="size-5 text-amber-500" />
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Quick Actions</h2>
            </div>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={onOpenAddProduct}
                className="flex items-center justify-between p-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-primary border border-blue-200 text-sm font-semibold transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Package className="size-4" />
                  <span>Add New Product</span>
                </div>
                <Plus className="size-4" />
              </button>

              <button
                onClick={onOpenAddStore}
                className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-sm font-semibold transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <StoreIcon className="size-4" />
                  <span>Register New Store Location</span>
                </div>
                <Plus className="size-4" />
              </button>

              <button
                onClick={() => onNavigate('products')}
                className="flex items-center justify-between p-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-sm font-semibold transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Package className="size-4" />
                  <span>Manage All Store Products</span>
                </div>
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          <div className={`mt-6 pt-4 border-t text-center ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Database powered by <span className="font-semibold text-primary">Google Cloud SQL PostgreSQL</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
