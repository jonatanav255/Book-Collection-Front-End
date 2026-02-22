'use client';

import React, { useState } from 'react';
import { Library, Settings as SettingsIcon } from 'lucide-react';
import { useToast } from '@/components/common/Toast';
import { UploadButton } from '@/components/library/UploadButton';
import { FeaturedBooks } from '@/components/library/FeaturedBooks';
import { ThemeSelector } from '@/components/theme/ThemeSelector';
import { Modal } from '@/components/common/Modal';
import { useBooks } from '@/hooks/useBooks';

export default function HomePage() {
  const [uploading, setUploading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const { uploadBook } = useBooks();
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 bg-gray-800 dark:bg-gray-800 px-6 py-4 rounded-lg">
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

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
              title="Settings"
            >
              <SettingsIcon className="w-6 h-6 text-gray-300" />
            </button>
            <UploadButton onUpload={handleUpload} isLoading={uploading} />
          </div>
        </div>

        {/* Featured Books - Recently Read */}
        <div className="mb-8">
          <FeaturedBooks limit={6} />
        </div>
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
