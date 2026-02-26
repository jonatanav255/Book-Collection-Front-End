import { useState, useCallback, useEffect, useRef } from 'react';
import { audioApi } from '@/services/api';

interface UseAudioPlayerOptions {
  bookId: string | null;
  currentPage: number;
  enabled?: boolean; // Only check cache status when enabled
  onPageComplete?: () => void;
  onError?: (error: Error) => void;
}

export function useAudioPlayer({
  bookId,
  currentPage,
  enabled = true,
  onPageComplete,
  onError,
}: UseAudioPlayerOptions) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentPageRef = useRef<number>(currentPage);
  const currentBookIdRef = useRef<string | null>(bookId);
  const isLoadingRef = useRef<boolean>(false);
  const shouldContinuePlayingRef = useRef<boolean>(false);

  // Update refs when props change
  useEffect(() => {
    currentPageRef.current = currentPage;
    currentBookIdRef.current = bookId;
  }, [currentPage, bookId]);

  // Check if audio is cached when page changes (only when enabled)
  useEffect(() => {
    if (!bookId || !enabled) {
      setIsCached(false);
      return;
    }

    const checkCache = async () => {
      try {
        const status = await audioApi.checkAudioStatus(bookId, currentPage);
        setIsCached(status.cached);
      } catch {
        // Silently fail - cache status is just for UI feedback
        setIsCached(false);
      }
    };

    checkCache();
  }, [bookId, currentPage, enabled]);

  // Cleanup audio when component unmounts or page changes
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        // Remove event listeners before cleanup
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
        audioRef.current.oncanplay = null;
        audioRef.current.onplay = null;
        audioRef.current.onpause = null;
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, [currentPage]);

  const loadAndPlayAudio = useCallback(
    async (pageNumber: number) => {
      const currentBookId = currentBookIdRef.current;

      if (!currentBookId) {
        setError('No book selected');
        return;
      }

      // Prevent duplicate requests
      if (isLoadingRef.current) {
        return;
      }

      try {
        isLoadingRef.current = true;
        setIsLoading(true);
        setError(null);

        // Stop and cleanup any existing audio
        if (audioRef.current) {
          const oldAudio = audioRef.current;
          // Remove event listeners to prevent old audio from triggering errors
          oldAudio.onended = null;
          oldAudio.onerror = null;
          oldAudio.oncanplay = null;
          oldAudio.onplay = null;
          oldAudio.onpause = null;
          oldAudio.pause();
          oldAudio.src = '';
        }

        // Create new audio element
        const audio = new Audio();
        audioRef.current = audio;

        // Set up event listeners
        audio.onended = () => {
          // Keep playing flag true for auto-advance
          shouldContinuePlayingRef.current = true;
          setIsPlaying(false);
          setIsPaused(false);
          setError(null); // Clear any previous errors
          isLoadingRef.current = false;
          onPageComplete?.();
        };

        audio.onerror = () => {
          const errorMsg = 'Failed to load or play audio';
          setError(errorMsg);
          setIsPlaying(false);
          setIsPaused(false);
          setIsLoading(false);
          isLoadingRef.current = false;
          onError?.(new Error(errorMsg));
        };

        audio.oncanplay = () => {
          setIsLoading(false);
          isLoadingRef.current = false;
          // Audio loaded successfully — backend cached it, update indicator instantly
          setIsCached(true);
        };

        audio.onplay = () => {
          setIsPlaying(true);
          setIsPaused(false);
        };

        audio.onpause = () => {
          if (audio.currentTime < audio.duration) {
            setIsPaused(true);
          }
        };

        // Load audio URL (backend handles cache/generation)
        audio.src = audioApi.getPageAudioUrl(currentBookId, pageNumber);

        // Start playing
        await audio.play();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to play audio';
        setError(errorMsg);
        setIsPlaying(false);
        setIsPaused(false);
        setIsLoading(false);
        isLoadingRef.current = false;
        onError?.(err instanceof Error ? err : new Error(errorMsg));
      }
    },
    [onPageComplete, onError]
  );

  const play = useCallback(() => {
    if (audioRef.current && isPaused) {
      // Resume existing audio
      audioRef.current.play().catch((err) => {
        setError('Failed to resume audio');
        onError?.(err);
      });
    } else {
      // Load and play current page
      loadAndPlayAudio(currentPageRef.current);
    }
  }, [isPaused, loadAndPlayAudio]);

  const pause = useCallback(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPaused(true);
    }
  }, [isPlaying]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setIsPaused(false);
      setError(null); // Clear errors when stopping
      shouldContinuePlayingRef.current = false;
    }
  }, []);

  const togglePlayPause = useCallback(() => {
    if (isPlaying && !isPaused) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, isPaused, play, pause]);

  // When page changes while playing, load new page audio
  useEffect(() => {
    // Auto-advance: play next page after previous finished
    if (shouldContinuePlayingRef.current) {
      shouldContinuePlayingRef.current = false;
      loadAndPlayAudio(currentPage);
    }
    // Manual page change while playing: continue playing new page
    else if (isPlaying && !isPaused) {
      loadAndPlayAudio(currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // Allow external callers to re-check cache status (e.g. after batch generation)
  const recheckCache = useCallback(async () => {
    if (!bookId || !enabled) return;
    try {
      const status = await audioApi.checkAudioStatus(bookId, currentPage);
      setIsCached(status.cached);
    } catch {
      // Silently fail
    }
  }, [bookId, currentPage, enabled]);

  return {
    isPlaying,
    isPaused,
    isLoading,
    isCached,
    error,
    play,
    pause,
    stop,
    togglePlayPause,
    recheckCache,
    audioElement: audioRef.current, // Expose audio element for sync
  };
}
