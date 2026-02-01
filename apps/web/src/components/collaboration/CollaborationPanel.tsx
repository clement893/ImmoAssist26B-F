/** * Collaboration Panel Component * Real-time collaboration features */ 'use client';
import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Users, Video, MessageSquare, Share2, Eye, Edit } from 'lucide-react';
export interface Collaborator {
  id: string;
  name: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer';
  status: 'online' | 'offline' | 'away';
  cursor?: { x: number; y: number };
  isTyping?: boolean;
}
export interface CollaborationPanelProps {
  collaborators?: Collaborator[];
  currentUser?: Collaborator;
  onInvite?: () => void;
  onShare?: () => void;
  onStartCall?: () => void;
  className?: string;
}
export default function CollaborationPanel({
  collaborators = [],
  currentUser,
  onInvite,
  onShare,
  onStartCall,
  className,
}: CollaborationPanelProps) {
  const [onlineCount, setOnlineCount] = useState(0);
  useEffect(() => {
    const online = collaborators.filter((c) => c.status === 'online').length;
    setOnlineCount(online);
  }, [collaborators]);
  const getStatusColor = (status: Collaborator['status']) => {
    switch (status) {
      case 'online':
        return 'bg-success-500';
      case 'away':
        return 'bg-warning-500';
      default:
        return 'bg-muted';
    }
  };
  const getRoleBadge = (role: Collaborator['role']) => {
    const variants = {
      owner: 'error' as const,
      editor: 'info' as const,
      viewer: 'default' as const,
    };
    return <Badge variant={variants[role]}>{role}</Badge>;
  };
  return (
    <Card className={clsx('bg-background', className)}>
      {' '}
      <div className="space-y-6">
        {' '}
        {/* Header */}{' '}
        <div className="flex items-center justify-between">
          {' '}
          <div className="flex items-center gap-2">
            {' '}
            <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />{' '}
            <h3 className="text-lg font-semibold text-foreground"> Collaboration </h3>{' '}
            {onlineCount > 0 && <Badge variant="success"> {onlineCount} online </Badge>}{' '}
          </div>{' '}
          <div className="flex items-center gap-2">
            {' '}
            {onStartCall && (
              <Button variant="outline" size="sm" onClick={onStartCall}>
                {' '}
                <span className="flex items-center gap-2">
                  {' '}
                  <Video className="w-4 h-4" /> Call{' '}
                </span>{' '}
              </Button>
            )}{' '}
            {onShare && (
              <Button variant="outline" size="sm" onClick={onShare}>
                {' '}
                <span className="flex items-center gap-2">
                  {' '}
                  <Share2 className="w-4 h-4" /> Share{' '}
                </span>{' '}
              </Button>
            )}{' '}
          </div>{' '}
        </div>{' '}
        {/* Collaborators List */}{' '}
        {collaborators.length === 0 ? (
          <div className="text-center py-8">
            {' '}
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />{' '}
            <p className="text-muted-foreground mb-4">No collaborators yet</p>{' '}
            {onInvite && (
              <Button variant="primary" onClick={onInvite}>
                {' '}
                <span className="flex items-center gap-2">
                  {' '}
                  <Users className="w-4 h-4" /> Invite Collaborators{' '}
                </span>{' '}
              </Button>
            )}{' '}
          </div>
        ) : (
          <div className="space-y-3">
            {' '}
            {collaborators.map((collaborator) => (
              <div
                key={collaborator.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted dark:hover:bg-background transition-modern" // UI Revamp - Transition moderne
              >
                {' '}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {' '}
                  <div className="relative">
                    {' '}
                    <Avatar src={collaborator.avatar} name={collaborator.name} size="md" />{' '}
                    <div
                      className={clsx(
                        'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background',
                        getStatusColor(collaborator.status)
                      )}
                    />{' '}
                  </div>{' '}
                  <div className="flex-1 min-w-0">
                    {' '}
                    <div className="flex items-center gap-2 mb-1">
                      {' '}
                      <span className="font-medium text-foreground truncate">
                        {' '}
                        {collaborator.name} {currentUser?.id === collaborator.id && ' (You)'}{' '}
                      </span>{' '}
                      {getRoleBadge(collaborator.role)}{' '}
                    </div>{' '}
                    {collaborator.isTyping && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        {' '}
                        <MessageSquare className="w-3 h-3" /> typing...{' '}
                      </div>
                    )}{' '}
                    {collaborator.cursor && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        {' '}
                        <Edit className="w-3 h-3" /> editing{' '}
                      </div>
                    )}{' '}
                  </div>{' '}
                </div>{' '}
                <div className="flex items-center gap-2">
                  {' '}
                  {collaborator.role === 'editor' && (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  )}{' '}
                </div>{' '}
              </div>
            ))}{' '}
          </div>
        )}{' '}
        {/* Invite Button */}{' '}
        {collaborators.length > 0 && onInvite && (
          <div className="pt-4 border-t border-border">
            {' '}
            <Button variant="outline" fullWidth onClick={onInvite}>
              {' '}
              <span className="flex items-center gap-2">
                {' '}
                <Users className="w-4 h-4" /> Invite More People{' '}
              </span>{' '}
            </Button>{' '}
          </div>
        )}{' '}
      </div>{' '}
    </Card>
  );
}
