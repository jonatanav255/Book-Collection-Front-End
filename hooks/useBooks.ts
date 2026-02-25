import { useCallback, useMemo } from 'react';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { booksApi, ApiError } from '@/services/api';
import { queryKeys } from './queryKeys';
import type { Book, ReadingStatus, BatchUploadFileResult, PaginatedResponse } from '@/types';

export function useBooks() {
  const queryClient = useQueryClient();

  const invalidateBookCaches = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.books.all });
  }, [queryClient]);

  const uploadBook = useCallback(async (file: File) => {
    const newBook = await booksApi.upload(file);
    invalidateBookCaches();
    return newBook;
  }, [invalidateBookCaches]);

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
    queryClient.setQueryData(queryKeys.books.detail(id), updated);
    invalidateBookCaches();
    return updated;
  }, [queryClient, invalidateBookCaches]);

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

export function usePaginatedBooks(filters: {
  search?: string;
  sortBy?: string;
  status?: string;
}) {
  const queryClient = useQueryClient();
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
    getNextPageParam: (lastPage) => lastPage.last ? undefined : lastPage.number + 1,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const books = data?.pages.flatMap(page => page.content) ?? [];
  const totalElements = data?.pages[0]?.totalElements ?? 0;
  const hasMore = hasNextPage ?? false;

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchNextPage();
    }
  }, [loadingMore, hasMore, fetchNextPage]);

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

export function useBook(id: string | null) {
  const { data: book, isLoading: loading, error: queryError } = useQuery({
    queryKey: queryKeys.books.detail(id!),
    queryFn: () => booksApi.getById(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });

  return {
    book: book ?? null,
    loading,
    error: queryError ? (queryError as Error).message : null,
  };
}
