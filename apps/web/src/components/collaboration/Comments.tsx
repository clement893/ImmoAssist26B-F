/** * Comments Component * Comment system with replies and reactions */ 'use client';
import { useState } from 'react';
import { clsx } from 'clsx';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { Send, Reply, MoreVertical, Heart, ThumbsUp } from 'lucide-react';
import { logger } from '@/lib/logger';
import Dropdown from '@/components/ui/Dropdown';
import type { DropdownItem } from '@/components/ui/Dropdown';
export interface Comment {
  id: string;
  author: { id: string; name: string; avatar?: string };
  content: string;
  timestamp: string;
  replies?: Comment[];
  reactions?: { like: number; heart: number };
  edited?: boolean;
}
export interface CommentsProps {
  comments?: Comment[];
  currentUser?: { id: string; name: string; avatar?: string };
  onSubmit?: (content: string, parentId?: string) => Promise<Comment>;
  onEdit?: (id: string, content: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onReact?: (id: string, reaction: 'like' | 'heart') => Promise<void>;
  className?: string;
}
export default function Comments({
  comments = [],
  currentUser,
  onSubmit,
  onEdit,
  onDelete,
  onReact,
  className,
}: CommentsProps) {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setLoading(true);
    try {
      await onSubmit?.(newComment);
      setNewComment('');
    } finally {
      setLoading(false);
    }
  };
  const handleReply = async (parentId: string) => {
    if (!replyContent.trim()) return;
    setLoading(true);
    try {
      await onSubmit?.(replyContent, parentId);
      setReplyingTo(null);
      setReplyContent('');
    } finally {
      setLoading(false);
    }
  };
  const handleEdit = async (id: string) => {
    if (!editContent.trim()) return;
    setLoading(true);
    try {
      await onEdit?.(id, editContent);
      setEditingId(null);
      setEditContent('');
    } finally {
      setLoading(false);
    }
  };
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };
  const renderComment = (comment: Comment, depth = 0) => {
    const isEditing = editingId === comment.id;
    const isReplying = replyingTo === comment.id;
    const dropdownItems: DropdownItem[] = [
      ...(onEdit && currentUser?.id === comment.author.id
        ? [
            {
              label: 'Edit',
              onClick: () => {
                setEditingId(comment.id);
                setEditContent(comment.content);
              },
            },
          ]
        : []),
      ...(onDelete && currentUser?.id === comment.author.id
        ? [
            {
              label: 'Delete',
              onClick: () => {
                if (confirm('Are you sure you want to delete this comment?')) {
                  onDelete(comment.id);
                }
              },
            },
          ]
        : []),
      { label: 'Report', onClick: () => logger.info('Report comment:', { id: comment.id }) },
    ];
    return (
      <div
        key={comment.id}
        className={clsx('space-y-3', depth > 0 && 'ml-8 pl-4 border-l-2 border-border')}
      >
        {' '}
        <div className="flex items-start gap-3">
          {' '}
          <Avatar src={comment.author.avatar} name={comment.author.name} size="sm" />{' '}
          <div className="flex-1 min-w-0">
            {' '}
            <div className="flex items-center gap-2 mb-1">
              {' '}
              <span className="font-medium text-foreground"> {comment.author.name} </span>{' '}
              <span className="text-xs text-muted-foreground">
                {' '}
                {formatTimestamp(comment.timestamp)}{' '}
              </span>{' '}
              {comment.edited && <Badge variant="default"> Edited </Badge>}{' '}
            </div>{' '}
            {isEditing ? (
              <div className="space-y-2">
                {' '}
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  className={clsx(
                    'w-full px-3 py-2 border rounded-lg text-sm',
                    'bg-background',
                    'text-foreground',
                    'border-border',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400'
                  )}
                />{' '}
                <div className="flex items-center gap-2">
                  {' '}
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleEdit(comment.id)}
                    loading={loading}
                  >
                    {' '}
                    Save{' '}
                  </Button>{' '}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingId(null);
                      setEditContent('');
                    }}
                  >
                    {' '}
                    Cancel{' '}
                  </Button>{' '}
                </div>{' '}
              </div>
            ) : (
              <>
                {' '}
                <p className="text-sm text-foreground mb-2 whitespace-pre-wrap">
                  {' '}
                  {comment.content}{' '}
                </p>{' '}
                <div className="flex items-center gap-4">
                  {' '}
                  {onReact && (
                    <>
                      {' '}
                      <button
                        onClick={() => onReact(comment.id, 'like')}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400"
                      >
                        {' '}
                        <ThumbsUp className="w-3 h-3" /> {comment.reactions?.like || 0}{' '}
                      </button>{' '}
                      <button
                        onClick={() => onReact(comment.id, 'heart')}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-danger-600 dark:hover:text-danger-400"
                      >
                        {' '}
                        <Heart className="w-3 h-3" /> {comment.reactions?.heart || 0}{' '}
                      </button>{' '}
                    </>
                  )}{' '}
                  {onSubmit && (
                    <button
                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      {' '}
                      <Reply className="w-3 h-3" /> Reply{' '}
                    </button>
                  )}{' '}
                  <Dropdown
                    trigger={<MoreVertical className="w-4 h-4" />}
                    items={dropdownItems}
                  />{' '}
                </div>{' '}
              </>
            )}{' '}
          </div>{' '}
        </div>{' '}
        {/* Reply Form */}{' '}
        {isReplying && (
          <div className="ml-11 space-y-2">
            {' '}
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              rows={2}
              className={clsx(
                'w-full px-3 py-2 border rounded-lg text-sm',
                'bg-background',
                'text-foreground',
                'border-border',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400'
              )}
            />{' '}
            <div className="flex items-center gap-2">
              {' '}
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleReply(comment.id)}
                loading={loading}
              >
                {' '}
                <span className="flex items-center gap-2">
                  {' '}
                  <Send className="w-3 h-3" /> Reply{' '}
                </span>{' '}
              </Button>{' '}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyContent('');
                }}
              >
                {' '}
                Cancel{' '}
              </Button>{' '}
            </div>{' '}
          </div>
        )}{' '}
        {/* Replies */}{' '}
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-3 mt-3">
            {' '}
            {comment.replies.map((reply) => renderComment(reply, depth + 1))}{' '}
          </div>
        )}{' '}
      </div>
    );
  };
  return (
    <Card className={clsx('bg-background', className)}>
      {' '}
      <div className="space-y-6">
        {' '}
        <h3 className="text-lg font-semibold text-foreground">
          {' '}
          Comments ({comments.length}){' '}
        </h3>{' '}
        {/* New Comment Form */}{' '}
        {onSubmit && currentUser && (
          <form onSubmit={handleSubmit} className="space-y-3">
            {' '}
            <div className="flex items-start gap-3">
              {' '}
              <Avatar src={currentUser.avatar} name={currentUser.name} size="sm" />{' '}
              <div className="flex-1">
                {' '}
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  rows={3}
                  className={clsx(
                    'w-full px-4 py-2 border rounded-lg text-sm',
                    'bg-background',
                    'text-foreground',
                    'border-border',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400'
                  )}
                />{' '}
                <div className="flex items-center justify-end mt-2">
                  {' '}
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    loading={loading}
                    disabled={!newComment.trim()}
                  >
                    {' '}
                    <span className="flex items-center gap-2">
                      {' '}
                      <Send className="w-4 h-4" /> Post Comment{' '}
                    </span>{' '}
                  </Button>{' '}
                </div>{' '}
              </div>{' '}
            </div>{' '}
          </form>
        )}{' '}
        {/* Comments List */}{' '}
        {comments.length === 0 ? (
          <div className="text-center py-8">
            {' '}
            <p className="text-muted-foreground">No comments yet</p>{' '}
          </div>
        ) : (
          <div className="space-y-6"> {comments.map((comment) => renderComment(comment))} </div>
        )}{' '}
      </div>{' '}
    </Card>
  );
}
