import type {
  Book,
  BookProgress,
  Note,
  CreateNoteRequest,
  UpdateNoteRequest,
  Preferences,
  UpdatePreferencesRequest,
  GoogleBooksCandidate,
  LibraryExport,
  PaginatedResponse,
} from '@/types';

// Base URL should be http://localhost:8080/api (the /api prefix is included)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(response.status, errorText || response.statusText);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Books API
export const booksApi = {
  async list(params?: {
    search?: string;
    sortBy?: string;
    status?: string;
  }): Promise<Book[]> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.status) queryParams.append('status', params.status);

    const url = `${API_URL}/books${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await fetch(url);
    return handleResponse<Book[]>(response);
  },

  async listPaged(params: {
    page: number;
    size: number;
    search?: string;
    sortBy?: string;
    status?: string;
  }): Promise<PaginatedResponse<Book>> {
    const queryParams = new URLSearchParams();
    queryParams.append('page', params.page.toString());
    queryParams.append('size', params.size.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.status) queryParams.append('status', params.status);

    const response = await fetch(`${API_URL}/books?${queryParams}`);
    return handleResponse<PaginatedResponse<Book>>(response);
  },

  async getById(id: string): Promise<Book> {
    const response = await fetch(`${API_URL}/books/${id}`);
    return handleResponse<Book>(response);
  },

  async getFeatured(limit: number = 6): Promise<Book[]> {
    const response = await fetch(`${API_URL}/books/featured?limit=${limit}`);
    return handleResponse<Book[]>(response);
  },

  async upload(file: File): Promise<Book> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/books`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<Book>(response);
  },

  async update(id: string, data: Partial<Book>): Promise<Book> {
    const response = await fetch(`${API_URL}/books/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Book>(response);
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/books/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(response);
  },

  getPdfUrl(id: string): string {
    return `${API_URL}/books/${id}/pdf`;
  },

  getThumbnailUrl(id: string): string {
    return `${API_URL}/books/${id}/thumbnail`;
  },
};

// Progress API
export const progressApi = {
  async get(bookId: string): Promise<BookProgress> {
    const response = await fetch(`${API_URL}/books/${bookId}/progress`);
    return handleResponse<BookProgress>(response);
  },

  async update(bookId: string, progress: Partial<BookProgress>): Promise<BookProgress> {
    const response = await fetch(`${API_URL}/books/${bookId}/progress`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(progress),
    });
    return handleResponse<BookProgress>(response);
  },
};

// Notes API
export const notesApi = {
  async list(bookId: string, sortBy?: 'page' | 'date'): Promise<Note[]> {
    const queryParams = sortBy ? `?sortBy=${sortBy}` : '';
    const response = await fetch(`${API_URL}/books/${bookId}/notes${queryParams}`);
    return handleResponse<Note[]>(response);
  },

  async create(bookId: string, note: CreateNoteRequest): Promise<Note> {
    const response = await fetch(`${API_URL}/books/${bookId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note),
    });
    return handleResponse<Note>(response);
  },

  async update(noteId: string, updates: UpdateNoteRequest): Promise<Note> {
    const response = await fetch(`${API_URL}/notes/${noteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return handleResponse<Note>(response);
  },

  async delete(noteId: string): Promise<void> {
    const response = await fetch(`${API_URL}/notes/${noteId}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(response);
  },

  async export(bookId: string): Promise<Blob> {
    const response = await fetch(`${API_URL}/books/${bookId}/notes/export`);
    if (!response.ok) {
      throw new ApiError(response.status, 'Failed to export notes');
    }
    return response.blob();
  },
};

