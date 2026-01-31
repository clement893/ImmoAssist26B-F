'use client';

import { useState, useRef, useEffect } from 'react';
import { useLea } from '@/hooks/useLea';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useVoiceSynthesis } from '@/hooks/useVoiceSynthesis';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import { Mic, MicOff, Volume2, VolumeX, X, Trash2, Paperclip, ArrowUp } from 'lucide-react';
import { clsx } from 'clsx';
import AudioWaveform from './AudioWaveform';
import LeaInitialUI from './LeaInitialUI';

interface LeaChatProps {
  onClose?: () => void;
  className?: string;
  initialMessage?: string;
}

export default function LeaChat({ onClose, className = '', initialMessage }: LeaChatProps) {
  const { messages, isLoading, error, sendMessage, clearChat } = useLea();
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    supported: voiceSupported,
    error: voiceError,
    requestPermission,
  } = useVoiceRecognition('fr-FR');
  const { speak, stop: stopSpeaking, isSpeaking, supported: ttsSupported } = useVoiceSynthesis();
  
  const [input, setInput] = useState('');
  const [autoSpeak, setAutoSpeak] = useState(false); // Mute par défaut
  const [initialMessageSent, setInitialMessageSent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Send initial message if provided
  useEffect(() => {
    if (initialMessage && !initialMessageSent && messages.length === 0) {
      setInitialMessageSent(true);
      sendMessage(initialMessage);
    }
  }, [initialMessage, initialMessageSent, messages.length, sendMessage]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update input with transcript when voice recognition updates
  useEffect(() => {
    if (transcript && !isListening) {
      setInput(transcript);
    }
  }, [transcript, isListening]);

  // Auto-speak assistant responses with improved voice settings
  useEffect(() => {
    if (autoSpeak && ttsSupported && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === 'assistant' && lastMessage.content && !isSpeaking) {
        // Small delay to ensure UI is updated
        setTimeout(() => {
          // Improved voice settings: slower rate, higher pitch, softer volume for a gentle, pleasant voice
          speak(lastMessage.content, { 
            lang: 'fr-FR', 
            rate: 0.85,      // Slower rate for clearer, more pleasant diction
            pitch: 1.15,     // Slightly higher pitch for a softer, more feminine voice
            volume: 0.9      // Slightly softer volume for a gentler tone
          });
        }, 300);
      }
    }
  }, [messages, autoSpeak, ttsSupported, isSpeaking, speak]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput('');
    await sendMessage(message);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleListening = async () => {
    if (isListening) {
      stopListening();
    } else {
      // startListening now handles permission request internally
      await startListening();
      setInput(''); // Clear input when starting to listen
    }
  };

  const handleClear = () => {
    if (confirm('Voulez-vous effacer l\'historique de conversation ?')) {
      clearChat();
    }
  };

  return (
    <div className={clsx('flex flex-col h-full min-h-screen bg-background', className)}>
      {/* Top Right Navigation */}
      <div className="flex items-center justify-end gap-4 mb-8 px-6 pt-6">
        {ttsSupported && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setAutoSpeak(!autoSpeak);
              if (isSpeaking) stopSpeaking();
            }}
            title={autoSpeak ? 'Désactiver la lecture automatique' : 'Activer la lecture automatique'}
            className="text-muted-foreground"
          >
            {autoSpeak ? <Volume2 className="w-4 h-4 mr-2" /> : <VolumeX className="w-4 h-4 mr-2" />}
            {autoSpeak ? 'Son activé' : 'Son désactivé'}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          title="Effacer l'historique"
          className="text-muted-foreground"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Effacer
        </Button>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            title="Fermer"
            className="text-muted-foreground"
          >
            <X className="w-4 h-4 mr-2" />
            Fermer
          </Button>
        )}
      </div>

      {/* Main Content - Centered with Initial UI */}
      <div className="flex-1 overflow-y-auto">
        {/* Messages Section - Above Initial UI if messages exist */}
        {messages.length > 0 && (
          <div className="max-w-4xl mx-auto px-6 pb-8 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={clsx(
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={clsx(
                    'max-w-[80%] rounded-lg px-4 py-2',
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : 'bg-muted text-foreground'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.timestamp && (
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <Loading size="sm" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Initial UI - Always visible, shows example cards only if no messages */}
        <LeaInitialUI
          onPromptSelect={async (prompt) => {
            if (!prompt.trim() || isLoading) return;
            setInput('');
            await sendMessage(prompt.trim());
          }}
          onInputSubmit={async (text) => {
            if (!text.trim() || isLoading) return;
            setInput('');
            await sendMessage(text.trim());
          }}
          inputValue={input}
          onInputChange={setInput}
          showExampleCards={messages.length === 0}
        />
      </div>

      {/* Error Alert */}
      {(error || voiceError) && (
        <div className="px-6 pb-4">
          <Alert variant="error" title={(error || voiceError)?.includes('Permission') ? 'Permission microphone requise' : 'Erreur'}>
            <div className="space-y-2">
              <p>{error || voiceError}</p>
              {(error || voiceError)?.includes('Permission') && (
                <div className="text-sm mt-2">
                  <p className="font-semibold mb-2">Pour autoriser le microphone :</p>
                  <ul className="list-disc list-inside space-y-1 text-xs mb-3">
                    <li>Cliquez sur l&apos;icône de cadenas ou l&apos;icône d&apos;information dans la barre d&apos;adresse</li>
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

      {/* Voice Input Indicator */}
      {isListening && (
        <div className="px-6 pb-4">
          <div className="flex items-center gap-2 text-sm text-purple-500 bg-purple-50 dark:bg-purple-950/20 rounded-lg p-3">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
            <span className="font-medium">Écoute en cours...</span>
            {transcript && <span className="text-muted-foreground">({transcript})</span>}
          </div>
        </div>
      )}
    </div>
  );
}
