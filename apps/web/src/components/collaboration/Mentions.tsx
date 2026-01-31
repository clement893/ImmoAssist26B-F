/**
 * Mentions Component
 * User mentions with autocomplete
 */
'use client';

import { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { AtSign } from 'lucide-react';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

export interface Mention {
  userId: string;
  userName: string;
  position: number;
}

export interface MentionsProps {
  users?: User[];
  value: string;
  onChange: (value: string, mentions: Mention[]) => void;
  placeholder?: string;
  className?: string;
}

export default function Mentions({
  users = [],
  value,
  onChange,
  placeholder = 'Type @ to mention someone...',
  className,
}: MentionsProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;

    // Check if user typed @
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      const hasSpace = textAfterAt.includes(' ');

      if (!hasSpace) {
        const searchTerm = textAfterAt.toLowerCase();
        const filtered = users.filter(
          (user) =>
            user.name.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm)
        );

        setSuggestions(filtered);
        setShowSuggestions(true);
        setMentionStart(lastAtIndex);
        setSelectedIndex(0);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }

    // Extract mentions from value
    const mentionRegex = /@(\w+)/g;
    const mentions: Mention[] = [];
    let match;

    while ((match = mentionRegex.exec(newValue)) !== null) {
      const userName = match[1];
      if (userName) {
        const user = users.find((u) => u.name.toLowerCase() === userName.toLowerCase());
        if (user) {
          mentions.push({
            userId: user.id,
            userName: user.name,
            position: match.index,
          });
        }
      }
    }

    onChange(newValue, mentions);
  };

  const handleSelectUser = (user: User) => {
    if (mentionStart === null || !textareaRef.current) return;

    const textBefore = value.substring(0, mentionStart);
    const textAfter = value.substring(textareaRef.current.selectionStart);
    const newValue = `${textBefore}@${user.name} ${textAfter}`;

    onChange(newValue, []);
    setShowSuggestions(false);
    setMentionStart(null);

    // Focus back on textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = mentionStart + user.name.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        const selectedUser = suggestions[selectedIndex];
        if (selectedUser) {
          handleSelectUser(selectedUser);
        }
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className={clsx('relative', className)}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={4}
        className={clsx(
          'w-full px-4 py-3 border rounded-lg text-sm',
          'bg-background',
          'text-foreground',
          'border-border',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400',
          'resize-none'
        )}
      />

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 mt-1 w-full bg-background border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto"
        >
          {suggestions.map((user, index) => (
            <button
              key={user.id}
              onClick={() => handleSelectUser(user)}
              className={clsx(
                'w-full px-4 py-3 flex items-center gap-3 text-left transition-colors',
                index === selectedIndex
                  ? 'bg-primary-50 dark:bg-primary-900/20'
                  : 'hover:bg-muted'
              )}
            >
              <Avatar src={user.avatar} name={user.name} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground">{user.name}</div>
                <div className="text-xs text-muted-foreground truncate">{user.email}</div>
              </div>
              {user.role && <Badge variant="default">{user.role}</Badge>}
            </button>
          ))}
        </div>
      )}

      {/* Mentioned Users Display */}
      {value.includes('@') && (
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Mentioned:</span>
          {users
            .filter((user) => value.includes(`@${user.name}`))
            .map((user) => (
              <Badge key={user.id} variant="info" className="flex items-center gap-1">
                <AtSign className="w-3 h-3" />
                {user.name}
              </Badge>
            ))}
        </div>
      )}
    </div>
  );
}
