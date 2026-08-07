import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { StoresView } from './components/StoresView';
import { ProductsView } from './components/ProductsView';
import { ProductModal } from './components/ProductModal';
import { StoreModal } from './components/StoreModal';
import { StorefrontView } from './components/StorefrontView';
import { StoreFinderView } from './components/StoreFinderView';
import { SettingsView } from './components/SettingsView';
import { AuthModal } from './components/AuthModal';
import {
  fetchDashboardMetrics,
  fetchStores,
  fetchProducts,
  createStore,
  updateStore,
  createProduct,
  updateProduct,
  deleteProduct,
  syncUserWithBackend,
} from './lib/api';
import { DashboardMetrics, Product, Store, UserProfile } from './types';
import { Menu, Store as StoreIcon, ShieldCheck, User, Search, RefreshCw } from 'lucide-react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export default function App() {
  // Navigation Mode: 'customer' (Public Webpage) or 'admin' (Store Owner Portal)
  const [viewMode, setViewMode] = useState<'customer' | 'admin'>('customer');
  const [customerSubTab, setCustomerSubTab] = useState<'finder' | 'storefront'>('finder');

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Theme Mode State ('light' | 'dark' | 'system')
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(() => {
    const saved = localStorage.getItem('store_dash_theme_mode');
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    return 'system';
  });

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Listen to OS System Theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemIsDark);

  // Sync dark class on document root & save setting
  useEffect(() => {
    localStorage.setItem('store_dash_theme_mode', themeMode);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeMode, isDark]);

  // User Auth State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Data State
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [storesList, setStoresList] = useState<Store[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStorefront, setSelectedStorefront] = useState<Store | null>(null);

  // Filter params
  const [productSearch, setProductSearch] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState('');
  const [productBrandFilter, setProductBrandFilter] = useState('');

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const synced = await syncUserWithBackend();
        if (synced) {
          setUserProfile(synced);
        } else {
          setUserProfile({
            uid: user.uid,
            email: user.email || 'admin@example.com',
            name: user.displayName || 'Admin User',
            role: 'Administrator',
            avatarUrl: user.photoURL || undefined,
          });
        }
      } else {
        setUserProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Initial Data Load
  const loadData = async () => {
    try {
      const [m, s, p] = await Promise.all([
        fetchDashboardMetrics().catch(() => null),
        fetchStores().catch(() => []),
        fetchProducts({ page: currentPage, limit: 10, search: productSearch, status: productStatusFilter, brand: productBrandFilter }).catch(() => ({ products: [], total: 0, totalPages: 1, page: 1 })),
      ]);

      if (m) setMetrics(m);
      if (s) {
        setStoresList(s);
        if (s.length > 0 && !selectedStorefront) {
          setSelectedStorefront(s[0]);
        }
      }
      if (p) {
        setProductsList(p.products);
        setTotalProducts(p.total);
        setTotalPages(p.totalPages);
      }
    } catch (err) {
      console.error('Data load error:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentPage, productSearch, productStatusFilter, productBrandFilter]);

  // Handlers
  const handleSaveStore = async (id: number, updatedData: Partial<Store>) => {
    const updated = await updateStore(id, updatedData);
    setStoresList((prev) => prev.map((s) => (s.id === id ? updated : s)));
  };

  const handleCreateStore = async (storeData: Partial<Store>) => {
    const created = await createStore(storeData);
    setStoresList((prev) => [...prev, created]);
    setSelectedStorefront(created);
  };

  const handleSaveProduct = async (productData: Partial<Product>) => {
    if (editingProduct) {
      const updated = await updateProduct(editingProduct.id, productData);
      setProductsList((prev) => prev.map((p) => (p.id === editingProduct.id ? updated : p)));
    } else {
      const created = await createProduct(productData);
      setProductsList((prev) => [created, ...prev]);
    }
    setEditingProduct(null);
    loadData();
  };

  const handleDeleteProduct = async (id: number) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await deleteProduct(id);
      setProductsList((prev) => prev.filter((p) => p.id !== id));
      loadData();
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-200 ${isDark ? 'bg-[#101922] text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* ---------------- CUSTOMER WEBPAGE MODE ---------------- */}
      {viewMode === 'customer' && (
        <div className="flex flex-col min-h-screen">
          {/* Customer Top Bar Header */}
          <header className={`sticky top-0 z-40 border-b backdrop-blur-md px-4 py-3 ${
            isDark ? 'bg-[#101922]/90 border-gray-800' : 'bg-white/90 border-gray-200 shadow-2xs'
          }`}>
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary text-white shadow-md">
                  <StoreIcon className="size-5" />
                </div>
                <div>
                  <h1 className={`font-extrabold text-lg tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    StoreFinder
                  </h1>
                  <p className="text-[10px] text-gray-400 font-medium">Customer Store Locator & Product Catalog</p>
                </div>
              </div>

              {/* Sub-tab switcher */}
              <div className={`flex items-center p-1 rounded-xl border ${
                isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-gray-100 border-gray-200'
              }`}>
                <button
                  onClick={() => setCustomerSubTab('finder')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    customerSubTab === 'finder'
                      ? 'bg-primary text-white shadow-xs'
                      : isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  🗺️ Nearby Map
                </button>
                <button
                  onClick={() => {
                    if (storesList.length > 0 && !selectedStorefront) {
                      setSelectedStorefront(storesList[0]);
                    }
                    setCustomerSubTab('storefront');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    customerSubTab === 'storefront'
                      ? 'bg-primary text-white shadow-xs'
                      : isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  🛍️ Store Products
                </button>
              </div>

              {/* Admin Portal Switch Button */}
              <button
                onClick={() => {
                  if (userProfile) {
                    setViewMode('admin');
                  } else {
                    setIsAuthModalOpen(true);
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isDark
                    ? 'bg-gray-800 hover:bg-gray-700 text-blue-400 border border-gray-700 hover:border-blue-500/50'
                    : 'bg-blue-50 hover:bg-blue-100 text-primary border border-blue-200'
                }`}
              >
                <ShieldCheck className="size-4" />
                <span>Store Owner Portal</span>
              </button>
            </div>
          </header>

          {/* Customer Page Main Content */}
          <main className="flex-1">
            {customerSubTab === 'finder' ? (
              <StoreFinderView
                stores={storesList}
                onSelectStorefront={(store) => {
                  setSelectedStorefront(store);
                  setCustomerSubTab('storefront');
                }}
                onBackToAdmin={() => {
                  if (userProfile) setViewMode('admin');
                  else setIsAuthModalOpen(true);
                }}
                isDark={isDark}
              />
            ) : (
              selectedStorefront && (
                <StorefrontView
                  store={selectedStorefront}
                  products={productsList}
                  onBackToAdmin={() => setCustomerSubTab('finder')}
                  onOpenStoreFinder={() => setCustomerSubTab('finder')}
                  isDark={isDark}
                />
              )
            )}
          </main>
        </div>
      )}

      {/* ---------------- ADMIN PORTAL MODE ---------------- */}
      {viewMode === 'admin' && (
        <div className="flex flex-col lg:flex-row min-h-screen">
          {/* Mobile Top Header for Admin */}
          <header className={`lg:hidden sticky top-0 z-30 p-3 border-b flex items-center justify-between transition-colors ${
            isDark ? 'bg-[#101922] text-white border-gray-800' : 'bg-white text-gray-900 border-gray-200 shadow-2xs'
          }`}>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 rounded-lg bg-gray-800 text-gray-200 hover:bg-gray-700"
                aria-label="Open navigation menu"
              >
                <Menu className="size-5" />
              </button>
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-primary" />
                <span className="font-extrabold text-base tracking-tight">Admin Dashboard</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('customer')}
                className="px-2.5 py-1 rounded-lg bg-primary text-white text-xs font-bold"
              >
                Customer Site
              </button>
            </div>
          </header>

          {/* Persistent Admin Sidebar */}
          <Sidebar
            activeTab={activeTab}
            setActiveTab={(tab) => setActiveTab(tab)}
            userProfile={userProfile}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onLogout={handleLogout}
            onViewStorefront={() => setViewMode('customer')}
            isMobileOpen={isMobileMenuOpen}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
            isDarkTheme={isDark}
            themeMode={themeMode}
            setThemeMode={setThemeMode}
          />

          {/* Main View Display for Admin */}
          <main className="flex-1 flex flex-col min-w-0">
            {/* Top Admin Bar */}
            <div className={`p-3 border-b flex items-center justify-between px-6 ${
              isDark ? 'bg-[#18232e] border-gray-800 text-gray-300' : 'bg-white border-gray-200 text-gray-700'
            }`}>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold">
                  Admin Authenticated
                </span>
                <span>• Managed Multi-Store System</span>
              </div>

              <button
                onClick={() => setViewMode('customer')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-xs"
              >
                <span>🌐 Switch to Public Customer View</span>
              </button>
            </div>

            {activeTab === 'dashboard' && (
              <DashboardView
                metrics={metrics}
                storesList={storesList}
                productsList={productsList}
                onNavigate={(tab) => setActiveTab(tab)}
                onOpenAddProduct={() => {
                  setEditingProduct(null);
                  setIsProductModalOpen(true);
                }}
                onOpenAddStore={() => setIsStoreModalOpen(true)}
                isDark={isDark}
              />
            )}

            {activeTab === 'stores' && (
              <StoresView
                storesList={storesList}
                onSaveStore={handleSaveStore}
                onOpenAddStore={() => setIsStoreModalOpen(true)}
                onViewStorefront={(store) => {
                  setSelectedStorefront(store);
                  setCustomerSubTab('storefront');
                  setViewMode('customer');
                }}
                isDark={isDark}
              />
            )}

            {activeTab === 'products' && (
              <ProductsView
                productsList={productsList}
                totalProducts={totalProducts}
                currentPage={currentPage}
                totalPages={totalPages}
                storesList={storesList}
                onPageChange={(p) => setCurrentPage(p)}
                onSearchChange={(q) => setProductSearch(q)}
                onStatusFilterChange={(s) => setProductStatusFilter(s)}
                onBrandFilterChange={(b) => setProductBrandFilter(b)}
                onOpenAddProduct={() => {
                  setEditingProduct(null);
                  setIsProductModalOpen(true);
                }}
                onEditProduct={(p) => {
                  setEditingProduct(p);
                  setIsProductModalOpen(true);
                }}
                onDeleteProduct={handleDeleteProduct}
                isDark={isDark}
              />
            )}

            {activeTab === 'users' && (
              <div className={`p-8 min-h-screen ${isDark ? 'bg-[#101922] text-gray-100' : 'bg-gray-50 text-gray-800'}`}>
                <h1 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Registered Users & Customers
                </h1>
                <p className="text-sm text-gray-400 mb-6">Users synchronized from Firebase Auth & PostgreSQL Database.</p>
                <div className={`border rounded-xl p-6 shadow-xs max-w-2xl ${
                  isDark ? 'bg-[#18232e] border-gray-800' : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-full bg-primary/20 text-primary flex items-center justify-center font-extrabold text-lg">
                      {userProfile?.name ? userProfile.name.charAt(0) : 'A'}
                    </div>
                    <div>
                      <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {userProfile?.name || 'Admin User'}
                      </h3>
                      <p className="text-xs text-gray-400">{userProfile?.email || 'admin@example.com'}</p>
                      <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-primary font-bold text-xs border border-blue-500/20">
                        {userProfile?.role || 'Administrator'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <SettingsView
                themeMode={themeMode}
                setThemeMode={setThemeMode}
                isDark={isDark}
                userProfile={userProfile}
              />
            )}
          </main>
        </div>
      )}

      {/* Modals */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleSaveProduct}
        editingProduct={editingProduct}
      />

      <StoreModal
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
        onSave={handleCreateStore}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(profile) => {
          setUserProfile(profile);
          setViewMode('admin');
        }}
      />
    </div>
  );
}
