'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  Home,
  StickyNote,
  Volume2,
  Settings,
  BookOpen,
} from 'lucide-react';
import Link from 'next/link';

interface ReaderControlsProps {
  currentPage: number;
  totalPages: number;
  scale: number;
  onPageChange: (page: number) => void;
  onScaleChange: (scale: number) => void;
  onToggleFullscreen: () => void;
  onToggleNotes: () => void;
  onToggleReadAloud: () => void;
  onToggleReadAlong?: () => void;
  onToggleSettings: () => void;
  isFullscreen: boolean;
  showReadAlong?: boolean;
  bookTitle?: string;
  bookAuthor?: string;
}

export function ReaderControls({
  currentPage,
  totalPages,
  scale,
  onPageChange,
  onScaleChange,
  onToggleFullscreen,
  onToggleNotes,
  onToggleReadAloud,
  onToggleReadAlong,
  onToggleSettings,
  isFullscreen,
  showReadAlong,
  bookTitle,
  bookAuthor,
}: ReaderControlsProps) {
  const [pageInput, setPageInput] = useState(currentPage.toString());

  const handlePageInputChange = (value: string) => {
    setPageInput(value);
  };

  const handlePageInputSubmit = () => {
    const page = parseInt(pageInput);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    } else {
      setPageInput(currentPage.toString());
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
      setPageInput((currentPage - 1).toString());
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
      setPageInput((currentPage + 1).toString());
    }
  };

  const handleZoomIn = () => {
    onScaleChange(Math.min(scale + 0.25, 3));
  };

  const handleZoomOut = () => {
    onScaleChange(Math.max(scale - 0.25, 0.5));
  };

  React.useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Navigation */}
        <div className="flex items-center gap-3">
          {!isFullscreen && (
            <Link
              href="/"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Back to Library"
            >
              <Home className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Link>
          )}

          {/* Book Title & Author */}
          {bookTitle && !isFullscreen && (
            <div className="border-l border-gray-300 dark:border-gray-700 pl-3 max-w-xs">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {bookTitle}
              </h2>
              {bookAuthor && (
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {bookAuthor}
                </p>
              )}
            </div>
          )}

          <div className="border-l border-gray-300 dark:border-gray-700 pl-3" />

          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Previous Page"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <input
              type="number"
              value={pageInput}
              onChange={(e) => handlePageInputChange(e.target.value)}
              onBlur={handlePageInputSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handlePageInputSubmit()}
              min="1"
              max={totalPages}
              className="w-16 px-2 py-1 text-center border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              of {totalPages}
            </span>
          </div>

          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Next Page"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Center: Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>

          <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[4rem] text-center">
            {Math.round(scale * 100)}%
          </span>

          <button
            onClick={handleZoomIn}
            disabled={scale >= 3}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleReadAloud}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Read Aloud"
          >
            <Volume2 className="w-5 h-5" />
          </button>

          {onToggleReadAlong && (
            <button
              onClick={onToggleReadAlong}
              className={`p-2 rounded-lg transition-colors ${
                showReadAlong
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              title="Read-Along Mode"
            >
              <BookOpen className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={onToggleNotes}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Notes"
          >
            <StickyNote className="w-5 h-5" />
          </button>

          <button
            onClick={onToggleSettings}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          <button
            onClick={onToggleFullscreen}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            <Maximize className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
