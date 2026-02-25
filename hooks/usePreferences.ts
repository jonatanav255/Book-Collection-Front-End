import { useQuery, useQueryClient } from '@tanstack/react-query';
import { preferencesApi } from '@/services/api';
import { queryKeys } from './queryKeys';
import type { Preferences, UpdatePreferencesRequest, ThemePreset, FontSize } from '@/types';

// User preferences hook (theme, font size, font family)
// Cached for 10 min — preferences rarely change and don't need frequent refetching
export function usePreferences() {
  const queryClient = useQueryClient();

  const { data: preferences, isLoading: loading, error: queryError } = useQuery({
    queryKey: queryKeys.preferences.all,
    queryFn: () => preferencesApi.get(),
    staleTime: 10 * 60 * 1000,   // Fresh for 10 min
    gcTime: 30 * 60 * 1000,      // Keep in memory for 30 min
  });

  // Update and immediately write to cache (no refetch needed)
  const updatePreferences = async (updates: UpdatePreferencesRequest) => {
    const updated = await preferencesApi.update(updates);
    queryClient.setQueryData(queryKeys.preferences.all, updated);
    return updated;
  };

  const setTheme = async (theme: ThemePreset) => updatePreferences({ theme });
  const setFontSize = async (fontSize: FontSize) => updatePreferences({ fontSize });
  const setFontFamily = async (fontFamily: string) => updatePreferences({ fontFamily });

  return {
    preferences: preferences ?? null,
    loading,
    error: queryError ? (queryError as Error).message : null,
    refetch: () => queryClient.invalidateQueries({ queryKey: queryKeys.preferences.all }),
    updatePreferences,
    setTheme,
    setFontSize,
    setFontFamily,
  };
}
