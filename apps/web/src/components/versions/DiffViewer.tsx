'use client';
import { Plus, Minus, Edit } from 'lucide-react';
import Card from '@/components/ui/Card';
interface DiffViewerProps {
  diff: {
    added?: Record<string, unknown>;
    removed?: Record<string, unknown>;
    modified?: Record<string, { old: unknown; new: unknown }>;
  };
  className?: string;
}
export function DiffViewer({ diff, className = '' }: DiffViewerProps) {
  const renderValue = (value: unknown): string => {
    if (value === null || value === undefined) {
      return 'null';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };
  return (
    <Card className={className}>
      {' '}
      <div className="space-y-4">
        {' '}
        {/* Added fields */}{' '}
        {diff.added && Object.keys(diff.added).length > 0 && (
          <div>
            {' '}
            <h4 className="text-sm font-semibold text-success-700 dark:text-success-400 mb-2 flex items-center gap-2">
              {' '}
              <Plus className="h-4 w-4" /> Added Fields{' '}
            </h4>{' '}
            <div className="space-y-2 pl-6">
              {' '}
              {Object.entries(diff.added).map(([key, value]) => (
                <div key={key} className="bg-success-50 dark:bg-success-900/20 p-2 rounded">
                  {' '}
                  <div className="font-mono text-xs">
                    {' '}
                    <span className="text-success-700 dark:text-success-400">+ {key}:</span>
                    {''} <span className="text-foreground">{renderValue(value)}</span>{' '}
                  </div>{' '}
                </div>
              ))}{' '}
            </div>{' '}
          </div>
        )}{' '}
        {/* Removed fields */}{' '}
        {diff.removed && Object.keys(diff.removed).length > 0 && (
          <div>
            {' '}
            <h4 className="text-sm font-semibold text-error-700 dark:text-error-400 mb-2 flex items-center gap-2">
              {' '}
              <Minus className="h-4 w-4" /> Removed Fields{' '}
            </h4>{' '}
            <div className="space-y-2 pl-6">
              {' '}
              {Object.entries(diff.removed).map(([key, value]) => (
                <div key={key} className="bg-error-50 dark:bg-error-900/20 p-2 rounded">
                  {' '}
                  <div className="font-mono text-xs">
                    {' '}
                    <span className="text-error-700 dark:text-error-400">- {key}:</span>
                    {''}{' '}
                    <span className="text-foreground line-through">
                      {' '}
                      {renderValue(value)}{' '}
                    </span>{' '}
                  </div>{' '}
                </div>
              ))}{' '}
            </div>{' '}
          </div>
        )}{' '}
        {/* Modified fields */}{' '}
        {diff.modified && Object.keys(diff.modified).length > 0 && (
          <div>
            {' '}
            <h4 className="text-sm font-semibold text-primary-700 dark:text-primary-400 mb-2 flex items-center gap-2">
              {' '}
              <Edit className="h-4 w-4" /> Modified Fields{' '}
            </h4>{' '}
            <div className="space-y-2 pl-6">
              {' '}
              {Object.entries(diff.modified).map(([key, change]) => (
                <div key={key} className="bg-primary-50 dark:bg-primary-900/20 p-2 rounded">
                  {' '}
                  <div className="font-mono text-xs space-y-1">
                    {' '}
                    <div>
                      {' '}
                      <span className="text-error-700 dark:text-error-400">- {key}:</span>
                      {''}{' '}
                      <span className="text-foreground line-through">
                        {' '}
                        {renderValue(change.old)}{' '}
                      </span>{' '}
                    </div>{' '}
                    <div>
                      {' '}
                      <span className="text-success-700 dark:text-success-400">+ {key}:</span>
                      {''} <span className="text-foreground"> {renderValue(change.new)} </span>{' '}
                    </div>{' '}
                  </div>{' '}
                </div>
              ))}{' '}
            </div>{' '}
          </div>
        )}{' '}
        {(!diff.added || Object.keys(diff.added).length === 0) &&
          (!diff.removed || Object.keys(diff.removed).length === 0) &&
          (!diff.modified || Object.keys(diff.modified).length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              {' '}
              <p>No differences found</p>{' '}
            </div>
          )}{' '}
      </div>{' '}
    </Card>
  );
}
