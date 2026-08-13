import type { Theme } from '@storedash/shared';
import { useEffect, useRef } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import type { Marker as LeafletMarker } from 'leaflet';
import { useTheme } from '../context/ThemeContext';
import { locationPinIcon } from '../lib/leafletIcons';

// Geographic center of South Africa — matches the store form's default
// country, used only when no coordinates have been set yet.
const DEFAULT_CENTER: [number, number] = [-30.5595, 22.9375];
const DEFAULT_ZOOM = 5;
const PICK_ZOOM = 16;

interface LocationMapPickerProps {
  lat: number | null;
  lng: number | null;
  onPick: (lat: number, lng: number) => void;
  /** Bump this to fly/zoom the map to `lat`/`lng` (e.g. after a geocode match). Map-originated moves (click/drag) don't need it. */
  focusToken?: number;
}

function InvalidateOnMount() {
  const map = useMap();
  useEffect(() => {
    const id = window.setTimeout(() => map.invalidateSize(), 0);
    const onResize = () => map.invalidateSize();
    window.addEventListener('resize', onResize);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('resize', onResize);
    };
  }, [map]);
  return null;
}

function ClickToPick({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyToFocus({ lat, lng, token }: { lat: number | null; lng: number | null; token: number | undefined }) {
  const map = useMap();
  const lastToken = useRef(token);

  useEffect(() => {
    if (token === undefined || token === lastToken.current || lat === null || lng === null) return;
    lastToken.current = token;
    map.flyTo([lat, lng], Math.max(map.getZoom(), PICK_ZOOM), { duration: 0.6 });
  }, [token, lat, lng, map]);

  return null;
}

export function LocationMapPicker({ lat, lng, onPick, focusToken }: LocationMapPickerProps) {
  const { theme } = useTheme();
  const hasPosition = lat !== null && lng !== null;
  const markerRef = useRef<LeafletMarker | null>(null);

  return (
    <div className="relative h-72 w-full overflow-hidden rounded-xl border border-gray-200">
      <MapContainer center={hasPosition ? [lat, lng] : DEFAULT_CENTER} zoom={hasPosition ? PICK_ZOOM : DEFAULT_ZOOM} scrollWheelZoom className="size-full">
        <TileLayer
          key={theme as Theme}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={`https://{s}.basemaps.cartocdn.com/${theme === 'dark' ? 'dark_all' : 'light_all'}/{z}/{x}/{y}{r}.png`}
        />
        <InvalidateOnMount />
        <ClickToPick onPick={onPick} />
        <FlyToFocus lat={lat} lng={lng} token={focusToken} />

        {hasPosition && (
          <Marker
            position={[lat, lng]}
            icon={locationPinIcon(theme)}
            draggable
            ref={markerRef}
            eventHandlers={{
              dragend: () => {
                const marker = markerRef.current;
                if (!marker) return;
                const { lat: newLat, lng: newLng } = marker.getLatLng();
                onPick(newLat, newLng);
              },
            }}
          />
        )}
      </MapContainer>

      {!hasPosition && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-surface/95 backdrop-blur-md px-4 py-2.5 text-xs font-medium text-gray-500 shadow-lg text-center">
            Click anywhere on the map to place the store's location.
          </div>
        </div>
      )}
    </div>
  );
}
