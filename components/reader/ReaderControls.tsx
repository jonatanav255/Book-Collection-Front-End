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
  Search,
  Timer,
  TimerReset,
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
  onToggleSettings: () => void;
  onToggleTimer: () => void;
  isFullscreen: boolean;
  isTimerRunning?: boolean;  // Whether timer is currently running
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
  onToggleSettings,
  onToggleTimer,
  isFullscreen,
  isTimerRunning = false,
}: ReaderControlsProps) {
  const [pageInput, setPageInput] = useState(currentPage.toString());

  const handlePageInputChange = (value: string) => {
    setPageInput(value);
  };

  const pageInputValue = parseInt(pageInput);
  const isPageInputInvalid = pageInput !== '' && (isNaN(pageInputValue) || pageInputValue < 1 || pageInputValue > totalPages);

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
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-2 py-2 sm:px-4 sm:py-3 relative z-20">
      <div className="flex items-center justify-between gap-1 sm:gap-4">
        {/* Left: Navigation */}
        <div className="flex items-center gap-1 sm:gap-3">
          {!isFullscreen && (
            <Link
              href="/"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Back to Library"
              aria-label="Back to Library"
            >
              <Home className="w-5 h-5 text-gray-700 dark:text-white" />
            </Link>
          )}

          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Previous Page"
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-white" />
          </button>

          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={pageInput}
              onChange={(e) => handlePageInputChange(e.target.value)}
              onBlur={handlePageInputSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handlePageInputSubmit()}
              className={`w-12 sm:w-16 px-2 py-1 text-center border rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 ${isPageInputInvalid ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-500 focus:ring-blue-500'}`}
            />
            <span className="text-sm text-gray-700 dark:text-white hidden sm:inline">
              of {totalPages}
            </span>
          </div>

          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Next Page"
            aria-label="Next Page"
          >
            <ChevronRight className="w-5 h-5 text-gray-700 dark:text-white" />
          </button>
        </div>

        {/* Center: Zoom Controls */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-5 h-5 text-gray-700 dark:text-white" />
          </button>

          <span className="text-sm text-gray-700 dark:text-white min-w-[4rem] text-center">
            {Math.round(scale * 100)}%
          </span>

          <button
            onClick={handleZoomIn}
            disabled={scale >= 3}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-5 h-5 text-gray-700 dark:text-white" />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-0.5 sm:gap-2">
          {/* Timer icon - changes to different icon when running */}
          <button
            onClick={onToggleTimer}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Reading Timer"
            aria-label="Reading Timer"
          >
            {isTimerRunning ? (
              <TimerReset className="w-5 h-5 text-gray-700 dark:text-white" />
            ) : (
              <Timer className="w-5 h-5 text-gray-700 dark:text-white" />
            )}
          </button>

          <button
            onClick={onToggleReadAloud}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Read Aloud"
            aria-label="Read Aloud"
          >
            <Volume2 className="w-5 h-5 text-gray-700 dark:text-white" />
          </button>

          <button
            onClick={onToggleNotes}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Notes"
            aria-label="Notes"
          >
            <StickyNote className="w-5 h-5 text-gray-700 dark:text-white" />
          </button>

          <button
            onClick={onToggleSettings}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Settings"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 text-gray-700 dark:text-white" />
          </button>

          <button
            onClick={onToggleFullscreen}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            <Maximize className="w-5 h-5 text-gray-700 dark:text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
