'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ReadingStatus } from '@/types';
import { ChevronDown } from 'lucide-react';

interface FilterBarProps {
  sortBy: string;
  status: ReadingStatus | '';
  onSortChange: (value: string) => void;
  onStatusChange: (value: ReadingStatus | '') => void;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  label: string;
}

function CustomSelect({ value, onChange, options, label }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-3 pl-4 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-w-[140px]"
      >
        <span>{selectedOption?.label || label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                option.value === value
                  ? 'bg-blue-500 dark:bg-blue-600 text-white'
                  : 'text-gray-900 dark:text-gray-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const sortOptions = [
  { value: 'dateAdded', label: 'Date Added' },
  { value: 'title', label: 'Title' },
  { value: 'lastRead', label: 'Last Read' },
  { value: 'progress', label: 'Progress' },
];

const statusOptions = [
  { value: '', label: 'All Books' },
  { value: ReadingStatus.UNREAD, label: 'Unread' },
  { value: ReadingStatus.READING, label: 'Reading' },
  { value: ReadingStatus.FINISHED, label: 'Finished' },
];

export const FilterBar = React.memo(function FilterBar({ sortBy, status, onSortChange, onStatusChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-4">
      {/* Sort By */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Sort by:
        </label>
        <CustomSelect
          value={sortBy}
          onChange={onSortChange}
          options={sortOptions}
          label="Sort by"
        />
      </div>

      {/* Filter by Status */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Status:
        </label>
        <CustomSelect
          value={status}
          onChange={onStatusChange as (value: string) => void}
          options={statusOptions}
          label="Status"
        />
      </div>
    </div>
  );
});
