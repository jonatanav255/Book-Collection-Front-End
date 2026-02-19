'use client';

import React from 'react';
import { ReadingStatus } from '@/types';

interface FilterBarProps {
  sortBy: string;
  status: ReadingStatus | '';
  onSortChange: (value: string) => void;
  onStatusChange: (value: ReadingStatus | '') => void;
}

export function FilterBar({ sortBy, status, onSortChange, onStatusChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-4">
      {/* Sort By */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Sort by:
        </label>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="dateAdded">Date Added</option>
          <option value="title">Title</option>
          <option value="lastRead">Last Read</option>
          <option value="progress">Progress</option>
        </select>
      </div>

      {/* Filter by Status */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Status:
        </label>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value as ReadingStatus | '')}
          className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Books</option>
          <option value={ReadingStatus.UNREAD}>Unread</option>
          <option value={ReadingStatus.READING}>Reading</option>
          <option value={ReadingStatus.FINISHED}>Finished</option>
        </select>
      </div>
    </div>
  );
}
