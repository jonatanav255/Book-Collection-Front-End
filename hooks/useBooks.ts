import { useState, useEffect, useCallback } from 'react';
import { booksApi } from '@/services/api';
import type { Book, ReadingStatus } from '@/types';

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

  const uploadBook = useCallback(async (file: File) => {
    try {
      const newBook = await booksApi.upload(file);
      setBooks((prev) => [newBook, ...prev]);
      return newBook;
    } catch (err) {
      throw err;
    }
  }, []);

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
      const updated = await booksApi.update(id, { status });
      setBooks((prev) =>
        prev.map((book) => (book.id === id ? updated : book))
      );
      return updated;
    } catch (err) {
      throw err;
    }
  }, []);

  return {
    books,
    loading,
    error,
    refetch: fetchBooks,
    uploadBook,
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
