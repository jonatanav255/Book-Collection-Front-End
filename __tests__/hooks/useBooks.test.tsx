import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useBooks } from '@/hooks/useBooks';
import { ApiError } from '@/services/api';

vi.mock('@/services/api', () => ({
  booksApi: {
    upload: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
    getById: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
      this.name = 'ApiError';
    }
  },
}));

import { booksApi } from '@/services/api';

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('useBooks', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uploadBook calls booksApi.upload and returns result', async () => {
    const book = { id: '1', title: 'My Book' };
    vi.mocked(booksApi.upload).mockResolvedValue(book as any);

    const { result } = renderHook(() => useBooks(), { wrapper });

    let returned: any;
    await act(async () => {
      returned = await result.current.uploadBook(new File(['pdf'], 'book.pdf'));
    });

    expect(booksApi.upload).toHaveBeenCalledTimes(1);
    expect(returned).toEqual(book);
  });

  it('uploadBooks marks file as success on upload', async () => {
    vi.mocked(booksApi.upload).mockResolvedValue({ id: '1' } as any);

    const { result } = renderHook(() => useBooks(), { wrapper });
    const files = [new File(['pdf'], 'a.pdf')];

    let results: any;
    await act(async () => {
      results = await result.current.uploadBooks(files);
    });

    expect(results[0].status).toBe('success');
  });

  it('uploadBooks marks file as skipped on 409 duplicate', async () => {
    const MockApiError = (await import('@/services/api')).ApiError;
    vi.mocked(booksApi.upload).mockRejectedValue(new MockApiError(409, 'Duplicate'));

    const { result } = renderHook(() => useBooks(), { wrapper });
    const files = [new File(['pdf'], 'dupe.pdf')];

    let results: any;
    await act(async () => {
      results = await result.current.uploadBooks(files);
    });

    expect(results[0].status).toBe('skipped');
    expect(results[0].error).toBe('Duplicate file');
  });

  it('uploadBooks marks file as failed on generic error', async () => {
    vi.mocked(booksApi.upload).mockRejectedValue(new Error('Server down'));

    const { result } = renderHook(() => useBooks(), { wrapper });
    const files = [new File(['pdf'], 'fail.pdf')];

    let results: any;
    await act(async () => {
      results = await result.current.uploadBooks(files);
    });

    expect(results[0].status).toBe('failed');
    expect(results[0].error).toBe('Server down');
  });

  it('uploadBooks processes multiple files sequentially', async () => {
    vi.mocked(booksApi.upload)
      .mockResolvedValueOnce({ id: '1' } as any)
      .mockResolvedValueOnce({ id: '2' } as any);

    const { result } = renderHook(() => useBooks(), { wrapper });
    const files = [new File(['pdf'], 'a.pdf'), new File(['pdf'], 'b.pdf')];

    let results: any;
    await act(async () => {
      results = await result.current.uploadBooks(files);
    });

    expect(results).toHaveLength(2);
    expect(results[0].status).toBe('success');
    expect(results[1].status).toBe('success');
  });

  it('updateBookStatus sets currentPage=pageCount when status=FINISHED', async () => {
    const book = { id: 'b1', pageCount: 300, status: 'READING' };
    vi.mocked(booksApi.getById).mockResolvedValue(book as any);
    vi.mocked(booksApi.update).mockResolvedValue({ ...book, status: 'FINISHED', currentPage: 300 } as any);

    const { result } = renderHook(() => useBooks(), { wrapper });

    let updated: any;
    await act(async () => {
      updated = await result.current.updateBookStatus('b1', 'FINISHED');
    });

    expect(booksApi.update).toHaveBeenCalledWith('b1', { status: 'FINISHED', currentPage: 300 });
  });

  it('updateBookStatus resets currentPage=0 when status=UNREAD', async () => {
    const book = { id: 'b2', pageCount: 200, status: 'READING' };
    vi.mocked(booksApi.getById).mockResolvedValue(book as any);
    vi.mocked(booksApi.update).mockResolvedValue({ ...book, status: 'UNREAD', currentPage: 0 } as any);

    const { result } = renderHook(() => useBooks(), { wrapper });

    await act(async () => {
      await result.current.updateBookStatus('b2', 'UNREAD');
    });

    expect(booksApi.update).toHaveBeenCalledWith('b2', { status: 'UNREAD', currentPage: 0 });
  });

  it('deleteBook calls booksApi.delete', async () => {
    vi.mocked(booksApi.delete).mockResolvedValue(undefined as any);

    const { result } = renderHook(() => useBooks(), { wrapper });

    await act(async () => {
      await result.current.deleteBook('delete-me');
    });

    expect(booksApi.delete).toHaveBeenCalledWith('delete-me');
  });
});
