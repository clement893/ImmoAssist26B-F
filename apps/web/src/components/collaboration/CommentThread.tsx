'use client';

import { useState } from 'react';
import { Reply, Heart, ThumbsUp, ThumbsDown, Smile, Edit2, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import { SafeHTML } from '@/components/ui/SafeHTML';
import { apiClient } from '@/lib/api/client';
import { useToast } from '@/components/ui';
import { getErrorMessage } from '@/lib/errors';
import { formatDistanceToNow } from '@/lib/utils/dateUtils';

interface Comment {
  id: number;
  content: string;
  content_html?: string;
  user_id: number;
  user_name?: string;
  user_email?: string;
  parent_id?: number;
  is_edited: boolean;
  reactions_count: number;
  created_at: string;
  updated_at: string;
  replies: Comment[];
}

interface CommentThreadProps {
  comment: Comment;
  entityType: string;
  entityId: number;
  currentUserId?: number;
  onUpdate?: () => void;
  level?: number;
}

const REACTION_TYPES = ['like', 'love', 'thumbs_up', 'thumbs_down'] as const;
type ReactionType = (typeof REACTION_TYPES)[number];

const getReactionIcon = (type: ReactionType) => {
  switch (type) {
    case 'like':
      return <ThumbsUp className="h-4 w-4" />;
    case 'love':
      return <Heart className="h-4 w-4" />;
    case 'thumbs_up':
      return <ThumbsUp className="h-4 w-4" />;
    case 'thumbs_down':
      return <ThumbsDown className="h-4 w-4" />;
    default:
      return <Smile className="h-4 w-4" />;
  }
};

export function CommentThread({
  comment,
  entityType,
  entityId,
  currentUserId,
  onUpdate,
  level = 0,
}: CommentThreadProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [editContent, setEditContent] = useState(comment.content);
  const [showReactions, setShowReactions] = useState(false);
  const { showToast } = useToast();

  const handleReply = async () => {
    if (!replyContent.trim()) return;

    try {
      await apiClient.post('/v1/comments', {
        content: replyContent.trim(),
        entity_type: entityType,
        entity_id: entityId,
        parent_id: comment.id,
      });
      setReplyContent('');
      setIsReplying(false);
      onUpdate?.();
      showToast({ message: 'Reply posted successfully', type: 'success' });
    } catch (error: unknown) {
      showToast({ message: getErrorMessage(error) || 'Failed to post reply', type: 'error' });
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim()) return;

    try {
      await apiClient.put(`/v1/comments/${comment.id}`, {
        content: editContent.trim(),
      });
      setIsEditing(false);
      onUpdate?.();
      showToast({ message: 'Comment updated successfully', type: 'success' });
    } catch (error: unknown) {
      showToast({ message: getErrorMessage(error) || 'Failed to update comment', type: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await apiClient.delete(`/v1/comments/${comment.id}`);
      onUpdate?.();
      showToast({ message: 'Comment deleted successfully', type: 'success' });
    } catch (error: unknown) {
      showToast({ message: getErrorMessage(error) || 'Failed to delete comment', type: 'error' });
    }
  };

  const handleReaction = async (reactionType: ReactionType) => {
    try {
      await apiClient.post(`/v1/comments/${comment.id}/reactions`, {
        reaction_type: reactionType,
      });
      onUpdate?.();
    } catch (error: unknown) {
      showToast({ message: getErrorMessage(error) || 'Failed to add reaction', type: 'error' });
    }
  };

  const canEdit = currentUserId === comment.user_id;
  const maxLevel = 3; // Maximum nesting level

  return (
    <div className={`${level > 0 ? 'ml-8 mt-4 border-l-2 border-border pl-4' : ''}`}>
      <div className="flex gap-3">
        <Avatar name={comment.user_name || comment.user_email || 'User'} size="sm" />
        <div className="flex-1">
          <div className="bg-muted rounded-lg p-3">
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="font-medium text-sm text-foreground">
                  {comment.user_name || comment.user_email || 'Anonymous'}
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  {formatDistanceToNow(new Date(comment.created_at))}
                  {comment.is_edited && ' (edited)'}
                </span>
              </div>
              {canEdit && (
                <div className="flex gap-1">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="p-1 hover:bg-muted dark:hover:bg-muted rounded"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-1 hover:bg-error-50 dark:hover:bg-error-900/20 rounded text-error-500"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEditContent(e.target.value)
                  }
                  className="w-full p-2 border border-border rounded-lg bg-background text-sm"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="primary" onClick={handleEdit}>
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-sm text-foreground whitespace-pre-wrap mb-2">
                  {comment.content_html ? (
                    <SafeHTML html={comment.content_html} />
                  ) : (
                    comment.content
                  )}
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowReactions(!showReactions)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <ThumbsUp className="h-3 w-3" />
                      {comment.reactions_count > 0 && <span>{comment.reactions_count}</span>}
                    </button>
                    {showReactions && (
                      <div className="absolute z-10 mt-8 bg-background border border-border rounded-lg shadow-standard-lg p-2 flex gap-1"> // UI Revamp - Nouveau système d'ombres
                        {REACTION_TYPES.map((type) => (
                          <button
                            key={type}
                            onClick={() => {
                              handleReaction(type);
                              setShowReactions(false);
                            }}
                            className="p-2 hover:bg-muted dark:hover:bg-muted rounded"
                            title={type}
                          >
                            {getReactionIcon(type)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {level < maxLevel && (
                    <button
                      onClick={() => setIsReplying(!isReplying)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Reply className="h-3 w-3" />
                      Reply
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {isReplying && (
            <div className="mt-3 space-y-2">
              <textarea
                value={replyContent}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setReplyContent(e.target.value)
                }
                placeholder="Write a reply..."
                className="w-full p-2 border border-border rounded-lg bg-background text-sm"
                rows={3}
              />
              <div className="flex gap-2">
                <Button size="sm" variant="primary" onClick={handleReply}>
                  Post Reply
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsReplying(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Render nested replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4">
              {comment.replies.map((reply) => (
                <CommentThread
                  key={reply.id}
                  comment={reply}
                  entityType={entityType}
                  entityId={entityId}
                  currentUserId={currentUserId}
                  onUpdate={onUpdate}
                  level={level + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
