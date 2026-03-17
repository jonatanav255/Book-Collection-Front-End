import { useState, useEffect, useRef } from 'react';
import { booksApi, getAuthHeaders } from '@/services/api';

export function useBookCover(bookId: string, coverUrl?: string | null) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  const googleCoverUrl = coverUrl
    ? coverUrl.replace('zoom=1', 'zoom=2').replace('&edge=curl', '')
    : null;

  // When falling back to the backend thumbnail, fetch it with auth headers
  // and create a blob URL so the <img> tag can display it without credentials issues.
  const needsAuthFetch = imageError || !googleCoverUrl;

  useEffect(() => {
    if (!needsAuthFetch) return;

    let cancelled = false;
    const thumbnailUrl = booksApi.getThumbnailUrl(bookId);

    fetch(thumbnailUrl, { headers: getAuthHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch thumbnail');
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        setBlobUrl(url);
      })
      .catch(() => {
        // Thumbnail fetch failed; leave blobUrl null so the UI can show a fallback.
      });

    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [needsAuthFetch, bookId]);

  const imageUrl = needsAuthFetch
    ? blobUrl ?? ''
    : googleCoverUrl!;

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    if (googleCoverUrl && !imageError && img.naturalWidth < 150) {
      setImageError(true);
    } else {
      setImageLoaded(true);
    }
  };

  const handleError = () => {
    setImageError(true);
  };

  return { imageUrl, imageLoaded, handleLoad, handleError };
}
