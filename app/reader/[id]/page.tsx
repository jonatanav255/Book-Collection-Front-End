'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useBook } from '@/hooks/useBooks';
import { useProgress } from '@/hooks/useProgress';
import { useNotes } from '@/hooks/useNotes';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useToast } from '@/components/common/Toast';
import { PDFViewer } from '@/components/reader/PDFViewer';
import { ReaderControls } from '@/components/reader/ReaderControls';
import { NotesPanel } from '@/components/notes/NotesPanel';
import { ReadAloudControls } from '@/components/readaloud/ReadAloudControls';
import { Timer } from '@/components/reader/Timer';
import { ThemeSelector } from '@/components/theme/ThemeSelector';
import { BatchAudioGenerator } from '@/components/audio/BatchAudioGenerator';
import { Modal } from '@/components/common/Modal';
import { Loading } from '@/components/common/Loading';
import { LanguageToggle } from '@/components/common/LanguageToggle';
import { booksApi } from '@/services/api';
import { useLanguage } from '@/i18n';
import { CreateNoteRequest, UpdateNoteRequest } from '@/types';

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
  const [showTimer, setShowTimer] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const { showToast } = useToast();
  const { t } = useLanguage();

  // Handle page change
  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPageState(page);
      setCurrentPage(page);
    },
    [setCurrentPage]
  );

  // Audio player
  const {
    isPlaying,
    isPaused,
    isLoading: audioLoading,
    isCached,
    error: audioError,
    togglePlayPause,
    stop,
    recheckCache,
  } = useAudioPlayer({
    bookId,
    currentPage,
    enabled: showReadAloud,
    onPageComplete: () => {
      if (currentPage < totalPages) {
        handlePageChange(currentPage + 1);
      } else {
        stop();
        showToast(t('reader.finishedReading'), 'success');
      }
    },
    onError: (error) => {
      showToast(error.message || t('reader.failedToPlayAudio'), 'error');
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

  // Flush pending progress updates when leaving the page
  useEffect(() => {
    return () => {
      // Save current page immediately when unmounting (user navigating away)
      if (currentPage > 0) {
        setCurrentPage(currentPage, true); // immediate = true to bypass debounce
      }
    };
  }, [currentPage, setCurrentPage]);

  // Save page on browser refresh/close and visibility change
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentPage > 0) {
        setCurrentPage(currentPage, true);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && currentPage > 0) {
        setCurrentPage(currentPage, true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentPage, setCurrentPage]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputField = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;

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
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, isFullscreen, handlePageChange]);

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
      showToast(t('reader.noteCreatedSuccess'), 'success');
    } catch {
      showToast(t('reader.failedToCreateNote'), 'error');
    }
  };

  const handleUpdateNote = async (id: string, updates: UpdateNoteRequest) => {
    try {
      await updateNote(id, updates);
      showToast(t('reader.noteUpdatedSuccess'), 'success');
    } catch {
      showToast(t('reader.failedToUpdateNote'), 'error');
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await deleteNote(id);
      showToast(t('reader.noteDeletedSuccess'), 'success');
    } catch {
      showToast(t('reader.failedToDeleteNote'), 'error');
    }
  };

  const handleExportNotes = async () => {
    try {
      await exportNotes();
      showToast(t('reader.notesExportedSuccess'), 'success');
    } catch {
      showToast(t('reader.failedToExportNotes'), 'error');
    }
  };

  if (bookLoading || !book) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loading size="lg" text={t('reader.loadingBook')} />
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
        onToggleTimer={() => setShowTimer(!showTimer)}
        isFullscreen={isFullscreen}
        isTimerRunning={isTimerRunning}
      />

      {/* PDF Viewer */}
      <div className="flex-1 overflow-hidden relative">
        <PDFViewer
          pdfUrl={pdfUrl}
          pageNumber={currentPage}
          scale={scale}
          onPageChange={handlePageChange}
          onTotalPagesLoad={setTotalPages}
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

      {/* Timer - shows modal when open, compact view when running and closed */}
      <Timer isOpen={showTimer} onClose={() => setShowTimer(false)} onOpen={() => setShowTimer(true)} onRunningChange={setIsTimerRunning} />

      {/* Settings Modal */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title={t('reader.readingPreferences')}
        size="lg"
      >
        <div className="space-y-6">
          <ThemeSelector />

          <hr className="border-gray-200 dark:border-gray-700" />

          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('settings.language')}</h3>
            <LanguageToggle />
          </div>

          <hr className="border-gray-200 dark:border-gray-700" />

          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('settings.audioHeading')}</h3>
            <BatchAudioGenerator
              bookId={bookId}
              onComplete={() => { recheckCache(); showToast(t('reader.batchGenerationCompleted'), 'success'); }}
              onError={(error) => showToast(error, 'error')}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
