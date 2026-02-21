import { useState, useEffect, useRef } from 'react';
import { audioApi } from '@/services/api';

interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
}

interface UseReadAlongOptions {
  bookId: string;
  currentPage: number;
  enabled: boolean;
  audioElement?: HTMLAudioElement | null; // External audio element to sync with
}

export function useReadAlong({
  bookId,
  currentPage,
  enabled,
  audioElement,
}: UseReadAlongOptions) {
  const [wordTimings, setWordTimings] = useState<WordTiming[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  const loadingRef = useRef<boolean>(false);
  const currentPageRef = useRef<number>(currentPage);

  // Fetch word timings for current page
  useEffect(() => {
    if (!enabled) {
      setWordTimings([]);
      setCurrentWordIndex(-1);
      loadingRef.current = false;
      return;
    }

    // Prevent duplicate requests
    if (loadingRef.current && currentPageRef.current === currentPage) {
      return;
    }

    let isMounted = true;
    currentPageRef.current = currentPage;

    const fetchTimings = async () => {
      try {
        loadingRef.current = true;
        setIsLoading(true);

        const data = await audioApi.getPageTextWithTimings(bookId, currentPage);

        if (isMounted) {
          setWordTimings(data.wordTimings);
          setIsLoading(false);
          loadingRef.current = false;
        }
      } catch (err) {
        if (isMounted) {
          // Silent fail - word timings are optional enhancement
          console.warn('Failed to load word timings:', err);
          setWordTimings([]);
          setIsLoading(false);
          loadingRef.current = false;
        }
      }
    };

    fetchTimings();

    return () => {
      isMounted = false;
    };
  }, [bookId, currentPage, enabled]);

  // Sync with external audio element
  useEffect(() => {
    if (!audioElement || wordTimings.length === 0) {
      setCurrentWordIndex(-1);
      return;
    }

    const handleTimeUpdate = () => {
      const time = audioElement.currentTime;

      // Find current word based on time
      const index = wordTimings.findIndex(
        (w) => w.startTime <= time && time < w.endTime
      );
      setCurrentWordIndex(index);
    };

    const handleEnded = () => {
      setCurrentWordIndex(-1);
    };

    const handlePause = () => {
      setCurrentWordIndex(-1);
    };

    audioElement.addEventListener('timeupdate', handleTimeUpdate);
    audioElement.addEventListener('ended', handleEnded);
    audioElement.addEventListener('pause', handlePause);

    return () => {
      audioElement.removeEventListener('timeupdate', handleTimeUpdate);
      audioElement.removeEventListener('ended', handleEnded);
      audioElement.removeEventListener('pause', handlePause);
    };
  }, [audioElement, wordTimings]);

  return {
    wordTimings,
    currentWordIndex,
    isLoading,
  };
}
