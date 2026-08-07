import L from 'leaflet';

// Leaflet's default marker images resolve via relative URLs that break under
// Vite bundling. Using inline SVG divIcons sidesteps that entirely and lets
// markers match the app's own visual style instead of Leaflet's stock pin.
export function storeMarkerIcon(selected: boolean): L.DivIcon {
  const size = selected ? 34 : 28;
  const fill = selected ? '#2563eb' : '#0f172a';
  return L.divIcon({
    className: '',
    html: `
      <div style="width:${size}px;height:${size}px;transform:translate(-50%,-100%);filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))">
        <svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="${fill}" stroke="white" stroke-width="1">
          <path d="M12 0C7.03 0 3 4.03 3 9c0 6.5 9 15 9 15s9-8.5 9-15c0-4.97-4.03-9-9-9zm0 12.5A3.5 3.5 0 1 1 12 5.5a3.5 3.5 0 0 1 0 7z"/>
        </svg>
      </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

export function userLocationIcon(): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:20px;height:20px">
        <div style="position:absolute;inset:-8px;border-radius:9999px;background:rgba(37,99,235,.25);animation:sd-pulse 2s infinite"></div>
        <div style="position:absolute;inset:0;border-radius:9999px;background:#2563eb;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.4)"></div>
      </div>
      <style>@keyframes sd-pulse{0%{transform:scale(.6);opacity:.8}100%{transform:scale(2.2);opacity:0}}</style>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}
