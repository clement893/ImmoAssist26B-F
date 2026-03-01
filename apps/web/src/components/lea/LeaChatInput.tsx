'use client';

import { useRef, useEffect } from 'react';
import { Mic, MicOff, ArrowUp, Paperclip, AudioLines, Volume2, SkipForward } from 'lucide-react';
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
  recordSupported?: boolean;
  isRecording?: boolean;
  onVoiceRecordToggle?: () => Promise<void>;
  isSpeaking?: boolean;
  onStopSpeaking?: () => void;
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
  recordSupported = false,
  isRecording = false,
  onVoiceRecordToggle,
  isSpeaking = false,
  onStopSpeaking,
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
        {/* Voice listening indicator - Enhanced for voice-first */}
        {isListening && (
          <div className="flex items-center justify-center gap-3 text-amber-500 bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4 mb-4 border-2 border-amber-200 dark:border-amber-800">
            <div className="relative">
              <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
              <div className="absolute inset-0 rounded-full bg-amber-500/50 animate-ping" />
            </div>
            <span className="font-semibold text-base">Léa vous écoute... Parlez maintenant</span>
          </div>
        )}
        {/* Voice recording indicator - Enhanced */}
        {isRecording && (
          <div className="flex items-center justify-center gap-3 text-red-500 bg-red-50 dark:bg-red-950/20 rounded-xl p-4 mb-4 border-2 border-red-200 dark:border-red-800">
            <div className="relative">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <div className="absolute inset-0 rounded-full bg-red-500/50 animate-ping" />
            </div>
            <span className="font-semibold text-base">Enregistrement en cours... Cliquez pour envoyer</span>
          </div>
        )}
        {/* Speaking indicator - Léa parle + bouton Passer */}
        {isSpeaking && onStopSpeaking && (
          <div className="flex items-center justify-center gap-3 text-green-500 bg-green-50 dark:bg-green-950/20 rounded-xl p-4 mb-4 border-2 border-green-200 dark:border-green-800">
            <div className="relative">
              <Volume2 className="w-5 h-5 animate-pulse" />
            </div>
            <span className="font-semibold text-base">Léa parle...</span>
            <button
              type="button"
              onClick={onStopSpeaking}
              className="ml-2 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              title="Passer la lecture (aller plus vite)"
            >
              <SkipForward className="w-4 h-4" />
              Passer la lecture
            </button>
          </div>
        )}

        {/* Voice-first button - Prominent */}
        {(voiceSupported || recordSupported) && !isListening && !isRecording && (
          <div className="flex justify-center mb-4">
            {voiceSupported && onVoiceToggle && (
              <button
                type="button"
                onClick={onVoiceToggle}
                disabled={isLoading || isRecording}
                className={clsx(
                  'px-6 py-3 rounded-xl transition-all transform hover:scale-105 shadow-standard-lg',
                  'flex items-center gap-2 text-base font-semibold',
                  'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white',
                  'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
                )}
                title="Parlez à Léa"
              >
                <Mic className="w-5 h-5" />
                <span>Parlez à Léa</span>
              </button>
            )}
            {recordSupported && onVoiceRecordToggle && !voiceSupported && (
              <button
                type="button"
                onClick={onVoiceRecordToggle}
                disabled={isLoading || isListening}
                className={clsx(
                  'px-6 py-3 rounded-xl transition-all transform hover:scale-105 shadow-standard-lg',
                  'flex items-center gap-2 text-base font-semibold',
                  'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white',
                  'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
                )}
                title="Message vocal"
              >
                <Mic className="w-5 h-5" />
                <span>Message vocal</span>
              </button>
            )}
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

          {/* Voice recording: envoie l'audio à /lea/chat/voice (nécessite agent configuré) */}
          {recordSupported && onVoiceRecordToggle && (
            <button
              type="button"
              onClick={onVoiceRecordToggle}
              disabled={isLoading || isListening}
              className={clsx(
                'p-3 rounded-xl transition-all flex-shrink-0',
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-muted hover:bg-muted/80 text-foreground',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              title={isRecording ? 'Arrêter et envoyer' : 'Message vocal'}
            >
              {isRecording ? (
                <Square className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>
          )}
          {/* Reconnaissance vocale: transcription dans le champ texte */}
          {voiceSupported && onVoiceToggle && (
            <button
              type="button"
              onClick={onVoiceToggle}
              disabled={isLoading || isRecording}
              className={clsx(
                'p-3 rounded-xl transition-all flex-shrink-0',
                isListening
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-muted hover:bg-muted/80 text-foreground',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              title={isListening ? 'Arrêter la dictée' : 'Dicter (reconnaissance vocale)'}
            >
              {isListening ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <AudioLines className="w-5 h-5" />
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
