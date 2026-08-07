import { AlertCircle, MapPin, Navigation, Search, ShoppingBag } from 'lucide-react';
import { lazy, Suspense, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState, ErrorState, Spinner } from '../components/ui/States';
import { useGeolocation, haversineDistanceMiles } from '../lib/geo';
import { isStoreOpenNow } from '../lib/hours';
import { fetchStores } from '../lib/api';
import { useAsync } from '../lib/useAsync';

const CATEGORIES = ['All', 'Grocery', 'Bookstore', 'Electronics', 'Cafe', 'Bakery', 'Apparel', 'General'];

// Leaflet + react-leaflet is the single largest dependency in this app and is
// only ever needed on this page, so it's split into its own chunk instead of
// bloating every route's initial bundle.
const StoreMap = lazy(() => import('../components/StoreMap').then((m) => ({ default: m.StoreMap })));

export function HomePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const geo = useGeolocation();

  const { data, loading, error, reload } = useAsync(
    () => fetchStores({ search: search || undefined, category: category === 'All' ? undefined : category, limit: 100 }),
    [search, category],
  );

  const stores = useMemo(() => {
    const list = data?.items ?? [];
    if (!geo.coords) return list;
    return [...list].sort((a, b) => {
      if (a.lat === null || a.lng === null) return 1;
      if (b.lat === null || b.lng === null) return -1;
      const da = haversineDistanceMiles(geo.coords!.lat, geo.coords!.lng, a.lat, a.lng);
      const db = haversineDistanceMiles(geo.coords!.lat, geo.coords!.lng, b.lat, b.lng);
      return da - db;
    });
  }, [data, geo.coords]);

  const selectedStore = stores.find((s) => s.id === selectedStoreId) ?? null;

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-gray-200 bg-white px-4 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 size-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search stores by name, city, or address…"
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <button
            onClick={geo.request}
            disabled={geo.status === 'loading'}
            className={`flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              geo.status === 'granted'
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : 'bg-primary text-white hover:bg-primary/90'
            }`}
          >
            <Navigation className={`size-3.5 ${geo.status === 'loading' ? 'animate-spin' : ''}`} />
            {geo.status === 'granted' ? 'Using your location' : geo.status === 'loading' ? 'Locating…' : 'Use my location'}
          </button>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                  category === cat ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {geo.errorMessage && (
          <div className="max-w-7xl mx-auto mt-2 flex items-center gap-1.5 text-xs text-amber-700">
            <AlertCircle className="size-3.5" />
            <span>{geo.errorMessage}</span>
          </div>
        )}
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-140px)]">
        <div className="lg:col-span-7 h-[380px] lg:h-auto relative border-b lg:border-b-0 lg:border-r border-gray-200">
          <Suspense fallback={<Spinner label="Loading map…" />}>
            <StoreMap stores={stores} selectedStoreId={selectedStoreId} onSelectStore={setSelectedStoreId} userLocation={geo.coords} />
          </Suspense>
        </div>

        <div className="lg:col-span-5 flex flex-col overflow-y-auto max-h-[calc(100vh-140px)]">
          {loading && <Spinner label="Finding stores…" />}
          {error && <ErrorState message={error} onRetry={reload} />}
          {!loading && !error && stores.length === 0 && (
            <EmptyState icon={ShoppingBag} title="No stores match your search" description="Try a different search term or category." />
          )}

          {!loading && !error && stores.length > 0 && (
            <div className="flex flex-col divide-y divide-gray-100">
              {stores.map((store) => {
                const distance =
                  geo.coords && store.lat !== null && store.lng !== null
                    ? haversineDistanceMiles(geo.coords.lat, geo.coords.lng, store.lat, store.lng)
                    : null;
                const openNow = isStoreOpenNow(store.openingHours);
                const isSelected = store.id === selectedStore?.id;

                return (
                  <button
                    key={store.id}
                    onClick={() => {
                      setSelectedStoreId(store.id);
                      navigate(`/stores/${store.id}`);
                    }}
                    className={`text-left p-4 flex items-center gap-3 transition-colors hover:bg-gray-50 ${isSelected ? 'bg-blue-50/70' : ''}`}
                  >
                    <img
                      src={store.imageUrl || undefined}
                      alt={store.name}
                      className="size-14 rounded-xl object-cover bg-gray-100 border border-gray-200 shrink-0"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.visibility = 'hidden';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-gray-900 truncate">{store.name}</h3>
                        {openNow !== null && (
                          <span className={`shrink-0 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${openNow ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                            {openNow ? 'Open' : 'Closed'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {store.category} • {store.city}, {store.state}
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="size-3 shrink-0" />
                        {distance !== null ? (
                          <span>{distance} mi away</span>
                        ) : store.lat === null ? (
                          <span className="italic">Location not available</span>
                        ) : (
                          <span className="truncate">{store.address}</span>
                        )}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
