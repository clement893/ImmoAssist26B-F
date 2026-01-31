'use client';
import { List, Grid } from 'lucide-react';
import { Button } from '@/components/ui';
export type ViewMode = 'list' | 'gallery';
interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}
export default function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  return (
    <div className="flex items-center gap-1 border border-border rounded-md p-1">
      {' '}
      <Button
        size="sm"
        variant={value === 'list' ? 'primary' : 'ghost'}
        onClick={() => onChange('list')}
        className="h-8 px-3"
        aria-label="Vue liste"
      >
        {' '}
        <List className="w-4 h-4" />{' '}
      </Button>{' '}
      <Button
        size="sm"
        variant={value === 'gallery' ? 'primary' : 'ghost'}
        onClick={() => onChange('gallery')}
        className="h-8 px-3"
        aria-label="Vue galerie"
      >
        {' '}
        <Grid className="w-4 h-4" />{' '}
      </Button>{' '}
    </div>
  );
}
