/** * File Manager Component * File browser and manager */ 'use client';
import { useState } from 'react';
import { clsx } from 'clsx';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import {
  Folder,
  File,
  Upload,
  Download,
  Trash2,
  MoreVertical,
  Search,
  Grid,
  List,
} from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';
import type { DropdownItem } from '@/components/ui/Dropdown';
export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  modified: string;
  mimeType?: string;
  path: string;
}
export interface FileManagerProps {
  files?: FileItem[];
  currentPath?: string;
  onNavigate?: (path: string) => void;
  onUpload?: (files: File[]) => Promise<void>;
  onDownload?: (file: FileItem) => Promise<void>;
  onDelete?: (file: FileItem) => Promise<void>;
  onRename?: (file: FileItem, newName: string) => Promise<void>;
  className?: string;
}
const formatFileSize = (bytes?: number) => {
  if (!bytes) return 'N/A';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
export default function FileManager({
  files = [],
  currentPath = '/',
  onNavigate,
  onUpload,
  onDownload,
  onDelete,
  onRename,
  className,
}: FileManagerProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFiles, _setSelectedFiles] = useState<Set<string>>(new Set());
  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const folders = filteredFiles.filter((f) => f.type === 'folder');
  const fileItems = filteredFiles.filter((f) => f.type === 'file');
  const handleFileClick = (file: FileItem) => {
    if (file.type === 'folder') {
      onNavigate?.(file.path);
    }
  };
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      await onUpload?.(Array.from(selectedFiles));
    }
  };
  const getFileIcon = (file: FileItem) => {
    if (file.type === 'folder') {
      return <Folder className="w-5 h-5 text-primary-600 dark:text-primary-400" />;
    }
    return <File className="w-5 h-5 text-muted-foreground" />;
  };
  const getFileActions = (file: FileItem): DropdownItem[] => {
    const items: DropdownItem[] = [];
    if (file.type === 'file' && onDownload) {
      items.push({
        label: 'Download',
        icon: <Download className="w-4 h-4" />,
        onClick: () => onDownload(file),
      });
    }
    if (onRename) {
      items.push({
        label: 'Rename',
        onClick: () => {
          const newName = prompt('Enter new name:', file.name);
          if (newName && newName !== file.name) {
            onRename(file, newName);
          }
        },
      });
    }
    if (onDelete) {
      items.push({
        label: 'Delete',
        icon: <Trash2 className="w-4 h-4" />,
        onClick: () => {
          if (confirm(`Are you sure you want to delete ${file.name}?`)) {
            onDelete(file);
          }
        },
      });
    }
    return items;
  };
  return (
    <Card className={clsx('bg-background', className)}>
      {' '}
      <div className="space-y-4">
        {' '}
        {/* Header */}{' '}
        <div className="flex items-center justify-between">
          {' '}
          <div className="flex items-center gap-3 flex-1">
            {' '}
            <h3 className="text-lg font-semibold text-foreground"> File Manager </h3>{' '}
            <Badge variant="default"> {files.length} items </Badge>{' '}
          </div>{' '}
          <div className="flex items-center gap-2">
            {' '}
            <div className="relative">
              {' '}
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />{' '}
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search files..."
                className={clsx(
                  'pl-10 pr-4 py-2 border rounded-lg text-sm',
                  'bg-background',
                  'text-foreground',
                  'border-border',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400'
                )}
              />{' '}
            </div>{' '}
            <div className="flex items-center gap-1 border border-border rounded-lg">
              {' '}
              <button
                onClick={() => setViewMode('grid')}
                className={clsx(
                  'p-2',
                  viewMode === 'grid'
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'text-muted-foreground hover:bg-muted dark:hover:bg-muted'
                )}
              >
                {' '}
                <Grid className="w-4 h-4" />{' '}
              </button>{' '}
              <button
                onClick={() => setViewMode('list')}
                className={clsx(
                  'p-2',
                  viewMode === 'list'
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'text-muted-foreground hover:bg-muted dark:hover:bg-muted'
                )}
              >
                {' '}
                <List className="w-4 h-4" />{' '}
              </button>{' '}
            </div>{' '}
            {onUpload && (
              <label>
                {' '}
                <input type="file" multiple onChange={handleUpload} className="hidden" />{' '}
                <Button variant="primary">
                  {' '}
                  <span className="flex items-center gap-2">
                    {' '}
                    <Upload className="w-4 h-4" /> Upload{' '}
                  </span>{' '}
                </Button>{' '}
              </label>
            )}{' '}
          </div>{' '}
        </div>{' '}
        {/* Breadcrumb */}{' '}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {' '}
          {currentPath.split('/').map((segment, index, array) => {
            if (!segment) return null;
            const path = '/' + array.slice(1, index + 1).join('/');
            return (
              <span key={index}>
                {' '}
                {index > 0 && <span className="mx-2">/</span>}{' '}
                <button
                  onClick={() => onNavigate?.(path)}
                  className="hover:text-primary-600 dark:hover:text-primary-400"
                >
                  {' '}
                  {segment}{' '}
                </button>{' '}
              </span>
            );
          })}{' '}
        </div>{' '}
        {/* Files List */}{' '}
        {filteredFiles.length === 0 ? (
          <div className="text-center py-12">
            {' '}
            <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-4" />{' '}
            <p className="text-muted-foreground">No files found</p>{' '}
          </div>
        ) : (
          <div className={clsx(viewMode === 'grid' ? 'grid grid-cols-4 gap-4' : 'space-y-2')}>
            {' '}
            {/* Folders */}{' '}
            {folders.map((folder) => (
              <div
                key={folder.id}
                className={clsx(
                  'p-3 border rounded-lg cursor-pointer transition-all hover:bg-muted dark:hover:bg-background',
                  'border-border',
                  selectedFiles.has(folder.id) && 'ring-2 ring-primary-500 dark:ring-primary-400'
                )}
                onClick={() => handleFileClick(folder)}
              >
                {' '}
                <div className="flex items-center justify-between">
                  {' '}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {' '}
                    {getFileIcon(folder)}{' '}
                    <span className="text-sm font-medium text-foreground truncate">
                      {' '}
                      {folder.name}{' '}
                    </span>{' '}
                  </div>{' '}
                  <Dropdown
                    trigger={<MoreVertical className="w-4 h-4" />}
                    items={getFileActions(folder)}
                  />{' '}
                </div>{' '}
              </div>
            ))}{' '}
            {/* Files */}{' '}
            {fileItems.map((file) => (
              <div
                key={file.id}
                className={clsx(
                  'p-3 border rounded-lg transition-all hover:bg-muted dark:hover:bg-background',
                  'border-border',
                  selectedFiles.has(file.id) && 'ring-2 ring-primary-500 dark:ring-primary-400'
                )}
              >
                {' '}
                <div className="flex items-center justify-between">
                  {' '}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {' '}
                    {getFileIcon(file)}{' '}
                    <div className="flex-1 min-w-0">
                      {' '}
                      <div className="text-sm font-medium text-foreground truncate">
                        {' '}
                        {file.name}{' '}
                      </div>{' '}
                      <div className="text-xs text-muted-foreground">
                        {' '}
                        {formatFileSize(file.size)} •{' '}
                        {new Date(file.modified).toLocaleDateString()}{' '}
                      </div>{' '}
                    </div>{' '}
                  </div>{' '}
                  <Dropdown
                    trigger={<MoreVertical className="w-4 h-4" />}
                    items={getFileActions(file)}
                  />{' '}
                </div>{' '}
              </div>
            ))}{' '}
          </div>
        )}{' '}
      </div>{' '}
    </Card>
  );
}
