'use client';

import { useState, useEffect } from 'react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import LeaConversationHeader from './LeaConversationHeader';
import LeaMessagesList from './LeaMessagesList';
import LeaChatInput from './LeaChatInput';
import type { LeaMessage } from '@/hooks/useLea';

/** Formate la discussion + logs IA (raisonnement/actions backend, modèle, usage) pour copier-coller. */
function formatConversationForCopy(messages: LeaMessage[], sessionId?: string | null): string {
  const lines: string[] = [
    '--- Conversation Léa ---',
    `Exporté le ${new Date().toLocaleString('fr-CA', { dateStyle: 'medium', timeStyle: 'short' })}`,
    sessionId ? `Session ID: ${sessionId}` : '',
    '',
  ];
  for (const msg of messages) {
    if (msg.role === 'user') {
      lines.push('Utilisateur:', msg.content.trim(), '');
      continue;
    }
    if (msg.role === 'assistant' || msg.role === 'system') {
      lines.push('--- Logs IA (raisonnement / actions backend) ---');
      if (msg.timestamp) {
        lines.push(`  Heure: ${new Date(msg.timestamp).toLocaleString('fr-CA', { dateStyle: 'short', timeStyle: 'medium' })}`);
      }
      if (msg.actions?.length) {
        lines.push('  Actions effectuées par Léa:');
        msg.actions.forEach((a) => lines.push(`    - ${a}`));
      } else {
        lines.push('  Actions effectuées par Léa: (aucune action enregistrée pour ce message)');
      }
      if (msg.model) lines.push(`  Modèle: ${msg.model}`);
      if (msg.provider) lines.push(`  Fournisseur: ${msg.provider}`);
      if (msg.usage) {
        const u = msg.usage;
        const parts = [];
        if (u.prompt_tokens != null) parts.push(`prompt=${u.prompt_tokens}`);
        if (u.completion_tokens != null) parts.push(`completion=${u.completion_tokens}`);
        if (u.total_tokens != null) parts.push(`total=${u.total_tokens}`);
        if (parts.length) lines.push(`  Usage: ${parts.join(', ')}`);
      }
      lines.push('');
      lines.push('Léa:', msg.content.trim(), '');
    }
  }
  return lines.join('\n');
}

interface LeaConversationViewProps {
  messages: LeaMessage[];
  isLoading: boolean;
  error: string | null;
  voiceError: string | null;
  onMessageSend: (message: string) => Promise<void>;
  onClear: () => void;
  onClose?: () => void;
  /** Session ID pour les logs IA dans le copier-coller */
  sessionId?: string | null;
  // Voice props
  isListening: boolean;
  transcript: string | null;
  onVoiceToggle: () => Promise<void>;
  voiceSupported: boolean;
  requestPermission: () => Promise<boolean>;
  startListening: () => Promise<void>;
  // Sound props
  soundEnabled: boolean;
  soundSupported: boolean;
  onToggleSound: () => void;
  isSpeaking?: boolean;
  onStopSpeaking?: () => void;
  // Voice recording (for /lea/chat/voice API)
  recordSupported?: boolean;
  isRecording?: boolean;
  onVoiceRecordToggle?: () => Promise<void>;
}

export default function LeaConversationView({
  messages,
  isLoading,
  error,
  voiceError,
  onMessageSend,
  onClear,
  onClose,
  sessionId,
  isListening,
  transcript,
  onVoiceToggle,
  voiceSupported,
  requestPermission,
  startListening,
  soundEnabled,
  soundSupported,
  onToggleSound,
  isSpeaking = false,
  onStopSpeaking,
  recordSupported = false,
  isRecording = false,
  onVoiceRecordToggle,
}: LeaConversationViewProps) {
  const [input, setInput] = useState('');

  const handleCopyConversation = async () => {
    if (messages.length === 0) return;
    const text = formatConversationForCopy(messages, sessionId);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  };

  // Afficher le transcript en direct dans le champ pendant que l'utilisateur parle
  useEffect(() => {
    if (isListening && transcript !== null) {
      setInput(transcript);
    }
  }, [isListening, transcript]);

  return (
    <div className="flex flex-col h-full min-h-screen bg-background">
      {/* Header */}
      <LeaConversationHeader
        onToggleSound={onToggleSound}
        onClear={onClear}
        onClose={onClose}
        onCopyConversation={messages.length > 0 ? handleCopyConversation : undefined}
        soundEnabled={soundEnabled}
        soundSupported={soundSupported}
        isSpeaking={isSpeaking}
        onStopSpeaking={onStopSpeaking}
      />

      {/* Main area: centered vertically when content is short */}
      <div className="flex-1 flex flex-col justify-center min-h-0 min-w-0">
        <div className="flex flex-col w-full max-h-full overflow-y-auto px-4">
          {/* Messages List */}
          <LeaMessagesList messages={messages} isLoading={isLoading} grow={false} isSpeaking={isSpeaking} />

          {/* Error Alert */}
          {(error || voiceError) && (
            <div className="pb-3">
              <Alert
                variant="error"
                title={
                  (error || voiceError)?.includes('Permission')
                    ? 'Permission microphone requise'
                    : 'Erreur'
                }
              >
                <div className="space-y-2">
                  <p>{error || voiceError}</p>
                  {(error || voiceError)?.includes('Permission') && (
                    <div className="text-sm mt-2">
                      <p className="font-semibold mb-2">Pour autoriser le microphone :</p>
                      <ul className="list-disc list-inside space-y-1 text-xs mb-3">
                        <li>
                          Cliquez sur l&apos;icône de cadenas ou l&apos;icône
                          d&apos;information dans la barre d&apos;adresse
                        </li>
                        <li>Sélectionnez &quot;Autoriser&quot; pour le microphone</li>
                        <li>Rechargez la page si nécessaire</li>
                      </ul>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          const hasPermission = await requestPermission();
                          if (hasPermission) {
                            await startListening();
                          }
                        }}
                        className="w-full"
                      >
                        Demander la permission maintenant
                      </Button>
                    </div>
                  )}
                </div>
              </Alert>
            </div>
          )}

          {/* Transcription en direct pendant que vous parlez */}
          {isListening && (
            <div className="pb-3">
              <div className="max-w-2xl mx-auto rounded-xl bg-muted/80 border border-border px-4 py-3">
                <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">En direct</p>
                <p className="text-foreground text-base leading-relaxed min-h-[1.5rem]">
                  {transcript ? (
                    <span>{transcript}</span>
                  ) : (
                    <span className="text-muted-foreground">Parlez, le texte s&apos;affichera ici…</span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Chat Input */}
          <LeaChatInput
            value={input}
            onChange={setInput}
            onSubmit={onMessageSend}
            isLoading={isLoading}
            isListening={isListening}
            onVoiceToggle={onVoiceToggle}
            voiceSupported={voiceSupported}
            placeholder="Écrivez votre message à Léa..."
            recordSupported={recordSupported}
            isRecording={isRecording}
            onVoiceRecordToggle={onVoiceRecordToggle}
            isSpeaking={isSpeaking}
            onStopSpeaking={onStopSpeaking}
          />
        </div>
      </div>
    </div>
  );
}
