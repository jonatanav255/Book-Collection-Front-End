import { useState, useEffect, useCallback } from 'react';
import { booksApi, ApiError } from '@/services/api';
import type { Book, ReadingStatus, BatchUploadFileResult } from '@/types';

export function useBooks(filters?: {
  search?: string;
  sortBy?: string;
  status?: ReadingStatus;
}) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await booksApi.list(filters);
      setBooks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch books');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Refetch silently when user returns (tab switch or window focus from in-app navigation)
  useEffect(() => {
    const refetchSilently = async () => {
      try {
        const data = await booksApi.list(filters);
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
  }, [filters]);

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
