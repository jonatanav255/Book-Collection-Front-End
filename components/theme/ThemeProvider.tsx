'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { usePreferences } from '@/hooks/usePreferences';
import type { ThemePreset, FontSize } from '@/types';

interface ThemeContextValue {
  theme: ThemePreset;
  fontSize: FontSize;
  fontFamily: string;
  setTheme: (theme: ThemePreset) => Promise<void>;
  setFontSize: (size: FontSize) => Promise<void>;
  setFontFamily: (family: string) => Promise<void>;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { preferences, loading, setTheme: setThemePreference, setFontSize: setFontSizePreference, setFontFamily: setFontFamilyPreference } = usePreferences();

  // Apply theme to document
  useEffect(() => {
    if (!preferences) return;

    const root = document.documentElement;

    // Remove all theme classes
    root.classList.remove('theme-light', 'theme-dark', 'theme-sepia', 'theme-forest', 'theme-ocean');

    // Add current theme class
    root.classList.add(`theme-${preferences.theme}`);

    // Apply dark mode if needed
    if (preferences.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply font family
    root.style.setProperty('--font-family', preferences.fontFamily);

    // Apply font size
    const fontSizes = {
      sm: '14px',
      md: '16px',
      lg: '18px',
      xl: '20px',
    };
    root.style.setProperty('--font-size', fontSizes[preferences.fontSize]);
  }, [preferences]);

  // Wrap the preference setters to match the interface
  const setTheme = async (theme: ThemePreset): Promise<void> => {
    await setThemePreference(theme);
  };

  const setFontSize = async (size: FontSize): Promise<void> => {
    await setFontSizePreference(size);
  };

  const setFontFamily = async (family: string): Promise<void> => {
    await setFontFamilyPreference(family);
  };

  if (loading || !preferences) {
    return <div className="min-h-screen bg-white dark:bg-gray-900">{children}</div>;
  }

  return (
    <ThemeContext.Provider
      value={{
        theme: preferences.theme,
        fontSize: preferences.fontSize,
        fontFamily: preferences.fontFamily,
        setTheme,
        setFontSize,
        setFontFamily,
        loading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
