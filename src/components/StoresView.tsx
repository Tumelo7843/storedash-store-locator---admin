import React, { useState, useEffect } from 'react';
import {
  Store as StoreIcon,
  Search,
  Plus,
  MapPin,
  Phone,
  User,
  CheckCircle2,
  XCircle,
  Save,
  RotateCcw,
  Building2,
  Map,
  Globe,
} from 'lucide-react';
import { Store } from '../types';

interface StoresViewProps {
  storesList: Store[];
  onSaveStore: (id: number, updatedData: Partial<Store>) => Promise<void>;
  onOpenAddStore: () => void;
  onViewStorefront?: (store: Store) => void;
  isDark?: boolean;
}

export const StoresView: React.FC<StoresViewProps> = ({
  storesList,
  onSaveStore,
  onOpenAddStore,
  onViewStorefront,
  isDark = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(
    storesList.length > 0 ? storesList[0].id : null
  );

  // Form state
  const [formData, setFormData] = useState<Partial<Store>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const selectedStore = storesList.find((s) => s.id === selectedStoreId) || storesList[0];

  useEffect(() => {
    if (selectedStore) {
      setFormData({
        name: selectedStore.name || '',
        category: selectedStore.category || 'General',
        address: selectedStore.address || '',
        city: selectedStore.city || '',
        state: selectedStore.state || '',
        postalCode: selectedStore.postalCode || '',
        country: selectedStore.country || 'United States',
        phone: selectedStore.phone || '',
        managerName: selectedStore.managerName || '',
        status: selectedStore.status || 'Active',
      });
    }
  }, [selectedStoreId, storesList]);

  const filteredStores = storesList.filter((store) => {
    const q = searchQuery.toLowerCase();
    return (
      store.name.toLowerCase().includes(q) ||
      store.city.toLowerCase().includes(q) ||
      store.address.toLowerCase().includes(q)
    );
  });

  const handleInputChange = (field: keyof Store, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStoreId) return;

    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onSaveStore(selectedStoreId, formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save store:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`flex-1 min-h-screen p-4 md:p-8 flex flex-col gap-6 transition-colors duration-200 ${
      isDark ? 'bg-[#101922] text-gray-100' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Top Bar */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b ${
        isDark ? 'border-gray-800' : 'border-gray-200'
      }`}>
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Stores
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage your retail store locations, contact info, and operational status.
          </p>
        </div>

        <button
          onClick={onOpenAddStore}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus className="size-4" />
          <span>Add New Store</span>
        </button>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Store List Sidebar (4 cols) */}
        <div className={`lg:col-span-4 border rounded-xl overflow-hidden shadow-xs flex flex-col max-h-[85vh] ${
          isDark ? 'bg-[#18232e] border-gray-800' : 'bg-white border-gray-200'
        }`}>
          {/* List Header & Search */}
          <div className={`p-4 border-b flex flex-col gap-3 ${
            isDark ? 'border-gray-800 bg-gray-800/40' : 'border-gray-100 bg-gray-50/50'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">All Stores</h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-primary border border-blue-100">
                {filteredStores.length} stores
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find a store by name or city..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* List Items */}
          <div className="overflow-y-auto divide-y divide-gray-100 flex-1">
            {filteredStores.map((store) => {
              const isSelected = store.id === (selectedStoreId || selectedStore?.id);
              return (
                <div
                  key={store.id}
                  onClick={() => setSelectedStoreId(store.id)}
                  className={`p-4 cursor-pointer transition-all hover:bg-gray-50 flex items-start justify-between gap-3 ${
                    isSelected ? 'bg-blue-50/60 border-l-4 border-primary font-medium' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="size-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200 text-gray-600 font-bold text-sm overflow-hidden">
                      {store.imageUrl ? (
                        <img src={store.imageUrl} alt={store.name} className="size-full object-cover" loading="lazy" />
                      ) : (
                        store.name.charAt(0)
                      )}
                    </div>
                    <div className="flex flex-col">
                      <h4 className="text-sm font-bold text-gray-900 leading-snug">{store.name}</h4>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="size-3 shrink-0" />
                        <span className="truncate max-w-[160px]">{store.address}, {store.city}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{store.phone}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      store.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}
                  >
                    {store.status}
                  </span>
                </div>
              );
            })}

            {filteredStores.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">
                No store matching "{searchQuery}"
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Store Editing Details Form (8 cols) */}
        {selectedStore ? (
          <form onSubmit={handleSave} className="lg:col-span-8 bg-white border border-gray-200 rounded-xl p-6 shadow-xs flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
              <div>
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Store Management</span>
                <h2 className="text-xl font-bold text-gray-900">Editing: {selectedStore.name}</h2>
              </div>

              <div className="flex items-center gap-3">
                {onViewStorefront && (
                  <button
                    type="button"
                    onClick={() => onViewStorefront(selectedStore)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-primary text-xs font-bold transition-colors border border-blue-200/60"
                  >
                    <Globe className="size-3.5" />
                    <span>View Store Products</span>
                  </button>
                )}

                {saveSuccess && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 animate-in fade-in">
                    <CheckCircle2 className="size-4" />
                    <span>Changes Saved!</span>
                  </div>
                )}
              </div>
            </div>

            {/* Store Information */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b pb-2 border-gray-100">
                <Building2 className="size-4 text-primary" />
                <span>Store Information</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Store Name</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category / Type</label>
                  <select
                    value={formData.category || 'General'}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden bg-white"
                  >
                    <option value="Grocery">Grocery</option>
                    <option value="Bookstore">Bookstore</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Cafe">Cafe</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Apparel">Apparel</option>
                    <option value="General">General Retail</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">State / Province</label>
                  <input
                    type="text"
                    value={formData.state || ''}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Postal / ZIP Code</label>
                  <input
                    type="text"
                    value={formData.postalCode || ''}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Country</label>
                  <select
                    value={formData.country || 'United States'}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden bg-white"
                  >
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b pb-2 border-gray-100">
                <Phone className="size-4 text-primary" />
                <span>Contact Details</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Manager Name</label>
                  <input
                    type="text"
                    value={formData.managerName || ''}
                    onChange={(e) => handleInputChange('managerName', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Operational Details */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b pb-2 border-gray-100">
                <CheckCircle2 className="size-4 text-primary" />
                <span>Operational Details</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Store Status</label>
                  <select
                    value={formData.status || 'Active'}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Location Map Preview */}
            <div className="flex flex-col gap-2">
              <label className="block text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <Map className="size-4 text-primary" />
                <span>Location Map Preview</span>
              </label>

              <div className="h-44 w-full rounded-xl bg-slate-100 border border-gray-200 overflow-hidden relative flex items-center justify-center">
                {/* Visual Map graphic background */}
                <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-70" />

                {/* Map Pin */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="size-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
                    <MapPin className="size-5" />
                  </div>
                  <div className="mt-1 px-3 py-1 rounded-md bg-white border border-gray-200 text-xs font-bold shadow-md text-gray-900">
                    {formData.name}
                  </div>
                </div>

                <div className="absolute bottom-2 right-2 text-[10px] text-gray-500 bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded-xs">
                  Lat: {selectedStore.lat || '40.7128'}, Lng: {selectedStore.lng || '-74.0060'}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    name: selectedStore.name,
                    category: selectedStore.category,
                    address: selectedStore.address,
                    city: selectedStore.city,
                    state: selectedStore.state,
                    postalCode: selectedStore.postalCode,
                    country: selectedStore.country,
                    phone: selectedStore.phone,
                    managerName: selectedStore.managerName,
                    status: selectedStore.status,
                  });
                }}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
              >
                <RotateCcw className="size-4" />
                <span>Cancel</span>
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="size-4" />
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="lg:col-span-8 bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500">
            Select a store from the list to view or edit details.
          </div>
        )}
      </div>
    </div>
  );
};
