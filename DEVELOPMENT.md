# BookShelf - Development Documentation

## Project Overview

BookShelf is a full-featured PDF reader and library management application built with Next.js 15 and TypeScript. It provides a modern reading experience with features like text-to-speech, note-taking, progress tracking, and reading timers.

## Tech Stack

- **Framework**: Next.js 15.5.12 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.4.1
- **PDF Rendering**: PDF.js (pdfjs-dist 4.9.155)
- **Icons**: Lucide React 0.468.0
- **State Management**: React Hooks (useState, useEffect, useContext)

## Project Structure

```
Book-Collection-Front-End/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Home page with featured books
│   ├── library/                  # All books library page
│   │   └── page.tsx
│   ├── reader/[id]/              # PDF reader page
│   │   └── page.tsx
│   └── globals.css               # Global styles
│
├── components/                   # React components
│   ├── audio/                    # Audio generation components
│   │   └── BatchAudioGenerator.tsx
│   ├── common/                   # Reusable UI components
│   │   ├── Loading.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   └── ConfirmDialog.tsx
│   ├── library/                  # Library management components
│   │   ├── BookCard.tsx          # Individual book display
│   │   ├── FeaturedBooks.tsx     # Featured books carousel
│   │   ├── SearchBar.tsx
│   │   ├── FilterBar.tsx
│   │   └── UploadButton.tsx
│   ├── notes/                    # Note-taking components
│   │   └── NotesPanel.tsx
│   ├── reader/                   # PDF reader components
│   │   ├── PDFViewer.tsx         # Core PDF rendering (PDF.js)
│   │   ├── ReaderControls.tsx    # Reader toolbar
│   │   └── Timer.tsx             # Reading timer (countdown/countup/Pomodoro)
│   ├── readaloud/                # Text-to-speech components
│   │   └── ReadAloudControls.tsx
│   └── theme/                    # Theme management
│       └── ThemeSelector.tsx
│
├── hooks/                        # Custom React hooks
│   ├── useBooks.ts               # Book CRUD operations
│   ├── useProgress.ts            # Reading progress tracking
│   ├── useNotes.ts               # Notes management
│   ├── useAudioPlayer.ts         # Audio playback
│   ├── usePreferences.ts         # User preferences
│   └── useReadAlong.ts           # Read-along functionality
│
├── services/                     # API services
│   └── api.ts                    # Backend API client
│
├── types/                        # TypeScript type definitions
│   └── index.ts
│
└── utils/                        # Utility functions
    └── date.ts
```

## Key Components

### 1. PDFViewer (`components/reader/PDFViewer.tsx`)

The core PDF rendering component using PDF.js.

**Features:**
- High-quality canvas rendering with device pixel ratio support
- Transparent text layer for native browser text selection
- Dark mode support via CSS filters
- Zoom support (50% - 300%)
- Page navigation with render task cancellation

**How it works:**
1. Loads PDF document using PDF.js `getDocument()`
2. Renders each page to a canvas element
3. Creates a transparent text layer overlay for text selection
4. Text items are positioned absolutely to match PDF layout

**Key code:**
```typescript
// Canvas rendering
const renderContext = {
  canvasContext: context,
  viewport: viewport,
};
renderTaskRef.current = page.render(renderContext);

// Text layer creation
textContent.items.forEach((item) => {
  const textDiv = document.createElement('span');
  // Position absolutely to match PDF layout
  textDiv.style.position = 'absolute';
  textDiv.style.left = `${tx[4]}px`;
  textDiv.style.top = `${tx[5] - fontSize}px`;
  textLayerDiv.appendChild(textDiv);
});
```

### 2. Timer Component (`components/reader/Timer.tsx`)

Reading timer with three modes for focused reading sessions.

**Modes:**
1. **Countdown**: Set a specific reading duration (e.g., 25 minutes)
2. **Count-up**: Track total reading time from zero
3. **Pomodoro**: Use the Pomodoro Technique (25min work, 5min break, long break after 4 sessions)

