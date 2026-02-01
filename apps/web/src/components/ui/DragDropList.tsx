'use client';
import { useState } from 'react';
import { clsx } from 'clsx';
import { GripVertical } from 'lucide-react';
export interface DragDropListItem {
  id: string;
  content: React.ReactNode;
  disabled?: boolean;
}
export interface DragDropListProps {
  items: DragDropListItem[];
  onReorder?: (newOrder: DragDropListItem[]) => void;
  className?: string;
  itemClassName?: string;
  renderItem?: (item: DragDropListItem, index: number) => React.ReactNode;
}
export default function DragDropList({
  items: initialItems,
  onReorder,
  className,
  itemClassName,
  renderItem,
}: DragDropListProps) {
  const [items, setItems] = useState(initialItems);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const handleDragStart = (itemId: string) => {
    setDraggedItem(itemId);
  };
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItem === null) return;
    const draggedIndex = items.findIndex((item) => item.id === draggedItem);
    if (draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };
  const handleDragLeave = () => {
    setDragOverIndex(null);
  };
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedItem === null) return;
    const draggedIndex = items.findIndex((item) => item.id === draggedItem);
    if (draggedIndex === -1 || draggedIndex === dropIndex) {
      setDragOverIndex(null);
      setDraggedItem(null);
      return;
    }
    const newItems = [...items];
    const [removed] = newItems.splice(draggedIndex, 1);
    if (!removed) {
      setDragOverIndex(null);
      setDraggedItem(null);
      return;
    }
    newItems.splice(dropIndex, 0, removed);
    setItems(newItems);
    setDragOverIndex(null);
    setDraggedItem(null);
    onReorder?.(newItems);
  };
  const handleDragEnd = () => {
    setDragOverIndex(null);
    setDraggedItem(null);
  };
  return (
    <div className={clsx('space-y-2', className)}>
      {' '}
      {items.map((item, index) => {
        const isDragging = draggedItem === item.id;
        const isDragOver = dragOverIndex === index;
        return (
          <div
            key={item.id}
            draggable={!item.disabled}
            onDragStart={() => !item.disabled && handleDragStart(item.id)}
            onDragOver={(e) => !item.disabled && handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => !item.disabled && handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={clsx(
              'flex items-center gap-3 p-4 rounded-lg border transition-modern', // UI Revamp - Transition moderne
              'bg-background',
              'border-border',
              isDragging && 'opacity-50 cursor-grabbing',
              isDragOver &&
                'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20',
              !item.disabled && 'cursor-grab hover:border-border dark:hover:border-border',
              item.disabled && 'opacity-50 cursor-not-allowed',
              itemClassName
            )}
          >
            {' '}
            {!item.disabled && (
              <div className="text-muted-foreground flex-shrink-0">
                {' '}
                <GripVertical className="w-5 h-5" />{' '}
              </div>
            )}{' '}
            <div className="flex-1">
              {' '}
              {renderItem ? renderItem(item, index) : item.content}{' '}
            </div>{' '}
          </div>
        );
      })}{' '}
    </div>
  );
}
