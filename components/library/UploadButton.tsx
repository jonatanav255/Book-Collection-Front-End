'use client';

import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '../common/Button';

interface UploadButtonProps {
  onUpload: (file: File) => void;
  isLoading?: boolean;
}

export function UploadButton({ onUpload, isLoading = false }: UploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      onUpload(file);
    } else if (file) {
      alert('Please select a PDF file');
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
