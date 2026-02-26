import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBookCover } from '@/hooks/useBookCover';

// Mock the api module so we don't need a running backend
vi.mock('@/services/api', () => ({
  booksApi: {
    getThumbnailUrl: (id: string) => `http://localhost:8080/api/books/${id}/thumbnail`,
  },
}));

describe('useBookCover', () => {
  it('returns googleCoverUrl when coverUrl is provided', () => {
    const { result } = renderHook(() =>
      useBookCover('book-1', 'https://books.google.com/cover?zoom=1')
    );

    expect(result.current.imageUrl).toBe('https://books.google.com/cover?zoom=2');
  });

  it('strips &edge=curl from coverUrl', () => {
    const { result } = renderHook(() =>
      useBookCover('book-2', 'https://books.google.com/cover?zoom=1&edge=curl')
    );

    expect(result.current.imageUrl).not.toContain('edge=curl');
  });

  it('returns thumbnailUrl when coverUrl is null', () => {
    const { result } = renderHook(() => useBookCover('book-3', null));

    expect(result.current.imageUrl).toContain('book-3/thumbnail');
  });

  it('returns thumbnailUrl when coverUrl is undefined', () => {
    const { result } = renderHook(() => useBookCover('book-4'));

    expect(result.current.imageUrl).toContain('book-4/thumbnail');
  });

  it('falls back to thumbnail on handleError', () => {
    const { result } = renderHook(() =>
      useBookCover('book-5', 'https://books.google.com/cover?zoom=1')
    );

    act(() => {
      result.current.handleError();
    });

    expect(result.current.imageUrl).toContain('book-5/thumbnail');
  });

  it('imageLoaded starts as false', () => {
    const { result } = renderHook(() => useBookCover('book-6', 'https://example.com/cover.jpg'));
    expect(result.current.imageLoaded).toBe(false);
  });

  it('handleLoad sets imageLoaded=true for normal-sized image', () => {
    const { result } = renderHook(() =>
      useBookCover('book-7', 'https://books.google.com/cover?zoom=1')
    );

    act(() => {
      const fakeEvent = {
        target: { naturalWidth: 300 },
      } as React.SyntheticEvent<HTMLImageElement>;
      result.current.handleLoad(fakeEvent);
    });

    expect(result.current.imageLoaded).toBe(true);
  });

  it('handleLoad falls back to thumbnail for tiny images (naturalWidth < 150)', () => {
    const { result } = renderHook(() =>
      useBookCover('book-8', 'https://books.google.com/cover?zoom=1')
    );

    act(() => {
      const fakeEvent = {
        target: { naturalWidth: 80 }, // Placeholder image — too small
      } as React.SyntheticEvent<HTMLImageElement>;
      result.current.handleLoad(fakeEvent);
    });

    expect(result.current.imageUrl).toContain('book-8/thumbnail');
  });
});
