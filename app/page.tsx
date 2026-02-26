'use client';

import React, { useState } from 'react';
import { Library, Download } from 'lucide-react';
import { collectionApi } from '@/services/api';
import { useToast } from '@/components/common/Toast';
import { Button } from '@/components/common/Button';
import { UploadButton } from '@/components/library/UploadButton';
import { FeaturedBooks } from '@/components/library/FeaturedBooks';
import { ReadingStats } from '@/components/library/ReadingStats';
import { BatchUploadProgress } from '@/components/library/BatchUploadProgress';
import { useBooks } from '@/hooks/useBooks';
import { LanguageToggle } from '@/components/common/LanguageToggle';
import { useLanguage } from '@/i18n';
import type { BatchUploadFileResult } from '@/types';

export default function HomePage() {
  const [uploading, setUploading] = useState(false);
  const [batchResults, setBatchResults] = useState<BatchUploadFileResult[]>([]);
  const [batchIndex, setBatchIndex] = useState(0);
  const [batchComplete, setBatchComplete] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const { uploadBook, uploadBooks } = useBooks();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const handleUpload = async (files: File[]) => {
    if (files.length === 1) {
      try {
        setUploading(true);
        await uploadBook(files[0]);
        showToast(t('home.bookUploadedSuccess'), 'success');
      } catch {
        showToast(t('home.failedToUpload'), 'error');
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
                {t('home.title')}
              </h1>
              <p className="text-sm text-gray-300">
                {t('home.subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Button
              variant="primary"
              onClick={async () => {
                if (downloading) return;
                try {
                  setDownloading(true);
                  await collectionApi.downloadInsomnia();
                  showToast(t('home.apiCollectionDownloaded'), 'success');
                } catch {
                  showToast(t('home.failedToDownloadApi'), 'error');
                } finally {
                  setDownloading(false);
                }
              }}
              isLoading={downloading}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/25"
            >
              <Download className="w-5 h-5" />
              {t('home.apiCollection')}
            </Button>
            <UploadButton onUpload={handleUpload} isLoading={uploading} />
          </div>
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
