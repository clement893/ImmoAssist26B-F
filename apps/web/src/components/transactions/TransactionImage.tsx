'use client';

import { useState, useEffect } from 'react';
import { transactionsAPI } from '@/lib/api';

interface TransactionImageProps {
  src: string;
  alt: string;
  transactionId: number;
  documentId: number;
  className?: string;
  fallback?: string;
}

/**
 * Component that automatically refreshes expired S3 presigned URLs
 */
export default function TransactionImage({
  src,
  alt,
  transactionId,
  documentId,
  className = '',
  fallback,
}: TransactionImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setImageSrc(src);
    setHasError(false);
  }, [src]);

  const handleError = async () => {
    if (hasError || isRefreshing) {
      // Already tried to refresh or currently refreshing
      return;
    }

    // Try to refresh the URL
    setIsRefreshing(true);
    try {
      const response = await transactionsAPI.refreshDocumentUrl(transactionId, documentId);
      if (response.data?.url) {
        setImageSrc(response.data.url);
        setHasError(false);
      } else {
        setHasError(true);
      }
    } catch (error) {
      console.error('Failed to refresh image URL:', error);
      setHasError(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (hasError && fallback) {
    return (
      <div className={`bg-muted flex items-center justify-center ${className}`}>
        <span className="text-muted-foreground text-sm">Image non disponible</span>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={handleError}
      loading="lazy"
    />
  );
}
