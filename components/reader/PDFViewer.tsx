'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { TextLayer } from 'pdfjs-dist';
import { Loading } from '../common/Loading';
import { useLanguage } from '@/i18n';

/**
 * Configure PDF.js worker
 * Uses a locally served worker file to avoid CDN version mismatches
 * The worker handles PDF parsing in a separate thread for better performance
 */
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

/**
 * PDF Viewer component props
 */
interface PDFViewerProps {
  pdfUrl: string;  // URL to PDF file (from backend API)
  pageNumber: number;  // Current page number to display (1-indexed)
  scale: number;  // Zoom level (1.0 = 100%, 1.5 = 150%, etc.)
  onPageChange: (page: number) => void;  // Callback when page changes
  onTotalPagesLoad: (total: number) => void;  // Callback when PDF loads with total page count
}

/**
 * PDF Viewer Component
 *
 * Renders PDF pages using PDF.js with the following features:
 * - High-quality canvas rendering with device pixel ratio support for sharp display on retina screens
 * - Transparent text layer overlay for native browser text selection and copy
 * - Dark mode support via CSS filter
 * - Zoom support with dynamic scaling
 * - Page navigation with render task cancellation
 *
 * Architecture:
 * 1. Canvas layer: Renders the actual PDF visual content
 * 2. Text layer: Transparent overlay with absolutely positioned text for selection/copy functionality
 */
export function PDFViewer({
  pdfUrl,
  pageNumber,
  scale,
  onPageChange,
  onTotalPagesLoad,
}: PDFViewerProps) {
  const { t } = useLanguage();

  // Refs for DOM elements
  const canvasRef = useRef<HTMLCanvasElement>(null);  // Canvas for PDF rendering
  const containerRef = useRef<HTMLDivElement>(null);  // PDF container
  const textLayerRef = useRef<HTMLDivElement>(null);  // Text layer for selection
  const textLayerInstanceRef = useRef<TextLayer | null>(null);  // Active TextLayer instance

  // State
  const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy | null>(null);  // Loaded PDF document
  const [loading, setLoading] = useState(true);  // Loading state
  const [error, setError] = useState<string | null>(null);  // Error message
  const renderTaskRef = useRef<pdfjs.RenderTask | null>(null);  // Current render task for cancellation

  /**
   * Load PDF document from URL
   * Fetches and parses the PDF file using PDF.js
   * Runs when pdfUrl changes
   */
  useEffect(() => {
    let isMounted = true;

    const loadPdf = async () => {
      try {
        setLoading(true);
        setError(null);

        const loadingTask = pdfjs.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;

        if (isMounted) {
          setPdfDoc(pdf);
          onTotalPagesLoad(pdf.numPages);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load PDF');
          setLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
    };
  }, [pdfUrl, onTotalPagesLoad]);

  /**
   * Render current PDF page
   * Handles both canvas rendering (visual) and text layer creation (selection)
   * Runs when pdfDoc, pageNumber, or scale changes
   */
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let isMounted = true;

    const renderPage = async () => {
      try {
        // Cancel any ongoing render task to prevent conflicts when rapidly changing pages
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        // Fetch the requested page from the PDF document
        const page = await pdfDoc.getPage(pageNumber);

        if (!isMounted) return;

        // On small screens, fit PDF to fill the container (width-constrained)
        // On all screens, never exceed container width
        const wrapperEl = canvasRef.current?.parentElement?.parentElement;
        let effectiveScale = scale;
        if (wrapperEl) {
          const containerWidth = wrapperEl.clientWidth;
          const baseViewport = page.getViewport({ scale: 1 });
          const fitWidthScale = containerWidth / baseViewport.width;
          // On mobile (< 768px), use fit-to-width as the scale
          if (window.innerWidth < 768) {
            effectiveScale = fitWidthScale;
          } else if (fitWidthScale < scale) {
            effectiveScale = fitWidthScale;
          }
        }
        const viewport = page.getViewport({ scale: effectiveScale });
        const canvas = canvasRef.current;

        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        // Account for device pixel ratio for sharp rendering on retina displays
        // This ensures crisp PDF rendering on high-DPI screens
        const devicePixelRatio = window.devicePixelRatio || 1;
        canvas.height = viewport.height * devicePixelRatio;
        canvas.width = viewport.width * devicePixelRatio;
        canvas.style.height = `${viewport.height}px`;
        canvas.style.width = `${viewport.width}px`;

        // Scale the context to match device pixel ratio
        context.scale(devicePixelRatio, devicePixelRatio);

        // Render PDF page to canvas
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        renderTaskRef.current = page.render(renderContext);
        await renderTaskRef.current.promise;
        renderTaskRef.current = null;

        // Render text layer for selection/copy support
        if (textLayerInstanceRef.current) {
          textLayerInstanceRef.current.cancel();
          textLayerInstanceRef.current = null;
        }
        const textLayerDiv = textLayerRef.current;
        if (textLayerDiv) {
          textLayerDiv.innerHTML = '';
          textLayerDiv.style.setProperty('--scale-factor', String(viewport.scale));

          const textContent = await page.getTextContent();
          const textLayer = new TextLayer({
            textContentSource: textContent,
            container: textLayerDiv,
            viewport: viewport,
          });
          textLayerInstanceRef.current = textLayer;
          await textLayer.render();
        }
      } catch {
        // Silently handle rendering errors (except cancellation which is expected)
      }
    };

    renderPage();

    return () => {
      isMounted = false;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
      if (textLayerInstanceRef.current) {
        textLayerInstanceRef.current.cancel();
      }
    };
  }, [pdfDoc, pageNumber, scale]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loading size="lg" text={t('reader.loadingPdf')} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-2">{t('errors.failedToLoadPdf')}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto bg-gray-100 dark:bg-gray-950 p-0 sm:p-4">
      <div className="flex items-center justify-center min-w-full min-h-full">
        <div ref={containerRef} className="relative">
          <canvas
            ref={canvasRef}
            style={{
              filter: 'var(--pdf-filter, none)',
              boxShadow: '0 0 20px 10px rgba(0, 0, 0, 0.05)',
            }}
          />
          <div
            ref={textLayerRef}
            className="textLayer"
          />
        </div>
      </div>
    </div>
  );
}
