'use client';

import { useState, useEffect } from 'react';
import { useLea } from '@/hooks/useLea';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useVoiceSynthesis } from '@/hooks/useVoiceSynthesis';
import { clsx } from 'clsx';
import LeaWelcomeScreen from './LeaWelcomeScreen';
import LeaConversationView from './LeaConversationView';

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

  // Send initial message if provided
  useEffect(() => {
    if (initialMessage && !initialMessageSent && messages.length === 0) {
      setInitialMessageSent(true);
      sendMessage(initialMessage);
    }
  }, [initialMessage, initialMessageSent, messages.length, sendMessage]);

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
          // Improved voice settings: optimized rate for smooth, natural speech
          // Text cleaning is handled in useVoiceSynthesis hook
          speak(lastMessage.content, { 
            lang: 'fr-FR', 
            rate: 0.9,       // Smooth rate for natural, fluid speech
            pitch: 1.1,      // Pleasant pitch for a soft, feminine voice
            volume: 0.95     // Comfortable volume level
          });
        }, 300);
      }
    }
  }, [messages, autoSpeak, ttsSupported, isSpeaking, speak]);

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
      setInput('');
    }
  };

  const handleToggleSound = () => {
    setAutoSpeak(!autoSpeak);
    if (isSpeaking) stopSpeaking();
  };

  const handleMessageSend = async (message: string) => {
    await sendMessage(message);
    setInput('');
  };

  // Determine which view to show based on whether there are messages
  const hasMessages = messages.length > 0;

  return (
    <div className={clsx('flex flex-col h-full min-h-screen bg-background', className)}>
      {!hasMessages ? (
        // Welcome Screen - No messages yet
        <LeaWelcomeScreen
          onMessageSend={handleMessageSend}
          initialMessage={initialMessage}
          inputValue={input}
          onInputChange={setInput}
          isListening={isListening}
          onVoiceToggle={toggleListening}
          voiceSupported={voiceSupported}
          isLoading={isLoading}
        />
      ) : (
        // Conversation View - Messages present
        <LeaConversationView
          messages={messages}
          isLoading={isLoading}
          error={error}
          voiceError={voiceError}
          onMessageSend={handleMessageSend}
          onClear={handleClear}
          onClose={onClose}
          isListening={isListening}
          transcript={transcript}
          onVoiceToggle={toggleListening}
          voiceSupported={voiceSupported}
          requestPermission={requestPermission}
          startListening={startListening}
          soundEnabled={autoSpeak}
          soundSupported={ttsSupported}
          onToggleSound={handleToggleSound}
        />
      )}
    </div>
  );
}
