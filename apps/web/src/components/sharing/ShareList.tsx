'use client';
import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Share2, User, Users, Lock, X, ExternalLink } from 'lucide-react';
import Card from '@/components/ui/Card';
import { apiClient } from '@/lib/api/client';
import { useToast } from '@/components/ui';
import { formatDistanceToNow } from '@/lib/utils/dateUtils';
import { getErrorMessage } from '@/lib/errors';
interface Share {
  id: number;
  entity_type: string;
  entity_id: number;
  shared_with_type: string;
  shared_with_id: number;
  permission_level: 'view' | 'comment' | 'edit' | 'admin';
  created_by_id: number;
  expires_at?: string;
  requires_password: boolean;
  is_public_link: boolean;
  share_token?: string;
  created_at: string;
}
interface ShareListProps {
  entityType: string;
  entityId: number;
  className?: string;
}
export function ShareList({ entityType, entityId, className = '' }: ShareListProps) {
  const [shares, setShares] = useState<Share[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  useEffect(() => {
    fetchShares();
  }, [entityType, entityId]);
  const fetchShares = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<Share[]>(
        `/api/v1/shares/shares/entity/${entityType}/${entityId}`
      );
      if (response.data) {
        setShares(response.data);
      }
    } catch (error) {
      logger.error('', 'Failed to fetch shares:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleDelete = async (shareId: number) => {
    if (!confirm('Are you sure you want to remove this share?')) return;
    try {
      await apiClient.delete(`/v1/shares/${shareId}`);
      setShares(shares.filter((s) => s.id !== shareId));
      showToast({ message: 'Share removed successfully', type: 'success' });
    } catch (error: unknown) {
      showToast({ message: getErrorMessage(error) || 'Failed to remove share', type: 'error' });
    }
  };
  const copyShareLink = (shareToken: string) => {
    const link = `${window.location.origin}/share/${shareToken}`;
    navigator.clipboard.writeText(link);
    showToast({ message: 'Share link copied to clipboard', type: 'success' });
  };
  if (isLoading) {
    return (
      <Card className={className}>
        {' '}
        <div className="text-center py-8 text-muted-foreground">Loading shares...</div>{' '}
      </Card>
    );
  }
  return (
    <Card className={className}>
      {' '}
      <div className="flex items-center justify-between mb-4">
        {' '}
        <h3 className="text-lg font-semibold">Shared With</h3>{' '}
        <span className="text-sm text-muted-foreground">
          {shares.length} share{shares.length !== 1 ? 's' : ''}
        </span>{' '}
      </div>{' '}
      {shares.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {' '}
          <Share2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />{' '}
          <p>Not shared with anyone</p>{' '}
        </div>
      ) : (
        <div className="space-y-3">
          {' '}
          {shares.map((share) => (
            <div
              key={share.id}
              className="flex items-center justify-between p-3 border border-border rounded-lg"
            >
              {' '}
              <div className="flex items-center gap-3">
                {' '}
                {share.is_public_link ? (
                  <Share2 className="h-5 w-5 text-primary-500" />
                ) : share.shared_with_type === 'user' ? (
                  <User className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Users className="h-5 w-5 text-muted-foreground" />
                )}{' '}
                <div>
                  {' '}
                  <div className="flex items-center gap-2">
                    {' '}
                    <span className="font-medium text-sm">
                      {' '}
                      {share.is_public_link
                        ? 'Public Link'
                        : `${share.shared_with_type} #${share.shared_with_id}`}{' '}
                    </span>{' '}
                    <span className="text-xs bg-muted px-2 py-0.5 rounded capitalize">
                      {' '}
                      {share.permission_level}{' '}
                    </span>{' '}
                    {share.requires_password && (
                      <Lock className="h-3 w-3 text-muted-foreground" />
                    )}{' '}
                  </div>{' '}
                  {share.expires_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {' '}
                      Expires {formatDistanceToNow(new Date(share.expires_at))}{' '}
                    </p>
                  )}{' '}
                </div>{' '}
              </div>{' '}
              <div className="flex items-center gap-2">
                {' '}
                {share.is_public_link && share.share_token && (
                  <button
                    onClick={() => copyShareLink(share.share_token!)}
                    className="p-1 hover:bg-muted dark:hover:bg-muted rounded"
                    title="Copy share link"
                  >
                    {' '}
                    <ExternalLink className="h-4 w-4" />{' '}
                  </button>
                )}{' '}
                <button
                  onClick={() => handleDelete(share.id)}
                  className="p-1 hover:bg-error-50 dark:hover:bg-error-900/20 rounded text-error-500"
                  title="Remove share"
                >
                  {' '}
                  <X className="h-4 w-4" />{' '}
                </button>{' '}
              </div>{' '}
            </div>
          ))}{' '}
        </div>
      )}{' '}
    </Card>
  );
}
