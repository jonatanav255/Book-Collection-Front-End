'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { FontSize, ThemePreset } from '@/types';

export function ThemeSelector() {
  const { theme, fontSize, setTheme, setFontSize } = useTheme();

  const themes = [
    { value: ThemePreset.LIGHT, label: 'Light', icon: Sun, description: 'Bright theme' },
    { value: ThemePreset.DARK, label: 'Dark', icon: Moon, description: 'Dark theme' },
  ];

  const fontSizes = [
    { value: FontSize.SM, label: 'Small' },
    { value: FontSize.MD, label: 'Medium' },
    { value: FontSize.LG, label: 'Large' },
    { value: FontSize.XL, label: 'Extra Large' },
  ];

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Theme
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {themes.map((themeOption) => {
            const isActive = theme === themeOption.value;
            const Icon = themeOption.icon;

            return (
              <button
                key={themeOption.value}
                onClick={() => setTheme(themeOption.value)}
                className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all flex flex-col items-center gap-2 ${
                  isActive
                    ? 'border-blue-500 bg-blue-600 text-white'
                    : 'border-gray-500 dark:border-gray-500 bg-gray-700 dark:bg-gray-700 text-gray-200 dark:text-gray-200 hover:bg-gray-600 dark:hover:bg-gray-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{themeOption.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Font Size Selection */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Font Size
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {fontSizes.map((fs) => {
            const isActive = fontSize === fs.value;

            return (
              <button
                key={fs.value}
                onClick={() => setFontSize(fs.value)}
                className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  isActive
                    ? 'border-blue-500 bg-blue-600 text-white'
                    : 'border-gray-500 dark:border-gray-500 bg-gray-700 dark:bg-gray-700 text-gray-200 dark:text-gray-200 hover:bg-gray-600 dark:hover:bg-gray-600'
                }`}
              >
                {fs.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
