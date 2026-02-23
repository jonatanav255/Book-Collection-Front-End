'use client';

import React, { useState } from 'react';
import { Library } from 'lucide-react';
import { useToast } from '@/components/common/Toast';
import { UploadButton } from '@/components/library/UploadButton';
import { FeaturedBooks } from '@/components/library/FeaturedBooks';
import { ReadingStats } from '@/components/library/ReadingStats';
import { BatchUploadProgress } from '@/components/library/BatchUploadProgress';
import { useBooks } from '@/hooks/useBooks';
import type { BatchUploadFileResult } from '@/types';

export default function HomePage() {
  const [uploading, setUploading] = useState(false);
  const [batchResults, setBatchResults] = useState<BatchUploadFileResult[]>([]);
  const [batchIndex, setBatchIndex] = useState(0);
  const [batchComplete, setBatchComplete] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);

  const { uploadBook, uploadBooks } = useBooks(undefined, { skip: true });
  const { showToast } = useToast();

  const handleUpload = async (files: File[]) => {
    if (files.length === 1) {
      try {
        setUploading(true);
        await uploadBook(files[0]);
        showToast('Book uploaded successfully!', 'success');
      } catch (err) {
        showToast('Failed to upload book. Please try again.', 'error');
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
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 bg-gray-800 dark:bg-gray-800 px-4 sm:px-6 py-4 rounded-lg">
          <div className="flex items-center gap-3">
            <Library className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">
                BookShelf
              </h1>
              <p className="text-sm text-gray-300">
                Your personal reading collection
              </p>
            </div>
          </div>

          <UploadButton onUpload={handleUpload} isLoading={uploading} />
        </div>

        {/* Featured Books - Recently Read */}
        <div className="mb-8">
          <FeaturedBooks limit={5} />
        </div>

        {/* Reading Stats */}
        <div className="mb-8">
          <ReadingStats />
        </div>
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