**Features:**
- Browser notifications on timer completion
- Audio alerts
- Progress bars for countdown/Pomodoro
- Session tracking for Pomodoro
- Customizable durations

**Pomodoro Implementation:**
```typescript
// After work session completes
if (newSessionCount % pomodoroSettings.sessionsUntilLongBreak === 0) {
  setPomodoroPhase('longBreak');  // Long break after 4 sessions
} else {
  setPomodoroPhase('shortBreak');  // Short break otherwise
}
```

### 3. FeaturedBooks Component (`components/library/FeaturedBooks.tsx`)

Displays recently read books in a responsive carousel on the homepage.

**Features:**
- Fetches 5-6 most recently read books from backend
- Progress indicators on book covers
- Hover effects with scale animation
- Responsive grid (2 cols mobile → 6 cols desktop)
- "View All" link to full library

### 4. API Service (`services/api.ts`)

Centralized API client for all backend communication.

**Modules:**
- `booksApi`: Book CRUD, upload, PDF/thumbnail URLs
- `progressApi`: Reading progress tracking
- `notesApi`: Note CRUD and export
- `audioApi`: Text-to-speech audio generation
- `preferencesApi`: User preferences
- `googleBooksApi`: Book metadata lookup
- `libraryApi`: Export/import library data

**Example:**
```typescript
// Fetch featured books
const featuredBooks = await booksApi.getFeatured(6);

// Get PDF URL for viewer
const pdfUrl = booksApi.getPdfUrl(bookId);

// Update reading progress
await progressApi.update(bookId, { currentPage: 42 });
```

## Custom Hooks

### `useBooks()`
Manages book collection with CRUD operations.

**Returns:**
- `books`: Array of all books
- `loading`: Loading state
- `uploadBook()`: Upload new PDF
- `deleteBook()`: Delete book
- `refreshBooks()`: Reload book list

### `useProgress(bookId)`
Tracks reading progress for a specific book.

**Returns:**
- `progress`: Current progress (page, percentage, lastReadAt)
- `setCurrentPage()`: Update current page
- `loading`: Loading state

### `useNotes(bookId)`
Manages notes for a book.

**Returns:**
- `notes`: Array of notes for book
- `createNote()`: Create new note
- `updateNote()`: Update existing note
- `deleteNote()`: Delete note
- `exportNotes()`: Export notes as PDF

### `useAudioPlayer(options)`
Handles text-to-speech audio playback.

**Features:**
- Automatic page audio generation
- Play/pause/stop controls
- Auto-advance to next page on completion
- Cache status checking
- Error handling

## Styling

### Theme System

The app supports three theme modes:
- **Light Mode**: Traditional light theme
- **Dark Mode**: Dark background with light text
- **Reading Mode**: Sepia/cream background for comfortable reading

Themes are managed via CSS custom properties in `app/globals.css`:

```css
[data-theme="light"] { ... }
[data-theme="dark"] { ... }
[data-theme="reading"] { ... }
```

### PDF Text Selection

Custom text selection styles in `app/globals.css`:

```css
.pdf-text-layer > span {
  color: transparent;  /* Make text invisible */
  white-space: pre;    /* Preserve spaces */
  cursor: text;
}

.pdf-text-layer ::selection {
  background: #00A3FF;  /* Blue highlight */
  color: #FFFFFF;       /* White text when selected */
}
```

## Backend API Integration

Base URL: `http://localhost:8080/api`

### Endpoints

**Books:**
- `GET /books` - List all books
- `GET /books/featured?limit=6` - Get recently read books
- `GET /books/:id` - Get book details
- `POST /books` - Upload PDF (multipart/form-data)
- `PUT /books/:id` - Update book metadata
- `DELETE /books/:id` - Delete book
- `GET /books/:id/pdf` - Get PDF file
- `GET /books/:id/thumbnail` - Get cover thumbnail

**Progress:**
- `GET /books/:id/progress` - Get reading progress
- `PUT /books/:id/progress` - Update progress

