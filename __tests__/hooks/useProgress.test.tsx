import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProgress } from '@/hooks/useProgress';

// Mock the API module
vi.mock('@/services/api', () => ({
  progressApi: {
    get: vi.fn(),
    update: vi.fn(),
  },
}));

import { progressApi } from '@/services/api';

describe('useProgress', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sets loading=false and progress=null when bookId is null', async () => {
    const { result } = renderHook(() => useProgress(null));

    await act(async () => {});

    expect(result.current.loading).toBe(false);
    expect(result.current.progress).toBeNull();
  });

  it('fetches progress when bookId is provided', async () => {
    const mockProgress = { currentPage: 10, status: 'READING', progressPercentage: 20 };
    vi.mocked(progressApi.get).mockResolvedValue(mockProgress as any);

    const { result } = renderHook(() => useProgress('book-123'));

    await act(async () => {});

    expect(progressApi.get).toHaveBeenCalledWith('book-123');
    expect(result.current.progress).toEqual(mockProgress);
    expect(result.current.loading).toBe(false);
  });

  it('sets error when fetch fails', async () => {
    vi.mocked(progressApi.get).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useProgress('book-abc'));

    await act(async () => {});

    expect(result.current.error).toBe('Network error');
    expect(result.current.loading).toBe(false);
  });

  it('updateProgress immediate=true calls API right away', async () => {
    const mockProgress = { currentPage: 5, status: 'READING', progressPercentage: 10 };
    vi.mocked(progressApi.get).mockResolvedValue(mockProgress as any);
    vi.mocked(progressApi.update).mockResolvedValue({ ...mockProgress, currentPage: 20 } as any);

    const { result } = renderHook(() => useProgress('book-xyz'));
    await act(async () => {});

    await act(async () => {
      await result.current.updateProgress({ currentPage: 20 }, true);
    });

    expect(progressApi.update).toHaveBeenCalledWith('book-xyz', { currentPage: 20 });
  });

  it('updateProgress immediate=false debounces the API call', async () => {
    const mockProgress = { currentPage: 5, status: 'READING', progressPercentage: 10 };
    vi.mocked(progressApi.get).mockResolvedValue(mockProgress as any);
    vi.mocked(progressApi.update).mockResolvedValue(mockProgress as any);

    const { result } = renderHook(() => useProgress('book-debounce'));
    await act(async () => {});

    act(() => {
      result.current.updateProgress({ currentPage: 15 }); // default: immediate=false
    });

    // API should NOT be called immediately
    expect(progressApi.update).not.toHaveBeenCalled();

    // After 2s debounce, it should fire
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(progressApi.update).toHaveBeenCalledWith('book-debounce', { currentPage: 15 });
  });

  it('updateProgress merges multiple debounced updates into one call', async () => {
    const mockProgress = { currentPage: 5, status: 'READING', progressPercentage: 10 };
    vi.mocked(progressApi.get).mockResolvedValue(mockProgress as any);
    vi.mocked(progressApi.update).mockResolvedValue(mockProgress as any);

    const { result } = renderHook(() => useProgress('book-merge'));
    await act(async () => {});

    act(() => {
      result.current.updateProgress({ currentPage: 10 });
      result.current.updateProgress({ currentPage: 15 });
      result.current.updateProgress({ currentPage: 20 });
    });

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    // Only one API call with the latest merged state
    expect(progressApi.update).toHaveBeenCalledTimes(1);
    expect(progressApi.update).toHaveBeenCalledWith('book-merge', { currentPage: 20 });
  });

  it('updateProgress does nothing when bookId is null', async () => {
    const { result } = renderHook(() => useProgress(null));
    await act(async () => {});

    await act(async () => {
      await result.current.updateProgress({ currentPage: 5 }, true);
    });

    expect(progressApi.update).not.toHaveBeenCalled();
  });

  it('flushes pending debounced update on unmount', async () => {
    const mockProgress = { currentPage: 1, status: 'READING', progressPercentage: 5 };
    vi.mocked(progressApi.get).mockResolvedValue(mockProgress as any);
    vi.mocked(progressApi.update).mockResolvedValue(mockProgress as any);

    const { result, unmount } = renderHook(() => useProgress('book-flush'));
    await act(async () => {});

    // Queue a debounced update without advancing timers
    act(() => {
      result.current.updateProgress({ currentPage: 99 });
    });

    // API not called yet
    expect(progressApi.update).not.toHaveBeenCalled();

    // Unmount should flush the pending update
    await act(async () => {
      unmount();
    });

    expect(progressApi.update).toHaveBeenCalledWith('book-flush', { currentPage: 99 });
  });

  it('setCurrentPage calls updateProgress with currentPage field', async () => {
    const mockProgress = { currentPage: 1, status: 'READING', progressPercentage: 5 };
    vi.mocked(progressApi.get).mockResolvedValue(mockProgress as any);
    vi.mocked(progressApi.update).mockResolvedValue(mockProgress as any);

    const { result } = renderHook(() => useProgress('book-page'));
    await act(async () => {});

    await act(async () => {
      result.current.setCurrentPage(42, true);
    });

    expect(progressApi.update).toHaveBeenCalledWith('book-page', { currentPage: 42 });
  });
});
