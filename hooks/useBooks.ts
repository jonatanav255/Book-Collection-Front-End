import { useCallback, useMemo } from 'react';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { booksApi, ApiError } from '@/services/api';
import { queryKeys } from './queryKeys';
import type { Book, ReadingStatus, BatchUploadFileResult, PaginatedResponse } from '@/types';

// Mutation-only hook for book CRUD operations
// After each mutation, invalidates all book-related caches (list, stats, featured, details)
export function useBooks() {
  const queryClient = useQueryClient();

  // Invalidates everything under ['books'] — list, stats, featured, details
  const invalidateBookCaches = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.books.all });
  }, [queryClient]);

  const uploadBook = useCallback(async (file: File) => {
    const newBook = await booksApi.upload(file);
    invalidateBookCaches();
    return newBook;
  }, [invalidateBookCaches]);

  // Sequential batch upload with per-file progress reporting
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
          await booksApi.upload(files[i]);
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

      invalidateBookCaches();
      return results;
    },
    [invalidateBookCaches]
  );

  const deleteBook = useCallback(async (id: string) => {
    await booksApi.delete(id);
    invalidateBookCaches();
  }, [invalidateBookCaches]);

  const updateBook = useCallback(async (id: string, updates: Partial<Book>) => {
    const updated = await booksApi.update(id, updates);
    // Update the single-book detail cache immediately
    queryClient.setQueryData(queryKeys.books.detail(id), updated);
    invalidateBookCaches();
    return updated;
  }, [queryClient, invalidateBookCaches]);

  // Handles status transitions: FINISHED sets currentPage to max, UNREAD resets to 0
  const updateBookStatus = useCallback(async (id: string, status: ReadingStatus) => {
    const book = await booksApi.getById(id);
    const updates: Partial<Pick<Book, 'status' | 'currentPage'>> = { status };

    if (status === 'FINISHED' && book.pageCount > 0) {
      updates.currentPage = book.pageCount;
    } else if (status === 'UNREAD') {
      updates.currentPage = 0;
    }

    const updated = await booksApi.update(id, updates);
    invalidateBookCaches();
    return updated;
  }, [invalidateBookCaches]);

  return { uploadBook, uploadBooks, deleteBook, updateBook, updateBookStatus };
}

const PAGE_SIZE = 10;

// Infinite scroll hook for the library page
// Uses useInfiniteQuery to accumulate pages as the user scrolls down
export function usePaginatedBooks(filters: {
  search?: string;
  sortBy?: string;
  status?: string;
}) {
  const queryClient = useQueryClient();

  // Memoize to keep useCallback dependencies stable across renders
  const filterKey = useMemo(() => ({
    search: filters.search,
    sortBy: filters.sortBy,
    status: filters.status,
  }), [filters.search, filters.sortBy, filters.status]);

  const {
    data,
    isLoading: loading,
    isFetchingNextPage: loadingMore,
    isRefetching: refreshing,
    hasNextPage,
    fetchNextPage,
    refetch,
    error: queryError,
  } = useInfiniteQuery({
    queryKey: queryKeys.books.list(filterKey),
    queryFn: ({ pageParam, signal }) =>
      booksApi.listPaged({
        page: pageParam,
        size: PAGE_SIZE,
        search: filters.search || undefined,
        sortBy: filters.sortBy || undefined,
        status: filters.status || undefined,
      }, signal),

    initialPageParam: 0,

    // Spring Boot returns `last: true` on the final page — stop fetching when reached
    getNextPageParam: (lastPage) => lastPage.last ? undefined : lastPage.number + 1,

    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });

  // Flatten all pages into a single array: [page0.content, page1.content, ...]
  const books = data?.pages.flatMap(page => page.content) ?? [];
  const totalElements = data?.pages[0]?.totalElements ?? 0;
  const hasMore = hasNextPage ?? false;

  // Called by IntersectionObserver when the scroll sentinel becomes visible
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchNextPage();
    }
  }, [loadingMore, hasMore, fetchNextPage]);

  // Optimistic update: replace a book in the cached pages without refetching
  const updateBookInList = useCallback((updatedBook: Book) => {
    queryClient.setQueryData<{ pages: PaginatedResponse<Book>[]; pageParams: number[] }>(
      queryKeys.books.list(filterKey),
      (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map(page => ({
            ...page,
            content: page.content.map(b =>
              b.id === updatedBook.id ? updatedBook : b
            ),
          })),
        };
      }
    );
  }, [queryClient, filterKey]);

  // Optimistic removal: filter out a book from cached pages without refetching
  const removeBookFromList = useCallback((id: string) => {
    queryClient.setQueryData<{ pages: PaginatedResponse<Book>[]; pageParams: number[] }>(
      queryKeys.books.list(filterKey),
      (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map(page => ({
            ...page,
            content: page.content.filter(b => b.id !== id),
            totalElements: page.totalElements - 1,
          })),
        };
      }
    );
  }, [queryClient, filterKey]);

  return {
    books,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    totalElements,
    error: queryError ? (queryError as Error).message : null,
    loadMore,
    refetch,
    updateBookInList,
    removeBookFromList,
  };
}

// Single book detail hook — cached for 2 min so navigating back from reader is instant
export function useBook(id: string | null) {
  const { data: book, isLoading: loading, error: queryError } = useQuery({
    queryKey: queryKeys.books.detail(id!),
    queryFn: () => booksApi.getById(id!),
    enabled: !!id,       // Only fetch when id is provided
    staleTime: 2 * 60 * 1000,
  });

  return {
    book: book ?? null,
    loading,
    error: queryError ? (queryError as Error).message : null,
  };
}
