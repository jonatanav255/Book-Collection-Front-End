'use client';

import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '../common/Button';

interface UploadButtonProps {
  onUpload: (files: File[]) => void;
  isLoading?: boolean;
}

export function UploadButton({ onUpload, isLoading = false }: UploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const allFiles = Array.from(e.target.files || []);
    if (allFiles.length === 0) return;

    const pdfFiles = allFiles.filter((f) => f.type === 'application/pdf');
    const nonPdfCount = allFiles.length - pdfFiles.length;

    if (nonPdfCount > 0) {
      alert(`${nonPdfCount} non-PDF file${nonPdfCount > 1 ? 's were' : ' was'} ignored.`);
    }

    if (pdfFiles.length === 0) return;

    if (pdfFiles.length > 20) {
      alert('You can upload a maximum of 20 PDF files at once.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    onUpload(pdfFiles);

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
        Upload PDF
      </Button>
    </>
  );
}
