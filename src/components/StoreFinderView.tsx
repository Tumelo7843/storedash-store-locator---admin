import React, { useState } from 'react';
import {
  MapPin,
  Search,
  Filter,
  Star,
  Navigation,
  Clock,
  Phone,
  ChevronRight,
  ShoppingBag,
  ArrowRight,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Store } from '../types';
import { InteractiveMap } from './InteractiveMap';

interface StoreFinderViewProps {
  stores: Store[];
  onSelectStorefront: (store: Store) => void;
  onBackToAdmin?: () => void;
  isDark?: boolean;
}

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Search,
  Filter,
  Star,
  Navigation,
  Clock,
  Phone,
  ChevronRight,
  ShoppingBag,
  ArrowRight,
  ExternalLink,
  Layers,
  Sparkles,
  Compass,
  CheckCircle2,
  AlertCircle,
  Package,
} from 'lucide-react';
import { Store } from '../types';
import { InteractiveMap } from './InteractiveMap';

interface StoreFinderViewProps {
  stores: Store[];
  onSelectStorefront: (store: Store) => void;
  onBackToAdmin?: () => void;
  isDark?: boolean;
}

// Haversine formula to compute exact distance in miles between user GPS and store lat/lng
function calculateDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const StoreFinderView: React.FC<StoreFinderViewProps> = ({
  stores,
  onSelectStorefront,
  onBackToAdmin,
  isDark = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(
    stores.length > 0 ? stores[0].id : null
  );

  // GPS User Location State
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'granted' | 'denied'>('idle');
  const [gpsMessage, setGpsMessage] = useState<string>('Detecting your location...');

  const categories = ['All', 'Grocery', 'Bookstore', 'Electronics', 'Cafe', 'Bakery'];

  // Request Browser GPS Location
  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('denied');
      setGpsMessage('Geolocation is not supported by your browser.');
      return;
    }

    setGpsStatus('loading');
    setGpsMessage('Locating your position via GPS...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(coords);
        setGpsStatus('granted');
        setGpsMessage(`GPS Active (${coords.lat.toFixed(2)}, ${coords.lng.toFixed(2)})`);
      },
      (error) => {
        console.warn('GPS location access issue:', error);
        setGpsStatus('denied');
        setGpsMessage('Location access restricted. Showing nearby regional stores.');
        // Default fallback center coordinates if GPS denied or pending
        setUserLocation({ lat: 37.7749, lng: -122.4194 });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  useEffect(() => {
    requestUserLocation();
  }, []);

  // Compute distances for stores & sort by proximity
  const storesWithDistance = stores.map((s, index) => {
    const sLat = parseFloat(s.lat) || 37.7749 + index * 0.02;
    const sLng = parseFloat(s.lng) || -122.4194 + index * 0.02;

    let distanceMiles = 0.5 + index * 0.8;
    if (userLocation) {
      distanceMiles = calculateDistanceMiles(userLocation.lat, userLocation.lng, sLat, sLng);
    }

    return {
      ...s,
      calculatedLat: sLat,
      calculatedLng: sLng,
      distanceMiles,
    };
  });

  // Sort stores by closest distance first
  const sortedStores = [...storesWithDistance].sort((a, b) => a.distanceMiles - b.distanceMiles);

  const filteredStores = sortedStores.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      s.name.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q) ||
      s.address.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q);
    const matchesCat =
      selectedCategory === 'All' || s.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesQuery && matchesCat;
  });

  const selectedStore = filteredStores.find((s) => s.id === selectedStoreId) || filteredStores[0] || storesWithDistance[0];

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
      }`}
    >
      {/* Top GPS Status & Navigation Header */}
      <header
        className={`sticky top-0 z-30 backdrop-blur-md border-b p-4 ${
          isDark ? 'bg-gray-900/90 border-gray-800' : 'bg-white/90 border-gray-200 shadow-2xs'
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary text-white shadow-lg shadow-blue-500/30">
                <MapPin className="size-5" />
              </div>
              <div>
                <span className={`font-extrabold text-xl tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  StoreFinder
                </span>
                <span className="block text-[10px] text-primary font-bold uppercase tracking-wider">
                  Nearby Stores & Inventory Catalog
                </span>
              </div>
            </div>

            {onBackToAdmin && (
              <button
                onClick={onBackToAdmin}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  isDark
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
                }`}
              >
                ← Owner Portal
              </button>
            )}
          </div>

          {/* Search Input */}
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-3 size-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stores, locations or products sold..."
              className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/40 placeholder:text-gray-400 ${
                isDark
                  ? 'bg-gray-800/90 border border-gray-700 text-white'
                  : 'bg-white border border-gray-200 text-gray-900 shadow-2xs'
              }`}
            />
          </div>

          {/* GPS Location Trigger & Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 scrollbar-none">
            <button
              onClick={requestUserLocation}
              disabled={gpsStatus === 'loading'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-xs ${
                gpsStatus === 'granted'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : gpsStatus === 'loading'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
                  : 'bg-primary text-white shadow-md hover:bg-primary/90'
              }`}
            >
              <Navigation className={`size-3.5 ${gpsStatus === 'loading' ? 'animate-spin' : ''}`} />
              <span>
                {gpsStatus === 'granted'
                  ? '📍 Live GPS Active'
                  : gpsStatus === 'loading'
                  ? 'Locating...'
                  : '📍 Use My Location'}
              </span>
            </button>

            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-primary text-white shadow-md'
                    : isDark
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Split Screen Area: Map (Left) & Sidebar List / Store Detail Popup (Right) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-[calc(100vh-80px)]">
        {/* Left Column: Interactive Map (7 cols) */}
        <div className="lg:col-span-7 h-[400px] lg:h-full relative">
          <InteractiveMap
            stores={filteredStores}
            selectedStoreId={selectedStoreId}
            onSelectStore={(id) => setSelectedStoreId(id)}
            userLocation={userLocation}
            onRequestLocation={requestUserLocation}
          />
        </div>

        {/* Right Column: Nearby Store List & Detail Card Popup (5 cols) */}
        <div
          className={`lg:col-span-5 border-l flex flex-col h-full overflow-y-auto p-4 sm:p-6 gap-6 ${
            isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {filteredStores.length} Stores Around You
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">{gpsMessage}</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
              Sorted by Proximity
            </span>
          </div>

          {/* Selected Store Card - Displays "WHAT THIS STORE SELLS" */}
          {selectedStore && (
            <div
              className={`border-2 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 relative overflow-hidden ${
                isDark
                  ? 'bg-[#18232e] border-primary/60 text-white'
                  : 'bg-white border-primary/40 text-gray-900 shadow-lg'
              }`}
            >
              <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-extrabold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                Selected Location
              </div>

              <div className="flex gap-4">
                <img
                  src={
                    selectedStore.imageUrl ||
                    'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80'
                  }
                  alt={selectedStore.name}
                  className="size-20 rounded-xl object-cover bg-gray-800 border border-gray-700 shrink-0"
                />
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Open now
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      📍 {selectedStore.distanceMiles} mi away
                    </span>
                  </div>
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {selectedStore.name}
                  </h3>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="size-3 shrink-0 text-primary" />
                    <span>
                      {selectedStore.address}, {selectedStore.city}
                    </span>
                  </p>
                </div>
              </div>

              {/* What this store sells highlight banner */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                  isDark ? 'bg-gray-800/60 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                    <Package className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">Store Catalog Available</h4>
                    <p className="text-[11px] text-gray-400">
                      Browse groceries, books, electronics & products carried at this branch
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons: View Store Products & Get Directions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  onClick={() => onSelectStorefront(selectedStore)}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs transition-all shadow-lg shadow-blue-500/20 cursor-pointer"
                >
                  <ShoppingBag className="size-4" />
                  <span>See What This Store Sells</span>
                </button>

                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(
                    selectedStore.address + ' ' + selectedStore.city
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs transition-colors border ${
                    isDark
                      ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300'
                  }`}
                >
                  <Navigation className="size-4 text-emerald-500" />
                  <span>Get Directions</span>
                </a>
              </div>
            </div>
          )}

          {/* Proximity Sorted Store List */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                All Nearby Locations
              </h3>
              <span className="text-[11px] font-medium text-gray-400">
                {filteredStores.length} store{filteredStores.length === 1 ? '' : 's'} available
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {filteredStores.map((s, idx) => {
                const isSelected = s.id === selectedStore?.id;
                const isClosest = idx === 0;

                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedStoreId(s.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      isSelected
                        ? isDark
                          ? 'bg-[#18232e] border-primary text-white shadow-md'
                          : 'bg-blue-50/80 border-primary text-gray-900 shadow-xs'
                        : isDark
                        ? 'bg-gray-800/40 border-gray-800 text-gray-300 hover:bg-gray-800/80 hover:border-gray-700'
                        : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          s.imageUrl ||
                          'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80'
                        }
                        alt={s.name}
                        className="size-12 rounded-lg object-cover bg-gray-700 shrink-0"
                        loading="lazy"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4
                            className={`text-sm font-bold ${
                              isSelected ? (isDark ? 'text-white' : 'text-gray-900') : ''
                            }`}
                          >
                            {s.name}
                          </h4>
                          {isClosest && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Closest
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">
                          {s.category} • {s.city}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-emerald-400 font-bold">Open Now</span>
                          <span className="text-[10px] text-primary font-bold">
                            • {s.distanceMiles} mi away
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStorefront(s);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 border border-primary/20"
                      >
                        <ShoppingBag className="size-3" />
                        <span>Sells & Inventory</span>
                      </button>
                      <ChevronRight className="size-5 text-gray-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

