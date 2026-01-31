'use client';
import { useState } from 'react';
import { clsx } from 'clsx';
import Button from './Button';
export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: 'low' | 'medium' | 'high';
  assignee?: string;
  dueDate?: Date;
  tags?: string[];
}
export interface KanbanColumn {
  id: string;
  title: string;
  status: string;
  color?: string;
}
export interface KanbanBoardProps {
  columns: KanbanColumn[];
  cards: KanbanCard[];
  onCardMove?: (cardId: string, newStatus: string) => void;
  onCardClick?: (card: KanbanCard) => void;
  onCardAdd?: (status: string) => void;
  className?: string;
}
export default function KanbanBoard({
  columns,
  cards,
  onCardMove,
  onCardClick,
  onCardAdd,
  className,
}: KanbanBoardProps) {
  const [draggedCard, setDraggedCard] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const handleDragStart = (cardId: string) => {
    setDraggedCard(cardId);
  };
  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };
  const handleDragLeave = () => {
    setDragOverColumn(null);
  };
  const handleDrop = (e: React.DragEvent, columnStatus: string) => {
    e.preventDefault();
    if (draggedCard) {
      onCardMove?.(draggedCard, columnStatus);
    }
    setDraggedCard(null);
    setDragOverColumn(null);
  };
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'bg-error-50 dark:bg-error-900/30 text-error-900 dark:text-error-300';
      case 'medium':
        return 'bg-warning-50 dark:bg-warning-900/30 text-warning-900 dark:text-warning-300';
      case 'low':
        return 'bg-secondary-50 dark:bg-secondary-900/30 text-secondary-900 dark:text-secondary-300';
      default:
        return 'bg-muted text-foreground';
    }
  };
  return (
    <div className={clsx('flex gap-4 overflow-x-auto pb-4', className)}>
      {' '}
      {columns.map((column) => {
        const columnCards = cards.filter((card) => card.status === column.status);
        return (
          <div
            key={column.id}
            className={clsx(
              'flex-shrink-0 w-80 bg-muted rounded-lg p-4',
              dragOverColumn === column.id && 'ring-2 ring-primary-500'
            )}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.status)}
          >
            {' '}
            {/* Column Header */}{' '}
            <div className="flex items-center justify-between mb-4">
              {' '}
              <div className="flex items-center gap-2">
                {' '}
                <div
                  className={clsx('w-3 h-3 rounded-full', column.color || 'bg-primary-500')}
                  style={column.color ? { backgroundColor: column.color } : undefined}
                />{' '}
                <h3 className="font-semibold text-foreground text-foreground"> {column.title} </h3>{' '}
                <span className="text-sm text-muted-foreground bg-background px-2 py-1 rounded-full">
                  {' '}
                  {columnCards.length}{' '}
                </span>{' '}
              </div>{' '}
              {onCardAdd && (
                <Button variant="ghost" size="sm" onClick={() => onCardAdd(column.status)}>
                  {' '}
                  +{' '}
                </Button>
              )}{' '}
            </div>{' '}
            {/* Cards */}{' '}
            <div className="space-y-3 min-h-[200px]">
              {' '}
              {columnCards.map((card) => (
                <div
                  key={card.id}
                  draggable
                  onDragStart={() => handleDragStart(card.id)}
                  onClick={() => onCardClick?.(card)}
                  className={clsx(
                    'bg-background rounded-lg p-4 shadow-sm cursor-move hover:shadow-md transition-shadow',
                    draggedCard === card.id && 'opacity-50'
                  )}
                >
                  {' '}
                  <h4 className="font-medium text-foreground text-foreground mb-2">
                    {' '}
                    {card.title}{' '}
                  </h4>{' '}
                  {card.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {' '}
                      {card.description}{' '}
                    </p>
                  )}{' '}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    {' '}
                    {card.priority && (
                      <span
                        className={clsx(
                          'text-xs px-2 py-1 rounded',
                          getPriorityColor(card.priority)
                        )}
                      >
                        {' '}
                        {card.priority}{' '}
                      </span>
                    )}{' '}
                    {card.tags && card.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {' '}
                        {card.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded"
                          >
                            {' '}
                            {tag}{' '}
                          </span>
                        ))}{' '}
                      </div>
                    )}{' '}
                  </div>{' '}
                  {card.dueDate && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {' '}
                      {new Date(card.dueDate).toLocaleDateString()}{' '}
                    </div>
                  )}{' '}
                </div>
              ))}{' '}
            </div>{' '}
          </div>
        );
      })}{' '}
    </div>
  );
}
