'use client';

import React, { useEffect, useRef } from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';

interface SearchBarProps {
  searchText: string;
  onSearchChange: (text: string) => void;
  currentIndex: number;
  totalResults: number;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
  isOpen: boolean;
}

export function SearchBar({
  searchText,
  onSearchChange,
  currentIndex,
  totalResults,
  onNext,
  onPrevious,
  onClose,
  isOpen,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      if (e.shiftKey) {
        onPrevious();
      } else {
        onNext();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-3 min-w-[320px]">
      <div className="flex items-center gap-2">
        {/* Search Icon */}
        <Search className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />

        {/* Search Input */}
        <input
          ref={inputRef}
          type="text"
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search in document..."
          className="flex-1 px-2 py-1 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
        />

        {/* Results Counter */}
        {searchText && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
              {totalResults > 0 ? `${currentIndex + 1} of ${totalResults}` : 'No results'}
            </span>

            {/* Navigation Buttons */}
            {totalResults > 0 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={onPrevious}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Previous result (Shift+Enter)"
                  disabled={totalResults === 0}
                >
                  <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={onNext}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Next result (Enter)"
                  disabled={totalResults === 0}
                >
                  <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
          title="Close (Esc)"
        >
          <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Keyboard Hints */}
      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Enter</kbd> Next •{' '}
          <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Shift+Enter</kbd> Previous •{' '}
          <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Esc</kbd> Close
        </p>
      </div>
    </div>
  );
}
