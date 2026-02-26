'use client';

import { useState, useEffect, useRef } from 'react';
import { useLea } from '@/hooks/useLea';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useVoiceSynthesis } from '@/hooks/useVoiceSynthesis';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { clsx } from 'clsx';
import LeaWelcomeScreen from './LeaWelcomeScreen';
import LeaConversationView from './LeaConversationView';

interface LeaChatProps {
  onClose?: () => void;
  className?: string;
  initialMessage?: string;
}

export default function LeaChat({ onClose, className = '', initialMessage }: LeaChatProps) {
  const { messages, isLoading, error, sendMessage, sendVoiceMessage, clearChat } = useLea();
  const {
    isRecording,
    startRecording,
    stopRecording,
    supported: recordSupported,
  } = useVoiceRecording();
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
  const [autoSpeak, setAutoSpeak] = useState(true); // Activé par défaut pour une expérience vocale optimale
  const [initialMessageSent, setInitialMessageSent] = useState(false);
  const lastSpokenMessageRef = useRef<string | null>(null); // Track last spoken message to prevent repetition

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

  // Auto-speak assistant responses with natural, human-like voice
  useEffect(() => {
    if (autoSpeak && ttsSupported && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      
      // Only speak if:
      // 1. It's an assistant message
      // 2. It has content
      // 3. We're not currently speaking
      // 4. This message hasn't been spoken yet (prevent repetition)
      if (
        lastMessage && 
        lastMessage.role === 'assistant' && 
        lastMessage.content &&
        !isSpeaking &&
        lastMessage.content !== lastSpokenMessageRef.current
      ) {
        // Mark this message as spoken
        lastSpokenMessageRef.current = lastMessage.content;
        
        // Small delay to ensure UI is updated
        setTimeout(() => {
          // Optimized voice settings for natural, human-like speech
          speak(lastMessage.content, { 
            lang: 'fr-FR', 
            rate: 0.78,      // Slower rate for natural, human-like diction
            pitch: 1.02,     // Natural pitch (close to human voice)
            volume: 1.0      // Full volume for clarity
          });
        }, 300);
      }
    }
    
    // Reset spoken message tracking when autoSpeak is disabled
    if (!autoSpeak) {
      lastSpokenMessageRef.current = null;
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

  const handleVoiceRecordToggle = async () => {
    if (isRecording) {
      const blob = await stopRecording();
      if (blob) await sendVoiceMessage(blob);
    } else {
      await startRecording();
    }
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
          recordSupported={recordSupported}
          isRecording={isRecording}
          onVoiceRecordToggle={handleVoiceRecordToggle}
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
          recordSupported={recordSupported}
          isRecording={isRecording}
          onVoiceRecordToggle={handleVoiceRecordToggle}
        />
      )}
    </div>
  );
}
