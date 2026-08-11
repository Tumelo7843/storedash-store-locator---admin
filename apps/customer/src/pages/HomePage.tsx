import {
  AlertCircle,
  Clock,
  MapPin,
  Navigation,
  Phone,
  Search,
  ShoppingBag,
  Store as StoreIcon,
  X,
} from 'lucide-react';
import { lazy, Suspense, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState, ErrorState, Spinner } from '../components/ui/States';
import { useGeolocation, haversineDistanceMiles } from '../lib/geo';
import { isStoreOpenNow } from '../lib/hours';
import { fetchStores } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import type { Store } from '@storedash/shared';

const CATEGORIES = ['All', 'Grocery', 'Bookstore', 'Electronics', 'Cafe', 'Bakery', 'Apparel', 'General'];

// Leaflet + react-leaflet is the single largest dependency in this app and is
// only ever needed on this page, so it's split into its own chunk instead of
// bloating every route's initial bundle.
const StoreMap = lazy(() => import('../components/StoreMap').then((m) => ({ default: m.StoreMap })));

function ListSkeleton() {
  return (
    <div className="flex flex-col divide-y divide-gray-100">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4 animate-pulse">
          <div className="size-14 rounded-xl bg-gray-100 shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-3.5 w-2/3 rounded bg-gray-100" />
            <div className="h-2.5 w-1/2 rounded bg-gray-100" />
            <div className="h-2.5 w-1/3 rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function StoreDetailCard({
  store,
  onClose,
  variant = 'inline',
}: {
  store: Store;
  onClose: () => void;
  variant?: 'inline' | 'sheet';
}) {
  const openNow = isStoreOpenNow(store.openingHours);
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${store.address}, ${store.city}, ${store.state} ${store.postalCode}`,
  )}`;

  return (
    <div
      className={`sd-animate-in relative flex flex-col bg-surface border border-gray-200 overflow-hidden ${
        variant === 'sheet' ? 'rounded-t-2xl shadow-2xl' : 'm-3 rounded-2xl shadow-lg'
      }`}
    >
      <button
        onClick={onClose}
        aria-label="Close store details"
        className="absolute top-2.5 right-2.5 z-10 flex size-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
      >
        <X className="size-4" />
      </button>

      <div className="relative aspect-video w-full bg-gray-100 shrink-0">
        {store.imageUrl && !imgError ? (
          <img src={store.imageUrl} alt={store.name} className="size-full object-cover" onError={() => setImgError(true)} />
        ) : (
          <div className="flex size-full items-center justify-center text-gray-400">
            <StoreIcon className="size-10" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 p-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-extrabold text-gray-900 leading-tight">{store.name}</h2>
            {openNow !== null && (
              <span
                className={`shrink-0 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                  openNow ? 'bg-emerald-500/15 text-emerald-400' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {openNow ? 'Open' : 'Closed'}
              </span>
            )}
          </div>
          <p className="text-xs font-semibold text-accent mt-0.5">{store.category}</p>
        </div>

        <div className="flex flex-col gap-1.5 text-xs text-gray-600">
          <div className="flex items-start gap-2">
            <MapPin className="size-3.5 shrink-0 mt-0.5 text-gray-500" />
            <span>
              {store.address}, {store.city}, {store.state} {store.postalCode}
            </span>
          </div>
          {store.openingHours && (
            <div className="flex items-center gap-2">
              <Clock className="size-3.5 shrink-0 text-gray-500" />
              <span>{openNow === null ? 'Hours not available' : openNow ? 'Open now' : 'Closed now'}</span>
            </div>
          )}
          {store.phone && (
            <div className="flex items-center gap-2">
              <Phone className="size-3.5 shrink-0 text-gray-500" />
              <a href={`tel:${store.phone}`} className="hover:text-accent">
                {store.phone}
              </a>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={() => navigate(`/stores/${store.id}`)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-colors"
          >
            View Store
          </button>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors"
          >
            <Navigation className="size-3.5" /> Directions
          </a>
        </div>
      </div>
    </div>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
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

  // First click on a row selects it (highlights the marker + shows the detail
  // card); clicking the already-selected row is treated as intent to drill in.
  const handleRowActivate = (id: number) => {
    if (id === selectedStoreId) {
      navigate(`/stores/${id}`);
    } else {
      setSelectedStoreId(id);
      setMobileView('map');
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row lg:items-stretch">
      {/* Sidebar column: toolbar (search/filters/mobile toggle) is always
          rendered so it stays reachable — only the list *content* below it
          toggles away on mobile when the Map tab is active. If the toggle
          itself lived inside the panel that hides, switching to Map would
          strand the user with no way back to List. */}
      <div className="w-full flex flex-col bg-gray-50 lg:h-[calc(100vh-65px)] lg:w-105 lg:min-w-95 lg:border-r lg:border-gray-200">
        <div className="border-b border-gray-200 bg-surface px-4 py-4 flex flex-col gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 size-4 text-gray-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, city…"
                className="w-full pl-9 pr-8 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-shadow"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-2.5 text-gray-500 hover:text-gray-800"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <button
              onClick={geo.request}
              disabled={geo.status === 'loading'}
              aria-label="Use my location"
              className={`shrink-0 flex items-center justify-center gap-1.5 size-10 rounded-xl text-xs font-bold transition-colors ${
                geo.status === 'granted'
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-primary text-white hover:bg-primary/90'
              }`}
            >
              <Navigation className={`size-4 ${geo.status === 'loading' ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                  category === cat ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {geo.errorMessage && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400">
              <AlertCircle className="size-3.5 shrink-0" />
              <span>{geo.errorMessage}</span>
            </div>
          )}

          {/* Mobile-only list/map switch — a 50/50 split doesn't work on a
              small screen, so below lg the two views are toggled instead of
              shrunk side-by-side. */}
          <div className="flex lg:hidden items-center gap-1 p-1 rounded-xl bg-gray-100">
            <button
              onClick={() => setMobileView('list')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                mobileView === 'list' ? 'bg-surface text-gray-900 shadow-xs' : 'text-gray-500'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setMobileView('map')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                mobileView === 'map' ? 'bg-surface text-gray-900 shadow-xs' : 'text-gray-500'
              }`}
            >
              Map
            </button>
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto sd-scroll ${mobileView === 'map' ? 'hidden lg:block' : 'block'}`}>
          {selectedStore && <StoreDetailCard key={selectedStore.id} store={selectedStore} onClose={() => setSelectedStoreId(null)} />}

          {loading && <ListSkeleton />}
          {!loading && error && <ErrorState message={error} onRetry={reload} />}
          {!loading && !error && stores.length === 0 && (
            <EmptyState icon={ShoppingBag} title="No stores match your search" description="Try a different search term or category." />
          )}

          {!loading && !error && stores.length > 0 && (
            <div className="flex flex-col divide-y divide-gray-100">
              <p className="px-4 pt-3 pb-1 text-xs font-bold text-gray-500 uppercase tracking-wide">
                {stores.length} store{stores.length === 1 ? '' : 's'} nearby
              </p>
              {stores.map((store) => {
                const distance =
                  geo.coords && store.lat !== null && store.lng !== null
                    ? haversineDistanceMiles(geo.coords.lat, geo.coords.lng, store.lat, store.lng)
                    : null;
                const openNow = isStoreOpenNow(store.openingHours);
                const isSelected = store.id === selectedStoreId;

                return (
                  <button
                    key={store.id}
                    onClick={() => handleRowActivate(store.id)}
                    aria-pressed={isSelected}
                    className={`text-left p-4 flex items-center gap-3 transition-colors border-l-2 ${
                      isSelected ? 'bg-accent/10 border-accent' : 'border-transparent hover:bg-gray-100'
                    }`}
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
                          <span
                            className={`shrink-0 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                              openNow ? 'bg-emerald-500/15 text-emerald-400' : 'bg-gray-200 text-gray-500'
                            }`}
                          >
                            {openNow ? 'Open' : 'Closed'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {store.category} • {store.city}, {store.state}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
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

      {/* Map pane */}
      <div
        className={`relative w-full h-[65vh] lg:flex-1 lg:h-[calc(100vh-65px)] ${mobileView === 'list' ? 'hidden lg:block' : 'block'}`}
      >
        <Suspense fallback={<Spinner label="Loading map…" />}>
          <StoreMap
            stores={stores}
            selectedStoreId={selectedStoreId}
            onSelectStore={(id) => setSelectedStoreId(id)}
            userLocation={geo.coords}
            onLocateMe={geo.request}
            locating={geo.status === 'loading'}
          />
        </Suspense>

        {selectedStore && mobileView === 'map' && (
          <div className="lg:hidden absolute bottom-0 inset-x-0 z-500">
            <StoreDetailCard key={selectedStore.id} store={selectedStore} onClose={() => setSelectedStoreId(null)} variant="sheet" />
          </div>
        )}
      </div>
    </div>
  );
}
