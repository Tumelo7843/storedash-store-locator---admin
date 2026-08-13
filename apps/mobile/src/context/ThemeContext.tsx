import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { type Palette, paletteFor } from '../theme/colors';
import { readJSON, writeJSON } from '../lib/storage';

const STORAGE_KEY = 'storedash_mobile_theme_preference';

// Unlike the web app's Theme ('light' | 'dark' only, no backend column),
// mobile also offers "system" — resolved against the OS color scheme below.
// This is a local-only display preference, same trust model as the web app.
export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  preference: ThemePreference;
  resolvedTheme: 'light' | 'dark';
  colors: Palette;
  setPreference: (pref: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    readJSON<ThemePreference>(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') setPreferenceState(stored);
      setLoaded(true);
    });
  }, []);

  const setPreference = (pref: ThemePreference) => {
    setPreferenceState(pref);
    void writeJSON(STORAGE_KEY, pref);
  };

  const resolvedTheme: 'light' | 'dark' = preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;
  const colors = useMemo(() => paletteFor(resolvedTheme), [resolvedTheme]);

  // Avoids a flash of the default ('system') resolved theme before the
  // persisted preference loads from AsyncStorage on cold start.
  if (!loaded) return null;

  return <ThemeContext.Provider value={{ preference, resolvedTheme, colors, setPreference }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
