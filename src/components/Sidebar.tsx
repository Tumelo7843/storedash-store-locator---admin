import React from 'react';
import { LayoutDashboard, Store, Package, Users, Settings, HelpCircle, LogOut, ShoppingBag, MapPin, X, Sun, Moon, Monitor } from 'lucide-react';
import { UserProfile } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userProfile: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onViewStorefront: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  isDarkTheme?: boolean;
  themeMode?: 'light' | 'dark' | 'system';
  setThemeMode?: (mode: 'light' | 'dark' | 'system') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  userProfile,
  onOpenAuth,
  onLogout,
  onViewStorefront,
  isMobileOpen = false,
  onCloseMobile,
  isDarkTheme = true,
  themeMode = 'system',
  setThemeMode,
}) => {
  const isDark = isDarkTheme;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'stores', label: 'Managed Stores', icon: Store },
    { id: 'products', label: 'Store Products', icon: Package },
    { id: 'users', label: 'Customers / Users', icon: Users },
  ];

  const content = (
    <aside
      className={`flex h-full flex-col border-r w-64 p-4 shrink-0 transition-colors duration-200 ${
        isDark
          ? 'bg-[#101922] text-gray-200 border-gray-800'
          : 'bg-white text-gray-800 border-gray-200'
      }`}
    >
      <div className="flex flex-col gap-4">
        {/* Brand & Profile */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {userProfile?.avatarUrl ? (
              <img
                src={userProfile.avatarUrl}
                alt="Profile"
                className="size-10 rounded-full object-cover border border-gray-600"
                loading="lazy"
              />
            ) : (
              <div className="size-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-lg">
                {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'A'}
              </div>
            )}
            <div className="flex flex-col">
              <h2 className={`text-base font-semibold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {userProfile?.name || 'Admin User'}
              </h2>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {userProfile?.role || 'Administrator'}
              </p>
            </div>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1 rounded-lg hover:bg-gray-700/50 text-gray-400"
              aria-label="Close sidebar"
            >
              <X className="size-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1.5 mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? isDark
                      ? 'bg-primary/20 text-blue-400 font-semibold'
                      : 'bg-blue-50 text-primary font-semibold'
                    : isDark
                    ? 'text-gray-300 hover:bg-gray-800/80 hover:text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className={`size-5 ${isActive ? (isDark ? 'text-blue-400' : 'text-primary') : ''}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-gray-800/50">
        <button
          onClick={() => {
            onViewStorefront();
            if (onCloseMobile) onCloseMobile();
          }}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg h-10 px-4 bg-primary hover:bg-primary/90 text-white text-sm font-bold transition-colors shadow-sm"
        >
          <ShoppingBag className="size-4" />
          <span className="truncate">🌐 Customer Site View</span>
        </button>

        {!userProfile ? (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-blue-400 hover:bg-blue-500/10 transition-colors"
          >
            <Users className="size-5" />
            <span>Sign In / Admin Auth</span>
          </button>
        ) : (
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="size-5" />
            <span>Logout</span>
          </button>
        )}

        {/* Quick Theme Switcher Pill */}
        {setThemeMode && (
          <div className={`p-1.5 rounded-xl border flex items-center justify-between gap-1 mt-1 ${
            isDark ? 'bg-gray-900/80 border-gray-800 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-700'
          }`}>
            <button
              type="button"
              onClick={() => setThemeMode('light')}
              className={`flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg text-xs font-semibold transition-all ${
                themeMode === 'light'
                  ? 'bg-white text-gray-900 shadow-xs border border-gray-200'
                  : 'hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Light Mode"
            >
              <Sun className="size-3.5 text-amber-500" />
              <span>Light</span>
            </button>

            <button
              type="button"
              onClick={() => setThemeMode('dark')}
              className={`flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg text-xs font-semibold transition-all ${
                themeMode === 'dark'
                  ? 'bg-gray-800 text-white shadow-xs border border-gray-700'
                  : 'hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Dark Mode"
            >
              <Moon className="size-3.5 text-indigo-400" />
              <span>Dark</span>
            </button>

            <button
              type="button"
              onClick={() => setThemeMode('system')}
              className={`flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg text-xs font-semibold transition-all ${
                themeMode === 'system'
                  ? 'bg-primary text-white shadow-xs'
                  : 'hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Device Preference Mode"
            >
              <Monitor className="size-3.5" />
              <span>Auto</span>
            </button>
          </div>
        )}

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Settings className="size-5" />
          <span>Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('help')}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <HelpCircle className="size-5" />
          <span>Help</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-screen sticky top-0 z-20">
        {content}
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 max-w-xs w-full bg-[#101922] z-10">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
