// Geocoding via OpenStreetMap's Nominatim public API — the same
// OpenStreetMap data source already powering the customer app's map tiles
// (see apps/customer/src/components/StoreMap.tsx), so no new mapping
// provider or API key is introduced. Nominatim's usage policy caps the
// public instance at ~1 request/second and asks non-bulk callers to
// identify themselves via Referer (browsers send this automatically); this
// is fine for an admin form filled in by store staff. If store-creation
// volume ever grows large, swap this file for a paid provider or a
// self-hosted Nominatim instance — nothing else in the app needs to change.
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

export interface GeocodedAddress {
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface GeocodeSuggestion {
  displayName: string;
  lat: number;
  lng: number;
  address: GeocodedAddress;
}

function parseAddress(a: Record<string, string | undefined>): GeocodedAddress {
  return {
    streetAddress: [a.house_number, a.road].filter(Boolean).join(' ').trim(),
    city: a.city || a.town || a.village || a.suburb || a.municipality || '',
    state: a.state || '',
    postalCode: a.postcode || '',
    country: a.country || '',
  };
}

export class GeocodeError extends Error {}

async function nominatimFetch(path: string, params: Record<string, string>, signal?: AbortSignal): Promise<any> {
  const url = new URL(`${NOMINATIM_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  let res: Response;
  try {
    res = await fetch(url.toString(), { signal, headers: { Accept: 'application/json' } });
  } catch (err: any) {
    if (err?.name === 'AbortError') throw err;
    throw new GeocodeError('Could not reach the geocoding service. Check your internet connection.');
  }
  if (!res.ok) throw new GeocodeError(`Geocoding service error (${res.status})`);
  return res.json();
}

// countrycodes=za biases/restricts results to South Africa, matching the
// store form's default country and avoiding false-positive matches for
// short/common street names elsewhere in the world.
export async function searchAddress(query: string, opts: { signal?: AbortSignal; limit?: number } = {}): Promise<GeocodeSuggestion[]> {
  const q = query.trim();
  if (q.length < 4) return [];
  const rows = await nominatimFetch(
    '/search',
    { q, format: 'jsonv2', addressdetails: '1', limit: String(opts.limit ?? 5), countrycodes: 'za' },
    opts.signal,
  );
  return (rows as any[]).map((r) => ({
    displayName: r.display_name,
    lat: Number(r.lat),
    lng: Number(r.lon),
    address: parseAddress(r.address ?? {}),
  }));
}

export async function reverseGeocode(lat: number, lng: number, opts: { signal?: AbortSignal } = {}): Promise<GeocodeSuggestion | null> {
  const row = await nominatimFetch('/reverse', { lat: String(lat), lon: String(lng), format: 'jsonv2', addressdetails: '1' }, opts.signal);
  if (!row || row.error) return null;
  return {
    displayName: row.display_name,
    lat: Number(row.lat),
    lng: Number(row.lon),
    address: parseAddress(row.address ?? {}),
  };
}

export function isValidLat(lat: number): boolean {
  return Number.isFinite(lat) && lat >= -90 && lat <= 90;
}

export function isValidLng(lng: number): boolean {
  return Number.isFinite(lng) && lng >= -180 && lng <= 180;
}
