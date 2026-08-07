import { ChevronDown, LayoutDashboard, LogOut, Menu, Package, Settings, ShieldCheck, ShoppingBag, Sparkles, Store, Users, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/services', label: 'Services', icon: Sparkles },
  { to: '/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/store-settings', label: 'Store Settings', icon: Store },
  { to: '/admins', label: 'Store Admins', icon: Users },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth();
  const { stores, currentStore, setCurrentStoreId } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const sidebar = (
    <aside className="flex h-full flex-col w-64 shrink-0 bg-[#101922] text-gray-200 p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary text-white">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-base leading-none">StoreDash</h1>
            <p className="text-[10px] text-gray-400 font-medium">Admin</p>
          </div>
        </div>
        <button className="lg:hidden p-1 text-gray-400" onClick={() => setMobileOpen(false)} aria-label="Close menu">
          <X className="size-5" />
        </button>
      </div>

      {stores.length > 0 && (
        <div className="relative mb-4">
          <button
            onClick={() => setSwitcherOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-gray-800/80 border border-gray-700 text-left"
          >
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 font-bold uppercase">Managing</p>
              <p className="text-sm font-bold text-white truncate">{currentStore?.name ?? 'Select a store'}</p>
            </div>
            <ChevronDown className="size-4 text-gray-400 shrink-0" />
          </button>
          {switcherOpen && (
            <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-xl max-h-64 overflow-y-auto">
              {stores.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setCurrentStoreId(s.id);
                    setSwitcherOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 ${s.id === currentStore?.id ? 'text-primary font-bold' : 'text-gray-200'}`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active ? 'bg-primary/20 text-blue-400 font-semibold' : 'text-gray-300 hover:bg-gray-800/80 hover:text-white'
              }`}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
        {profile?.role === 'super_admin' && (
          <Link
            to="/stores/new"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === '/stores/new' ? 'bg-primary/20 text-blue-400 font-semibold' : 'text-gray-300 hover:bg-gray-800/80 hover:text-white'
            }`}
          >
            <Store className="size-5" />
            Create Store
          </Link>
        )}
      </nav>

      <div className="mt-auto flex flex-col gap-1 pt-4 border-t border-gray-800">
        <Link
          to="/account"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800"
        >
          <Settings className="size-5" /> Account
        </Link>
        <button
          onClick={async () => {
            await signOut();
            navigate('/login');
          }}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10"
        >
          <LogOut className="size-5" /> Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="hidden lg:block h-screen sticky top-0">{sidebar}</div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 h-full">{sidebar}</div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-30 bg-[#101922] text-white p-3 flex items-center gap-3">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg bg-gray-800" aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <span className="font-bold text-sm">{currentStore?.name ?? 'StoreDash Admin'}</span>
        </header>
        <main className="flex-1 flex flex-col min-w-0">{children}</main>
      </div>
    </div>
  );
}
