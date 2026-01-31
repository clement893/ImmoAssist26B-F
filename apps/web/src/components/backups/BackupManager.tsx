'use client';
import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import {
  Database,
  FileText,
  Archive,
  Download,
  Trash2,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { apiClient } from '@/lib/api/client';
import { useToast } from '@/components/ui';
import { getErrorMessage } from '@/lib/errors';
interface Backup {
  id: number;
  name: string;
  description?: string;
  backup_type: string;
  file_path?: string;
  file_size?: number;
  status: string;
  started_at?: string;
  completed_at?: string;
  expires_at?: string;
  is_automatic: boolean;
  created_at: string;
}
interface BackupManagerProps {
  className?: string;
}
const typeIcons = { database: Database, files: FileText, full: Archive };
const statusIcons = {
  pending: Clock,
  in_progress: Clock,
  completed: CheckCircle,
  failed: XCircle,
  expired: XCircle,
};
const statusColors = {
  pending: 'text-warning-600 dark:text-warning-400',
  in_progress: 'text-primary-600 dark:text-primary-400',
  completed: 'text-success-600 dark:text-success-400',
  failed: 'text-error-600 dark:text-error-400',
  expired: 'text-muted-foreground',
};
export function BackupManager({ className = '' }: BackupManagerProps) {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  useEffect(() => {
    fetchBackups();
  }, []);
  const fetchBackups = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<Backup[]>('/v1/backups');
      if (response.data) {
        setBackups(response.data);
      }
    } catch (error) {
      logger.error('', 'Failed to fetch backups:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleRestore = async (backupId: number) => {
    if (
      !confirm('Are you sure you want to restore from this backup? This action cannot be undone.')
    )
      return;
    try {
      await apiClient.post(`/v1/backups/${backupId}/restore`);
      showToast({ message: 'Restore operation started', type: 'success' });
    } catch (error: unknown) {
      showToast({ message: getErrorMessage(error) || 'Failed to start restore', type: 'error' });
    }
  };
  const handleDelete = async (backupId: number) => {
    if (!confirm('Are you sure you want to delete this backup?')) return;
    try {
      await apiClient.delete(`/v1/backups/${backupId}`);
      showToast({ message: 'Backup deleted successfully', type: 'success' });
      fetchBackups();
    } catch (error: unknown) {
      showToast({ message: getErrorMessage(error) || 'Failed to delete backup', type: 'error' });
    }
  };
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };
  if (isLoading) {
    return (
      <Card className={className}>
        {' '}
        <div className="text-center py-8 text-muted-foreground">Loading backups...</div>{' '}
      </Card>
    );
  }
  return (
    <Card className={className}>
      {' '}
      <div className="flex items-center justify-between mb-4">
        {' '}
        <h3 className="text-lg font-semibold flex items-center gap-2">
          {' '}
          <Archive className="h-5 w-5" /> Backups{' '}
        </h3>{' '}
        <Button variant="primary" size="sm">
          {' '}
          Create Backup{' '}
        </Button>{' '}
      </div>{' '}
      {backups.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {' '}
          <Archive className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />{' '}
          <p>No backups found</p>{' '}
        </div>
      ) : (
        <div className="space-y-3">
          {' '}
          {backups.map((backup) => {
            const TypeIcon = typeIcons[backup.backup_type as keyof typeof typeIcons] || Archive;
            const StatusIcon = statusIcons[backup.status as keyof typeof statusIcons] || Clock;
            const statusColor =
              statusColors[backup.status as keyof typeof statusColors] || 'text-muted-foreground';
            return (
              <div key={backup.id} className="p-4 border border-border rounded-lg">
                {' '}
                <div className="flex items-start justify-between mb-2">
                  {' '}
                  <div className="flex-1">
                    {' '}
                    <div className="flex items-center gap-2 mb-1">
                      {' '}
                      <TypeIcon className="h-4 w-4 text-muted-foreground" />{' '}
                      <span className="font-medium">{backup.name}</span>{' '}
                      <StatusIcon className={`h-4 w-4 ${statusColor}`} />{' '}
                      <span className={`text-xs capitalize ${statusColor}`}>{backup.status}</span>{' '}
                      {backup.is_automatic && (
                        <span className="text-xs bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-2 py-0.5 rounded">
                          {' '}
                          Auto{' '}
                        </span>
                      )}{' '}
                    </div>{' '}
                    {backup.description && (
                      <p className="text-sm text-muted-foreground mb-2"> {backup.description} </p>
                    )}{' '}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {' '}
                      <span>Type: {backup.backup_type}</span>{' '}
                      {backup.file_size && <span>Size: {formatFileSize(backup.file_size)}</span>}{' '}
                      {backup.completed_at && (
                        <span>Completed: {new Date(backup.completed_at).toLocaleString()}</span>
                      )}{' '}
                      {backup.expires_at && (
                        <span>Expires: {new Date(backup.expires_at).toLocaleString()}</span>
                      )}{' '}
                    </div>{' '}
                  </div>{' '}
                  <div className="flex gap-1">
                    {' '}
                    {backup.status === 'completed' && (
                      <>
                        {' '}
                        <button
                          onClick={() => handleRestore(backup.id)}
                          className="p-1 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded text-primary-500"
                          title="Restore"
                        >
                          {' '}
                          <RotateCcw className="h-4 w-4" />{' '}
                        </button>{' '}
                        {backup.file_path && (
                          <button
                            className="p-1 hover:bg-success-50 dark:hover:bg-success-900/20 rounded text-success-500"
                            title="Download"
                          >
                            {' '}
                            <Download className="h-4 w-4" />{' '}
                          </button>
                        )}{' '}
                      </>
                    )}{' '}
                    <button
                      onClick={() => handleDelete(backup.id)}
                      className="p-1 hover:bg-error-50 dark:hover:bg-error-900/20 rounded text-error-500"
                      title="Delete"
                    >
                      {' '}
                      <Trash2 className="h-4 w-4" />{' '}
                    </button>{' '}
                  </div>{' '}
                </div>{' '}
              </div>
            );
          })}{' '}
        </div>
      )}{' '}
    </Card>
  );
}
