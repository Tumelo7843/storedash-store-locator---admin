import * as Location from 'expo-location';
import { useCallback, useState } from 'react';

export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

export type GeoStatus = 'idle' | 'loading' | 'granted' | 'denied' | 'unsupported';

export interface GeoState {
  status: GeoStatus;
  coords: { lat: number; lng: number } | null;
  errorMessage: string | null;
  request: () => void;
}

// Deliberately has no fallback coordinate. When location is unavailable, the
// UI must fall back to "no distance sorting" rather than silently pretending
// the user is in some hardcoded city.
export function useGeolocation(): GeoState {
  const [status, setStatus] = useState<GeoStatus>('idle');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const request = useCallback(() => {
    setStatus('loading');
    setErrorMessage(null);

    (async () => {
      try {
        const { status: permission } = await Location.requestForegroundPermissionsAsync();
        if (permission !== 'granted') {
          setStatus('denied');
          setCoords(null);
          setErrorMessage('Location access was denied. You can still browse all stores below.');
          return;
        }
        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setStatus('granted');
      } catch {
        setStatus('denied');
        setCoords(null);
        setErrorMessage('Could not determine your location. You can still browse all stores below.');
      }
    })();
  }, []);

  return { status, coords, errorMessage, request };
}
