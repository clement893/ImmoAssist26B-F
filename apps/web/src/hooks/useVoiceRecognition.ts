/**
 * Hook for Voice Recognition (Speech-to-Text)
 * Uses Web Speech API
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseVoiceRecognitionReturn {
  isListening: boolean;
  transcript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  supported: boolean;
}

export function useVoiceRecognition(language: string = 'fr-FR'): UseVoiceRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check if browser supports Speech Recognition
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      setError('La reconnaissance vocale n\'est pas supportée par votre navigateur');
      return;
    }

    setSupported(true);
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result && result[0]) {
          const transcript = result[0].transcript;
          if (result.isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
      }

      setTranscript(finalTranscript || interimTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      let errorMessage = 'Erreur de reconnaissance vocale';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'Aucune parole détectée';
          break;
        case 'aborted':
          // User stopped, not an error
          return;
        case 'audio-capture':
          errorMessage = 'Microphone non accessible';
          break;
        case 'network':
          errorMessage = 'Erreur réseau';
          break;
        case 'not-allowed':
          errorMessage = 'Permission microphone refusée';
          break;
        default:
          errorMessage = `Erreur: ${event.error}`;
      }
      
      setError(errorMessage);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language]);

  const startListening = useCallback(() => {
    if (!supported || !recognitionRef.current) {
      setError('Reconnaissance vocale non disponible');
      console.error('Voice recognition not supported or not initialized');
      return;
    }

    try {
      // Stop any existing recognition first
      if (isListening) {
        recognitionRef.current.stop();
        // Wait a bit before restarting
        setTimeout(() => {
          try {
            setTranscript('');
            setError(null);
            recognitionRef.current?.start();
          } catch (err) {
            console.error('Error restarting recognition:', err);
            setError('Impossible de redémarrer la reconnaissance vocale');
          }
        }, 100);
      } else {
        setTranscript('');
        setError(null);
        recognitionRef.current.start();
      }
    } catch (err: any) {
      console.error('Error starting recognition:', err);
      // Handle specific error cases
      if (err?.message?.includes('already started') || err?.name === 'InvalidStateError') {
        // Recognition is already running, try to stop and restart
        try {
          recognitionRef.current.stop();
          setTimeout(() => {
            try {
              recognitionRef.current?.start();
            } catch (retryErr) {
              setError('Impossible de démarrer la reconnaissance vocale');
            }
          }, 100);
        } catch (stopErr) {
          setError('Erreur lors du démarrage du microphone');
        }
      } else {
        setError('Impossible de démarrer la reconnaissance vocale. Vérifiez les permissions du microphone.');
      }
    }
  }, [supported, isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    supported,
  };
}

// Type definitions for Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
