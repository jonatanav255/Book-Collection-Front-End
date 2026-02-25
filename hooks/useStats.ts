import { useQuery } from '@tanstack/react-query';
import { booksApi } from '@/services/api';
import { queryKeys } from './queryKeys';

export function useStats() {
  return useQuery({
    queryKey: queryKeys.books.stats(),
    queryFn: () => booksApi.getStats(),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
