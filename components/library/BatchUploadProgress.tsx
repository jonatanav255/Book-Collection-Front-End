'use client';

import React from 'react';
import { CheckCircle, MinusCircle, XCircle, Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import type { BatchUploadFileResult } from '@/types';
import { useLanguage } from '@/i18n';

interface BatchUploadProgressProps {
  isOpen: boolean;
  onClose: () => void;
  results: BatchUploadFileResult[];
  currentIndex: number;
  isComplete: boolean;
}

const statusIcon: Record<string, React.ReactNode> = {
  pending: <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0" />,
  uploading: <Loader2 className="w-6 h-6 text-blue-500 animate-spin flex-shrink-0" />,
  success: <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />,
  skipped: <MinusCircle className="w-6 h-6 text-amber-400 flex-shrink-0" />,
  failed: <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />,
};

export function BatchUploadProgress({
  isOpen,
  onClose,
  results,
  currentIndex,
  isComplete,
}: BatchUploadProgressProps) {
  const { t } = useLanguage();
  const total = results.length;
  const uploaded = results.filter((r) => r.status === 'success').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;
  const failed = results.filter((r) => r.status === 'failed').length;
  const done = uploaded + skipped + failed;
  const progressPercent = total > 0 ? (done / total) * 100 : 0;

  const summaryParts: string[] = [t('upload.uploadedSummary', { uploaded })];
  if (skipped > 0) summaryParts.push(t('upload.skippedSummary', { skipped }));
  if (failed > 0) summaryParts.push(t('upload.failedSummary', { failed }));

  return (
    <Modal isOpen={isOpen} onClose={isComplete ? onClose : () => {}} title={t('upload.uploadingBooks')} size="lg">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-base text-gray-600 dark:text-gray-400 mb-2">
          <span>
            {isComplete
              ? t('upload.uploadComplete')
              : t('upload.uploadingProgress', { current: Math.min(currentIndex + 1, total), total })}
          </span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* File list */}
      <ul className="space-y-3 mb-6">
        {results.map((result, i) => (
          <li key={i} className="flex items-start gap-4 text-base py-1">
            <span className="mt-0.5">{statusIcon[result.status]}</span>
            <div className="min-w-0 flex-1">
              <span className="block truncate text-gray-800 dark:text-gray-200">
                {result.file.name}
              </span>
              {result.status === 'skipped' && (
                <span className="text-amber-500 dark:text-amber-400 text-sm">{t('upload.duplicateSkipped')}</span>
              )}
              {result.status === 'failed' && (
                <span className="text-red-500 dark:text-red-400 text-sm">{t('upload.uploadFailed')}</span>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Summary + close */}
      {isComplete && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
          <p className="text-base text-gray-700 dark:text-gray-300 mb-4">
            {summaryParts.join(', ')}
          </p>
          <Button onClick={onClose} className="w-full">{t('upload.closeBatch')}</Button>
        </div>
      )}
    </Modal>
  );
}
