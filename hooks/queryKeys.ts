// Central cache key factory for React Query
// All query keys are defined here so invalidation is consistent across the app
//
// Key hierarchy — invalidating a parent key invalidates all children:
//   ['books']                                  → all book-related cache
//   ['books', 'list', { search, sortBy, ... }] → paginated book list per filter
//   ['books', 'detail', 'abc-123']             → single book by ID
//   ['books', 'featured', 3]                   → featured books with limit
//   ['books', 'stats']                         → library stats
//   ['notes', 'book-id', 'page']               → notes for a book + sort order
//   ['preferences']                            → user preferences (theme, font, etc.)

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
