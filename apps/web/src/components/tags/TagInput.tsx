'use client';

import { useState, useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';
import { X, Plus, Tag as TagIcon } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/components/ui';
import { getErrorMessage } from '@/lib/errors';

interface Tag {
  id: number;
  name: string;
  slug: string;
  color?: string;
}

interface TagInputProps {
  entityType: string;
  entityId: number;
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  placeholder?: string;
  className?: string;
  allowCreate?: boolean;
}

export function TagInput({
  entityType,
  entityId,
  selectedTags,
  onTagsChange,
  placeholder = 'Add tags...',
  className = '',
  allowCreate = true,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedInput = useDebounce(inputValue, 300);
  const { showToast } = useToast();

  // Fetch tag suggestions
  useEffect(() => {
    if (debouncedInput.length >= 2) {
      fetchSuggestions(debouncedInput);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [debouncedInput, entityType]);

  const fetchSuggestions = async (query: string) => {
    try {
      const response = await apiClient.get<Tag[]>('/api/v1/tags/search', {
        params: {
          q: query,
          entity_type: entityType,
          limit: 10,
        },
      });

      if (response.data) {
        // Filter out already selected tags
        const filtered = response.data.filter((tag: Tag) => !selectedTags.some((st) => st.id === tag.id));
        setSuggestions(filtered);
        setShowSuggestions(true);
      }
    } catch (error) {
      logger.error('', 'Failed to fetch tag suggestions:', error);
      setSuggestions([]);
    }
  };

  const handleAddTag = async (tag: Tag) => {
    try {
      await apiClient.post(`/v1/tags/${tag.id}/entities/${entityType}/${entityId}`);
      onTagsChange([...selectedTags, tag]);
      setInputValue('');
      setShowSuggestions(false);
    } catch (error: unknown) {
      showToast({ message: getErrorMessage(error) || 'Failed to add tag', type: 'error' });
    }
  };

  const handleCreateTag = async () => {
    if (!inputValue.trim() || !allowCreate) return;

    try {
      const response = await apiClient.post<{ id: number; name: string; slug: string; color?: string }>(
        '/api/v1/tags',
        {
          name: inputValue.trim(),
          entity_type: entityType,
          entity_id: entityId,
        }
      );

      if (response.data) {
        const newTag: Tag = {
          id: response.data.id,
          name: response.data.name,
          slug: response.data.slug,
          color: response.data.color,
        };
        onTagsChange([...selectedTags, newTag]);
        setInputValue('');
        setShowSuggestions(false);
        showToast({ message: 'Tag created and added', type: 'success' });
      }
    } catch (error: unknown) {
      showToast({ message: getErrorMessage(error) || 'Failed to create tag', type: 'error' });
    }
  };

  const handleRemoveTag = async (tagId: number) => {
    try {
      await apiClient.delete(`/v1/tags/${tagId}/entities/${entityType}/${entityId}`);
      onTagsChange(selectedTags.filter((t) => t.id !== tagId));
    } catch (error: unknown) {
      showToast({ message: getErrorMessage(error) || 'Failed to remove tag', type: 'error' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0 && suggestions[0]) {
        handleAddTag(suggestions[0]);
      } else if (allowCreate && inputValue.trim()) {
        handleCreateTag();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex flex-wrap gap-2 p-2 border border-border rounded-lg bg-background min-h-[42px]">
        {selectedTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-sm bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200"
            style={tag.color ? { backgroundColor: tag.color + '20', color: tag.color } : undefined}
          >
            <TagIcon className="h-3 w-3" />
            {tag.name}
            <button
              onClick={() => handleRemoveTag(tag.id)}
              className="hover:text-error-500 dark:hover:text-error-400"
              type="button"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={selectedTags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm"
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((tag) => (
            <button
              key={tag.id}
              onClick={() => handleAddTag(tag)}
              className="w-full text-left px-4 py-2 hover:bg-muted dark:hover:bg-muted flex items-center gap-2"
            >
              <TagIcon className="h-4 w-4" style={{ color: tag.color }} />
              {tag.name}
            </button>
          ))}
          {allowCreate &&
            inputValue.trim() &&
            !suggestions.some((t) => t.name.toLowerCase() === inputValue.toLowerCase()) && (
              <button
                onClick={handleCreateTag}
                className="w-full text-left px-4 py-2 hover:bg-muted dark:hover:bg-muted flex items-center gap-2 text-primary-600 dark:text-primary-400"
              >
                <Plus className="h-4 w-4" />
                Create "{inputValue.trim()}"
              </button>
            )}
        </div>
      )}
    </div>
  );
}
