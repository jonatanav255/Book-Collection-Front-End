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
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

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

    const url = `${API_URL}/api/books${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await fetch(url);
    return handleResponse<Book[]>(response);
  },

  async getById(id: string): Promise<Book> {
    const response = await fetch(`${API_URL}/api/books/${id}`);
    return handleResponse<Book>(response);
  },

  async upload(file: File): Promise<Book> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/api/books`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<Book>(response);
  },

  async update(id: string, data: Partial<Book>): Promise<Book> {
    const response = await fetch(`${API_URL}/api/books/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Book>(response);
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/books/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(response);
  },

  getPdfUrl(id: string): string {
    return `${API_URL}/api/books/${id}/pdf`;
  },

  getThumbnailUrl(id: string): string {
    return `${API_URL}/api/books/${id}/thumbnail`;
  },
};

// Progress API
export const progressApi = {
  async get(bookId: string): Promise<BookProgress> {
    const response = await fetch(`${API_URL}/api/books/${bookId}/progress`);
    return handleResponse<BookProgress>(response);
  },

  async update(bookId: string, progress: Partial<BookProgress>): Promise<BookProgress> {
    const response = await fetch(`${API_URL}/api/books/${bookId}/progress`, {
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
    const response = await fetch(`${API_URL}/api/books/${bookId}/notes${queryParams}`);
    return handleResponse<Note[]>(response);
  },

  async create(bookId: string, note: CreateNoteRequest): Promise<Note> {
    const response = await fetch(`${API_URL}/api/books/${bookId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note),
    });
    return handleResponse<Note>(response);
  },

  async update(noteId: string, updates: UpdateNoteRequest): Promise<Note> {
    const response = await fetch(`${API_URL}/api/notes/${noteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return handleResponse<Note>(response);
  },

  async delete(noteId: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/notes/${noteId}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(response);
  },

  async export(bookId: string): Promise<Blob> {
    const response = await fetch(`${API_URL}/api/books/${bookId}/notes/export`);
    if (!response.ok) {
      throw new ApiError(response.status, 'Failed to export notes');
    }
    return response.blob();
  },
};

// Preferences API
export const preferencesApi = {
  async get(): Promise<Preferences> {
    const response = await fetch(`${API_URL}/api/preferences`);
    return handleResponse<Preferences>(response);
  },

  async update(preferences: UpdatePreferencesRequest): Promise<Preferences> {
    const response = await fetch(`${API_URL}/api/preferences`, {
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

    const response = await fetch(`${API_URL}/api/books/lookup?${queryParams}`);
    return handleResponse<GoogleBooksCandidate[]>(response);
  },
};

// Export/Import API
export const libraryApi = {
  async export(): Promise<Blob> {
    const response = await fetch(`${API_URL}/api/export`);
    if (!response.ok) {
      throw new ApiError(response.status, 'Failed to export library');
    }
    return response.blob();
  },

  async import(data: LibraryExport): Promise<void> {
    const response = await fetch(`${API_URL}/api/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<void>(response);
  },
};

export { ApiError };
