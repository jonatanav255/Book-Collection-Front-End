'use client';

import React, { useEffect, useState } from 'react';
import { BookOpen, BookCheck, FileText, TrendingUp } from 'lucide-react';

interface Stats {
  totalBooks: number;
  readingBooks: number;
  finishedBooks: number;
  unreadBooks: number;
  totalPages: number;
  totalPagesRead: number;
}

export function ReadingStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
        const res = await fetch(`${API_URL}/books/stats`);
        if (res.ok) {
          setStats(await res.json());
        }
      } catch {
        // silently ignore
      }
    };
    fetchStats();
  }, []);

  if (!stats || stats.totalBooks === 0) return null;

  const progressPercent = stats.totalPages > 0
    ? Math.round((stats.totalPagesRead / stats.totalPages) * 100)
    : 0;

  const statCards = [
    {
      label: 'Total Books',
      value: stats.totalBooks,
      icon: BookOpen,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      label: 'Currently Reading',
      value: stats.readingBooks,
      icon: TrendingUp,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
    },
    {
      label: 'Finished',
      value: stats.finishedBooks,
      icon: BookCheck,
      color: 'text-green-400',
      bg: 'bg-green-400/10',
    },
    {
      label: 'Pages Read',
      value: stats.totalPagesRead.toLocaleString(),
      icon: FileText,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Your Reading</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Library overview</p>
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
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Progress</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {stats.totalPagesRead.toLocaleString()} / {stats.totalPages.toLocaleString()} pages ({progressPercent}%)
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
