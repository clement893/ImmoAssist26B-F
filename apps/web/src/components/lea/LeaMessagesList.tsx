'use client';

import { useEffect, useRef } from 'react';
import Loading from '@/components/ui/Loading';
import LeaMessageBubble from './LeaMessageBubble';
import type { LeaMessage } from '@/hooks/useLea';

interface LeaMessagesListProps {
  messages: LeaMessage[];
  isLoading?: boolean;
  className?: string;
  /** If false, list doesn't grow to fill space (e.g. for vertically centered layout) */
  grow?: boolean;
  /** When true, the last assistant message is shown as "being read" (TTS) */
  isSpeaking?: boolean;
}

export default function LeaMessagesList({
  messages,
  isLoading = false,
  className = '',
  grow = true,
  isSpeaking = false,
}: LeaMessagesListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const growClass = grow ? 'flex-1 min-h-0' : '';

  if (messages.length === 0 && !isLoading) {
    return (
      <div className={`flex items-center justify-center text-center px-4 py-6 ${growClass} ${className}`}>
        <div className="max-w-md">
          <p className="text-muted-foreground text-sm">
            Commencez une conversation avec Léa pour voir vos messages ici.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`overflow-y-auto px-4 py-6 ${growClass} ${className}`}>
      <div className="max-w-4xl mx-auto space-y-4">
        {(() => {
          const visible = messages.filter((m) => m.role === 'user' || m.role === 'assistant');
          return (
            <>
              {visible.map((message, index) => {
                const isLast = index === visible.length - 1;
                const isStreaming = isLoading && isLast && message.role === 'assistant';
                const lastAssistantIndex = visible.reduce((acc, m, idx) => (m.role === 'assistant' || m.role === 'system' ? idx : acc), -1);
                const isBeingRead = isSpeaking && (message.role === 'assistant' || message.role === 'system') && index === lastAssistantIndex;
                return (
                  <LeaMessageBubble
                    key={index}
                    content={message.content}
                    role={message.role as 'user' | 'assistant'}
                    timestamp={message.timestamp}
                    isStreaming={isStreaming}
                    isBeingRead={isBeingRead}
                  />
                );
              })}
              {isLoading && (visible.length === 0 || visible[visible.length - 1]?.role !== 'assistant') && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-xl px-4 py-3 border border-border">
                    <Loading size="sm" />
                  </div>
                </div>
              )}
            </>
          );
        })()}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
