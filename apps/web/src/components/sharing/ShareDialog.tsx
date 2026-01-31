'use client';
import { useState } from 'react';
import { Share2, User, Users, Lock, Calendar, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { apiClient } from '@/lib/api/client';
import { useToast } from '@/components/ui';
import { getErrorMessage } from '@/lib/errors';
interface ShareDialogProps {
  entityType: string;
  entityId: number;
  onClose: () => void;
  onShare?: () => void;
}
type PermissionLevel = 'view' | 'comment' | 'edit' | 'admin';
type ShareWithType = 'user' | 'team';
export function ShareDialog({ entityType, entityId, onClose, onShare }: ShareDialogProps) {
  const [shareWithType, setShareWithType] = useState<ShareWithType>('user');
  const [shareWithId, setShareWithId] = useState('');
  const [permissionLevel, setPermissionLevel] = useState<PermissionLevel>('view');
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [isPublicLink, setIsPublicLink] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const { showToast } = useToast();
  const handleShare = async () => {
    if (!shareWithId.trim() && !isPublicLink) {
      showToast({ message: 'Please enter a user/team ID or enable public link', type: 'error' });
      return;
    }
    if (requiresPassword && !password.trim()) {
      showToast({ message: 'Password is required', type: 'error' });
      return;
    }
    setIsSharing(true);
    try {
      await apiClient.post('/v1/shares', {
        entity_type: entityType,
        entity_id: entityId,
        shared_with_type: isPublicLink ? 'public' : shareWithType,
        shared_with_id: isPublicLink ? 0 : parseInt(shareWithId),
        permission_level: permissionLevel,
        requires_password: requiresPassword,
        password: requiresPassword ? password : undefined,
        is_public_link: isPublicLink,
        expires_at: expiresAt || undefined,
      });
      showToast({
        message: isPublicLink ? 'Public link created successfully' : 'Shared successfully',
        type: 'success',
      });
      onShare?.();
      onClose();
    } catch (error: unknown) {
      showToast({ message: getErrorMessage(error) || 'Failed to share', type: 'error' });
    } finally {
      setIsSharing(false);
    }
  };
  return (
    <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50">
      {' '}
      <div className="bg-background rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {' '}
        <div className="flex items-center justify-between mb-4">
          {' '}
          <div className="flex items-center gap-2">
            {' '}
            <Share2 className="h-5 w-5 text-primary-500" />{' '}
            <h3 className="text-lg font-semibold">Share</h3>{' '}
          </div>{' '}
          <button onClick={onClose} className="p-1 hover:bg-muted dark:hover:bg-muted rounded">
            {' '}
            <X className="h-4 w-4" />{' '}
          </button>{' '}
        </div>{' '}
        <div className="space-y-4">
          {' '}
          {/* Share type */}{' '}
          <div>
            {' '}
            <label className="block text-sm font-medium text-foreground mb-2">
              {' '}
              Share with{' '}
            </label>{' '}
            <div className="flex gap-2">
              {' '}
              <button
                onClick={() => {
                  setShareWithType('user');
                  setIsPublicLink(false);
                }}
                className={`flex-1 p-2 border rounded-lg ${shareWithType === 'user' && !isPublicLink ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-border'}`}
              >
                {' '}
                <User className="h-4 w-4 mx-auto mb-1" /> <span className="text-xs">User</span>{' '}
              </button>{' '}
              <button
                onClick={() => {
                  setShareWithType('team');
                  setIsPublicLink(false);
                }}
                className={`flex-1 p-2 border rounded-lg ${shareWithType === 'team' && !isPublicLink ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-border'}`}
              >
                {' '}
                <Users className="h-4 w-4 mx-auto mb-1" />{' '}
                <span className="text-xs">Team</span>{' '}
              </button>{' '}
              <button
                onClick={() => setIsPublicLink(!isPublicLink)}
                className={`flex-1 p-2 border rounded-lg ${isPublicLink ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-border'}`}
              >
                {' '}
                <Share2 className="h-4 w-4 mx-auto mb-1" />{' '}
                <span className="text-xs">Public Link</span>{' '}
              </button>{' '}
            </div>{' '}
          </div>{' '}
          {/* Share with ID */}{' '}
          {!isPublicLink && (
            <Input
              label={shareWithType === 'user' ? 'User ID' : 'Team ID'}
              type="number"
              value={shareWithId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShareWithId(e.target.value)}
              placeholder={`Enter ${shareWithType} ID`}
            />
          )}{' '}
          {/* Permission level */}{' '}
          <div>
            {' '}
            <label className="block text-sm font-medium text-foreground mb-2">
              {' '}
              Permission Level{' '}
            </label>{' '}
            <select
              value={permissionLevel}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setPermissionLevel(e.target.value as PermissionLevel)
              }
              className="w-full px-3 py-2 border border-border rounded-lg bg-background"
            >
              {' '}
              <option value="view">View Only</option>{' '}
              <option value="comment">View & Comment</option>{' '}
              <option value="edit">View, Comment & Edit</option>{' '}
              <option value="admin">Admin (Full Access)</option>{' '}
            </select>{' '}
          </div>{' '}
          {/* Password protection */}{' '}
          <div className="flex items-center gap-2">
            {' '}
            <input
              type="checkbox"
              id="requiresPassword"
              checked={requiresPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setRequiresPassword(e.target.checked)
              }
              className="rounded"
            />{' '}
            <label
              htmlFor="requiresPassword"
              className="text-sm text-foreground flex items-center gap-1"
            >
              {' '}
              <Lock className="h-3 w-3" /> Require password{' '}
            </label>{' '}
          </div>{' '}
          {requiresPassword && (
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          )}{' '}
          {/* Expiration */}{' '}
          <div>
            {' '}
            <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-1">
              {' '}
              <Calendar className="h-3 w-3" /> Expires At (Optional){' '}
            </label>{' '}
            <Input
              type="datetime-local"
              value={expiresAt}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExpiresAt(e.target.value)}
            />{' '}
          </div>{' '}
          {/* Actions */}{' '}
          <div className="flex gap-2 pt-4">
            {' '}
            <Button variant="outline" onClick={onClose} className="flex-1">
              {' '}
              Cancel{' '}
            </Button>{' '}
            <Button variant="primary" onClick={handleShare} loading={isSharing} className="flex-1">
              {' '}
              Share{' '}
            </Button>{' '}
          </div>{' '}
        </div>{' '}
      </div>{' '}
    </div>
  );
}
