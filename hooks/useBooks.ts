import { useState, useEffect, useCallback, useRef } from 'react';
import { booksApi, ApiError } from '@/services/api';
import type { Book, ReadingStatus, BatchUploadFileResult } from '@/types';

export function useBooks(filters?: {
  search?: string;
  sortBy?: string;
  status?: ReadingStatus;
}, options?: { skip?: boolean }) {
  const skip = options?.skip ?? false;
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<string | null>(null);

  const search = filters?.search;
  const sortBy = filters?.sortBy;
  const status = filters?.status;

  const fetchBooks = useCallback(async () => {
    if (skip) return;
    try {
      setLoading(true);
      setError(null);
      const data = await booksApi.list({ search, sortBy, status });
      setBooks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch books');
    } finally {
      setLoading(false);
    }
  }, [search, sortBy, status, skip]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Refetch silently when user returns (tab switch or window focus from in-app navigation)
  useEffect(() => {
    if (skip) return;
    const refetchSilently = async () => {
      try {
        const data = await booksApi.list({ search, sortBy, status });
        setBooks(data);
      } catch {
        // silently ignore refetch errors
      }
    };
    const handleVisibilityChange = () => {
      if (!document.hidden) refetchSilently();
    };
    const handleFocus = () => refetchSilently();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [search, sortBy, status, skip]);

  const uploadBook = useCallback(async (file: File) => {
    try {
      const newBook = await booksApi.upload(file);
      setBooks((prev) => [newBook, ...prev]);
      return newBook;
    } catch (err) {
      throw err;
    }
  }, []);

  const uploadBooks = useCallback(
    async (
      files: File[],
      onProgress?: (results: BatchUploadFileResult[], currentIndex: number) => void
    ): Promise<BatchUploadFileResult[]> => {
      const results: BatchUploadFileResult[] = files.map((file) => ({
        file,
        status: 'pending' as const,
      }));

      for (let i = 0; i < files.length; i++) {
        results[i] = { ...results[i], status: 'uploading' };
        onProgress?.(results, i);

        try {
          const newBook = await booksApi.upload(files[i]);
          setBooks((prev) => [newBook, ...prev]);
          results[i] = { ...results[i], status: 'success' };
        } catch (err) {
          if (err instanceof ApiError && err.status === 409) {
            results[i] = { ...results[i], status: 'skipped', error: 'Duplicate file' };
          } else {
            results[i] = {
              ...results[i],
              status: 'failed',
              error: err instanceof Error ? err.message : 'Upload failed',
            };
          }
        }

        onProgress?.(results, i);
      }

      return results;
    },
    []
  );

  const deleteBook = useCallback(async (id: string) => {
    try {
      await booksApi.delete(id);
      setBooks((prev) => prev.filter((book) => book.id !== id));
    } catch (err) {
      throw err;
    }
  }, []);

  const updateBook = useCallback(async (id: string, updates: Partial<Book>) => {
    try {
      const updated = await booksApi.update(id, updates);
      setBooks((prev) =>
        prev.map((book) => (book.id === id ? updated : book))
      );
      return updated;
    } catch (err) {
      throw err;
    }
  }, []);

  const updateBookStatus = useCallback(async (id: string, status: ReadingStatus) => {
    try {
      const book = books.find(b => b.id === id);
      const updates: any = { status };

      if (status === 'FINISHED' && book && book.pageCount > 0) {
        updates.currentPage = book.pageCount;
      } else if (status === 'UNREAD') {
        updates.currentPage = 0;
      }

      const updated = await booksApi.update(id, updates);
      setBooks((prev) =>
        prev.map((book) => (book.id === id ? updated : book))
      );

      return updated;
    } catch (err) {
      throw err;
    }
  }, [books]);

  return {
    books,
    loading,
    error,
    refetch: fetchBooks,
    uploadBook,
    uploadBooks,
    deleteBook,
    updateBook,
    updateBookStatus,
  };
}

const PAGE_SIZE = 10;

export function usePaginatedBooks(filters: {
  search?: string;
  sortBy?: string;
  status?: string;
}) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const initialLoadDone = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchPage = useCallback(async (pageNum: number, append: boolean) => {
    // Cancel any in-flight request
    if (!append) {
      abortRef.current?.abort();
    }
    const controller = new AbortController();
    if (!append) {
      abortRef.current = controller;
    }

    try {
      if (append) {
        setLoadingMore(true);
      } else if (!initialLoadDone.current) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const data = await booksApi.listPaged({
        page: pageNum,
        size: PAGE_SIZE,
        search: filters.search || undefined,
        sortBy: filters.sortBy || undefined,
        status: filters.status || undefined,
      }, controller.signal);

      const content = data.content ?? [];
      setBooks(prev => append ? [...prev, ...content] : content);
      setHasMore(!data.last);
      setTotalElements(data.totalElements);
      setPage(data.number);
      initialLoadDone.current = true;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [filters.search, filters.sortBy, filters.status]);

  // Reset when filters change
  useEffect(() => {
    fetchPage(0, false);
    return () => { abortRef.current?.abort(); };
  }, [fetchPage]);

  // Refetch on tab focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) fetchPage(0, false);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchPage(page + 1, true);
    }
  }, [loadingMore, hasMore, page, fetchPage]);

  const refetch = useCallback(() => {
    fetchPage(0, false);
  }, [fetchPage]);

  return {
    books,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    totalElements,
    loadMore,
    refetch,
  };
}

export function useBook(id: string | null) {
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setBook(null);
      setLoading(false);
      return;
    }

    const fetchBook = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await booksApi.getById(id);
        setBook(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch book');
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id]);

  return { book, loading, error };
}
