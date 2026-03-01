'use client';

import { clsx } from 'clsx';

interface LeaMessageBubbleProps {
  content: string;
  role: 'user' | 'assistant';
  timestamp?: string;
  className?: string;
  isStreaming?: boolean;
  /** When true, use styles suited for dark background (e.g. Lea2 view) */
  variant?: 'default' | 'dark';
}

export default function LeaMessageBubble({
  content,
  role,
  timestamp,
  className = '',
  isStreaming = false,
  variant = 'default',
}: LeaMessageBubbleProps) {
  const isUser = role === 'user';
  const isDark = variant === 'dark';

  return (
    <div
      className={clsx(
        'flex',
        isUser ? 'justify-end' : 'justify-start',
        className
      )}
    >
      <div
        className={clsx(
          'max-w-[85%] rounded-2xl px-4 py-3 shadow-subtle-sm',
          isUser
            ? isDark
              ? 'bg-gradient-to-r from-violet-500 to-indigo-600 text-white'
              : 'bg-gradient-to-r from-green-600 to-blue-600 text-white'
            : isDark
              ? 'bg-white/10 text-white/95 border border-white/20'
              : 'bg-muted text-foreground border border-border'
        )}
      >
        <p className="text-sm whitespace-pre-wrap leading-relaxed">
          {content}
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-0.5 bg-primary-500 animate-pulse align-middle" aria-hidden />
          )}
        </p>
        {timestamp && (
          <p
            className={clsx(
              'text-xs mt-2',
              isUser ? 'opacity-80' : 'opacity-60'
            )}
          >
            {new Date(timestamp).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
      </div>
    </div>
  );
}
