import L from 'leaflet';
import type { Theme } from '@storedash/shared';

// Leaflet's default marker images resolve via relative URLs that break under
// Vite bundling. Using inline SVG divIcons sidesteps that entirely and lets
// markers match the app's own visual style instead of Leaflet's stock pin.
//
// Unselected markers use the brand purple so the map reads as "StoreDash" at a
// glance; the selected marker switches to the accent blue and grows slightly so
// it's unambiguous which shop is highlighted, matching the selected-state color
// used for the list item and detail card. The outline color is theme-aware
// (not just the fill) because it exists purely for contrast against the map
// tiles underneath, which flip between CARTO's dark_all/light_all basemaps —
// a near-white outline that reads fine on the dark tiles nearly disappears on
// the light ones, and vice versa.
export function storeMarkerIcon(selected: boolean, theme: Theme = 'dark'): L.DivIcon {
  const size = selected ? 38 : 30;
  const fill = selected ? '#3b82f6' : '#7c3aed';
  const outline = theme === 'dark' ? '#f6f4fa' : '#17111f';
  const glow = selected ? 'drop-shadow(0 0 8px rgba(59,130,246,.65))' : 'drop-shadow(0 2px 4px rgba(0,0,0,.5))';
  return L.divIcon({
    className: '',
    html: `
      <div style="width:${size}px;height:${size}px;transform:translate(-50%,-100%);filter:${glow};transition:filter 150ms ease">
        <svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="${fill}" stroke="${outline}" stroke-width="1.25">
          <path d="M12 0C7.03 0 3 4.03 3 9c0 6.5 9 15 9 15s9-8.5 9-15c0-4.97-4.03-9-9-9zm0 12.5A3.5 3.5 0 1 1 12 5.5a3.5 3.5 0 0 1 0 7z"/>
        </svg>
      </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

export function userLocationIcon(theme: Theme = 'dark'): L.DivIcon {
  const outline = theme === 'dark' ? '#f6f4fa' : '#17111f';
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:20px;height:20px">
        <div style="position:absolute;inset:-8px;border-radius:9999px;background:rgba(59,130,246,.28);animation:sd-pulse 2s infinite"></div>
        <div style="position:absolute;inset:0;border-radius:9999px;background:#3b82f6;border:2px solid ${outline};box-shadow:0 1px 3px rgba(0,0,0,.5)"></div>
      </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}
