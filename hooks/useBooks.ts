import { useState, useEffect, useCallback, useRef } from 'react';
import { booksApi, ApiError } from '@/services/api';
import type { Book, ReadingStatus, BatchUploadFileResult } from '@/types';

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);

  const uploadBook = useCallback(async (file: File) => {
    const newBook = await booksApi.upload(file);
    setBooks((prev) => [newBook, ...prev]);
    return newBook;
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
    await booksApi.delete(id);
    setBooks((prev) => prev.filter((book) => book.id !== id));
  }, []);

  const updateBook = useCallback(async (id: string, updates: Partial<Book>) => {
    const updated = await booksApi.update(id, updates);
    setBooks((prev) =>
      prev.map((book) => (book.id === id ? updated : book))
    );
    return updated;
  }, []);

  const updateBookStatus = useCallback(async (id: string, status: ReadingStatus) => {
    const book = await booksApi.getById(id);
    const updates: Partial<Pick<Book, 'status' | 'currentPage'>> = { status };

    if (status === 'FINISHED' && book.pageCount > 0) {
      updates.currentPage = book.pageCount;
    } else if (status === 'UNREAD') {
      updates.currentPage = 0;
    }

    const updated = await booksApi.update(id, updates);
    setBooks((prev) =>
      prev.map((book) => (book.id === id ? updated : book))
    );

    return updated;
  }, []);

  return {
    books,
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
  const [error, setError] = useState<string | null>(null);
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
      setError(null);

      const data = await booksApi.listPaged({
        page: pageNum,
        size: PAGE_SIZE,
        search: filters.search || undefined,
        sortBy: filters.sortBy || undefined,
        status: filters.status || undefined,
      }, controller.signal);

      const content = data.content ?? [];
      setBooks(prev => {
        if (!append) return content;
        const existingIds = new Set(prev.map(b => b.id));
        const newBooks = content.filter(b => !existingIds.has(b.id));
        return [...prev, ...newBooks];
      });
      setHasMore(!data.last);
      setTotalElements(data.totalElements);
      setPage(data.number);
      initialLoadDone.current = true;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to fetch books');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [filters.search, filters.sortBy, filters.status]);

  // Reset when filters change
  useEffect(() => {
    setHasMore(true);
    setPage(0);
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

  const updateBookInList = useCallback((updatedBook: Book) => {
    setBooks(prev => prev.map(b => b.id === updatedBook.id ? updatedBook : b));
  }, []);

  const removeBookFromList = useCallback((id: string) => {
    setBooks(prev => prev.filter(b => b.id !== id));
    setTotalElements(prev => Math.max(0, prev - 1));
  }, []);

  return {
    books,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    totalElements,
    error,
    loadMore,
    refetch,
    updateBookInList,
    removeBookFromList,
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
