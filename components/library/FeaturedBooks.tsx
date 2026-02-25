'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Loader2 } from 'lucide-react';
import { Book } from '@/types';
import { booksApi } from '@/services/api';
import { useBookCover } from '@/hooks/useBookCover';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/queryKeys';
import { Loading } from '../common/Loading';

interface FeaturedBooksProps {
  limit?: number;
}

export function FeaturedBooks({ limit = 6 }: FeaturedBooksProps) {
  const { data: books = [], isLoading: loading, error } = useQuery({
    queryKey: queryKeys.books.featured(limit),
    queryFn: () => booksApi.getFeatured(limit),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading size="lg" text="Loading featured books..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">{(error as Error).message}</p>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">No books to display yet. Upload some PDFs to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Continue Reading</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Pick up where you left off</p>
        </div>
        <Link
          href="/library"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-cyan-500/25"
        >
          All Books
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
        {books.map((book) => (
          <FeaturedBookCard key={book.id} book={book} />
        ))}
      </div>
    </div>
  );
}

function FeaturedBookCard({ book }: { book: Book }) {
  const [isOpening, setIsOpening] = useState(false);
  const { imageUrl, imageLoaded, handleLoad, handleError } = useBookCover(book.id, book.coverUrl);
  const progress = book.status === 'FINISHED'
    ? 100
    : book.pageCount > 0 ? Math.round((book.currentPage / book.pageCount) * 100) : 0;

  return (
    <Link href={`/reader/${book.id}`} onClick={() => setIsOpening(true)}>
      <div className="group cursor-pointer">
        {/* Book Cover */}
        <div className="aspect-[3/4] relative bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105">
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
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
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
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
              <div className="w-full bg-gray-300/50 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full transition-all ${book.status === 'FINISHED' ? 'bg-green-500' : 'bg-blue-500'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-white text-xs mt-1 font-medium">
                {book.status === 'FINISHED' ? 'Complete' : `${progress}%`}
              </p>
            </div>
          )}
        </div>

        {/* Book Info */}
        <div className="mt-2">
          <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {book.title}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mt-0.5">
            {book.author}
          </p>
        </div>
      </div>
    </Link>
  );
}
