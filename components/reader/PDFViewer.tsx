'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { Loading } from '../common/Loading';

// Use a locally served worker to avoid CDN version mismatches
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

interface PDFViewerProps {
  pdfUrl: string;
  pageNumber: number;
  scale: number;
  onPageChange: (page: number) => void;
  onTotalPagesLoad: (total: number) => void;
}

export function PDFViewer({
  pdfUrl,
  pageNumber,
  scale,
  onPageChange,
  onTotalPagesLoad,
}: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const renderTaskRef = useRef<pdfjs.RenderTask | null>(null);

  // Load PDF document
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

  // Render current page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || !textLayerRef.current) return;

    let isMounted = true;

    const renderPage = async () => {
      try {
        // Cancel any ongoing render task
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const page = await pdfDoc.getPage(pageNumber);

        if (!isMounted) return;

        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const textLayerDiv = textLayerRef.current;

        if (!canvas || !textLayerDiv) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        // Account for device pixel ratio for sharp rendering on retina displays
        const devicePixelRatio = window.devicePixelRatio || 1;
        canvas.height = viewport.height * devicePixelRatio;
        canvas.width = viewport.width * devicePixelRatio;
        canvas.style.height = `${viewport.height}px`;
        canvas.style.width = `${viewport.width}px`;

        // Scale the context to match device pixel ratio
        context.scale(devicePixelRatio, devicePixelRatio);

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        renderTaskRef.current = page.render(renderContext);
        await renderTaskRef.current.promise;
        renderTaskRef.current = null;

        // Clear previous text layer
        textLayerDiv.innerHTML = '';
        textLayerDiv.style.width = `${viewport.width}px`;
        textLayerDiv.style.height = `${viewport.height}px`;

        // Render text layer for native browser text selection
        const textContent = await page.getTextContent();

        textContent.items.forEach((item: any) => {
          const tx = pdfjs.Util.transform(viewport.transform, item.transform);
          const fontSize = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]);

          const textDiv = document.createElement('span');
          textDiv.style.position = 'absolute';
          textDiv.style.left = `${tx[4]}px`;
          textDiv.style.top = `${tx[5] - fontSize}px`;
          textDiv.style.fontSize = `${fontSize}px`;
          textDiv.style.fontFamily = item.fontName || 'sans-serif';
          textDiv.style.whiteSpace = 'pre';
          textDiv.textContent = item.str || '';

          textLayerDiv.appendChild(textDiv);
        });
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Error rendering page:', err);
        }
      }
    };

    renderPage();

    return () => {
      isMounted = false;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdfDoc, pageNumber, scale]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loading size="lg" text="Loading PDF..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-2">Failed to load PDF</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto bg-gray-100 dark:bg-gray-950 p-4">
      <div className="flex items-center justify-center min-w-full min-h-full">
        <div ref={containerRef} className="relative">
          <canvas
            ref={canvasRef}
            className="shadow-2xl"
            style={{
              filter: 'var(--pdf-filter, none)',
            }}
          />
          <div
            ref={textLayerRef}
            className="pdf-text-layer"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              overflow: 'hidden',
              lineHeight: 1,
            }}
          />
        </div>
      </div>
    </div>
  );
}
