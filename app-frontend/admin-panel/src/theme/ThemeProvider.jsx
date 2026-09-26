import { createContext, useContext, useState, useEffect } from 'react';
import { modes } from './colors';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  const themeColors = darkMode ? modes.dark : modes.light;

  useEffect(() => {
    document.documentElement.style.setProperty('--h1-color', themeColors.primary);

    document.body.style.background = themeColors.bg;
    document.body.style.color = themeColors.text;
  }, [themeColors]);

  const toggleTheme = () => {
    setDarkMode((current) => {
      const newMode = !current;

      localStorage.setItem('theme', newMode ? 'dark' : 'light');

      return newMode;
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        colors: themeColors,
        darkMode,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }

  return context;
}
