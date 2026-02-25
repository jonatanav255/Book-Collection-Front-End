export const queryKeys = {
  books: {
    all: ['books'] as const,
    lists: () => [...queryKeys.books.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.books.lists(), filters] as const,
    details: () => [...queryKeys.books.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.books.details(), id] as const,
    featured: (limit: number) => [...queryKeys.books.all, 'featured', limit] as const,
    stats: () => [...queryKeys.books.all, 'stats'] as const,
  },
  notes: {
    all: ['notes'] as const,
    list: (bookId: string, sortBy?: string) => [...queryKeys.notes.all, bookId, sortBy] as const,
  },
  preferences: {
    all: ['preferences'] as const,
  },
} as const;
