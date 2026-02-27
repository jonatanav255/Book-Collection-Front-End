'use client';

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, MoreVertical, CheckCircle, BookOpen, BookX, Pencil, Loader2, Check } from 'lucide-react';
import { Book, ReadingStatus } from '@/types';
import { useBookCover } from '@/hooks/useBookCover';
import { useClickOutside } from '@/hooks/useClickOutside';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useLanguage } from '@/i18n';

interface BookCardProps {
  book: Book;
  onDelete: (id: string) => void;
  onStatusChange?: (id: string, status: ReadingStatus) => void;
  onRename?: (id: string, title: string) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export const BookCard = React.memo(function BookCard({ book, onDelete, onStatusChange, onRename, selectionMode, isSelected, onToggleSelect }: BookCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(book.title);
  const [isOpening, setIsOpening] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  const closeMenu = useCallback(() => setShowMenu(false), []);
  useClickOutside(menuRef, closeMenu, showMenu);

  const { imageUrl, imageLoaded, handleLoad, handleError } = useBookCover(book.id, book.coverUrl);

  const progress = book.status === 'FINISHED'
    ? 100
    : book.pageCount > 0 ? Math.round((book.currentPage / book.pageCount) * 100) : 0;

  const coverContent = (
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
        onLoad={handleLoad}
        onError={handleError}
        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        quality={75}
        priority={false}
      />

      {/* Selection checkbox overlay */}
      {selectionMode && (
        <div className="absolute top-2 left-2 z-10">
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            isSelected
              ? 'bg-blue-500 border-blue-500'
              : 'bg-white/80 border-gray-400 dark:bg-gray-800/80 dark:border-gray-500'
          }`}>
            {isSelected && <Check className="w-4 h-4 text-white" />}
          </div>
        </div>
      )}

      {/* Opening overlay */}
      {isOpening && !selectionMode && (
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
            {book.status === 'FINISHED' ? t('library.complete') : t('library.percentComplete', { percent: progress })}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div
        className={`group relative bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all overflow-hidden ${
          selectionMode && isSelected ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900' : ''
        } ${selectionMode ? 'cursor-pointer' : ''}`}
        onClick={selectionMode ? () => onToggleSelect?.(book.id) : undefined}
      >
        {/* Book Cover */}
        {selectionMode ? (
          coverContent
        ) : (
          <Link href={`/reader/${book.id}`} onClick={() => setIsOpening(true)}>
            {coverContent}
          </Link>
        )}

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
          ) : selectionMode ? (
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 mb-1 min-h-[48px]">
              {book.title}
            </h3>
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
              {book.status === 'FINISHED' ? t('library.finishedStatus') : book.status === 'READING' ? t('library.readingStatus') : t('library.unread')}
            </span>

            {/* More Options Button - hidden in selection mode */}
            {!selectionMode && (
              <button
                onClick={() => setShowMenu(!showMenu)}
                aria-label={t('common.moreOptions')}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            )}
          </div>

          {/* Dropdown Menu */}
          {showMenu && !selectionMode && (
            <div ref={menuRef} className="absolute right-0 bottom-4 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10 min-w-[160px] sm:min-w-[180px]">
              {book.status !== 'UNREAD' && onStatusChange && (
                <button
                  onClick={() => {
                    onStatusChange(book.id, ReadingStatus.UNREAD);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left rounded-t-lg"
                >
                  <BookX className="w-4 h-4" />
                  {t('library.markAsUnread')}
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
                  {t('library.markAsReading')}
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
                  {t('library.markAsComplete')}
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
                  {t('library.rename')}
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
                {t('common.delete')}
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => onDelete(book.id)}
        title={t('library.deleteBook')}
        message={t('library.deleteBookMessage', { title: book.title })}
        confirmText={t('common.delete')}
        variant="danger"
      />
    </>
  );
});
