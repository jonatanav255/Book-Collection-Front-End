'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, Clock } from 'lucide-react';
import { Book } from '@/types';
import { booksApi } from '@/services/api';
import { Button } from '../common/Button';

interface ContinueReadingProps {
  book: Book | null;
}

export function ContinueReading({ book }: ContinueReadingProps) {
  if (!book) return null;

  const progress = book.pageCount > 0 ? Math.round((book.currentPage / book.pageCount) * 100) : 0;

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white mb-8">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5" />
        <h2 className="text-xl font-bold">Continue Reading</h2>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Book Cover */}
        <div className="w-32 h-48 flex-shrink-0 rounded-lg overflow-hidden shadow-lg">
          <Image
            src={book.coverUrl || booksApi.getThumbnailUrl(book.id)}
            alt={book.title}
            width={128}
            height={192}
            className="w-full h-full object-cover"
            quality={75}
          />
        </div>

        {/* Book Info */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-2">{book.title}</h3>
            <p className="text-blue-100 mb-4">{book.author}</p>

            <div className="flex items-center gap-2 text-sm text-blue-100 mb-4">
              <Clock className="w-4 h-4" />
              <span>
                Page {book.currentPage} of {book.pageCount}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="w-full bg-white/30 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-white h-full transition-all rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-blue-100 mt-1">{progress}% complete</p>
            </div>
          </div>

          {/* Resume Button */}
          <div>
            <Link href={`/reader/${book.id}`}>
              <Button variant="secondary" size="lg" className="w-full md:w-auto">
                Resume Reading
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
