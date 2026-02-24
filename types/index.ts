// Book Types
export enum ReadingStatus {
  UNREAD = 'UNREAD',
  READING = 'READING',
  FINISHED = 'FINISHED',
}

export interface Book {
  id: string;
  title: string;
  author: string;
  description?: string;
  genre?: string;
  pageCount: number;
  currentPage: number;
  status: ReadingStatus;
  pdfPath: string;
  thumbnailPath?: string;
  coverUrl?: string;
  fileHash: string;
  dateAdded: string;
  lastReadAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookProgress {
  currentPage: number;
  status: ReadingStatus;
  lastReadAt?: string;
}

// Note Types
export enum NoteColor {
  IDEA = 'idea',
  QUESTION = 'question',
  SUMMARY = 'summary',
  QUOTE = 'quote',
}

export interface Note {
  id: string;
  bookId: string;
  pageNumber: number;
  content: string;
  color: NoteColor;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteRequest {
  pageNumber: number;
  content: string;
  color: NoteColor;
  pinned?: boolean;
}

export interface UpdateNoteRequest {
  content?: string;
  color?: NoteColor;
  pinned?: boolean;
}

// Preferences Types
export enum ThemePreset {
  LIGHT = 'light',
  DARK = 'dark',
}

export enum FontSize {
  SM = 'sm',
  MD = 'md',
  LG = 'lg',
  XL = 'xl',
}

export interface Preferences {
  id: string;
  theme: ThemePreset;
  fontFamily: string;
  fontSize: FontSize;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePreferencesRequest {
  theme?: ThemePreset;
  fontFamily?: string;
  fontSize?: FontSize;
}

// API Response Types
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  last: boolean;
}

// Batch Upload Types
export type BatchUploadFileStatus = 'pending' | 'uploading' | 'success' | 'skipped' | 'failed';

export interface BatchUploadFileResult {
  file: File;
  status: BatchUploadFileStatus;
  error?: string;
}

