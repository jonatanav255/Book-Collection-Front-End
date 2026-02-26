'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { ThemePreset } from '@/types';
import { useLanguage } from '@/i18n';

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();

  const themes = [
    { value: ThemePreset.LIGHT, label: t('settings.light'), icon: Sun, description: t('settings.brightTheme') },
    { value: ThemePreset.DARK, label: t('settings.dark'), icon: Moon, description: t('settings.darkTheme') },
  ];

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          {t('settings.theme')}
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
                    : 'border-gray-300 dark:border-gray-500 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{themeOption.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
