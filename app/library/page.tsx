'use client';

import React, { useState, useMemo } from 'react';
import { Library, Settings as SettingsIcon, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useBooks } from '@/hooks/useBooks';
import { useToast } from '@/components/common/Toast';
import { BookCard } from '@/components/library/BookCard';
import { SearchBar } from '@/components/library/SearchBar';
import { FilterBar } from '@/components/library/FilterBar';
import { UploadButton } from '@/components/library/UploadButton';
import { ThemeSelector } from '@/components/theme/ThemeSelector';
import { Modal } from '@/components/common/Modal';
import { BookCardSkeleton } from '@/components/common/Loading';
import { ReadingStatus } from '@/types';

export default function AllBooksPage() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('dateAdded');
  const [statusFilter, setStatusFilter] = useState<ReadingStatus | ''>('');
  const [uploading, setUploading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const { books, loading, uploadBook, deleteBook } = useBooks();
  const { showToast } = useToast();

  const handleUpload = async (file: File) => {
    try {
      setUploading(true);
      await uploadBook(file);
      showToast('Book uploaded successfully!', 'success');
    } catch (err) {
      showToast('Failed to upload book. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBook(id);
      showToast('Book deleted successfully', 'success');
    } catch (err) {
      showToast('Failed to delete book', 'error');
    }
  };

  // Filter and sort books
  const filteredBooks = useMemo(() => {
    let result = [...books];

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (book) =>
          book.title.toLowerCase().includes(searchLower) ||
          (book.author || '').toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (statusFilter) {
      result = result.filter((book) => book.status === statusFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'lastRead':
          return (
            new Date(b.lastReadAt || 0).getTime() -
            new Date(a.lastReadAt || 0).getTime()
          );
        case 'progress':
          const progressA = a.pageCount > 0 ? a.currentPage / a.pageCount : 0;
          const progressB = b.pageCount > 0 ? b.currentPage / b.pageCount : 0;
          return progressB - progressA;
        default: // dateAdded
          return (
            new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
          );
      }
    });

    return result;
  }, [books, search, statusFilter, sortBy]);

  // Calculate statistics
  const stats = useMemo(() => {
    const finished = books.filter((b) => b.status === ReadingStatus.FINISHED).length;
    const reading = books.filter((b) => b.status === ReadingStatus.READING).length;
    const unread = books.filter((b) => b.status === ReadingStatus.UNREAD).length;
    return { finished, reading, unread, total: books.length };
  }, [books]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-12 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-8 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <BookCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
              title="Back to Home"
            >
              <ArrowLeft className="w-6 h-6" style={{ color: 'var(--icon-color)' }} />
            </Link>
            <div className="flex items-center gap-3">
              <Library className="w-8 h-8" style={{ color: 'var(--icon-color-secondary)' }} />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  All Books
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {stats.total} books • {stats.reading} reading • {stats.finished} finished
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
              title="Settings"
            >
              <SettingsIcon className="w-6 h-6" style={{ color: 'var(--icon-color)' }} />
            </button>
            <UploadButton onUpload={handleUpload} isLoading={uploading} />
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

        {/* Books Grid */}
        {filteredBooks.length === 0 ? (
          <div className="text-center py-16">
            <Library className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {books.length === 0 ? 'No books yet' : 'No books found'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {books.length === 0
                ? 'Upload your first PDF to get started'
                : 'Try adjusting your search or filters'}
            </p>
            {books.length === 0 && (
              <UploadButton onUpload={handleUpload} isLoading={uploading} />
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredBooks.map((book) => (
              <BookCard key={book.id} book={book} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Reading Preferences"
        size="lg"
      >
        <ThemeSelector />
      </Modal>
    </div>
  );
}