// Preferences API
export const preferencesApi = {
  async get(): Promise<Preferences> {
    const response = await fetch(`${API_URL}/preferences`);
    return handleResponse<Preferences>(response);
  },

  async update(preferences: UpdatePreferencesRequest): Promise<Preferences> {
    const response = await fetch(`${API_URL}/preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferences),
    });
    return handleResponse<Preferences>(response);
  },
};

// Google Books Lookup API
export const googleBooksApi = {
  async lookup(title?: string, author?: string): Promise<GoogleBooksCandidate[]> {
    const queryParams = new URLSearchParams();
    if (title) queryParams.append('title', title);
    if (author) queryParams.append('author', author);

    const response = await fetch(`${API_URL}/books/lookup?${queryParams}`);
    return handleResponse<GoogleBooksCandidate[]>(response);
  },
};

// Export/Import API
export const libraryApi = {
  async export(): Promise<Blob> {
    const response = await fetch(`${API_URL}/export`);
    if (!response.ok) {
      throw new ApiError(response.status, 'Failed to export library');
    }
    return response.blob();
  },

  async import(data: LibraryExport): Promise<void> {
    const response = await fetch(`${API_URL}/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<void>(response);
  },
};

// Audio API (Google Cloud Text-to-Speech)
export const audioApi = {
  /**
   * Get audio for a specific book page (MP3 format)
   * Uses cache-first strategy - generates audio if not cached
   * @param bookId - Book UUID
   * @param pageNumber - Page number (1-indexed)
   * @returns MP3 audio blob
   */
  async getPageAudio(bookId: string, pageNumber: number): Promise<Blob> {
    const response = await fetch(`${API_URL}/books/${bookId}/pages/${pageNumber}/audio`);
    if (!response.ok) {
      throw new ApiError(response.status, 'Failed to get audio');
    }
    return response.blob();
  },

  /**
   * Get audio URL for HTML5 audio player
   * @param bookId - Book UUID
   * @param pageNumber - Page number (1-indexed)
   * @returns Audio URL
   */
  getPageAudioUrl(bookId: string, pageNumber: number): string {
    return `${API_URL}/books/${bookId}/pages/${pageNumber}/audio`;
  },

  /**
   * Check if audio is cached for a specific page
   * @param bookId - Book UUID
   * @param pageNumber - Page number (1-indexed)
   * @returns Cache status
   */
  async checkAudioStatus(bookId: string, pageNumber: number): Promise<{ bookId: string; pageNumber: number; cached: boolean }> {
    const response = await fetch(`${API_URL}/books/${bookId}/pages/${pageNumber}/audio/status`);
    return handleResponse(response);
  },

  /**
   * Delete all cached audio files for a book
   * @param bookId - Book UUID
   */
  async deleteBookAudio(bookId: string): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/books/${bookId}/audio`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  /**
   * Start batch audio generation for all pages or a page range
   * @param bookId - Book UUID
   * @param startPage - Optional start page (1-indexed)
   * @param endPage - Optional end page (1-indexed)
   */
  async startBatchGeneration(
    bookId: string,
    startPage?: number,
    endPage?: number
  ): Promise<{ message: string }> {
    let url = `${API_URL}/books/${bookId}/audio/generate-all`;

    const params = new URLSearchParams();
    if (startPage !== undefined && startPage > 0) {
      params.append('startPage', startPage.toString());
    }
    if (endPage !== undefined && endPage > 0) {
      params.append('endPage', endPage.toString());
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      method: 'POST',
    });
    return handleResponse(response);
  },

  /**
   * Get batch generation status
   * @param bookId - Book UUID
   */
  async getBatchGenerationStatus(bookId: string): Promise<{
    status: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    currentPage: number;
    totalPages: number;
    progressPercentage: number;
    errorMessage?: string;
  }> {
    const response = await fetch(`${API_URL}/books/${bookId}/audio/generation-status`);
    return handleResponse(response);
  },

  /**
   * Cancel batch audio generation
   * @param bookId - Book UUID
   */
  async cancelBatchGeneration(bookId: string): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/books/${bookId}/audio/generation`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  /**
   * Get page text with word-level timings for read-along
   * @param bookId - Book UUID
   * @param pageNumber - Page number (1-indexed)
   */
  async getPageTextWithTimings(bookId: string, pageNumber: number): Promise<{
    text: string;
    audioUrl: string;
    wordTimings: Array<{
      word: string;
      startTime: number;
      endTime: number;
    }>;
  }> {
    const response = await fetch(`${API_URL}/books/${bookId}/pages/${pageNumber}/text-with-timings`);
    return handleResponse(response);
  },
};

export { ApiError };
