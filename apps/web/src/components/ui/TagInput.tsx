'use client';

import { useState, KeyboardEvent, ChangeEvent, useRef } from 'react';
import { clsx } from 'clsx';
import { X } from 'lucide-react';

export interface TagInputProps {
  value?: string[];
  defaultValue?: string[];
  onChange?: (tags: string[]) => void;
  label?: string;
  placeholder?: string;
  maxTags?: number;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  allowDuplicates?: boolean;
  tagValidator?: (tag: string) => boolean;
  onTagAdd?: (tag: string) => void;
  onTagRemove?: (tag: string) => void;
}

export default function TagInput({
  value: controlledValue,
  defaultValue = [],
  onChange,
  label,
  placeholder = 'Ajouter un tag...',
  maxTags,
  disabled = false,
  fullWidth = false,
  className,
  allowDuplicates = false,
  tagValidator,
  onTagAdd,
  onTagRemove,
}: TagInputProps) {
  const [internalTags, setInternalTags] = useState<string[]>(defaultValue);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const isControlled = controlledValue !== undefined;
  const tags = isControlled ? controlledValue : internalTags;

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (!trimmedTag) return;

    // Validate tag
    if (tagValidator && !tagValidator(trimmedTag)) {
      return;
    }

    // Check duplicates
    if (!allowDuplicates && tags.includes(trimmedTag)) {
      return;
    }

    // Check max tags
    if (maxTags && tags.length >= maxTags) {
      return;
    }

    const newTags = [...tags, trimmedTag];
    if (!isControlled) {
      setInternalTags(newTags);
    }
    onChange?.(newTags);
    onTagAdd?.(trimmedTag);
    setInputValue('');
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove);
    if (!isControlled) {
      setInternalTags(newTags);
    }
    onChange?.(newTags);
    onTagRemove?.(tagToRemove);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      const lastTag = tags[tags.length - 1];
      if (lastTag) removeTag(lastTag);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addTag(inputValue);
    }
  };

  return (
    <div className={clsx('flex flex-col gap-2', fullWidth && 'w-full', className)}>
      {label && <label className="text-sm font-medium text-foreground">{label}</label>}

      <div
        className={clsx(
          'flex flex-wrap gap-2 p-2 border border-border rounded-lg',
          'bg-background shadow-subtle-sm transition-modern', // UI Revamp - Ombres subtiles et transition moderne
          'focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent focus-within:shadow-subtle-md',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag, index) => (
          <span
            key={index}
            className={clsx(
              'inline-flex items-center gap-1 px-2 py-1 text-sm',
              'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200',
              'rounded-md shadow-subtle-sm transition-modern', // UI Revamp - Ombres subtiles et transition moderne
              !disabled && 'cursor-default'
            )}
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag);
                }}
                className="hover:bg-primary-200 dark:hover:bg-primary-800 rounded p-0.5 transition-modern" // UI Revamp - Transition moderne
                aria-label={`Supprimer ${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          disabled={disabled || (maxTags !== undefined && tags.length >= maxTags)}
          placeholder={tags.length === 0 ? placeholder : ''}
          className={clsx(
            'flex-1 min-w-[120px] outline-none bg-transparent',
            'text-foreground',
            'placeholder:text-muted-foreground dark:placeholder:text-muted-foreground'
          )}
        />
      </div>

      {maxTags && (
        <div className="text-xs text-muted-foreground">
          {tags.length} / {maxTags} tags
        </div>
      )}
    </div>
  );
}
