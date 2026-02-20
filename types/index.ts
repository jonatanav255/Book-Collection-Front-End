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
export interface BooksListResponse {
  books: Book[];
}

export interface GoogleBooksCandidate {
  title: string;
  authors: string[];
  description?: string;
  categories?: string[];
  coverUrl?: string;
}

// Filter and Sort Types
export interface BookFilters {
  search?: string;
  status?: ReadingStatus;
  sortBy?: 'title' | 'dateAdded' | 'lastRead' | 'progress';
}

// PDF Rendering Types
export interface PDFPageInfo {
  pageNumber: number;
  totalPages: number;
  scale: number;
}

// Read Aloud Types
export interface ReadAloudState {
  isPlaying: boolean;
  currentPage: number;
  speed: number;
  voice?: SpeechSynthesisVoice;
}

export interface ReadAloudControls {
  play: () => void;
  pause: () => void;
  stop: () => void;
  setSpeed: (speed: number) => void;
  setVoice: (voice: SpeechSynthesisVoice) => void;
}

// Export/Import Types
export interface LibraryExport {
  books: Book[];
  notes: Note[];
  preferences: Preferences;
  exportDate: string;
}
