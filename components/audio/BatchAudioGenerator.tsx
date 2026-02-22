'use client';

import { useState, useEffect, useRef } from 'react';
import { audioApi } from '@/services/api';

interface BatchAudioGeneratorProps {
  bookId: string;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

type GenerationStatus = 'IDLE' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export function BatchAudioGenerator({ bookId, onComplete, onError }: BatchAudioGeneratorProps) {
  const [status, setStatus] = useState<GenerationStatus>('IDLE');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Page range inputs
  const [startPage, setStartPage] = useState<string>('');
  const [endPage, setEndPage] = useState<string>('');

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Poll for status updates
  useEffect(() => {
    const pollStatus = async () => {
      try {
        const statusData = await audioApi.getBatchGenerationStatus(bookId);
        setStatus(statusData.status);
        setCurrentPage(statusData.currentPage);
        setTotalPages(statusData.totalPages);
        setProgressPercentage(statusData.progressPercentage);
        setErrorMessage(statusData.errorMessage || null);

        // Stop polling if completed, failed, or cancelled
        if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(statusData.status)) {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }

          if (statusData.status === 'COMPLETED') {
            onComplete?.();
          } else if (statusData.status === 'FAILED' && statusData.errorMessage) {
            onError?.(statusData.errorMessage);
          }
        }
      } catch (err) {
        // Silently handle polling errors
      }
    };

    // Start polling when running
    if (status === 'RUNNING' && !pollingIntervalRef.current) {
      pollingIntervalRef.current = setInterval(pollStatus, 2000); // Poll every 2 seconds
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [status, bookId, onComplete, onError]);

  const handleStart = async () => {
    try {
      setIsStarting(true);
      setErrorMessage(null);

      // Parse page range inputs
      const start = startPage.trim() ? parseInt(startPage) : undefined;
      const end = endPage.trim() ? parseInt(endPage) : undefined;

      // Validate inputs
      if (start !== undefined && (isNaN(start) || start < 1)) {
        throw new Error('Start page must be a positive number');
      }
      if (end !== undefined && (isNaN(end) || end < 1)) {
        throw new Error('End page must be a positive number');
      }
      if (start !== undefined && end !== undefined && start > end) {
        throw new Error('Start page must be less than or equal to end page');
      }

      await audioApi.startBatchGeneration(bookId, start, end);
      setStatus('RUNNING');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start batch generation';
      setErrorMessage(message);
      onError?.(message);
    } finally {
      setIsStarting(false);
    }
  };

  const handleCancel = async () => {
    try {
      setIsCancelling(true);
      await audioApi.cancelBatchGeneration(bookId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel batch generation';
      setErrorMessage(message);
      onError?.(message);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Batch Audio Generation
        </h3>
        <span className={`text-sm font-medium px-3 py-1 rounded-full ${
          status === 'IDLE' ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300' :
          status === 'RUNNING' && isCancelling ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
          status === 'RUNNING' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
          status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
          status === 'FAILED' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
        }`}>
          {isCancelling ? 'CANCELLING...' : status}
        </span>
      </div>

      {status === 'RUNNING' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Page {currentPage} / {totalPages}</span>
            <span>{progressPercentage.toFixed(1)}%</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ease-out ${
                isCancelling ? 'bg-yellow-600 dark:bg-yellow-500' : 'bg-blue-600 dark:bg-blue-500'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {isCancelling && (
            <p className="text-sm text-yellow-700 dark:text-yellow-400 font-medium">
              Stopping generation... This may take a moment.
            </p>
          )}
        </div>
      )}

      {/* Page Range Inputs */}
      {(status === 'IDLE' || status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED') && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="startPage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Page (optional)
            </label>
            <input
              id="startPage"
              type="number"
              min="1"
              value={startPage}
              onChange={(e) => setStartPage(e.target.value)}
              placeholder="1"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="endPage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Page (optional)
            </label>
            <input
              id="endPage"
              type="number"
              min="1"
              value={endPage}
              onChange={(e) => setEndPage(e.target.value)}
              placeholder="Last page"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-400">{errorMessage}</p>
        </div>
      )}

      <div className="flex gap-3">
        {status === 'IDLE' || status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED' ? (
          <button
            onClick={handleStart}
            disabled={isStarting}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isStarting ? 'Starting...' : status === 'IDLE' ? 'Start Generation' : 'Restart Generation'}
          </button>
        ) : (
          <button
            onClick={handleCancel}
            disabled={isCancelling}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isCancelling ? 'Cancelling...' : 'Cancel'}
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Generate audio for all pages in this book. Pages with existing cached audio will be skipped.
      </p>
    </div>
  );
}
