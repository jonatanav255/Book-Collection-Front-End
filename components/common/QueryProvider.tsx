'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

// Global React Query provider — wraps the entire app in layout.tsx
// Initializes QueryClient inside useState to avoid recreating on every render
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,         // Data is fresh for 1 min by default
        gcTime: 5 * 60 * 1000,        // Unused cache kept for 5 min
        retry: 1,                      // Retry failed requests once
        refetchOnWindowFocus: false,   // Don't refetch on tab focus by default
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Dev-only floating panel to inspect cache state */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
