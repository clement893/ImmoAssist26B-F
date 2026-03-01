'use client';

import { clsx } from 'clsx';

interface LeaMessageBubbleProps {
  content: string;
  role: 'user' | 'assistant';
  timestamp?: string;
  className?: string;
  isStreaming?: boolean;
}

export default function LeaMessageBubble({
  content,
  role,
  timestamp,
  className = '',
  isStreaming = false,
}: LeaMessageBubbleProps) {
  const isUser = role === 'user';

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
          'max-w-[80%] rounded-xl px-4 py-3 shadow-subtle-sm', // UI Revamp - shadow-subtle-sm
          isUser
            ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white'
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
