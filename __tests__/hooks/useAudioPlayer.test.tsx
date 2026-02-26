import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

// Mock the API module
vi.mock('@/services/api', () => ({
  audioApi: {
    checkAudioStatus: vi.fn(),
    getPageAudioUrl: vi.fn((bookId: string, page: number) =>
      `http://localhost:8080/api/books/${bookId}/pages/${page}/audio`
    ),
  },
}));

import { audioApi } from '@/services/api';

/**
 * Minimal mock for HTMLAudioElement.
 * Captures event handlers so tests can fire them manually.
 */
function createMockAudio() {
  const audio: Record<string, any> = {
    src: '',
    currentTime: 0,
    duration: 100,
    paused: true,
    // Event handler slots
    oncanplay: null,
    onplay: null,
    onpause: null,
    onended: null,
    onerror: null,
    play: vi.fn().mockImplementation(async function (this: any) {
      this.paused = false;
      this.onplay?.();
    }),
    pause: vi.fn().mockImplementation(function (this: any) {
      this.paused = true;
    }),
    load: vi.fn(),
  };

  // Bind play/pause to the audio object
  audio.play = audio.play.bind(audio);
  audio.pause = audio.pause.bind(audio);

  return audio;
}

let mockAudioInstance: ReturnType<typeof createMockAudio>;

/**
 * useAudioPlayer hook tests
 * Verifies play/pause/stop, cache status, error handling, and the instant cache indicator fix
 */
describe('useAudioPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAudioInstance = createMockAudio();

    // Mock the Audio constructor to return our mock instance
    vi.stubGlobal('Audio', vi.fn(() => mockAudioInstance));

    // Default: page is not cached
    vi.mocked(audioApi.checkAudioStatus).mockResolvedValue({
      bookId: 'book-1',
      pageNumber: 1,
      cached: false,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ── Initial state
  it('starts with isCached=false, isPlaying=false, isLoading=false', async () => {
    const { result } = renderHook(() =>
      useAudioPlayer({ bookId: 'book-1', currentPage: 1 })
    );
    await act(async () => {});

    expect(result.current.isCached).toBe(false);
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  // ── Cache check on mount
  it('checks cache status on mount and sets isCached=true when cached', async () => {
    vi.mocked(audioApi.checkAudioStatus).mockResolvedValue({
      bookId: 'book-1',
      pageNumber: 1,
      cached: true,
    });

    const { result } = renderHook(() =>
      useAudioPlayer({ bookId: 'book-1', currentPage: 1 })
    );
    await act(async () => {});

    expect(audioApi.checkAudioStatus).toHaveBeenCalledWith('book-1', 1);
    expect(result.current.isCached).toBe(true);
  });

  it('does not check cache when enabled=false', async () => {
    const { result } = renderHook(() =>
      useAudioPlayer({ bookId: 'book-1', currentPage: 1, enabled: false })
    );
    await act(async () => {});

    expect(audioApi.checkAudioStatus).not.toHaveBeenCalled();
    expect(result.current.isCached).toBe(false);
  });

  // ── Instant cache indicator after audio loads (the bug fix)
  it('sets isCached=true immediately when audio fires oncanplay', async () => {
    const { result } = renderHook(() =>
      useAudioPlayer({ bookId: 'book-1', currentPage: 1 })
    );
    await act(async () => {});

    // Initially not cached
    expect(result.current.isCached).toBe(false);

    // Play triggers loadAndPlayAudio which creates Audio and sets event handlers
    await act(async () => {
      result.current.play();
    });

    // Simulate the browser firing oncanplay (audio loaded from backend/cache)
    await act(async () => {
      mockAudioInstance.oncanplay?.();
    });

    // isCached should now be true without navigating away
    expect(result.current.isCached).toBe(true);
  });

  // ── Play/pause/stop
  it('sets isPlaying=true after calling play', async () => {
    const { result } = renderHook(() =>
      useAudioPlayer({ bookId: 'book-1', currentPage: 1 })
    );
    await act(async () => {});

    await act(async () => {
      result.current.play();
    });

    expect(result.current.isPlaying).toBe(true);
  });

  it('sets error when bookId is null and play is called', async () => {
    const { result } = renderHook(() =>
      useAudioPlayer({ bookId: null, currentPage: 1 })
    );
    await act(async () => {});

    await act(async () => {
      result.current.play();
    });

    expect(result.current.error).toBe('No book selected');
  });

  it('stop resets isPlaying and isPaused', async () => {
    const { result } = renderHook(() =>
      useAudioPlayer({ bookId: 'book-1', currentPage: 1 })
    );
    await act(async () => {});

    // Start playing
    await act(async () => {
      result.current.play();
    });
    expect(result.current.isPlaying).toBe(true);

    // Stop
    act(() => {
      result.current.stop();
    });

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.isPaused).toBe(false);
  });

  // ── Error handling
  it('sets error when audio fires onerror', async () => {
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useAudioPlayer({ bookId: 'book-1', currentPage: 1, onError })
    );
    await act(async () => {});

    await act(async () => {
      result.current.play();
    });

    // Simulate audio error
    await act(async () => {
      mockAudioInstance.onerror?.();
    });

    expect(result.current.error).toBe('Failed to load or play audio');
    expect(result.current.isPlaying).toBe(false);
    expect(onError).toHaveBeenCalled();
  });

  // ── onPageComplete callback
  it('calls onPageComplete when audio ends', async () => {
    const onPageComplete = vi.fn();
    const { result } = renderHook(() =>
      useAudioPlayer({ bookId: 'book-1', currentPage: 1, onPageComplete })
    );
    await act(async () => {});

    await act(async () => {
      result.current.play();
    });

    // Simulate audio finishing
    await act(async () => {
      mockAudioInstance.onended?.();
    });

    expect(onPageComplete).toHaveBeenCalled();
    expect(result.current.isPlaying).toBe(false);
  });

  // ── togglePlayPause
  it('togglePlayPause starts playback when not playing', async () => {
    const { result } = renderHook(() =>
      useAudioPlayer({ bookId: 'book-1', currentPage: 1 })
    );
    await act(async () => {});

    await act(async () => {
      result.current.togglePlayPause();
    });

    expect(result.current.isPlaying).toBe(true);
  });
});
