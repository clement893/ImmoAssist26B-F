'use client';

import { useState } from 'react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import LeaConversationHeader from './LeaConversationHeader';
import LeaMessagesList from './LeaMessagesList';
import LeaChatInput from './LeaChatInput';

export interface LeaMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface LeaConversationViewProps {
  messages: LeaMessage[];
  isLoading: boolean;
  error: string | null;
  voiceError: string | null;
  onMessageSend: (message: string) => Promise<void>;
  onClear: () => void;
  onClose?: () => void;
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
}

export default function LeaConversationView({
  messages,
  isLoading,
  error,
  voiceError,
  onMessageSend,
  onClear,
  onClose,
  isListening,
  transcript,
  onVoiceToggle,
  voiceSupported,
  requestPermission,
  startListening,
  soundEnabled,
  soundSupported,
  onToggleSound,
}: LeaConversationViewProps) {
  const [input, setInput] = useState('');

  return (
    <div className="flex flex-col h-full min-h-screen bg-background">
      {/* Header */}
      <LeaConversationHeader
        onToggleSound={onToggleSound}
        onClear={onClear}
        onClose={onClose}
        soundEnabled={soundEnabled}
        soundSupported={soundSupported}
      />

      {/* Messages List */}
      <LeaMessagesList messages={messages} isLoading={isLoading} />

      {/* Error Alert */}
      {(error || voiceError) && (
        <div className="px-4 pb-3">
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
      />
    </div>
  );
}
