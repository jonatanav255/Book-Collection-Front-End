'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Book } from '@/types';
import { booksApi } from '@/services/api';
import { Loading } from '../common/Loading';

interface FeaturedBooksProps {
  limit?: number;
}

export function FeaturedBooks({ limit = 6 }: FeaturedBooksProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedBooks = async () => {
      try {
        setLoading(true);
        const featuredBooks = await booksApi.getFeatured(limit);
        setBooks(featuredBooks);
      } catch (err) {
        console.error('Failed to fetch featured books:', err);
        setError('Failed to load featured books');
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedBooks();
  }, [limit]);

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
        <p className="text-red-600 dark:text-red-400">{error}</p>
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Continue Reading</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Pick up where you left off</p>
        </div>
        <Link
          href="/library"
          className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
        >
          View All
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {books.map((book) => (
          <FeaturedBookCard key={book.id} book={book} />
        ))}
      </div>
    </div>
  );
}

function FeaturedBookCard({ book }: { book: Book }) {
  const [imageError, setImageError] = useState(false);
  const progress = book.pageCount > 0 ? Math.round((book.currentPage / book.pageCount) * 100) : 0;

  const imageUrl = imageError || !book.coverUrl
    ? booksApi.getThumbnailUrl(book.id)
    : book.coverUrl;

  return (
    <Link href={`/reader/${book.id}`}>
      <div className="group cursor-pointer">
        {/* Book Cover */}
        <div className="aspect-[3/4] relative bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105">
          <Image
            src={imageUrl}
            alt={book.title}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            quality={100}
            priority={false}
          />

          {/* Progress Overlay */}
          {progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
              <div className="w-full bg-gray-300/50 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-white text-xs mt-1 font-medium">{progress}%</p>
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
