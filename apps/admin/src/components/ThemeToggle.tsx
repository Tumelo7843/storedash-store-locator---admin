import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// Compact icon toggle for the sidebar footer. The full control with a label
// lives in Settings > Appearance (SettingsPage.tsx) — this is the quick-access
// version, same underlying state.
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-nav-active hover:text-gray-900 transition-colors ${className}`}
    >
      {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
      {isDark ? 'Light mode' : 'Dark mode'}
    </button>
  );
}
