import { useState, useCallback, useEffect, useRef } from 'react';
import { audioApi } from '@/services/api';

interface UseAudioPlayerOptions {
  bookId: string | null;
  currentPage: number;
  onPageComplete?: () => void;
  onError?: (error: Error) => void;
}

export function useAudioPlayer({
  bookId,
  currentPage,
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

  // Update refs when props change
  useEffect(() => {
    currentPageRef.current = currentPage;
    currentBookIdRef.current = bookId;
  }, [currentPage, bookId]);

  // Check if audio is cached when page changes
  useEffect(() => {
    if (!bookId) return;

    const checkCache = async () => {
      try {
        const status = await audioApi.checkAudioStatus(bookId, currentPage);
        setIsCached(status.cached);
      } catch (err) {
        // Silently fail - cache status is just for UI feedback
        setIsCached(false);
      }
    };

    checkCache();
  }, [bookId, currentPage]);

  // Cleanup audio when component unmounts or page changes
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, [currentPage]);

  const loadAndPlayAudio = useCallback(
    async (pageNumber: number) => {
      if (!bookId) {
        setError('No book selected');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Stop any existing audio
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
        }

        // Create new audio element
        const audio = new Audio();
        audioRef.current = audio;

        // Set up event listeners
        audio.onended = () => {
          setIsPlaying(false);
          setIsPaused(false);
          onPageComplete?.();
        };

        audio.onerror = () => {
          const errorMsg = 'Failed to load or play audio';
          setError(errorMsg);
          setIsPlaying(false);
          setIsPaused(false);
          setIsLoading(false);
          onError?.(new Error(errorMsg));
        };

        audio.oncanplay = () => {
          setIsLoading(false);
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
        audio.src = audioApi.getPageAudioUrl(bookId, pageNumber);

        // Start playing
        await audio.play();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to play audio';
        setError(errorMsg);
        setIsPlaying(false);
        setIsPaused(false);
        setIsLoading(false);
        onError?.(err instanceof Error ? err : new Error(errorMsg));
      }
    },
    [bookId, onPageComplete, onError]
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
    if (isPlaying && !isPaused && bookId) {
      loadAndPlayAudio(currentPage);
    }
  }, [currentPage, bookId, isPlaying, isPaused, loadAndPlayAudio]);

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
  };
}
