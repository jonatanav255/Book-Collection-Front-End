'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, MoreVertical, CheckCircle } from 'lucide-react';
import { Book, ReadingStatus } from '@/types';
import { booksApi } from '@/services/api';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface BookCardProps {
  book: Book;
  onDelete: (id: string) => void;
  onStatusChange?: (id: string, status: ReadingStatus) => void;
}

export function BookCard({ book, onDelete, onStatusChange }: BookCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imageError, setImageError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const progress = book.status === 'FINISHED'
    ? 100
    : book.pageCount > 0 ? Math.round((book.currentPage / book.pageCount) * 100) : 0;

  const imageUrl = imageError || !book.coverUrl
    ? booksApi.getThumbnailUrl(book.id)
    : book.coverUrl;

  return (
    <>
      <div className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden">
        {/* Book Cover */}
        <Link href={`/reader/${book.id}`}>
          <div className="aspect-[3/4] relative bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <Image
              src={imageUrl}
              alt={book.title}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              quality={100}
              priority={false}
            />

            {/* Progress Overlay */}
            {progress > 0 && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all ${book.status === 'FINISHED' ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-white text-xs mt-1 font-medium">
                  {book.status === 'FINISHED' ? 'Complete' : `${progress}% complete`}
                </p>
              </div>
            )}
          </div>
        </Link>

        {/* Book Info */}
        <div className="p-4 h-[140px] flex flex-col">
          <Link href={`/reader/${book.id}`}>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 mb-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors min-h-[48px]">
              {book.title}
            </h3>
          </Link>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 mb-2 min-h-[20px]">
            {book.author}
          </p>

          {/* Status Badge */}
          <div className="flex items-center justify-between mt-auto">
            <span
              className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                book.status === 'FINISHED'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  : book.status === 'READING'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {book.status.toLowerCase()}
            </span>

            {/* More Options Button */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Dropdown Menu */}
          {showMenu && (
            <div ref={menuRef} className="absolute right-4 bottom-4 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10 min-w-[180px]">
              {book.status !== 'FINISHED' && onStatusChange && (
                <button
                  onClick={() => {
                    onStatusChange(book.id, ReadingStatus.FINISHED);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 w-full text-left rounded-t-lg"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Complete
                </button>
              )}
              <button
                onClick={() => {
                  setShowDeleteConfirm(true);
                  setShowMenu(false);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => onDelete(book.id)}
        title="Delete Book"
        message={`Are you sure you want to delete "${book.title}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
}
