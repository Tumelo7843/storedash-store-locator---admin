import { LogIn, MapPin, Receipt, ShoppingCart, Store, User } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

function NavLink({ to, icon: Icon, label }: { to: string; icon: typeof MapPin; label: string }) {
  const location = useLocation();
  const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
  return (
    <Link
      to={to}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
        active ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon className="size-4" />
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth();
  const { totalCount } = useCart();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary text-white shadow-md">
              <Store className="size-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg tracking-tight leading-none">StoreDash</h1>
              <p className="text-[10px] text-gray-400 font-medium">Find stores near you</p>
            </div>
          </Link>

          <nav className="flex items-center gap-1.5">
            <NavLink to="/" icon={MapPin} label="Discover" />
            <NavLink to="/orders" icon={Receipt} label="Orders" />
            <Link
              to="/cart"
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <ShoppingCart className="size-4" />
              <span className="hidden sm:inline">Cart</span>
              {totalCount > 0 && (
                <span className="absolute -top-1 -right-1 size-4 rounded-full bg-amber-400 text-gray-900 text-[10px] font-extrabold flex items-center justify-center">
                  {totalCount}
                </span>
              )}
            </Link>
            <Link
              to="/account"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {!loading && profile ? (
                <>
                  <div className="size-5 rounded-full bg-primary/15 text-primary flex items-center justify-center font-extrabold text-[10px]">
                    {(profile.name || profile.email).charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline">Account</span>
                </>
              ) : (
                <>
                  <LogIn className="size-4" />
                  <span className="hidden sm:inline">Sign in</span>
                </>
              )}
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
