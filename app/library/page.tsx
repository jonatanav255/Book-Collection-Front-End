'use client';

import React, { useState, useEffect, useRef, useCallback, DragEvent } from 'react';
import { Library, ArrowLeft, Upload, CheckSquare, X, Trash2, BookOpen, BookX, CheckCircle, MinusCircle } from 'lucide-react';
import Link from 'next/link';
import { useBooks, usePaginatedBooks } from '@/hooks/useBooks';
import { useStats } from '@/hooks/useStats';
import { useToast } from '@/components/common/Toast';
import { BookCard } from '@/components/library/BookCard';
import { SearchBar } from '@/components/library/SearchBar';
import { FilterBar } from '@/components/library/FilterBar';
import { UploadButton } from '@/components/library/UploadButton';
import { BookCardSkeleton } from '@/components/common/Loading';
import { BatchUploadProgress } from '@/components/library/BatchUploadProgress';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ReadingStatus } from '@/types';
import type { BatchUploadFileResult } from '@/types';
import { ApiError } from '@/services/api';
import { useLanguage } from '@/i18n';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export default function AllBooksPage() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('dateAdded');
  const [statusFilter, setStatusFilter] = useState<ReadingStatus | ''>('');
  const [uploading, setUploading] = useState(false);
  const [batchResults, setBatchResults] = useState<BatchUploadFileResult[]>([]);
  const [batchIndex, setBatchIndex] = useState(0);
  const [batchComplete, setBatchComplete] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);

  // Multi-select state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [bulkOperationLoading, setBulkOperationLoading] = useState(false);
  const lastClickedIndexRef = useRef<number | null>(null);

  const debouncedSearch = useDebounce(search, 150);

  const {
    books,
    loading,
    loadingMore,
    hasMore,
    totalElements,
    error: paginationError,
    loadMore,
    refetch,
    updateBookInList,
    removeBookFromList,
    removeBooksFromList,
  } = usePaginatedBooks({
    search: debouncedSearch,
    sortBy,
    status: statusFilter || undefined,
  });

  const { uploadBook, uploadBooks, deleteBook, updateBookStatus, updateBook, bulkDelete, bulkUpdateStatus } = useBooks();
  const { data: statsData } = useStats();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const hasBooks = books.length > 0;

  const stats = {
    total: statsData?.totalBooks ?? 0,
    reading: statsData?.readingBooks ?? 0,
    finished: statsData?.finishedBooks ?? 0,
    unread: statsData?.unreadBooks ?? 0,
  };

  // Exit selection mode when search/filters change
  useEffect(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, [debouncedSearch, sortBy, statusFilter]);

  // Scroll to top on mount and when search/filters change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [debouncedSearch, sortBy, statusFilter]);

  // Intersection Observer for infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreRef.current();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasBooks, debouncedSearch, sortBy, statusFilter]);

  const handleUpload = useCallback(async (files: File[]) => {
    if (files.length === 1) {
      try {
        setUploading(true);
        await uploadBook(files[0]);
        showToast(t('library.bookUploadedSuccess'), 'success');
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          showToast(t('library.bookAlreadyExists'), 'error');
        } else {
          showToast(t('library.failedToUpload'), 'error');
        }
      } finally {
        setUploading(false);
      }
      return;
    }

    setBatchComplete(false);
    setBatchIndex(0);
    setBatchResults(files.map((file) => ({ file, status: 'pending' as const })));
    setShowBatchModal(true);

    const results = await uploadBooks(files, (currentResults, index) => {
      setBatchResults([...currentResults]);
      setBatchIndex(index);
    });

    setBatchResults([...results]);
    setBatchComplete(true);

    const uploaded = results.filter((r) => r.status === 'success').length;
    const skipped = results.filter((r) => r.status === 'skipped').length;
    const failed = results.filter((r) => r.status === 'failed').length;
    const parts = [t('home.uploaded', { count: uploaded })];
    if (skipped > 0) parts.push(t('home.skipped', { count: skipped }));
    if (failed > 0) parts.push(t('home.failed', { count: failed }));
    showToast(parts.join(', '), failed > 0 ? 'error' : 'success');
  }, [uploadBook, uploadBooks, showToast, t]);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDragging(false);

    const allFiles = Array.from(e.dataTransfer.files);
    const pdfFiles = allFiles.filter(f => f.type === 'application/pdf');

    if (pdfFiles.length === 0) {
      showToast(t('library.onlyPdfAccepted'), 'warning');
      return;
    }

    const nonPdfCount = allFiles.length - pdfFiles.length;
    if (nonPdfCount > 0) {
      showToast(t(nonPdfCount > 1 ? 'library.nonPdfIgnoredMany' : 'library.nonPdfIgnoredOne', { count: nonPdfCount }), 'warning');
    }

    handleUpload(pdfFiles);
  }, [handleUpload, showToast, t]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteBook(id);
      removeBookFromList(id);
      showToast(t('library.bookDeletedSuccess'), 'success');
    } catch {
      showToast(t('library.failedToDeleteBook'), 'error');
    }
  }, [deleteBook, removeBookFromList, showToast, t]);

  const handleStatusChange = useCallback(async (id: string, status: ReadingStatus) => {
    try {
      const updated = await updateBookStatus(id, status);
      if (updated) updateBookInList(updated);
      showToast(t('library.bookStatusUpdated'), 'success');
    } catch {
      showToast(t('library.failedToUpdateStatus'), 'error');
    }
  }, [updateBookStatus, updateBookInList, showToast, t]);

  const handleRename = useCallback(async (id: string, title: string) => {
    try {
      const updated = await updateBook(id, { title });
      if (updated) updateBookInList(updated);
      showToast(t('library.bookRenamedSuccess'), 'success');
    } catch {
      showToast(t('library.failedToRenameBook'), 'error');
    }
  }, [updateBook, updateBookInList, showToast, t]);

  // Selection mode handlers
  const toggleSelectionMode = useCallback(() => {
    setSelectionMode(prev => {
      if (prev) setSelectedIds(new Set());
      return !prev;
    });
  }, []);

  const handleToggleSelect = useCallback((id: string, event?: React.MouseEvent) => {
    const index = books.findIndex(b => b.id === id);

    // Shift+click range selection
    if (event?.shiftKey && lastClickedIndexRef.current !== null && selectionMode) {
      const start = Math.min(lastClickedIndexRef.current, index);
      const end = Math.max(lastClickedIndexRef.current, index);
      setSelectedIds(prev => {
        const next = new Set(prev);
        for (let i = start; i <= end; i++) {
          next.add(books[i].id);
        }
        return next;
      });
      lastClickedIndexRef.current = index;
      return;
    }

    lastClickedIndexRef.current = index;
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, [books, selectionMode]);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === books.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(books.map(b => b.id)));
    }
  }, [books, selectedIds.size]);

  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedIds);
    setBulkOperationLoading(true);
    try {
      const result = await bulkDelete(ids);
      if (result.failureCount === 0) {
        removeBooksFromList(ids);
        showToast(t('library.bulkDeleteSuccess', { count: result.successCount }), 'success');
      } else if (result.successCount > 0) {
        const successIds = ids.filter(id => !result.failedIds.includes(id));
        removeBooksFromList(successIds);
        showToast(t('library.bulkDeletePartial', { success: result.successCount, failure: result.failureCount }), 'warning');
      } else {
        showToast(t('library.bulkDeleteFailed'), 'error');
      }
      setSelectionMode(false);
      setSelectedIds(new Set());
    } catch {
      showToast(t('library.bulkDeleteFailed'), 'error');
    } finally {
      setBulkOperationLoading(false);
      setShowBulkDeleteConfirm(false);
    }
  }, [selectedIds, bulkDelete, removeBooksFromList, showToast, t]);

  const handleBulkStatusChange = useCallback(async (status: ReadingStatus) => {
    const ids = Array.from(selectedIds);
    setBulkOperationLoading(true);
    try {
      const result = await bulkUpdateStatus(ids, status);
      if (result.failureCount === 0) {
        showToast(t('library.bulkStatusSuccess', { count: result.successCount }), 'success');
      } else if (result.successCount > 0) {
        showToast(t('library.bulkStatusPartial', { success: result.successCount, failure: result.failureCount }), 'warning');
      } else {
        showToast(t('library.bulkStatusFailed'), 'error');
      }
      setSelectionMode(false);
      setSelectedIds(new Set());
      refetch();
    } catch {
      showToast(t('library.bulkStatusFailed'), 'error');
    } finally {
      setBulkOperationLoading(false);
    }
  }, [selectedIds, bulkUpdateStatus, showToast, t, refetch]);

  const selectedCount = selectedIds.size;

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900 relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drop Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-blue-500/10 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="border-4 border-dashed border-blue-500 rounded-2xl p-12 bg-white/80 dark:bg-gray-800/80 text-center">
            <Upload className="w-12 h-12 text-blue-500 mx-auto mb-3" />
            <p className="text-xl font-semibold text-blue-600 dark:text-blue-400">{t('library.dropPdfsHere')}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('library.uploadPdfFiles')}</p>
          </div>
        </div>
      )}

      {/* Bulk Actions Toolbar */}
      {selectionMode && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-teal-800 dark:bg-teal-900 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSelectionMode}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                aria-label={t('common.close')}
              >
                <X className="w-4 h-4 text-white" strokeWidth={2} />
              </button>
              <span className="font-bold text-sm sm:text-base text-white">
                {t('library.selectedCount', { count: selectedCount })}
              </span>
              <button
                onClick={() => setSelectedIds(new Set())}
                disabled={selectedCount === 0}
                className="flex items-center gap-1.5 text-sm px-2.5 py-1 rounded-full border border-white/30 hover:border-white/60 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-white/30 disabled:hover:bg-transparent"
              >
                <MinusCircle className="w-3.5 h-3.5" />
                {t('library.deselectAll')}
              </button>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              {/* Status change buttons */}
              <span className="text-xs sm:text-sm font-medium hidden sm:inline">{t('library.markSelectedAs')}:</span>
              <button
                onClick={() => handleBulkStatusChange(ReadingStatus.UNREAD)}
                disabled={selectedCount === 0 || bulkOperationLoading}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-gray-600 hover:bg-gray-700 disabled:opacity-40 disabled:hover:bg-gray-600 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                title={t('library.markAsUnread')}
              >
                <BookX className="w-4 h-4" />
                <span className="hidden sm:inline">{t('library.unread')}</span>
              </button>
              <button
                onClick={() => handleBulkStatusChange(ReadingStatus.READING)}
                disabled={selectedCount === 0 || bulkOperationLoading}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                title={t('library.markAsReading')}
              >
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">{t('library.readingStatus')}</span>
              </button>
              <button
                onClick={() => handleBulkStatusChange(ReadingStatus.FINISHED)}
                disabled={selectedCount === 0 || bulkOperationLoading}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:hover:bg-green-600 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                title={t('library.markAsComplete')}
              >
                <CheckCircle className="w-4 h-4" />
                <span className="hidden sm:inline">{t('library.finishedStatus')}</span>
              </button>

              <div className="w-px h-6 bg-white/30 mx-1" />

              {/* Delete button */}
              <button
                onClick={() => setShowBulkDeleteConfirm(true)}
                disabled={selectedCount === 0 || bulkOperationLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:hover:bg-red-600 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">{t('library.bulkDelete')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/"
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
              title={t('library.backToHome')}
            >
              <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <Library className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: 'var(--icon-color-secondary)' }} />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {t('library.allBooks')}
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                  {t('library.booksStats', { total: stats.total })} • <span className="text-blue-500 dark:text-blue-400">{t('library.reading', { count: stats.reading })}</span> • <span className="text-green-500 dark:text-green-400">{t('library.finished', { count: stats.finished })}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-3">
              {/* Select mode toggle */}
              {hasBooks && !selectionMode && (
                <button
                  onClick={toggleSelectionMode}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-cyan-500/25 rounded-xl transition-all"
                >
                  <CheckSquare className="w-4 h-4" />
                  {t('library.selectBooks')}
                </button>
              )}
              <UploadButton onUpload={handleUpload} isLoading={uploading} />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-300">{t('library.dragDropHint')}</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <SearchBar value={search} onChange={setSearch} />
          <FilterBar
            sortBy={sortBy}
            status={statusFilter}
            onSortChange={setSortBy}
            onStatusChange={setStatusFilter}
          />
        </div>

        {/* Error Message */}
        {paginationError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400 text-sm">{paginationError}</p>
            <button
              onClick={() => refetch()}
              className="mt-2 text-sm text-red-600 dark:text-red-300 underline hover:no-underline"
            >
              {t('common.tryAgain')}
            </button>
          </div>
        )}

        {/* Books Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {[...Array(10)].map((_, i) => (
              <BookCardSkeleton key={i} />
            ))}
          </div>
        ) : books.length === 0 && !paginationError ? (
          <div className="text-center py-16">
            <Library className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {totalElements === 0 && !debouncedSearch && !statusFilter ? t('library.noBooksYet') : t('library.noBooksFound')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {totalElements === 0 && !debouncedSearch && !statusFilter
                ? t('library.uploadFirstPdf')
                : t('library.adjustSearchOrFilters')}
            </p>
            {totalElements === 0 && !debouncedSearch && !statusFilter && (
              <UploadButton onUpload={handleUpload} isLoading={uploading} />
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {books.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                  onRename={handleRename}
                  selectionMode={selectionMode}
                  isSelected={selectedIds.has(book.id)}
                  onToggleSelect={handleToggleSelect}
                />
              ))}
              {loadingMore &&
                [...Array(4)].map((_, i) => <BookCardSkeleton key={`skeleton-${i}`} />)}
            </div>
            <div ref={sentinelRef} className="h-4" />
            {!hasMore && books.length > 0 && (
              <p className="text-center text-sm text-gray-500 py-6">
                — {t('library.reachedTheEnd')} —
              </p>
            )}
          </>
        )}
      </div>

      {/* Batch Upload Progress Modal */}
      <BatchUploadProgress
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        results={batchResults}
        currentIndex={batchIndex}
        isComplete={batchComplete}
      />

      {/* Bulk Delete Confirmation */}
      <ConfirmDialog
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title={t('library.bulkDeleteConfirmTitle', { count: selectedCount })}
        message={t('library.bulkDeleteConfirmMessage', { count: selectedCount })}
        confirmText={t('library.bulkDelete')}
        variant="danger"
      />
    </div>
  );
}
