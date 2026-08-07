import { Clock, Globe, MapPin, Navigation, Package, Phone, Plus, Search, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { EmptyState, ErrorState, Spinner } from '../components/ui/States';
import { useCart } from '../context/CartContext';
import { fetchProducts, fetchServices, fetchStore } from '../lib/api';
import { DAY_LABELS, formatDayHours, isStoreOpenNow, ORDERED_DAY_KEYS } from '../lib/hours';
import { useAsync } from '../lib/useAsync';

type Tab = 'products' | 'services';

export function StorePage() {
  const { id } = useParams<{ id: string }>();
  const storeId = Number(id);
  const [tab, setTab] = useState<Tab>('products');
  const [search, setSearch] = useState('');
  const { addItem, lines } = useCart();

  const storeQuery = useAsync(() => fetchStore(storeId), [storeId]);
  const productsQuery = useAsync(() => fetchProducts({ storeId, search: search || undefined, limit: 100 }), [storeId, search]);
  const servicesQuery = useAsync(() => fetchServices({ storeId, search: search || undefined, limit: 100 }), [storeId, search]);

  if (storeQuery.loading) return <Spinner label="Loading store…" />;
  if (storeQuery.error) return <ErrorState message={storeQuery.error} onRetry={storeQuery.reload} />;
  const store = storeQuery.data;
  if (!store) return <EmptyState title="Store not found" description="This store may have been removed or is no longer active." />;

  const openNow = isStoreOpenNow(store.openingHours);
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${store.address}, ${store.city}, ${store.state} ${store.postalCode}`)}`;

  const activeQuery = tab === 'products' ? productsQuery : servicesQuery;

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
        {store.bannerUrl && <img src={store.bannerUrl} alt="" className="absolute inset-0 size-full object-cover opacity-25" />}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative z-10">
          <div className="flex items-center gap-3 mb-2">
            {openNow !== null && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${openNow ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'}`}>
                {openNow ? 'Open now' : 'Closed now'}
              </span>
            )}
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/90 text-xs font-bold border border-white/20">{store.category}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{store.name}</h1>
          {store.description && <p className="text-sm text-gray-300 mt-2 max-w-2xl">{store.description}</p>}
          <p className="text-sm text-gray-300 mt-2 flex items-center gap-2">
            <MapPin className="size-4 text-primary" />
            {store.address}, {store.city}, {store.state} {store.postalCode}
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-base font-bold mb-4 pb-3 border-b border-gray-100 flex items-center gap-2">
              <MapPin className="size-5 text-primary" /> Store Information
            </h3>
            <div className="flex flex-col gap-3 text-sm text-gray-700">
              {store.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="size-4 text-gray-400 shrink-0" />
                  <a href={`tel:${store.phone}`} className="hover:text-primary">{store.phone}</a>
                </div>
              )}
              {store.email && (
                <div className="flex items-center gap-3">
                  <Globe className="size-4 text-gray-400 shrink-0" />
                  <a href={`mailto:${store.email}`} className="hover:text-primary">{store.email}</a>
                </div>
              )}
              {store.lat === null && (
                <p className="text-xs text-amber-600 italic">Precise location not available for this store yet — showing address only.</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <a
                href={directionsUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold"
              >
                <Navigation className="size-3.5" /> Get Directions
              </a>
              {store.phone && (
                <a href={`tel:${store.phone}`} className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold">
                  <Phone className="size-3.5" /> Call Store
                </a>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-base font-bold mb-4 pb-3 border-b border-gray-100 flex items-center gap-2">
              <Clock className="size-5 text-primary" /> Opening Hours
            </h3>
            {store.openingHours ? (
              <div className="flex flex-col gap-2 text-xs">
                {ORDERED_DAY_KEYS.map((key) => (
                  <div key={key} className="flex justify-between py-1 border-b border-gray-50 last:border-0 text-gray-800">
                    <span className="font-semibold">{DAY_LABELS[key]}</span>
                    <span>{formatDayHours(store.openingHours![key])}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">This store hasn't published its hours yet.</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 border border-gray-200 w-fit">
              <button
                onClick={() => setTab('products')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${tab === 'products' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-600'}`}
              >
                <Package className="size-3.5" /> Products
              </button>
              <button
                onClick={() => setTab('services')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${tab === 'services' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-600'}`}
              >
                <Sparkles className="size-3.5" /> Services
              </button>
            </div>

            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-2.5 size-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${tab}…`}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {activeQuery.loading && <Spinner />}
          {activeQuery.error && <ErrorState message={activeQuery.error} onRetry={activeQuery.reload} />}

          {tab === 'products' && !productsQuery.loading && !productsQuery.error && (
            productsQuery.data?.items.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {productsQuery.data.items.map((p) => {
                  const isOut = p.availability === 'out_of_stock';
                  const inCart = lines.find((l) => l.product.id === p.id)?.quantity ?? 0;
                  return (
                    <div key={p.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col">
                      <div className="relative aspect-4/3 bg-gray-100">
                        {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="size-full object-cover" loading="lazy" />}
                        <span
                          className={`absolute top-2 right-2 text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            isOut ? 'bg-rose-500 text-white' : p.availability === 'low_stock' ? 'bg-amber-400 text-gray-900' : 'bg-emerald-500 text-white'
                          }`}
                        >
                          {isOut ? 'Out of stock' : p.availability === 'low_stock' ? 'Low stock' : 'In stock'}
                        </span>
                      </div>
                      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase">{p.category}</span>
                          <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{p.name}</h3>
                          {p.description && <p className="text-xs text-gray-500 line-clamp-2 mt-1">{p.description}</p>}
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <span className="text-base font-extrabold text-gray-900">
                            ${p.price.toFixed(2)}
                            {p.unit && <span className="text-[10px] text-gray-400 font-normal"> /{p.unit}</span>}
                          </span>
                          <button
                            onClick={() => addItem(p)}
                            disabled={isOut}
                            className={`p-2 rounded-xl flex items-center gap-1 text-xs font-bold ${
                              isOut ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 text-white'
                            }`}
                          >
                            <Plus className="size-4" />
                            {inCart > 0 && <span>{inCart}</span>}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState icon={Package} title="No products found" description="This store hasn't listed any products matching your search." />
            )
          )}

          {tab === 'services' && !servicesQuery.loading && !servicesQuery.error && (
            servicesQuery.data?.items.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {servicesQuery.data.items.map((s) => (
                  <div key={s.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex gap-4">
                    {s.imageUrl && <img src={s.imageUrl} alt={s.name} className="size-16 rounded-xl object-cover bg-gray-100 shrink-0" />}
                    <div className="flex-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{s.category}</span>
                      <h3 className="text-sm font-bold text-gray-900">{s.name}</h3>
                      {s.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{s.description}</p>}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-sm font-extrabold text-gray-900">${s.price.toFixed(2)}</span>
                        {s.durationMinutes && <span className="text-xs text-gray-400">{s.durationMinutes} min</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Sparkles} title="No services found" description="This store hasn't listed any services matching your search." />
            )
          )}
        </div>
      </main>
    </div>
  );
}
