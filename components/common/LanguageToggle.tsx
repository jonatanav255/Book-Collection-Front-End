'use client';

import React from 'react';
import { useLanguage } from '@/i18n';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
      className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
      title={language === 'en' ? 'Cambiar a Español' : 'Switch to English'}
    >
      {language === 'en' ? 'ES' : 'EN'}
    </button>
  );
}
