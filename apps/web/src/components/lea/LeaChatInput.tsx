'use client';

import { useRef, useEffect } from 'react';
import { Mic, MicOff, ArrowUp, Paperclip } from 'lucide-react';
import { clsx } from 'clsx';

interface LeaChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (text: string) => Promise<void>;
  isLoading?: boolean;
  isListening?: boolean;
  onVoiceToggle?: () => void;
  voiceSupported?: boolean;
  placeholder?: string;
}

export default function LeaChatInput({
  value,
  onChange,
  onSubmit,
  isLoading = false,
  isListening = false,
  onVoiceToggle,
  voiceSupported = false,
  placeholder = "Écrivez votre message...",
}: LeaChatInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!value.trim() || isLoading || isListening) return;
    await onSubmit(value.trim());
    onChange('');
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    // Focus input when not listening and not loading
    if (!isListening && !isLoading) {
      inputRef.current?.focus();
    }
  }, [isListening, isLoading]);

  return (
    <div className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Voice listening indicator */}
        {isListening && (
          <div className="flex items-center gap-2 text-sm text-green-500 bg-green-50 dark:bg-green-950/20 rounded-lg p-2.5 mb-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="font-medium">Écoute en cours...</span>
          </div>
        )}

        {/* Input container */}
        <div className="flex items-end gap-2">
          {/* Attachment button */}
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-muted transition-modern flex-shrink-0" // UI Revamp - Transition moderne
            title="Joindre un fichier"
          >
            <Paperclip className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Text input */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={isLoading || isListening}
              className={clsx(
                'w-full px-4 py-3 pr-12 rounded-xl border-2 border-border',
                'bg-background text-foreground placeholder:text-muted-foreground',
                'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                'transition-modern', // UI Revamp - Transition moderne
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            />
          </div>

          {/* Voice button */}
          {voiceSupported && onVoiceToggle && (
            <button
              type="button"
              onClick={onVoiceToggle}
              disabled={isLoading}
              className={clsx(
                'p-3 rounded-xl transition-all flex-shrink-0',
                isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-muted hover:bg-muted/80 text-foreground',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              title={isListening ? 'Arrêter l\'écoute' : 'Parler à Léa'}
            >
              {isListening ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>
          )}

          {/* Send button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!value.trim() || isLoading || isListening}
            className={clsx(
              'p-3 rounded-xl transition-all flex-shrink-0',
              value.trim() && !isLoading && !isListening
                ? 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-standard-lg' // UI Revamp - shadow-standard-lg
                : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
            )}
            title="Envoyer"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowUp className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
