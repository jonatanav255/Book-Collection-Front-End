'use client';

import React from 'react';
import { useTheme } from './ThemeProvider';
import { FontSize } from '@/types';

export function ThemeSelector() {
  const { fontSize, fontFamily, setFontSize, setFontFamily } = useTheme();

  const fontSizes = [
    { value: FontSize.SM, label: 'Small' },
    { value: FontSize.MD, label: 'Medium' },
    { value: FontSize.LG, label: 'Large' },
    { value: FontSize.XL, label: 'Extra Large' },
  ];

  const fontFamilies = [
    { value: 'system-ui, -apple-system, sans-serif', label: 'System' },
    { value: 'Georgia, serif', label: 'Serif' },
    { value: '"Courier New", monospace', label: 'Mono' },
    { value: '"Comic Sans MS", cursive', label: 'Comic' },
  ];

  return (
    <div className="space-y-6">

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
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                {fs.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Font Family Selection */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Font Family
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {fontFamilies.map((ff) => {
            const isActive = fontFamily === ff.value;

            return (
              <button
                key={ff.value}
                onClick={() => setFontFamily(ff.value)}
                style={{ fontFamily: ff.value }}
                className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  isActive
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                {ff.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
