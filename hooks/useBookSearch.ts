import { useState, useEffect, useCallback, useRef } from 'react';
import * as pdfjs from 'pdfjs-dist';

interface SearchMatch {
  pageNumber: number;
  matchIndex: number; // Index of match on this page
  text: string;
}

interface UseBookSearchOptions {
  pdfDoc: pdfjs.PDFDocumentProxy | null;
  searchText: string;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export function useBookSearch({
  pdfDoc,
  searchText,
  currentPage,
  onPageChange,
}: UseBookSearchOptions) {
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  // Cache extracted text to avoid re-extraction
  const pageTextCache = useRef<Map<number, string>>(new Map());

  // Extract text from all pages and find matches
  useEffect(() => {
    if (!pdfDoc || !searchText || searchText.trim().length === 0) {
      setMatches([]);
      setCurrentMatchIndex(0);
      return;
    }

    let isMounted = true;
    const searchLower = searchText.toLowerCase();

    const performSearch = async () => {
      setIsSearching(true);
      const foundMatches: SearchMatch[] = [];

      try {
        // Search through all pages
        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
          if (!isMounted) break;

          // Get cached text or extract it
          let pageText = pageTextCache.current.get(pageNum);

          if (!pageText) {
            const page = await pdfDoc.getPage(pageNum);
            const textContent = await page.getTextContent();
            pageText = textContent.items
              .map((item: any) => item.str)
              .join(' ');
            pageTextCache.current.set(pageNum, pageText);
          }

          // Find all matches on this page
          const pageTextLower = pageText.toLowerCase();
          let startIndex = 0;
          let matchIndex = 0;

          while (true) {
            const index = pageTextLower.indexOf(searchLower, startIndex);
            if (index === -1) break;

            foundMatches.push({
              pageNumber: pageNum,
              matchIndex,
              text: pageText.substring(index, index + searchText.length),
            });

            matchIndex++;
            startIndex = index + 1;
          }
        }

        if (isMounted) {
          setMatches(foundMatches);
          setCurrentMatchIndex(0);
          setIsSearching(false);

          // Auto-navigate to first match if not on a page with matches
          if (foundMatches.length > 0) {
            const currentPageHasMatch = foundMatches.some(
              (m) => m.pageNumber === currentPage
            );
            if (!currentPageHasMatch) {
              onPageChange(foundMatches[0].pageNumber);
            }
          }
        }
      } catch (error) {
        console.error('Error during search:', error);
        if (isMounted) {
          setIsSearching(false);
        }
      }
    };

    // Debounce search
    const timeoutId = setTimeout(performSearch, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [pdfDoc, searchText, currentPage, onPageChange]);

  // Navigate to next match
  const nextMatch = useCallback(() => {
    if (matches.length === 0) return;

    const newIndex = (currentMatchIndex + 1) % matches.length;
    setCurrentMatchIndex(newIndex);
    const match = matches[newIndex];
    if (match.pageNumber !== currentPage) {
      onPageChange(match.pageNumber);
    }
  }, [matches, currentMatchIndex, currentPage, onPageChange]);

  // Navigate to previous match
  const previousMatch = useCallback(() => {
    if (matches.length === 0) return;

    const newIndex = currentMatchIndex === 0 ? matches.length - 1 : currentMatchIndex - 1;
    setCurrentMatchIndex(newIndex);
    const match = matches[newIndex];
    if (match.pageNumber !== currentPage) {
      onPageChange(match.pageNumber);
    }
  }, [matches, currentMatchIndex, currentPage, onPageChange]);

  // Clear cache when PDF changes
  useEffect(() => {
    pageTextCache.current.clear();
  }, [pdfDoc]);

  return {
    matches,
    currentMatchIndex,
    totalMatches: matches.length,
    isSearching,
    nextMatch,
    previousMatch,
  };
}
