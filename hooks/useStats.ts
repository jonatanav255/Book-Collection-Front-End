import { useQuery } from '@tanstack/react-query';
import { booksApi } from '@/services/api';
import { queryKeys } from './queryKeys';

// Shared hook for library stats (total books, reading, finished, pages read)
// Used by both ReadingStats and the library page — React Query deduplicates
// so only one API call is made even if both components mount simultaneously
export function useStats() {
  return useQuery({
    queryKey: queryKeys.books.stats(),
    queryFn: () => booksApi.getStats(),

    // Stats stay fresh for 2 min — no refetch during that window
    staleTime: 2 * 60 * 1000,

    // Keep in memory for 5 min after last component unmounts
    gcTime: 5 * 60 * 1000,
  });
}
