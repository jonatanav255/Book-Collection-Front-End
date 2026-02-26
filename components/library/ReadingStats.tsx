'use client';

import React from 'react';
import { BookOpen, BookCheck, FileText, TrendingUp } from 'lucide-react';
import { useStats } from '@/hooks/useStats';
import { useLanguage } from '@/i18n';

export function ReadingStats() {
  const { data: stats } = useStats();
  const { t } = useLanguage();

  if (!stats || stats.totalBooks === 0) return null;

  const progressPercent = stats.totalPages > 0
    ? Math.round((stats.totalPagesRead / stats.totalPages) * 100)
    : 0;

  const statCards = [
    {
      label: t('library.totalBooks'),
      value: stats.totalBooks,
      icon: BookOpen,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      label: t('library.currentlyReading'),
      value: stats.readingBooks,
      icon: TrendingUp,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
    },
    {
      label: t('library.finishedStatus'),
      value: stats.finishedBooks,
      icon: BookCheck,
      color: 'text-green-400',
      bg: 'bg-green-400/10',
    },
    {
      label: t('library.pagesRead'),
      value: stats.totalPagesRead.toLocaleString(),
      icon: FileText,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{t('library.yourReading')}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('library.libraryOverview')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{card.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Overall progress bar */}
      {stats.totalPages > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('library.overallProgress')}</p>
            <p className="text-sm text-gray-500 dark:text-gray-300">
              {t('library.progressText', { read: stats.totalPagesRead.toLocaleString(), total: stats.totalPages.toLocaleString(), percent: progressPercent })}
            </p>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
