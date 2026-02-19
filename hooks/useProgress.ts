import { useState, useEffect, useCallback, useRef } from 'react';
import { progressApi } from '@/services/api';
import type { BookProgress } from '@/types';

const DEBOUNCE_DELAY = 2000; // 2 seconds

export function useProgress(bookId: string | null) {
  const [progress, setProgress] = useState<BookProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdateRef = useRef<Partial<BookProgress> | null>(null);

  useEffect(() => {
    if (!bookId) {
      setProgress(null);
      setLoading(false);
      return;
    }

    const fetchProgress = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await progressApi.get(bookId);
        setProgress(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch progress');
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [bookId]);

  const updateProgress = useCallback(
    async (updates: Partial<BookProgress>, immediate = false) => {
      if (!bookId) return;

      // Update local state immediately for UI responsiveness
      setProgress((prev) => (prev ? { ...prev, ...updates } : null));

      if (immediate) {
        // Cancel any pending debounced update
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }

        try {
          await progressApi.update(bookId, updates);
          pendingUpdateRef.current = null;
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to update progress');
          throw err;
        }
      } else {
        // Merge with any pending updates
        pendingUpdateRef.current = {
          ...pendingUpdateRef.current,
          ...updates,
        };

        // Clear existing timer
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        // Set new timer
        debounceTimerRef.current = setTimeout(async () => {
          if (!pendingUpdateRef.current) return;

          try {
            await progressApi.update(bookId, pendingUpdateRef.current);
            pendingUpdateRef.current = null;
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update progress');
          }
        }, DEBOUNCE_DELAY);
      }
    },
    [bookId]
  );

  const setCurrentPage = useCallback(
    (page: number, immediate = false) => {
      updateProgress({ currentPage: page }, immediate);
    },
    [updateProgress]
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    progress,
    loading,
    error,
    updateProgress,
    setCurrentPage,
  };
}
