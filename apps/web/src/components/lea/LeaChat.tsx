'use client';

import { useState, useEffect, useRef } from 'react';
import { useLea } from '@/hooks/useLea';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useVoiceSynthesis } from '@/hooks/useVoiceSynthesis';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { leaAPI } from '@/lib/api';
import { clsx } from 'clsx';
import LeaWelcomeScreen from './LeaWelcomeScreen';
import LeaConversationView from './LeaConversationView';

interface LeaChatProps {
  onClose?: () => void;
  className?: string;
  initialMessage?: string;
}

export default function LeaChat({ onClose, className = '', initialMessage }: LeaChatProps) {
  const { messages, isLoading, error, sendMessage, sendVoiceMessage, clearChat, sessionId } = useLea();
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
  const prevListeningRef = useRef(false);
  const restartListeningAfterResponseRef = useRef(false);
  const prevIsSpeakingRef = useRef(false);
  /** True quand l'audio backend (TTS) est en cours de lecture — pour réactiver le micro à la fin */
  const [isPlayingBackendAudio, setIsPlayingBackendAudio] = useState(false);
  const backendAudioRef = useRef<HTMLAudioElement | null>(null);

  // Send initial message if provided
  useEffect(() => {
    if (initialMessage && !initialMessageSent && messages.length === 0) {
      setInitialMessageSent(true);
      sendMessage(initialMessage);
    }
  }, [initialMessage, initialMessageSent, messages.length, sendMessage]);

  // Afficher le transcript en direct dans l'input pendant que vous parlez ; à l'arrêt, recopier le transcript final
  useEffect(() => {
    if (isListening) {
      setInput(transcript);
    } else if (transcript && transcript.trim()) {
      setInput(transcript);
    }
  }, [transcript, isListening]);

  // Quand vous arrêtez de parler : envoi automatique du message et marquer qu'on veut réactiver le micro après la réponse
  useEffect(() => {
    if (prevListeningRef.current === true && !isListening && transcript.trim()) {
      const text = transcript.trim();
      setInput('');
      sendMessage(text);
      restartListeningAfterResponseRef.current = true;
    }
    prevListeningRef.current = isListening;
  }, [isListening, transcript, sendMessage]);

  // Auto-speak assistant responses: priorité TTS backend (voix shimmer, douce et plus rapide), sinon navigateur
  useEffect(() => {
    if (autoSpeak && ttsSupported && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      
      if (
        lastMessage && 
        lastMessage.role === 'assistant' && 
        lastMessage.content &&
        !isSpeaking &&
        lastMessage.content !== lastSpokenMessageRef.current
      ) {
        lastSpokenMessageRef.current = lastMessage.content;
        
        const textToSpeak = lastMessage.content;
        setTimeout(() => {
          // 1) TTS backend : voix shimmer (douce, humaine), débit 1.2 (un peu plus rapide)
          leaAPI.synthesizeSpeech(textToSpeak, 'shimmer', 1.2)
            .then((res) => {
              const data = res.data as { audio_base64?: string; content_type?: string } | undefined;
              const base64 = data?.audio_base64;
              if (base64) {
                const audio = new Audio(`data:audio/mpeg;base64,${base64}`);
                backendAudioRef.current = audio;
                audio.onended = () => {
                  backendAudioRef.current = null;
                  setIsPlayingBackendAudio(false);
                };
                audio.onerror = () => {
                  backendAudioRef.current = null;
                  setIsPlayingBackendAudio(false);
                };
                setIsPlayingBackendAudio(true);
                audio.play().catch(() => {
                  backendAudioRef.current = null;
                  setIsPlayingBackendAudio(false);
                  speak(textToSpeak, { lang: 'fr-FR', rate: 1.15, pitch: 1.02, volume: 1.0 });
                });
              } else {
                speak(textToSpeak, { lang: 'fr-FR', rate: 1.15, pitch: 1.02, volume: 1.0 });
              }
            })
            .catch(() => {
              speak(textToSpeak, { lang: 'fr-FR', rate: 1.15, pitch: 1.02, volume: 1.0 });
            });
        }, 300);
      }
    }
    
    if (!autoSpeak) {
      lastSpokenMessageRef.current = null;
    }
  }, [messages, autoSpeak, ttsSupported, isSpeaking, speak]);

  // Réactiver le micro après la réponse de Léa (quand l'utilisateur a envoyé au micro)
  const isAudioPlaying = isSpeaking || isPlayingBackendAudio;
  useEffect(() => {
    if (!voiceSupported || isListening || isLoading) return;
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    const lastIsAssistant = lastMessage?.role === 'assistant';
    if (!lastIsAssistant || !restartListeningAfterResponseRef.current) return;

    if (autoSpeak && ttsSupported) {
      // Réactiver le micro dès que la lecture (TTS navigateur ou audio backend) est terminée
      if (prevIsSpeakingRef.current && !isAudioPlaying) {
        restartListeningAfterResponseRef.current = false;
        startListening().catch(() => {});
      } else if (!isAudioPlaying) {
        // Filet de sécurité : si après 2,5 s le TTS n'a pas démarré ou a échoué, réactiver quand même le micro
        const t = setTimeout(() => {
          if (restartListeningAfterResponseRef.current && !isListening) {
            restartListeningAfterResponseRef.current = false;
            startListening().catch(() => {});
          }
        }, 2500);
        return () => clearTimeout(t);
      }
    } else {
      restartListeningAfterResponseRef.current = false;
      startListening().catch(() => {});
    }
    prevIsSpeakingRef.current = isAudioPlaying;
    return;
  }, [isLoading, messages, isAudioPlaying, autoSpeak, ttsSupported, voiceSupported, isListening, startListening]);

  const toggleListening = async () => {
    console.log('toggleListening called, isListening:', isListening, 'voiceSupported:', voiceSupported);
    if (isListening) {
      console.log('Stopping listening...');
      stopListening();
    } else {
      try {
        console.log('Starting listening...');
        // startListening now handles permission request internally
        await startListening();
        console.log('Listening started successfully');
        setInput(''); // Clear input when starting to listen
      } catch (err) {
        console.error('Error in toggleListening:', err);
        // Error is already set by startListening hook
      }
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
          transcript={transcript}
          onVoiceToggle={toggleListening}
          voiceSupported={voiceSupported}
          isLoading={isLoading}
          recordSupported={recordSupported}
          isRecording={isRecording}
          onVoiceRecordToggle={handleVoiceRecordToggle}
          voiceError={voiceError}
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
          sessionId={sessionId}
          isListening={isListening}
          transcript={transcript}
          onVoiceToggle={toggleListening}
          voiceSupported={voiceSupported}
          requestPermission={requestPermission}
          startListening={startListening}
          soundEnabled={autoSpeak}
          soundSupported={ttsSupported}
          onToggleSound={handleToggleSound}
          isSpeaking={isSpeaking || isPlayingBackendAudio}
          onStopSpeaking={() => {
            stopSpeaking();
            if (backendAudioRef.current) {
              backendAudioRef.current.pause();
              backendAudioRef.current.currentTime = 0;
              backendAudioRef.current = null;
            }
            setIsPlayingBackendAudio(false);
          }}
          recordSupported={recordSupported}
          isRecording={isRecording}
          onVoiceRecordToggle={handleVoiceRecordToggle}
        />
      )}
    </div>
  );
}
