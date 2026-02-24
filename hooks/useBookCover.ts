import { useState } from 'react';
import { booksApi } from '@/services/api';

export function useBookCover(bookId: string, coverUrl?: string | null) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const googleCoverUrl = coverUrl
    ? coverUrl.replace('zoom=1', 'zoom=2').replace('&edge=curl', '')
    : null;

  const imageUrl = imageError || !googleCoverUrl
    ? booksApi.getThumbnailUrl(bookId)
    : googleCoverUrl;

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
