import { describe, it, expect, vi, beforeEach } from 'vitest';
import { booksApi, notesApi, progressApi, audioApi, ApiError } from '@/services/api';

// Polyfill global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

function makeResponse(status: number, body: unknown, ok = status < 400) {
  return {
    ok,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
    blob: () => Promise.resolve(new Blob([JSON.stringify(body)])),
  } as Response;
}

describe('ApiError', () => {
  it('has correct status and message', () => {
    const err = new ApiError(404, 'Not found');
    expect(err.status).toBe(404);
    expect(err.message).toBe('Not found');
    expect(err.name).toBe('ApiError');
  });
});

describe('booksApi', () => {
  beforeEach(() => mockFetch.mockReset());

  it('getById fetches correct URL', async () => {
    mockFetch.mockResolvedValue(makeResponse(200, { id: '1', title: 'Book' }));

    const result = await booksApi.getById('1');

    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/books/1'));
    expect(result).toMatchObject({ id: '1', title: 'Book' });
  });

  it('getById throws ApiError on 404', async () => {
    mockFetch.mockResolvedValue(makeResponse(404, 'Not found', false));

    await expect(booksApi.getById('missing')).rejects.toBeInstanceOf(ApiError);
  });

  it('delete sends DELETE method', async () => {
    mockFetch.mockResolvedValue(makeResponse(204, null));

    await booksApi.delete('book-1');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/books/book-1'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('getPdfUrl returns correct URL without fetch', () => {
    const url = booksApi.getPdfUrl('abc');
    expect(url).toContain('/books/abc/pdf');
  });

  it('getThumbnailUrl returns correct URL without fetch', () => {
    const url = booksApi.getThumbnailUrl('xyz');
    expect(url).toContain('/books/xyz/thumbnail');
  });

  it('throws ApiError on 500 server error', async () => {
    mockFetch.mockResolvedValue(makeResponse(500, 'Internal Server Error', false));

    await expect(booksApi.getById('any')).rejects.toMatchObject({ status: 500 });
  });
});

describe('progressApi', () => {
  beforeEach(() => mockFetch.mockReset());

  it('update sends PUT with JSON body', async () => {
    mockFetch.mockResolvedValue(makeResponse(200, { currentPage: 30 }));

    await progressApi.update('book-1', { currentPage: 30 });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/books/book-1/progress'),
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ currentPage: 30 }),
      })
    );
  });
});

describe('audioApi', () => {
  beforeEach(() => mockFetch.mockReset());

  it('getPageAudioUrl returns correct URL without fetch', () => {
    const url = audioApi.getPageAudioUrl('book-1', 5);
    expect(url).toContain('/books/book-1/pages/5/audio');
  });

  it('startBatchGeneration includes page range params when provided', async () => {
    mockFetch.mockResolvedValue(makeResponse(200, { message: 'started' }));

    await audioApi.startBatchGeneration('book-1', 1, 50);

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('startPage=1');
    expect(calledUrl).toContain('endPage=50');
  });
});
