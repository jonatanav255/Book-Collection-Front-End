'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, XCircle, Download } from 'lucide-react';
import { audioApi } from '@/services/api';

interface BatchProgress {
  status: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  currentPage: number;
  totalPages: number;
  progressPercentage: number;
  errorMessage?: string;
}

interface BatchAudioGeneratorProps {
  bookId: string;
  onComplete?: () => void;
}

export function BatchAudioGenerator({ bookId, onComplete }: BatchAudioGeneratorProps) {
  const [progress, setProgress] = useState<BatchProgress | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Poll for progress while generating
  useEffect(() => {
    if (!isGenerating) return;

    const pollInterval = setInterval(async () => {
      try {
        const data = await audioApi.getBatchGenerationStatus(bookId);
        setProgress(data);

        // Stop polling if completed, failed, or cancelled
        if (data.status === 'COMPLETED' || data.status === 'FAILED' || data.status === 'CANCELLED') {
          setIsGenerating(false);
          if (data.status === 'COMPLETED' && onComplete) {
            onComplete();
          }
        }
      } catch (err) {
        console.error('Failed to fetch generation status:', err);
        setError('Failed to check generation status');
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [isGenerating, bookId, onComplete]);

  const handleStartGeneration = async () => {
    try {
      setError(null);
      await audioApi.startBatchGeneration(bookId);
      setIsGenerating(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start generation');
    }
  };

  const handleCancelGeneration = async () => {
    try {
      await audioApi.cancelBatchGeneration(bookId);
      setIsGenerating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel generation');
    }
  };

  const canStart = !isGenerating && (!progress || progress.status !== 'RUNNING');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Download className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Batch Audio Generation
          </h3>
        </div>

        {progress?.status === 'COMPLETED' && (
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        )}
        {progress?.status === 'FAILED' && (
          <XCircle className="w-5 h-5 text-red-600" />
        )}
      </div>

      <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
        Pre-generate audio for all pages to enable offline reading and faster playback
      </p>

      {/* Error Message */}
      {error && (
        <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Start Button */}
      {canStart && (
        <button
          onClick={handleStartGeneration}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Generate All Pages Audio
        </button>
      )}

      {/* Progress Bar & Status */}
      {isGenerating && progress && (
        <div className="space-y-3">
          {/* Progress Bar */}
          <div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-2 transition-all duration-300"
                style={{ width: `${progress.progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Progress Text */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400">
              Page {progress.currentPage} of {progress.totalPages}
            </span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {progress.progressPercentage.toFixed(1)}%
            </span>
          </div>

          {/* Cancel Button */}
          <button
            onClick={handleCancelGeneration}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            Cancel Generation
          </button>
        </div>
      )}

      {/* Completion Status */}
      {progress?.status === 'COMPLETED' && !isGenerating && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-700 dark:text-green-300 font-medium">
            All audio generated successfully!
          </p>
        </div>
      )}

      {/* Failure Status */}
      {progress?.status === 'FAILED' && !isGenerating && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-700 dark:text-red-300 font-medium">
              Generation failed
            </p>
            {progress.errorMessage && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {progress.errorMessage}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Cancelled Status */}
      {progress?.status === 'CANCELLED' && !isGenerating && (
        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Generation cancelled
          </p>
        </div>
      )}
    </div>
  );
}
