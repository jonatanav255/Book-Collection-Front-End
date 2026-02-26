'use client';

import React from 'react';
import { Play, Pause, Square, Volume2, Loader2, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/i18n';

interface ReadAloudControlsProps {
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  isCached?: boolean;
  error?: string | null;
  onTogglePlayPause: () => void;
  onStop: () => void;
}

export function ReadAloudControls({
  isPlaying,
  isPaused,
  isLoading,
  isCached,
  error,
  onTogglePlayPause,
  onStop,
}: ReadAloudControlsProps) {
  const { t } = useLanguage();

  const getStatusText = () => {
    if (error) return t('audio.error');
    if (isLoading) return t('audio.loadingAudio');
    if (isPlaying && !isPaused) return t('audio.playing');
    if (isPaused) return t('audio.paused');
    return t('audio.ready');
  };

  const getStatusColor = () => {
    if (error) return 'text-red-600 dark:text-red-400';
    if (isLoading) return 'text-yellow-600 dark:text-yellow-400';
    if (isPlaying) return 'text-green-600 dark:text-green-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-2 sm:p-3 border border-gray-200 dark:border-gray-700">
      {/* Play/Pause Button */}
      <button
        onClick={onTogglePlayPause}
        disabled={isLoading}
        className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white transition-colors"
        title={!isPlaying ? t('audio.play') : isPaused ? t('audio.resume') : t('audio.pause')}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : !isPlaying || isPaused ? (
          <Play className="w-5 h-5" fill="currentColor" />
        ) : (
          <Pause className="w-5 h-5" fill="currentColor" />
        )}
      </button>

      {/* Stop Button */}
      {isPlaying && (
        <button
          onClick={onStop}
          className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
          title={t('audio.stop')}
        >
          <Square className="w-5 h-5" fill="currentColor" />
        </button>
      )}

      {/* Status */}
      <div className="flex items-center gap-2 px-3 text-sm">
        <Volume2 className={`w-4 h-4 ${getStatusColor()}`} />
        <span className={`font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>

      {/* Cached Indicator */}
      {isCached && !isLoading && !error && (
        <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded text-xs text-green-700 dark:text-green-300">
          <CheckCircle2 className="w-3 h-3" />
          <span>{t('audio.cached')}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <span className="ml-auto text-xs text-red-600 dark:text-red-400 max-w-xs truncate">
          {error}
        </span>
      )}

      {/* Info Note */}
      {!error && !isLoading && (
        <div className="ml-auto hidden sm:block">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('audio.ttsInfo')}
          </p>
        </div>
      )}
    </div>
  );
}
