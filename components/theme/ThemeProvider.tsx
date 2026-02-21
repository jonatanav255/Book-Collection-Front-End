'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { usePreferences } from '@/hooks/usePreferences';
import { ThemePreset, FontSize } from '@/types';
import type { Preferences } from '@/types';

const DEFAULT_PREFERENCES: Preferences = {
  id: 'default',
  theme: ThemePreset.DARK,
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: FontSize.MD,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

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

    // Remove all theme classes first
    root.classList.remove('theme-light', 'theme-dark', 'dark');

    // Apply selected theme
    switch (preferences.theme) {
      case ThemePreset.LIGHT:
        root.classList.add('theme-light');
        break;
      case ThemePreset.DARK:
        root.classList.add('theme-dark', 'dark');
        break;
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

  // Use real preferences if loaded, otherwise fall back to defaults
  // so the context is always available even when the backend is offline
  const effective = preferences ?? DEFAULT_PREFERENCES;

  return (
    <ThemeContext.Provider
      value={{
        theme: effective.theme,
        fontSize: effective.fontSize,
        fontFamily: effective.fontFamily,
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
