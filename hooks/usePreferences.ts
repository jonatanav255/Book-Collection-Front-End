import { useState, useEffect, useCallback } from 'react';
import { preferencesApi } from '@/services/api';
import type { Preferences, UpdatePreferencesRequest, ThemePreset, FontSize } from '@/types';

export function usePreferences() {
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await preferencesApi.get();
      setPreferences(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch preferences');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreferences = useCallback(async (updates: UpdatePreferencesRequest) => {
    try {
      const updated = await preferencesApi.update(updates);
      setPreferences(updated);
      return updated;
    } catch (err) {
      throw err;
    }
  }, []);

  const setTheme = useCallback(
    async (theme: ThemePreset) => {
      return updatePreferences({ theme });
    },
    [updatePreferences]
  );

  const setFontSize = useCallback(
    async (fontSize: FontSize) => {
      return updatePreferences({ fontSize });
    },
    [updatePreferences]
  );

  const setFontFamily = useCallback(
    async (fontFamily: string) => {
      return updatePreferences({ fontFamily });
    },
    [updatePreferences]
  );

  return {
    preferences,
    loading,
    error,
    refetch: fetchPreferences,
    updatePreferences,
    setTheme,
    setFontSize,
    setFontFamily,
  };
}
