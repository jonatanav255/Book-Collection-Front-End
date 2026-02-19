# BookShelf Frontend

A modern, feature-rich Next.js frontend for the BookShelf application - your personal digital library for managing and reading PDF books.

## Features

### 📚 Library Management
- Visual book grid with covers and thumbnails
- Upload PDFs via file picker or drag-and-drop
- Search books by title or author
- Sort by title, date added, last read, or progress
- Filter by reading status (Unread, Reading, Finished)
- Continue Reading widget for quick access
- Book completion tracking
- Delete books with confirmation

### 📖 PDF Reader
- High-quality PDF rendering with pdf.js
- Zoom in/out controls
- Fullscreen mode
- Page navigation (buttons, input, keyboard shortcuts)
- Auto-bookmark - resume where you left off
- Keyboard shortcuts (Arrow keys for navigation, Escape to exit fullscreen)

### 🎨 Themes & Customization
- 5 beautiful theme presets:
  - Light mode
  - Dark mode
  - Sepia mode
  - Forest mode
  - Ocean mode
- Font size control (S/M/L/XL)
- Font family selection
- Preferences sync across all books

### 🔊 Read Aloud
- Browser-native Text-to-Speech
- Play/Pause/Stop controls
- Adjustable playback speed (0.5x - 2x)
- Voice selection
- Auto-advance to next page
- Visual playback indicator

### 📝 Notes
- Create notes tied to specific pages
- Color-coded categories (Idea, Question, Summary, Quote)
- Pin important notes
- Markdown support
- Edit and delete notes
- Sort by page or date
- Export all notes as Markdown file

### 🎯 User Experience
- Responsive design (desktop & tablet)
- Dark mode support
- Toast notifications
- Loading states and skeletons
- Error handling with user-friendly messages
- Confirmation dialogs for destructive actions

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **PDF Rendering**: pdf.js
- **Icons**: Lucide React
- **State Management**: React Hooks
- **Read Aloud**: Web SpeechSynthesis API

## Project Structure

```
bookshelf-frontend/
├── app/                      # Next.js App Router pages
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Library page (home)
│   ├── globals.css          # Global styles and theme CSS
│   └── reader/[id]/
│       └── page.tsx         # PDF reader page
├── components/
│   ├── common/              # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   ├── Loading.tsx
│   │   └── ConfirmDialog.tsx
│   ├── library/             # Library page components
│   │   ├── BookCard.tsx
│   │   ├── SearchBar.tsx
│   │   ├── FilterBar.tsx
│   │   ├── UploadButton.tsx
│   │   └── ContinueReading.tsx
│   ├── reader/              # PDF reader components
│   │   ├── PDFViewer.tsx
│   │   └── ReaderControls.tsx
│   ├── notes/               # Notes components
│   │   ├── NoteCard.tsx
│   │   ├── NoteEditor.tsx
│   │   └── NotesPanel.tsx
│   ├── readaloud/           # Read aloud components
│   │   └── ReadAloudControls.tsx
│   └── theme/               # Theme components
│       ├── ThemeProvider.tsx
│       └── ThemeSelector.tsx
├── hooks/                   # Custom React hooks
│   ├── useBooks.ts
│   ├── useNotes.ts
│   ├── usePreferences.ts
│   ├── useProgress.ts
│   └── useReadAloud.ts
├── services/                # API service layer
│   └── api.ts
├── types/                   # TypeScript type definitions
│   └── index.ts
├── utils/                   # Utility functions
│   └── date.ts
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Backend API running (see backend repository)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd bookshelf-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file (copy from `.env.example`):
```bash
cp .env.example .env.local
```

4. Update the API URL in `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API base URL (default: `http://localhost:8080`)

## API Integration

The frontend communicates with the Spring Boot backend via REST APIs:

- **Books**: Upload, list, get, update, delete
- **Progress**: Track reading progress per book
- **Notes**: CRUD operations for notes
- **Preferences**: User theme and reading preferences
- **Export/Import**: Backup and restore library data

See `services/api.ts` for complete API documentation.

## Keyboard Shortcuts

### Reader Page
- `←` - Previous page
- `→` - Next page
- `Esc` - Exit fullscreen mode

## Browser Compatibility

- **PDF Rendering**: Modern browsers with Canvas API support
- **Read Aloud**: Browsers with Web SpeechSynthesis API
  - Chrome/Edge: Full support
  - Firefox: Full support
  - Safari: Limited voice selection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the BookShelf application suite.

## Support

For issues, feature requests, or questions, please open an issue in the GitHub repository.