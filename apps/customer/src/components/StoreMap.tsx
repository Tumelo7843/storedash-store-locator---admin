import type { Store } from '@storedash/shared';
import L from 'leaflet';
import { LocateFixed, MapPinOff } from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { storeMarkerIcon, userLocationIcon } from '../lib/leafletIcons';

interface StoreMapProps {
  stores: Store[];
  selectedStoreId: number | null;
  onSelectStore: (id: number) => void;
  userLocation: { lat: number; lng: number } | null;
  onLocateMe?: () => void;
  locating?: boolean;
}

const DEFAULT_CENTER: [number, number] = [39.8283, -98.5795]; // geographic center of the contiguous US
const DEFAULT_ZOOM = 4;
const SELECT_ZOOM = 15;

// The mobile List/Map toggle keeps the map mounted but hides it with
// `display:none` rather than unmounting it (so pan/zoom state survives
// switching tabs). Leaflet can't compute pixel positions for a zero-size
// container — calling setView/fitBounds/flyTo while hidden throws "Invalid
// LatLng object: (NaN, NaN)". This gate holds off any view-changing children
// until the container actually has a size, and re-invalidates on every
// resize after that (covers the tab toggle, sidebar layout, window resize).
function MapReadyGate({ children }: { children: ReactNode }) {
  const map = useMap();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = map.getContainer();

    const check = () => {
      if (container.clientWidth > 0 && container.clientHeight > 0) {
        map.invalidateSize();
        setReady(true);
      }
    };

    check();
    const observer = new ResizeObserver(check);
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  return ready ? <>{children}</> : null;
}

function FitToMarkers({ points }: { points: [number, number][] }) {
  const map = useMap();
  const lastKey = useRef<string>('');

  useEffect(() => {
    const key = points.map((p) => p.join(',')).join('|');
    if (key === lastKey.current || points.length === 0) return;
    lastKey.current = key;

    if (points.length === 1) {
      map.setView(points[0], 14);
    } else {
      map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 15 });
    }
  }, [points, map]);

  return null;
}

// Pans/zooms to a store the moment it's selected (list click or marker click),
// separate from FitToMarkers so re-selecting doesn't fight the initial fit.
function FlyToSelected({ point }: { point: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (!point) return;
    map.flyTo(point, Math.max(map.getZoom(), SELECT_ZOOM), { duration: 0.6 });
  }, [point, map]);
  return null;
}

function LocateButton({ onClick, active }: { onClick: () => void; active: boolean }) {
  return (
    <button
      onClick={onClick}
      aria-label="Center on my location"
      className="absolute bottom-4 right-4 z-500 flex size-11 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-95 transition-all"
    >
      <LocateFixed className={`size-5 ${active ? 'animate-pulse' : ''}`} />
    </button>
  );
}

// Stores without geocoded coordinates are filtered out before this component
// ever sees them — a store with no lat/lng cannot be plotted on a real map,
// and pretending otherwise (e.g. with a fake default coordinate) would be
// misleading. Callers should show those stores in a list with a "location
// unavailable" note instead.
export function StoreMap({ stores, selectedStoreId, onSelectStore, userLocation, onLocateMe, locating }: StoreMapProps) {
  const plottable = stores.filter((s): s is Store & { lat: number; lng: number } => s.lat !== null && s.lng !== null);

  const points: [number, number][] = [
    ...(userLocation ? [[userLocation.lat, userLocation.lng] as [number, number]] : []),
    ...plottable.map((s): [number, number] => [s.lat, s.lng]),
  ];

  const selectedStore = plottable.find((s) => s.id === selectedStoreId) ?? null;
  const selectedPoint: [number, number] | null = selectedStore ? [selectedStore.lat, selectedStore.lng] : null;

  return (
    <div className="relative size-full">
      <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} scrollWheelZoom className="size-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <MapReadyGate>
          <FitToMarkers points={points} />
          <FlyToSelected point={selectedPoint} />
        </MapReadyGate>

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon()} zIndexOffset={-100}>
            <Popup>Your location</Popup>
          </Marker>
        )}

        {plottable.map((store) => (
          <Marker
            key={store.id}
            position={[store.lat, store.lng]}
            icon={storeMarkerIcon(store.id === selectedStoreId)}
            zIndexOffset={store.id === selectedStoreId ? 1000 : 0}
            eventHandlers={{ click: () => onSelectStore(store.id) }}
          >
            <Popup minWidth={180}>
              <div className="font-sans flex flex-col gap-1.5 min-w-40">
                <div>
                  <p className="font-bold text-sm text-gray-900">{store.name}</p>
                  <p className="text-xs text-gray-500">{store.category}</p>
                </div>
                <Link
                  to={`/stores/${store.id}`}
                  className="text-xs font-bold text-accent hover:underline mt-1"
                >
                  View store →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {onLocateMe && <LocateButton onClick={onLocateMe} active={Boolean(locating)} />}

      {plottable.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
          <div className="pointer-events-auto flex items-center gap-2.5 rounded-xl border border-gray-200 bg-surface/95 backdrop-blur-md px-4 py-3 text-xs font-medium text-gray-400 shadow-lg">
            <MapPinOff className="size-4 shrink-0 text-gray-500" />
            No store locations to display yet.
          </div>
        </div>
      )}
    </div>
  );
}
