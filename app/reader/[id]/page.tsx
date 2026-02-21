'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useBook } from '@/hooks/useBooks';
import { useProgress } from '@/hooks/useProgress';
import { useNotes } from '@/hooks/useNotes';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useBookSearch } from '@/hooks/useBookSearch';
import { useToast } from '@/components/common/Toast';
import { PDFViewer } from '@/components/reader/PDFViewer';
import { ReaderControls } from '@/components/reader/ReaderControls';
import { NotesPanel } from '@/components/notes/NotesPanel';
import { ReadAloudControls } from '@/components/readaloud/ReadAloudControls';
import { SearchBar } from '@/components/reader/SearchBar';
import { ThemeSelector } from '@/components/theme/ThemeSelector';
import { BatchAudioGenerator } from '@/components/audio/BatchAudioGenerator';
import { Modal } from '@/components/common/Modal';
import { Loading } from '@/components/common/Loading';
import { booksApi } from '@/services/api';
import { CreateNoteRequest } from '@/types';
import * as pdfjs from 'pdfjs-dist';

export default function ReaderPage() {
  const params = useParams();
  const bookId = params.id as string;

  const { book, loading: bookLoading } = useBook(bookId);
  const { progress, setCurrentPage } = useProgress(bookId);
  const {
    notes,
    createNote,
    updateNote,
    deleteNote,
    exportNotes,
  } = useNotes(bookId);

  const [currentPage, setCurrentPageState] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showReadAloud, setShowReadAloud] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy | null>(null);

  const { showToast } = useToast();

  // Handle page change
  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPageState(page);
      setCurrentPage(page);
      // Note: Audio player automatically handles loading new page audio via useEffect
    },
    [setCurrentPage]
  );

  // Book search functionality
  const {
    currentMatchIndex,
    totalMatches,
    nextMatch,
    previousMatch,
  } = useBookSearch({
    pdfDoc,
    searchText,
    currentPage,
    onPageChange: handlePageChange,
  });

  // Load PDF document for search
  useEffect(() => {
    if (!book) return;

    let isMounted = true;
    const pdfUrl = booksApi.getPdfUrl(bookId);

    const loadPdf = async () => {
      try {
        const loadingTask = pdfjs.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        if (isMounted) {
          setPdfDoc(pdf);
        }
      } catch (error) {
        console.error('Failed to load PDF for search:', error);
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
    };
  }, [book, bookId]);

  // Audio player
  const {
    isPlaying,
    isPaused,
    isLoading: audioLoading,
    isCached,
    error: audioError,
    togglePlayPause,
    stop,
    audioElement,
  } = useAudioPlayer({
    bookId,
    currentPage,
    enabled: showReadAloud,
    onPageComplete: () => {
      if (currentPage < totalPages) {
        handlePageChange(currentPage + 1);
      } else {
        stop();
        showToast('Finished reading the book!', 'success');
      }
    },
    onError: (error) => {
      showToast(error.message || 'Failed to play audio', 'error');
    },
  });

  // Initialize current page from progress (only once on mount)
  const initializedRef = useRef(false);
  useEffect(() => {
    if (progress && !initializedRef.current) {
      setCurrentPageState(progress.currentPage || 1);
      initializedRef.current = true;
    }
  }, [progress]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere with input fields (unless it's Cmd/Ctrl+F)
      const isInputField = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;

      // Handle Cmd/Ctrl+F for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setShowSearch(true);
        return;
      }

      if (isInputField) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          if (currentPage > 1) handlePageChange(currentPage - 1);
          break;
        case 'ArrowRight':
          if (currentPage < totalPages) handlePageChange(currentPage + 1);
          break;
        case 'Escape':
          if (isFullscreen) {
            document.exitFullscreen?.();
            setIsFullscreen(false);
          } else if (showSearch) {
            setShowSearch(false);
            setSearchText('');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, isFullscreen, showSearch, handlePageChange]);

  // Fullscreen handling
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Read aloud handling
  const handleToggleReadAloud = () => {
    setShowReadAloud(!showReadAloud);
  };

  const handleCreateNote = async (note: CreateNoteRequest) => {
    try {
      await createNote(note);
      showToast('Note created successfully', 'success');
    } catch (err) {
      showToast('Failed to create note', 'error');
    }
  };

  const handleUpdateNote = async (id: string, updates: any) => {
    try {
      await updateNote(id, updates);
      showToast('Note updated successfully', 'success');
    } catch (err) {
      showToast('Failed to update note', 'error');
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await deleteNote(id);
      showToast('Note deleted successfully', 'success');
    } catch (err) {
      showToast('Failed to delete note', 'error');
    }
  };

  const handleExportNotes = async () => {
    try {
      await exportNotes();
      showToast('Notes exported successfully', 'success');
    } catch (err) {
      showToast('Failed to export notes', 'error');
    }
  };

  if (bookLoading || !book) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loading size="lg" text="Loading book..." />
      </div>
    );
  }

  const pdfUrl = booksApi.getPdfUrl(bookId);

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
      {/* Controls */}
      <ReaderControls
        currentPage={currentPage}
        totalPages={totalPages}
        scale={scale}
        onPageChange={handlePageChange}
        onScaleChange={setScale}
        onToggleFullscreen={toggleFullscreen}
        onToggleNotes={() => setShowNotes(!showNotes)}
        onToggleReadAloud={handleToggleReadAloud}
        onToggleSettings={() => setShowSettings(!showSettings)}
        onToggleSearch={() => setShowSearch(!showSearch)}
        isFullscreen={isFullscreen}
      />

      {/* PDF Viewer */}
      <div className="flex-1 overflow-hidden relative">
        <PDFViewer
          pdfUrl={pdfUrl}
          pageNumber={currentPage}
          scale={scale}
          onPageChange={handlePageChange}
          onTotalPagesLoad={setTotalPages}
          searchText={searchText}
          currentSearchIndex={currentMatchIndex}
        />

        {/* Search Bar */}
        <SearchBar
          searchText={searchText}
          onSearchChange={setSearchText}
          currentIndex={currentMatchIndex}
          totalResults={totalMatches}
          onNext={nextMatch}
          onPrevious={previousMatch}
          onClose={() => {
            setShowSearch(false);
            setSearchText('');
          }}
          isOpen={showSearch}
        />

        {/* Read Aloud Controls Overlay */}
        {showReadAloud && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-full max-w-2xl px-4">
            <ReadAloudControls
              isPlaying={isPlaying}
              isPaused={isPaused}
              isLoading={audioLoading}
              isCached={isCached}
              error={audioError}
              onTogglePlayPause={togglePlayPause}
              onStop={stop}
            />
          </div>
        )}
      </div>

      {/* Notes Panel */}
      <NotesPanel
        isOpen={showNotes}
        onClose={() => setShowNotes(false)}
        notes={notes}
        currentPage={currentPage}
        onCreateNote={handleCreateNote}
        onUpdateNote={handleUpdateNote}
        onDeleteNote={handleDeleteNote}
        onExportNotes={handleExportNotes}
      />

      {/* Settings Modal */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Reading Preferences"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Theme</h3>
            <ThemeSelector />
          </div>

          <hr className="border-gray-200 dark:border-gray-700" />

          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Audio</h3>
            <BatchAudioGenerator
              bookId={bookId}
              onComplete={() => showToast('Batch generation completed!', 'success')}
              onError={(error) => showToast(error, 'error')}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
