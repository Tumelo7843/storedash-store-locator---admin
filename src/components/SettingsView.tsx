import React from 'react';
import { Sun, Moon, Monitor, ShieldCheck, Database, Check, Palette, Bell, RefreshCw, User, Laptop } from 'lucide-react';
import { UserProfile } from '../types';

interface SettingsViewProps {
  themeMode: 'light' | 'dark' | 'system';
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  isDark: boolean;
  userProfile: UserProfile | null;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  themeMode,
  setThemeMode,
  isDark,
  userProfile,
}) => {
  const getSystemIsDark = () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isSystemDark = getSystemIsDark();

  return (
    <div className={`flex-1 p-4 md:p-8 min-h-screen transition-colors duration-200 ${isDark ? 'bg-[#101922] text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className={`pb-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/20 text-primary">
              <Palette className="size-6" />
            </div>
            <div>
              <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Application Settings
              </h1>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Manage system appearance, theme preferences, database connections, and user accounts.
              </p>
            </div>
          </div>
        </div>

        {/* Theme Settings Section (Light, Dark, System) */}
        <div className={`rounded-2xl p-6 border shadow-xs transition-colors ${
          isDark ? 'bg-[#18232e] border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <Palette className="size-5 text-primary" />
                <span>Appearance & Theme Mode</span>
              </h2>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Choose how StoreDash looks to you. Select Light, Dark, or automatically respond to your device's system settings.
              </p>
            </div>

            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              isDark ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-primary border border-blue-200'
            }`}>
              <span className="size-2 rounded-full bg-primary animate-pulse" />
              Active: {themeMode === 'system' ? `System (${isSystemDark ? 'Dark' : 'Light'})` : themeMode === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </span>
          </div>

          {/* Theme Option Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            {/* Light Mode Option */}
            <button
              type="button"
              onClick={() => setThemeMode('light')}
              className={`relative p-5 rounded-xl border-2 text-left flex flex-col justify-between transition-all ${
                themeMode === 'light'
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-md'
                  : isDark
                  ? 'border-gray-800 bg-gray-900/50 hover:border-gray-700 hover:bg-gray-900'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'
              }`}
            >
              {themeMode === 'light' && (
                <div className="absolute top-3 right-3 p-1 rounded-full bg-primary text-white">
                  <Check className="size-3.5" />
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
                  <Sun className="size-6" />
                </div>
                <div>
                  <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Light Mode</h3>
                  <span className="text-[11px] text-gray-500">Clean & Bright</span>
                </div>
              </div>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Crisp white cards, high-contrast text, and subtle light gray canvas backgrounds.
              </p>
            </button>

            {/* Dark Mode Option */}
            <button
              type="button"
              onClick={() => setThemeMode('dark')}
              className={`relative p-5 rounded-xl border-2 text-left flex flex-col justify-between transition-all ${
                themeMode === 'dark'
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-md'
                  : isDark
                  ? 'border-gray-800 bg-gray-900/50 hover:border-gray-700 hover:bg-gray-900'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'
              }`}
            >
              {themeMode === 'dark' && (
                <div className="absolute top-3 right-3 p-1 rounded-full bg-primary text-white">
                  <Check className="size-3.5" />
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Moon className="size-6" />
                </div>
                <div>
                  <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Dark Mode</h3>
                  <span className="text-[11px] text-gray-500">Sleek & Low-Light</span>
                </div>
              </div>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Deep charcoal canvas, reduced eye strain, and vibrant neon blue indicators.
              </p>
            </button>

            {/* Device / System Mode Option */}
            <button
              type="button"
              onClick={() => setThemeMode('system')}
              className={`relative p-5 rounded-xl border-2 text-left flex flex-col justify-between transition-all ${
                themeMode === 'system'
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-md'
                  : isDark
                  ? 'border-gray-800 bg-gray-900/50 hover:border-gray-700 hover:bg-gray-900'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'
              }`}
            >
              {themeMode === 'system' && (
                <div className="absolute top-3 right-3 p-1 rounded-full bg-primary text-white">
                  <Check className="size-3.5" />
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                  <Monitor className="size-6" />
                </div>
                <div>
                  <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Device Preference</h3>
                  <span className="text-[11px] text-gray-500">Automatic Sync</span>
                </div>
              </div>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Syncs dynamically with your OS (macOS, Windows, iOS, Android) light/dark scheduler.
              </p>
            </button>
          </div>
        </div>

        {/* Database & System Architecture Information */}
        <div className={`rounded-2xl p-6 border shadow-xs transition-colors ${
          isDark ? 'bg-[#18232e] border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <h2 className={`text-lg font-bold flex items-center gap-2 mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Database className="size-5 text-emerald-500" />
            <span>Infrastructure & Data Persistence</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-900/40 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Database Engine
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[11px] font-bold">Connected</span>
              </div>
              <p className={`text-sm font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Google Cloud SQL (PostgreSQL)
              </p>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Instance Region: europe-west2 | Drizzle ORM
              </p>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-900/40 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Authentication System
                </span>
                <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[11px] font-bold">Active</span>
              </div>
              <p className={`text-sm font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Firebase Authentication & Google Sign-In
              </p>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                User Role: {userProfile?.role || 'Administrator'}
              </p>
            </div>
          </div>
        </div>

        {/* Current User Session Profile */}
        <div className={`rounded-2xl p-6 border shadow-xs transition-colors ${
          isDark ? 'bg-[#18232e] border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <h2 className={`text-lg font-bold flex items-center gap-2 mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <User className="size-5 text-blue-400" />
            <span>Administrator Account</span>
          </h2>

          <div className="flex items-center gap-4">
            <div className="size-12 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xl border border-primary/30">
              {userProfile?.name ? userProfile.name.charAt(0) : 'A'}
            </div>
            <div>
              <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {userProfile?.name || 'Admin User'}
              </h3>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {userProfile?.email || 'admin@example.com'}
              </p>
              <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-bold text-xs border border-blue-500/20">
                {userProfile?.role || 'Administrator'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
