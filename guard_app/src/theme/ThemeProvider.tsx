import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { loadThemeMode, saveThemeMode, ThemeMode } from '../lib/themeStorage';
import { AppColors, darkColors, lightColors } from './colors';

type ThemeContextValue = {
  themeMode: ThemeMode;
  isDark: boolean;
  colors: AppColors;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const storedMode = await loadThemeMode();
        if (storedMode) {
          setThemeModeState(storedMode);
        }
      } finally {
        setHydrated(true);
      }
    };

    void init();
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await saveThemeMode(mode);
  };

  const value = useMemo<ThemeContextValue>(() => {
    const isDark = themeMode === 'dark';
    return {
      themeMode,
      isDark,
      colors: isDark ? darkColors : lightColors,
      setThemeMode,
    };
  }, [themeMode]);

  if (!hydrated) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }
  return context;
}