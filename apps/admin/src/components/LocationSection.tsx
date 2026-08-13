import { Loader2, MapPinOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { LocationMapPicker } from './LocationMapPicker';
import { type GeocodeSuggestion, isValidLat, isValidLng, reverseGeocode, searchAddress } from '../lib/geocode';

export interface LocationFormValue {
  address: string;
  city: string;
  state: string;
  postalCode: string;
  lat: number | null;
  lng: number | null;
}

interface LocationSectionProps {
  value: LocationFormValue;
  onChange: (patch: Partial<LocationFormValue>) => void;
  /** Change this (e.g. the store id) when the whole `value` is swapped out for a different record, so the section doesn't re-geocode a location that's already correct. */
  resetKey?: string | number;
}

const SEARCH_DEBOUNCE_MS = 700;
const COORDS_DEBOUNCE_MS = 700;

function buildQuery(v: LocationFormValue): string {
  return [v.address, v.city, v.state, v.postalCode]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(', ');
}

export function LocationSection({ value, onChange, resetKey }: LocationSectionProps) {
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [reverseLoading, setReverseLoading] = useState(false);
  const [geocodeError, setGeocodeError] = useState('');
  const [focusToken, setFocusToken] = useState(0);

  const valueRef = useRef(value);
  valueRef.current = value;

  // Skips the next address->geocode effect run once: set right before we
  // programmatically fill address fields ourselves (suggestion pick, reverse
  // geocode) so we don't immediately re-search and fight our own update.
  const suppressSearchRef = useRef(true); // also covers "don't search on first mount"
  const lastResetKeyRef = useRef(resetKey);
  const searchAbortRef = useRef<AbortController | null>(null);
  const reverseAbortRef = useRef<AbortController | null>(null);
  const coordsDebounceRef = useRef<number | undefined>(undefined);

  // Re-arms the mount-skip whenever the caller swaps in a different record
  // (e.g. switching the selected store) so an already-correct saved address
  // doesn't get silently re-geocoded and its coordinates nudged.
  useEffect(() => {
    if (resetKey === lastResetKeyRef.current) return;
    lastResetKeyRef.current = resetKey;
    suppressSearchRef.current = true;
    setSuggestions([]);
    setShowSuggestions(false);
    setNotFound(false);
    setSearching(false);
    setGeocodeError('');
  }, [resetKey]);

  useEffect(() => {
    if (suppressSearchRef.current) {
      suppressSearchRef.current = false;
      return;
    }

    const query = buildQuery(value);
    if (!value.address.trim() || !value.city.trim() || query.length < 6) {
      setSuggestions([]);
      setNotFound(false);
      setSearching(false);
      return;
    }

    setSearching(true);
    setNotFound(false);
    setGeocodeError('');
    setShowSuggestions(true);
    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;

    const timer = window.setTimeout(async () => {
      try {
        const results = await searchAddress(query, { signal: controller.signal, limit: 5 });
        setSearching(false);
        setSuggestions(results);
        setNotFound(results.length === 0);
        if (results.length > 0) {
          const top = results[0];
          onChange({ lat: top.lat, lng: top.lng });
          setFocusToken((t) => t + 1);
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        setSearching(false);
        setGeocodeError('Could not search for this address right now.');
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.address, value.city, value.state, value.postalCode]);

  function selectSuggestion(s: GeocodeSuggestion) {
    suppressSearchRef.current = true;
    onChange({
      address: s.address.streetAddress || value.address,
      city: s.address.city || value.city,
      state: s.address.state || value.state,
      postalCode: s.address.postalCode || value.postalCode,
      lat: s.lat,
      lng: s.lng,
    });
    setSuggestions([]);
    setShowSuggestions(false);
    setNotFound(false);
    setFocusToken((t) => t + 1);
  }

  async function applyCoordinates(lat: number, lng: number, opts: { reverseFill?: boolean } = {}) {
    onChange({ lat, lng });
    setFocusToken((t) => t + 1);
    if (!opts.reverseFill) return;

    reverseAbortRef.current?.abort();
    const controller = new AbortController();
    reverseAbortRef.current = controller;
    setReverseLoading(true);
    try {
      const result = await reverseGeocode(lat, lng, { signal: controller.signal });
      if (result) {
        suppressSearchRef.current = true;
        const current = valueRef.current;
        onChange({
          address: result.address.streetAddress || current.address,
          city: result.address.city || current.city,
          state: result.address.state || current.state,
          postalCode: result.address.postalCode || current.postalCode,
        });
        setNotFound(false);
      }
    } catch {
      // Non-fatal: keep the manually-placed coordinates even if reverse geocoding fails.
    } finally {
      setReverseLoading(false);
    }
  }

  function scheduleCoordApply() {
    window.clearTimeout(coordsDebounceRef.current);
    coordsDebounceRef.current = window.setTimeout(() => {
      const { lat, lng } = valueRef.current;
      if (lat !== null && lng !== null && isValidLat(lat) && isValidLng(lng)) {
        applyCoordinates(lat, lng, { reverseFill: true });
      }
    }, COORDS_DEBOUNCE_MS);
  }

  const latInvalid = value.lat !== null && !isValidLat(value.lat);
  const lngInvalid = value.lng !== null && !isValidLng(value.lng);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Field label="Street Address">
          <input
            value={value.address}
            onChange={(e) => onChange({ address: e.target.value })}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => window.setTimeout(() => setShowSuggestions(false), 150)}
            required
            autoComplete="off"
            className="input"
          />
        </Field>
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-surface shadow-lg max-h-64 overflow-auto">
            {suggestions.map((s, i) => (
              <button
                type="button"
                key={`${s.lat}-${s.lng}-${i}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectSuggestion(s);
                }}
                className="block w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 border-b border-gray-100 last:border-0"
              >
                {s.displayName}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="City">
          <input value={value.city} onChange={(e) => onChange({ city: e.target.value })} required className="input" />
        </Field>
        <Field label="Province">
          <input value={value.state} onChange={(e) => onChange({ state: e.target.value })} required className="input" />
        </Field>
        <Field label="Postal Code">
          <input value={value.postalCode} onChange={(e) => onChange({ postalCode: e.target.value })} required className="input" />
        </Field>
      </div>

      {searching && (
        <p className="text-xs text-gray-400 flex items-center gap-1.5">
          <Loader2 className="size-3.5 animate-spin" /> Looking up this address…
        </p>
      )}
      {!searching && notFound && (
        <p className="text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-2 rounded-lg flex items-start gap-1.5">
          <MapPinOff className="size-3.5 shrink-0 mt-0.5" />
          We couldn't find this address automatically. Click or drag the pin on the map below to set the exact location.
        </p>
      )}
      {geocodeError && <p className="text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">{geocodeError}</p>}

      <LocationMapPicker lat={value.lat} lng={value.lng} onPick={(lat, lng) => applyCoordinates(lat, lng, { reverseFill: true })} focusToken={focusToken} />
      {reverseLoading && (
        <p className="text-xs text-gray-400 flex items-center gap-1.5">
          <Loader2 className="size-3.5 animate-spin" /> Looking up the address for this location…
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Latitude">
          <input
            type="number"
            step="any"
            value={value.lat ?? ''}
            onChange={(e) => {
              onChange({ lat: e.target.value === '' ? null : Number(e.target.value) });
              scheduleCoordApply();
            }}
            className="input"
          />
          {latInvalid && <p className="text-[11px] font-semibold text-rose-600 mt-1">Must be between -90 and 90.</p>}
        </Field>
        <Field label="Longitude">
          <input
            type="number"
            step="any"
            value={value.lng ?? ''}
            onChange={(e) => {
              onChange({ lng: e.target.value === '' ? null : Number(e.target.value) });
              scheduleCoordApply();
            }}
            className="input"
          />
          {lngInvalid && <p className="text-[11px] font-semibold text-rose-600 mt-1">Must be between -180 and 180.</p>}
        </Field>
      </div>
      <p className="text-xs text-gray-400 -mt-2">
        Coordinates are found automatically from the address above. If it can't be found, click/drag the pin on the map or enter coordinates manually — the
        store won't appear on the customer map until coordinates are set.
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
