'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Loader2 } from 'lucide-react';
import { audioApi } from '@/services/api';

interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
}

interface PageData {
  text: string;
  audioUrl: string;
  wordTimings: WordTiming[];
}

interface ReadAlongPlayerProps {
  bookId: string;
  pageNumber: number;
  onPageChange?: (page: number) => void;
  totalPages?: number;
}

export function ReadAlongPlayer({
  bookId,
  pageNumber,
  onPageChange,
  totalPages,
}: ReadAlongPlayerProps) {
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // Fetch page data with timings
  useEffect(() => {
    let isMounted = true;

    const fetchPageData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await audioApi.getPageTextWithTimings(bookId, pageNumber);

        if (isMounted) {
          setPageData(data);
          setLoading(false);
          setCurrentWordIndex(-1);
          setCurrentTime(0);

          // Reset audio
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlaying(false);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load page data');
          setLoading(false);
        }
      }
    };

    fetchPageData();

    return () => {
      isMounted = false;
    };
  }, [bookId, pageNumber]);

  // Audio event listeners
  useEffect(() => {
    if (!audioRef.current || !pageData) return;

    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      const time = audio.currentTime;
      setCurrentTime(time);

      // Find current word index based on time
      const index = pageData.wordTimings.findIndex(
        (w) => w.startTime <= time && time < w.endTime
      );
      setCurrentWordIndex(index);

      // Auto-scroll to current word
      if (index !== -1 && wordRefs.current[index]) {
        wordRefs.current[index]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentWordIndex(-1);

      // Auto-advance to next page if available
      if (totalPages && pageNumber < totalPages && onPageChange) {
        setTimeout(() => {
          onPageChange(pageNumber + 1);
        }, 500);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('play', () => setIsPlaying(true));
    audio.addEventListener('pause', () => setIsPlaying(false));
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('play', () => setIsPlaying(true));
      audio.removeEventListener('pause', () => setIsPlaying(false));
      audio.removeEventListener('ended', handleEnded);
    };
  }, [pageData, pageNumber, totalPages, onPageChange]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handlePreviousPage = () => {
    if (pageNumber > 1 && onPageChange) {
      onPageChange(pageNumber - 1);
    }
  };

  const handleNextPage = () => {
    if (totalPages && pageNumber < totalPages && onPageChange) {
      onPageChange(pageNumber + 1);
    }
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading read-along...</span>
        </div>
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <p className="text-sm text-red-700 dark:text-red-400">
          {error || 'Failed to load read-along data'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Audio Controls */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-3">
          {/* Previous Page */}
          {onPageChange && pageNumber > 1 && (
            <button
              onClick={handlePreviousPage}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Previous Page"
            >
              <SkipBack className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          )}

          {/* Play/Pause */}
          <button
            onClick={togglePlayPause}
            className="flex items-center justify-center w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors shadow-md"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </button>

          {/* Next Page */}
          {onPageChange && totalPages && pageNumber < totalPages && (
            <button
              onClick={handleNextPage}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Next Page"
            >
              <SkipForward className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          )}

          {/* Time Display */}
          <div className="flex-1 min-w-0">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={pageData.audioUrl.startsWith('http') ? pageData.audioUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${pageData.audioUrl}`}
        preload="auto"
      />

      {/* Text with word-by-word highlighting */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="text-xl leading-relaxed">
          {pageData.wordTimings.map((timing, index) => (
            <span
              key={index}
              ref={(el) => {
                wordRefs.current[index] = el;
              }}
              className={`transition-all duration-200 cursor-pointer ${
                index === currentWordIndex
                  ? 'bg-yellow-300 dark:bg-yellow-500 text-gray-900 font-semibold px-1 rounded shadow-sm scale-105'
                  : 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.currentTime = timing.startTime;
                }
              }}
            >
              {timing.word}{' '}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
