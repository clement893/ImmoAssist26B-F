'use client';

import { useState, useRef, useEffect } from 'react';
import { useLea, LeaMessage } from '@/hooks/useLea';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useVoiceSynthesis } from '@/hooks/useVoiceSynthesis';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import { Send, Mic, MicOff, Volume2, VolumeX, X, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';

interface LeaChatProps {
  onClose?: () => void;
  className?: string;
}

export default function LeaChat({ onClose, className = '' }: LeaChatProps) {
  const { messages, isLoading, error, sendMessage, clearChat, resetContext } = useLea();
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    supported: voiceSupported,
  } = useVoiceRecognition('fr-FR');
  const { speak, stop: stopSpeaking, isSpeaking, supported: ttsSupported } = useVoiceSynthesis();
  
  const [input, setInput] = useState('');
  const [autoSpeak, setAutoSpeak] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Auto-speak assistant responses
  useEffect(() => {
    if (autoSpeak && ttsSupported && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.content && !isSpeaking) {
        // Small delay to ensure UI is updated
        setTimeout(() => {
          speak(lastMessage.content, { lang: 'fr-FR', rate: 1.0 });
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

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
      setInput(''); // Clear input when starting to listen
    }
  };

  const handleClear = () => {
    if (confirm('Voulez-vous effacer l\'historique de conversation ?')) {
      clearChat();
    }
  };

  return (
    <Card className={clsx('flex flex-col h-full max-h-[600px]', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold text-lg">L</span>
          </div>
          <div>
            <h3 className="font-semibold">Léa</h3>
            <p className="text-xs text-muted-foreground">Assistante AI Immobilière</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {ttsSupported && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAutoSpeak(!autoSpeak);
                if (isSpeaking) stopSpeaking();
              }}
              title={autoSpeak ? 'Désactiver la lecture automatique' : 'Activer la lecture automatique'}
            >
              {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            title="Effacer l'historique"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              title="Fermer"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <span className="text-primary font-bold text-2xl">L</span>
            </div>
            <h4 className="font-semibold mb-2">Bonjour ! Je suis Léa</h4>
            <p className="text-sm text-muted-foreground max-w-sm">
              Votre assistante AI spécialisée dans l'immobilier. Je peux vous aider à rechercher des agents,
              des contacts, des entreprises et bien plus encore. Posez-moi une question !
            </p>
          </div>
        )}

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
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
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

      {/* Error Alert */}
      {error && (
        <div className="px-4 pb-2">
          <Alert variant="error" title="Erreur">
            {error}
          </Alert>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t space-y-2">
        {isListening && (
          <div className="flex items-center gap-2 text-sm text-primary">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span>Écoute en cours...</span>
            {transcript && <span className="text-muted-foreground">({transcript})</span>}
          </div>
        )}
        <div className="flex items-center gap-2">
          {voiceSupported && (
            <Button
              variant={isListening ? 'destructive' : 'outline'}
              size="sm"
              onClick={toggleListening}
              disabled={isLoading}
              title={isListening ? 'Arrêter l\'écoute' : 'Démarrer l\'écoute vocale'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
          )}
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tapez votre message ou utilisez le microphone..."
            disabled={isLoading || isListening}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || isListening}
            title="Envoyer"
          >
            {isLoading ? <Loading size="sm" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          {voiceSupported && '💡 Utilisez le microphone pour parler à Léa'}
        </p>
      </div>
    </Card>
  );
}
