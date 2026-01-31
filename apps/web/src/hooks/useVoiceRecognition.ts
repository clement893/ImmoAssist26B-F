/**
 * Hook for Voice Recognition (Speech-to-Text)
 * Uses Web Speech API
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseVoiceRecognitionReturn {
  isListening: boolean;
  transcript: string;
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => void;
  supported: boolean;
  requestPermission: () => Promise<boolean>;
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

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('L\'accès au microphone n\'est pas disponible dans ce navigateur');
      return false;
    }

    try {
      // Always try to request permission - getUserMedia will trigger the browser prompt
      // This is the only reliable way to request permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop());
      setError(null);
      return true;
    } catch (err: any) {
      console.error('Microphone permission error:', err);
      let errorMessage = 'Permission microphone refusée';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Permission microphone refusée. Veuillez autoriser l\'accès au microphone dans les paramètres de votre navigateur.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'Aucun microphone trouvé. Veuillez connecter un microphone.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'Le microphone est déjà utilisé par une autre application.';
      } else {
        errorMessage = `Erreur d'accès au microphone: ${err.message || err.name}`;
      }
      
      setError(errorMessage);
      return false;
    }
  }, []);

  const startListening = useCallback(async () => {
    if (!supported || !recognitionRef.current) {
      setError('Reconnaissance vocale non disponible');
      console.error('Voice recognition not supported or not initialized');
      return;
    }

    // If already listening, stop first
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Error stopping recognition:', err);
      }
      return;
    }

    // Request microphone permission first
    const hasPermission = await requestPermission();
    if (!hasPermission) {
      // Error already set by requestPermission
      return;
    }

    try {
      setTranscript('');
      setError(null);
      recognitionRef.current.start();
    } catch (err: any) {
      console.error('Error starting recognition:', err);
      // Handle specific error cases
      if (err?.message?.includes('already started') || err?.name === 'InvalidStateError') {
        // Recognition is already running, try to stop and restart
        try {
          recognitionRef.current.stop();
          setTimeout(() => {
            try {
              setTranscript('');
              setError(null);
              recognitionRef.current?.start();
            } catch (retryErr) {
              console.error('Error restarting recognition:', retryErr);
              setError('Impossible de démarrer la reconnaissance vocale');
            }
          }, 200);
        } catch (stopErr) {
          console.error('Error stopping recognition:', stopErr);
          setError('Erreur lors du démarrage du microphone');
        }
      } else if (err?.error === 'not-allowed') {
        setError('Permission microphone refusée. Veuillez autoriser l\'accès au microphone.');
      } else {
        setError('Impossible de démarrer la reconnaissance vocale. Vérifiez les permissions du microphone.');
      }
    }
  }, [supported, isListening, requestPermission]);

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
    requestPermission,
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
