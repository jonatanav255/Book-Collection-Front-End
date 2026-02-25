'use client';

import React, { useState, useEffect, useRef, useCallback, DragEvent } from 'react';
import { Library, ArrowLeft, Upload } from 'lucide-react';
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
import { ReadingStatus } from '@/types';
import type { BatchUploadFileResult } from '@/types';
import { ApiError } from '@/services/api';

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
  } = usePaginatedBooks({
    search: debouncedSearch,
    sortBy,
    status: statusFilter || undefined,
  });

  const { uploadBook, uploadBooks, deleteBook, updateBookStatus, updateBook } = useBooks();
  const { data: statsData } = useStats();
  const { showToast } = useToast();
  const hasBooks = books.length > 0;

  const stats = {
    total: statsData?.totalBooks ?? 0,
    reading: statsData?.readingBooks ?? 0,
    finished: statsData?.finishedBooks ?? 0,
    unread: statsData?.unreadBooks ?? 0,
  };

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
        showToast('Book uploaded successfully!', 'success');
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          showToast('This book already exists in your library.', 'error');
        } else {
          showToast('Failed to upload book. Please try again.', 'error');
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
    const parts = [`${uploaded} uploaded`];
    if (skipped > 0) parts.push(`${skipped} skipped`);
    if (failed > 0) parts.push(`${failed} failed`);
    showToast(parts.join(', '), failed > 0 ? 'error' : 'success');
  }, [uploadBook, uploadBooks, showToast]);

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
      showToast('Only PDF files are accepted', 'warning');
      return;
    }

    const nonPdfCount = allFiles.length - pdfFiles.length;
    if (nonPdfCount > 0) {
      showToast(`${nonPdfCount} non-PDF file${nonPdfCount > 1 ? 's were' : ' was'} ignored`, 'warning');
    }

    handleUpload(pdfFiles);
  }, [handleUpload, showToast]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteBook(id);
      removeBookFromList(id);
      showToast('Book deleted successfully', 'success');
    } catch {
      showToast('Failed to delete book', 'error');
    }
  }, [deleteBook, removeBookFromList, showToast]);

  const handleStatusChange = useCallback(async (id: string, status: ReadingStatus) => {
    try {
      const updated = await updateBookStatus(id, status);
      if (updated) updateBookInList(updated);
      showToast('Book status updated', 'success');
    } catch {
      showToast('Failed to update book status', 'error');
    }
  }, [updateBookStatus, updateBookInList, showToast]);

  const handleRename = useCallback(async (id: string, title: string) => {
    try {
      const updated = await updateBook(id, { title });
      if (updated) updateBookInList(updated);
      showToast('Book renamed successfully', 'success');
    } catch {
      showToast('Failed to rename book', 'error');
    }
  }, [updateBook, updateBookInList, showToast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-12 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-8 animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {[...Array(10)].map((_, i) => (
              <BookCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

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
            <p className="text-xl font-semibold text-blue-600 dark:text-blue-400">Drop PDFs here</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Upload one or multiple PDF files</p>
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
              title="Back to Home"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <Library className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: 'var(--icon-color-secondary)' }} />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                  All Books
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                  {stats.total} books • <span className="text-blue-500 dark:text-blue-400">{stats.reading} reading</span> • <span className="text-green-500 dark:text-green-400">{stats.finished} finished</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <UploadButton onUpload={handleUpload} isLoading={uploading} />
            <p className="text-xs text-gray-500 dark:text-gray-300">or drag & drop PDFs anywhere</p>
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
              Try again
            </button>
          </div>
        )}

        {/* Books Grid */}
        {books.length === 0 && !paginationError ? (
          <div className="text-center py-16">
            <Library className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {totalElements === 0 && !debouncedSearch && !statusFilter ? 'No books yet' : 'No books found'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {totalElements === 0 && !debouncedSearch && !statusFilter
                ? 'Upload your first PDF to get started'
                : 'Try adjusting your search or filters'}
            </p>
            {totalElements === 0 && !debouncedSearch && !statusFilter && (
              <UploadButton onUpload={handleUpload} isLoading={uploading} />
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {books.map((book) => (
                <BookCard key={book.id} book={book} onDelete={handleDelete} onStatusChange={handleStatusChange} onRename={handleRename} />
              ))}
              {loadingMore &&
                [...Array(4)].map((_, i) => <BookCardSkeleton key={`skeleton-${i}`} />)}
            </div>
            <div ref={sentinelRef} className="h-4" />
            {!hasMore && books.length > 0 && (
              <p className="text-center text-sm text-gray-500 py-6">
                — You&apos;ve reached the end —
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
    </div>
  );
}
