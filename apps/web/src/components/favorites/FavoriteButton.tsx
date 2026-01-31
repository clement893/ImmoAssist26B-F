'use client';
import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Heart } from 'lucide-react';
import Button from '@/components/ui/Button';
import { apiClient } from '@/lib/api/client';
import { useToast } from '@/components/ui';
import { getErrorMessage } from '@/lib/errors';
interface FavoriteButtonProps {
  entityType: string;
  entityId: number;
  className?: string;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
}
export function FavoriteButton({
  entityType,
  entityId,
  className = '',
  showCount = false,
  size = 'md',
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const { showToast } = useToast();
  useEffect(() => {
    checkFavoriteStatus();
    if (showCount) {
      fetchFavoritesCount();
    }
  }, [entityType, entityId, showCount]);
  const checkFavoriteStatus = async () => {
    try {
      const response = await apiClient.get<{ is_favorited: boolean }>(
        `/api/v1/favorites/check/${entityType}/${entityId}`
      );
      if (response.data) {
        setIsFavorited(response.data.is_favorited);
      }
    } catch (error) {
      logger.error('', 'Failed to check favorite status:', error);
    }
  };
  const fetchFavoritesCount = async () => {
    try {
      const response = await apiClient.get<{ count: number }>(
        `/api/v1/favorites/count/${entityType}/${entityId}`
      );
      if (response.data) {
        setFavoritesCount(response.data.count);
      }
    } catch (error) {
      logger.error('', 'Failed to fetch favorites count:', error);
    }
  };
  const handleToggle = async () => {
    setIsLoading(true);
    try {
      if (isFavorited) {
        await apiClient.delete(`/v1/favorites/${entityType}/${entityId}`);
        setIsFavorited(false);
        if (showCount) {
          setFavoritesCount((prev) => Math.max(0, prev - 1));
        }
        showToast({ message: 'Removed from favorites', type: 'success' });
      } else {
        await apiClient.post('/v1/favorites', { entity_type: entityType, entity_id: entityId });
        setIsFavorited(true);
        if (showCount) {
          setFavoritesCount((prev) => prev + 1);
        }
        showToast({ message: 'Added to favorites', type: 'success' });
      }
    } catch (error: unknown) {
      showToast({ message: getErrorMessage(error) || 'Failed to update favorite', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Button
      variant={isFavorited ? 'primary' : 'outline'}
      size={size}
      onClick={handleToggle}
      disabled={isLoading}
      className={className}
    >
      {' '}
      <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />{' '}
      {showCount && favoritesCount > 0 && <span className="ml-1">{favoritesCount}</span>}{' '}
    </Button>
  );
}
