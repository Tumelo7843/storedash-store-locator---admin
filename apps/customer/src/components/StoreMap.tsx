import type { Store } from '@storedash/shared';
import L from 'leaflet';
import { useEffect, useRef } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { storeMarkerIcon, userLocationIcon } from '../lib/leafletIcons';

interface StoreMapProps {
  stores: Store[];
  selectedStoreId: number | null;
  onSelectStore: (id: number) => void;
  userLocation: { lat: number; lng: number } | null;
}

const DEFAULT_CENTER: [number, number] = [39.8283, -98.5795]; // geographic center of the contiguous US
const DEFAULT_ZOOM = 4;

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

// Stores without geocoded coordinates are filtered out before this component
// ever sees them — a store with no lat/lng cannot be plotted on a real map,
// and pretending otherwise (e.g. with a fake default coordinate) would be
// misleading. Callers should show those stores in a list with a "location
// unavailable" note instead.
export function StoreMap({ stores, selectedStoreId, onSelectStore, userLocation }: StoreMapProps) {
  const plottable = stores.filter((s): s is Store & { lat: number; lng: number } => s.lat !== null && s.lng !== null);

  const points: [number, number][] = [
    ...(userLocation ? [[userLocation.lat, userLocation.lng] as [number, number]] : []),
    ...plottable.map((s): [number, number] => [s.lat, s.lng]),
  ];

  return (
    <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} scrollWheelZoom className="size-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitToMarkers points={points} />

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
          eventHandlers={{ click: () => onSelectStore(store.id) }}
        >
          <Popup>
            <div className="font-sans">
              <p className="font-bold text-sm">{store.name}</p>
              <p className="text-xs text-gray-500">{store.category}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
