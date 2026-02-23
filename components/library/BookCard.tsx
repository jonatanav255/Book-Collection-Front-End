'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, MoreVertical, CheckCircle, BookOpen, BookX, Pencil, Loader2 } from 'lucide-react';
import { Book, ReadingStatus } from '@/types';
import { booksApi } from '@/services/api';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface BookCardProps {
  book: Book;
  onDelete: (id: string) => void;
  onStatusChange?: (id: string, status: ReadingStatus) => void;
  onRename?: (id: string, title: string) => void;
}

export const BookCard = React.memo(function BookCard({ book, onDelete, onStatusChange, onRename }: BookCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(book.title);
  const [isOpening, setIsOpening] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

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
        <Link href={`/reader/${book.id}`} onClick={() => setIsOpening(true)}>
          <div className="aspect-[3/4] relative bg-gray-200 dark:bg-gray-700 overflow-hidden">
            {/* Shimmer placeholder */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
            )}
            <Image
              src={imageUrl}
              alt={book.title}
              fill
              className={`object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              quality={75}
              priority={false}
            />

            {/* Opening overlay */}
            {isOpening && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}

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
          {isRenaming ? (
            <input
              ref={renameInputRef}
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const trimmed = newTitle.trim();
                  if (trimmed && trimmed !== book.title && onRename) {
                    onRename(book.id, trimmed);
                  }
                  setIsRenaming(false);
                } else if (e.key === 'Escape') {
                  setNewTitle(book.title);
                  setIsRenaming(false);
                }
              }}
              onBlur={() => {
                const trimmed = newTitle.trim();
                if (trimmed && trimmed !== book.title && onRename) {
                  onRename(book.id, trimmed);
                }
                setIsRenaming(false);
              }}
              autoFocus
              className="font-semibold text-gray-900 dark:text-gray-100 mb-1 min-h-[48px] w-full bg-transparent border border-blue-500 rounded px-1 outline-none"
            />
          ) : (
            <Link href={`/reader/${book.id}`}>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 mb-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors min-h-[48px]">
                {book.title}
              </h3>
            </Link>
          )}
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
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Dropdown Menu */}
          {showMenu && (
            <div ref={menuRef} className="absolute right-0 bottom-4 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10 min-w-[160px] sm:min-w-[180px]">
              {book.status !== 'UNREAD' && onStatusChange && (
                <button
                  onClick={() => {
                    onStatusChange(book.id, ReadingStatus.UNREAD);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left rounded-t-lg"
                >
                  <BookX className="w-4 h-4" />
                  Mark as Unread
                </button>
              )}
              {book.status !== 'READING' && onStatusChange && (
                <button
                  onClick={() => {
                    onStatusChange(book.id, ReadingStatus.READING);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 w-full text-left"
                >
                  <BookOpen className="w-4 h-4" />
                  Mark as Reading
                </button>
              )}
              {book.status !== 'FINISHED' && onStatusChange && (
                <button
                  onClick={() => {
                    onStatusChange(book.id, ReadingStatus.FINISHED);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 w-full text-left"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Complete
                </button>
              )}
              {onRename && (
                <button
                  onClick={() => {
                    setNewTitle(book.title);
                    setIsRenaming(true);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                >
                  <Pencil className="w-4 h-4" />
                  Rename
                </button>
              )}
              <button
                onClick={() => {
                  setShowDeleteConfirm(true);
                  setShowMenu(false);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left rounded-b-lg"
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
});
