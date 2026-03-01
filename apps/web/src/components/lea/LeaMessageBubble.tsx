'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { clsx } from 'clsx';
import { useMemo } from 'react';

interface LeaMessageBubbleProps {
  content: string;
  role: 'user' | 'assistant';
  timestamp?: string;
  className?: string;
  isStreaming?: boolean;
  /** If provided, show "Actions effectuées par Léa" (included in copy and visible in UI) */
  actions?: string[];
  /** When true, use styles suited for dark background (e.g. Lea2 view) */
  variant?: 'default' | 'dark';
  /** When true, the message is currently being read aloud by TTS (visual highlight) */
  isBeingRead?: boolean;
  /** Callback to skip/stop the current TTS reading (shown as "Passer" when isBeingRead) */
  onSkipReading?: () => void;
}

/** Transform assistant text into segments with links to Transactions and transaction detail */
function useLeaContentWithLinks(content: string, role: 'user' | 'assistant') {
  const params = useParams();
  const locale = (params?.locale as string) || 'fr';

  return useMemo(() => {
    if (role !== 'assistant' || !content) return [{ type: 'text' as const, value: content }];
    const segments: { type: 'text' | 'link'; value: string; href?: string }[] = [];
    // Match "section Transactions" or "la section Transactions"
    const sectionRegex = /((?:la\s+)?section\s+Transactions)(?=\s|\.|,|$|\))/gi;
    // Match "transaction #4" or "transaction # 4"
    const txRegex = /(transaction\s+#\s*(\d+))(?=\s|\.|,|$|\))/gi;

    const allMatches: { index: number; length: number; type: 'section' | 'tx'; text: string; id?: string }[] = [];
    let m;
    sectionRegex.lastIndex = 0;
    while ((m = sectionRegex.exec(content)) !== null) {
      allMatches.push({ index: m.index, length: m[0].length, type: 'section', text: m[1] ?? '' });
    }
    txRegex.lastIndex = 0;
    while ((m = txRegex.exec(content)) !== null) {
      allMatches.push({ index: m.index, length: m[0].length, type: 'tx', text: m[1] ?? '', id: m[2] ?? '' });
    }
    allMatches.sort((a, b) => a.index - b.index);

    let lastIndex = 0;
    for (const seg of allMatches) {
      if (seg.index > lastIndex) {
        segments.push({ type: 'text', value: content.slice(lastIndex, seg.index) });
      }
      segments.push({
        type: 'link',
        value: seg.text,
        href: seg.type === 'section' ? `/${locale}/dashboard/transactions` : `/${locale}/dashboard/transactions/${seg.id}`,
      });
      lastIndex = seg.index + seg.length;
    }
    if (lastIndex < content.length) {
      segments.push({ type: 'text', value: content.slice(lastIndex) });
    }
    if (segments.length === 0) return [{ type: 'text' as const, value: content }];
    return segments;
  }, [content, role, locale]);
}

export default function LeaMessageBubble({
  content,
  role,
  timestamp,
  className = '',
  isStreaming = false,
  actions,
  variant = 'default',
  isBeingRead = false,
  onSkipReading,
}: LeaMessageBubbleProps) {
  const isUser = role === 'user';
  const isDark = variant === 'dark';
  const segments = useLeaContentWithLinks(content, role);

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
          'max-w-[85%] rounded-2xl px-4 py-3 shadow-subtle-sm transition-colors duration-300',
          isUser
            ? isDark
              ? 'bg-gradient-to-r from-violet-500 to-indigo-600 text-white'
              : 'bg-gradient-to-r from-green-600 to-blue-600 text-white'
            : isDark
              ? 'bg-white/10 text-white/95 border border-white/20'
              : 'bg-muted text-foreground border border-border',
          !isUser && isBeingRead && isDark && 'ring-2 ring-blue-400/60 bg-blue-500/20 border-blue-400/50',
          !isUser && isBeingRead && !isDark && 'ring-2 ring-primary-400/50 bg-primary-500/10 border-primary-400/40'
        )}
      >
        {!isUser && isBeingRead && (
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-xs font-medium text-blue-400 dark:text-primary-400 flex items-center gap-1.5" aria-live="polite">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 dark:bg-primary-400 animate-pulse" />
              Léa parle
            </p>
            {onSkipReading && (
              <button
                type="button"
                onClick={onSkipReading}
                className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-400 rounded"
              >
                Passer
              </button>
            )}
          </div>
        )}
        <p className="text-sm whitespace-pre-wrap leading-relaxed">
          {isUser
            ? content
            : segments.map((seg, i) =>
                seg.type === 'link' && seg.href ? (
                  <Link
                    key={i}
                    href={seg.href}
                    className="underline font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                  >
                    {seg.value}
                  </Link>
                ) : (
                  <span key={i}>{seg.value}</span>
                )
              )}
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-0.5 bg-primary-500 animate-pulse align-middle" aria-hidden />
          )}
        </p>
        {!isUser && actions && actions.length > 0 && (
          <div className="text-xs text-muted-foreground border-t border-border/50 pt-2 mt-2 space-y-1">
            <p className="font-medium text-foreground/80">Actions effectuées par Léa:</p>
            <ul className="list-disc list-inside space-y-0.5">
              {actions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        )}
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
