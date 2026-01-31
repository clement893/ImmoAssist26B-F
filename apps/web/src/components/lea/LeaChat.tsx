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
    <div className={clsx('flex flex-col h-full max-h-[600px] bg-[#1A1A2E] rounded-lg overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">L</span>
          </div>
          <div>
            <h3 className="font-semibold text-white">Léa</h3>
            <p className="text-xs text-gray-400">Assistante AI Immobilière</p>
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
              className="text-gray-400 hover:text-white"
            >
              {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            title="Effacer l'historique"
            className="text-gray-400 hover:text-white"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              title="Fermer"
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#1A1A2E]">
        {/* Interface initiale - toujours visible */}
        <div className="flex flex-col items-center justify-center text-center py-8">
          {/* Audio Waveform Visualization */}
          <div className="w-full max-w-md h-32 mb-8 relative">
            <AudioWaveform isActive={isListening} className="w-full h-full" />
          </div>
          
          {/* Gradient Text */}
          <h4 className="font-semibold mb-4 text-2xl bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
            Parlez à votre assistante AI maintenant
          </h4>
          <p className="text-sm text-gray-400 max-w-sm">
            Votre assistante AI spécialisée dans l&apos;immobilier. Je peux vous aider à rechercher des agents,
            des contacts, des entreprises et bien plus encore.
          </p>
        </div>

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
                  : 'bg-gray-800 text-gray-100'
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
            <div className="bg-gray-800 rounded-lg px-4 py-2">
              <Loading size="sm" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Alert */}
      {(error || voiceError) && (
        <div className="px-4 pb-2">
          <Alert variant="error" title={voiceError?.includes('Permission') ? 'Permission microphone requise' : 'Erreur'}>
            <div className="space-y-2">
              <p>{error || voiceError}</p>
              {voiceError?.includes('Permission') && (
                <div className="text-sm text-gray-300 mt-2">
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

      {/* Audio Waveform when listening */}
      {isListening && messages.length === 0 && (
        <div className="px-4 pb-2">
          <div className="w-full h-24">
            <AudioWaveform isActive={true} className="w-full h-full" />
          </div>
        </div>
      )}

      {/* Input Area - Modern Design */}
      <div className="p-4 bg-gray-900/50 border-t border-gray-800">
        {isListening && (
          <div className="flex items-center gap-2 text-sm text-purple-400 mb-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            <span>Écoute en cours...</span>
            {transcript && <span className="text-gray-400">({transcript})</span>}
          </div>
        )}
        <div className="flex items-center gap-2 bg-gray-800/80 rounded-full px-2 py-2">
          {/* Add/Attachment Button */}
          <button
            type="button"
            className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
            title="Ajouter une pièce jointe"
          >
            <Paperclip className="w-5 h-5 text-gray-300" />
          </button>
          
          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Écrivez votre message ici..."
            disabled={isLoading || isListening}
            className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none px-2 text-sm"
          />
          
          {/* Voice Button - Always visible if supported */}
          {voiceSupported && (
            <button
              type="button"
              onClick={toggleListening}
              disabled={isLoading}
              className={clsx(
                'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                isListening
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-gray-700 hover:bg-gray-600'
              )}
              title={isListening ? 'Arrêter l\'écoute' : 'Parler à Léa'}
            >
              {isListening ? (
                <MicOff className="w-5 h-5 text-white" />
              ) : (
                <Mic className="w-5 h-5 text-white" />
              )}
            </button>
          )}
          
          {/* Send Button - Shows when there's text or when voice is not supported */}
          {(input.trim() || !voiceSupported) && (
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || isLoading || isListening}
              className={clsx(
                'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                input.trim() && !isLoading && !isListening
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'
                  : 'bg-gradient-to-r from-purple-500 to-blue-500 opacity-50 cursor-not-allowed'
              )}
              title="Envoyer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <ArrowUp className="w-5 h-5 text-white" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