**Notes:**
- `GET /books/:id/notes` - List notes
- `POST /books/:id/notes` - Create note
- `PUT /notes/:id` - Update note
- `DELETE /notes/:id` - Delete note
- `GET /books/:id/notes/export` - Export as PDF

**Audio (Text-to-Speech):**
- `GET /books/:id/pages/:pageNum/audio` - Get page audio
- `POST /books/:id/audio/generate-all` - Batch generate
- `GET /books/:id/audio/generation-status` - Check status
- `DELETE /books/:id/audio/generation` - Cancel batch

## Development Workflow

### Running the App

```bash
# Install dependencies
npm install

# Start development server
npm run dev
# Server runs on http://localhost:3000 (or 3001 if 3000 is in use)

# Build for production
npm run build

# Run production build
npm start
```

### Environment Variables

Create `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

### Code Structure Guidelines

1. **Components**: One component per file, use PascalCase naming
2. **Hooks**: Prefix with `use`, place in `/hooks` directory
3. **Types**: Define in `/types/index.ts`
4. **API Calls**: Use services in `/services/api.ts`, never fetch directly
5. **Comments**: Add JSDoc comments for complex functions
6. **Error Handling**: Always use try-catch with proper error messages

### Best Practices

1. **State Management**:
   - Use `useState` for local component state
   - Use custom hooks for shared logic
   - Keep state as close to where it's used as possible

2. **Effects**:
   - Always include dependency arrays
   - Clean up subscriptions/intervals in return function
   - Use refs for values that shouldn't trigger re-renders

3. **Performance**:
   - Use `useCallback` for functions passed to children
   - Use `useMemo` for expensive computations
   - Cancel ongoing async operations on unmount

4. **Accessibility**:
   - Use semantic HTML elements
   - Include ARIA labels for icon buttons
   - Ensure keyboard navigation works

## Common Development Tasks

### Adding a New API Endpoint

1. Add type definition in `/types/index.ts`
2. Add API function in `/services/api.ts`
3. Create custom hook in `/hooks` if needed
4. Use in component

Example:
```typescript
// 1. types/index.ts
export interface BookStats {
  totalBooks: number;
  booksRead: number;
  // ...
}

// 2. services/api.ts
export const booksApi = {
  async getStats(): Promise<BookStats> {
    const response = await fetch(`${API_URL}/books/stats`);
    return handleResponse<BookStats>(response);
  },
};

// 3. hooks/useBookStats.ts
export function useBookStats() {
  const [stats, setStats] = useState<BookStats | null>(null);

  useEffect(() => {
    booksApi.getStats().then(setStats);
  }, []);

  return { stats };
}

// 4. Component usage
const { stats } = useBookStats();
```

### Adding a New Reader Feature

1. Create component in `/components/reader/`
2. Add control button to `ReaderControls.tsx`
3. Add state and handler in `app/reader/[id]/page.tsx`
4. Wire up props

### Debugging Tips

1. **PDF not rendering**: Check browser console for PDF.js errors
2. **API errors**: Check Network tab, verify backend is running
3. **State not updating**: Verify dependency arrays in useEffect
4. **Performance issues**: Use React DevTools Profiler

## Testing

```bash
# Run linter
npm run lint

# Type checking
npx tsc --noEmit
```

## Common Issues & Solutions

### Issue: Port already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Issue: PDF Worker not found
Ensure `public/pdf.worker.min.mjs` exists

### Issue: Text selection not working
Check CSS in `app/globals.css` for `.pdf-text-layer` styles

### Issue: Dark mode not applying to PDF
Verify CSS custom property `--pdf-filter` is set in theme

## Future Enhancements

Potential features to add:
- [ ] Annotations and highlights
- [ ] Multiple reading lists/collections
- [ ] Cloud sync
- [ ] Mobile app
- [ ] Collaborative reading
- [ ] Book recommendations
- [ ] Reading statistics dashboard
- [ ] Export annotations
- [ ] Night light mode (blue light filter)
- [ ] Speed reading mode
