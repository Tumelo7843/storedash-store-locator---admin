import L from 'leaflet';
import type { Theme } from '@storedash/shared';

// Same rationale as apps/customer/src/lib/leafletIcons.ts: inline SVG
// divIcons sidestep Leaflet's default marker image paths breaking under
// Vite, and let the pin match the app's own palette instead of Leaflet's
// stock icon.
export function locationPinIcon(theme: Theme = 'dark'): L.DivIcon {
  const size = 38;
  const fill = theme === 'dark' ? '#3b82f6' : '#2563eb';
  const outline = theme === 'dark' ? '#f8fafc' : '#111827';
  return L.divIcon({
    className: '',
    html: `
      <div style="width:${size}px;height:${size}px;transform:translate(-50%,-100%);filter:drop-shadow(0 2px 4px rgba(0,0,0,.5));cursor:grab">
        <svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="${fill}" stroke="${outline}" stroke-width="1.25">
          <path d="M12 0C7.03 0 3 4.03 3 9c0 6.5 9 15 9 15s9-8.5 9-15c0-4.97-4.03-9-9-9zm0 12.5A3.5 3.5 0 1 1 12 5.5a3.5 3.5 0 0 1 0 7z"/>
        </svg>
      </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
}
