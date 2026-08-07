import React from 'react';
import { MapPin, Navigation, Store, Star } from 'lucide-react';
import { Store as StoreType } from '../types';

interface InteractiveMapProps {
  stores: StoreType[];
  selectedStoreId: number | null;
  onSelectStore: (id: number) => void;
  userLocation?: { lat: number; lng: number } | null;
  onRequestLocation?: () => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  stores,
  selectedStoreId,
  onSelectStore,
  userLocation,
  onRequestLocation,
}) => {
  return (
    <div className="relative size-full min-h-[400px] bg-slate-900 overflow-hidden select-none">
      {/* Canvas / Vector Map Graphic background */}
      <svg className="absolute inset-0 size-full opacity-40" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Map River */}
        <path
          d="M -50 150 Q 200 120 350 280 T 800 450 T 1200 600"
          fill="none"
          stroke="#1e3a8a"
          strokeWidth="32"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* Roads */}
        <path d="M 0 250 L 1200 250" fill="none" stroke="#475569" strokeWidth="6" />
        <path d="M 0 420 L 1200 420" fill="none" stroke="#475569" strokeWidth="8" />
        <path d="M 300 0 L 300 800" fill="none" stroke="#475569" strokeWidth="6" />
        <path d="M 750 0 L 750 800" fill="none" stroke="#475569" strokeWidth="8" />
      </svg>

      {/* User GPS Location Pulse Pin */}
      <div className="absolute top-[48%] left-[20%] -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
        <div className="relative flex items-center justify-center">
          <div className="absolute size-10 bg-blue-500/30 rounded-full animate-ping" />
          <div className="absolute size-6 bg-blue-500/50 rounded-full animate-pulse" />
          <div className="size-4 bg-blue-600 rounded-full ring-4 ring-white shadow-xl flex items-center justify-center">
            <div className="size-1.5 bg-white rounded-full" />
          </div>
        </div>
        <div className="mt-1 px-2 py-0.5 bg-blue-600 text-white font-extrabold text-[10px] rounded-full shadow-lg border border-blue-400 whitespace-nowrap flex items-center gap-1">
          <Navigation className="size-2.5 animate-spin" />
          <span>{userLocation ? 'Your Location' : 'Default GPS Area'}</span>
        </div>
      </div>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        {onRequestLocation && (
          <button
            onClick={onRequestLocation}
            className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-xl transition-all flex items-center justify-center gap-1.5 text-xs font-bold ring-2 ring-blue-400/50"
            title="Locate Me via GPS"
          >
            <Navigation className="size-4" />
            <span className="hidden sm:inline">GPS Radar</span>
          </button>
        )}
      </div>

      {/* Map Store Markers */}
      <div className="absolute inset-0 p-8 flex items-center justify-center">
        {stores.map((store, index) => {
          const isSelected = store.id === selectedStoreId;

          // Preset visual map coordinates for responsive display
          const coords = [
            { top: '30%', left: '35%' },
            { top: '55%', left: '60%' },
            { top: '25%', left: '72%' },
            { top: '65%', left: '28%' },
            { top: '42%', left: '48%' },
          ];

          const pos = coords[index % coords.length];

          return (
            <div
              key={store.id}
              onClick={() => onSelectStore(store.id)}
              style={{ top: pos.top, left: pos.left }}
              className={`absolute cursor-pointer transition-all duration-300 z-10 -translate-x-1/2 -translate-y-1/2 group ${
                isSelected ? 'scale-125 z-30' : 'hover:scale-110'
              }`}
            >
              {/* Pulse effect */}
              {isSelected && (
                <div className="absolute -inset-2 bg-blue-500/40 rounded-full animate-ping pointer-events-none" />
              )}

              {/* Pin marker */}
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full shadow-2xl border-2 transition-colors ${
                  isSelected
                    ? 'bg-primary text-white border-white ring-4 ring-blue-500/30'
                    : 'bg-slate-900/90 text-gray-200 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <Store className="size-4 shrink-0 text-amber-400" />
                <span className="text-xs font-bold truncate max-w-[120px]">{store.name}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Map Watermark */}
      <div className="absolute bottom-3 left-3 text-[10px] text-slate-500 font-mono">
        StoreFinder Vector GPS Engine • Cloud SQL Synchronized
      </div>
    </div>
  );
};
