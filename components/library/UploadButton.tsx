'use client';

import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '../common/Button';
import { useToast } from '../common/Toast';
import { useLanguage } from '@/i18n';

const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

interface UploadButtonProps {
  onUpload: (files: File[]) => void;
  isLoading?: boolean;
}

export function UploadButton({ onUpload, isLoading = false }: UploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const { t } = useLanguage();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const allFiles = Array.from(e.target.files || []);
    if (allFiles.length === 0) return;

    const pdfFiles = allFiles.filter((f) => f.type === 'application/pdf');
    const nonPdfCount = allFiles.length - pdfFiles.length;

    if (nonPdfCount > 0) {
      alert(t(nonPdfCount > 1 ? 'library.nonPdfIgnoredMany' : 'library.nonPdfIgnoredOne', { count: nonPdfCount }));
    }

    if (pdfFiles.length === 0) return;

    if (pdfFiles.length > 20) {
      alert(t('library.maxFilesLimit'));
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const oversized = pdfFiles.filter((f) => f.size > MAX_FILE_SIZE_BYTES);
    if (oversized.length > 0) {
      showToast(
        t(oversized.length > 1 ? 'library.fileSizeExceededMany' : 'library.fileSizeExceededOne', { count: oversized.length, size: MAX_FILE_SIZE_MB }),
        'warning'
      );
      const validFiles = pdfFiles.filter((f) => f.size <= MAX_FILE_SIZE_BYTES);
      if (validFiles.length === 0) {
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      onUpload(validFiles);
    } else {
      onUpload(pdfFiles);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        isLoading={isLoading}
        className="flex items-center gap-2"
      >
        <Upload className="w-5 h-5" />
        {t('library.uploadPdf')}
      </Button>
    </>
  );
}
