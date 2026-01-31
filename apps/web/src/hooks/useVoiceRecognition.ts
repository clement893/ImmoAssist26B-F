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
  const streamRef = useRef<MediaStream | null>(null); // Keep stream active during recognition

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
          // Don't show error for no-speech, just stop listening
          setIsListening(false);
          return;
        case 'aborted':
          // User stopped, not an error
          setIsListening(false);
          return;
        case 'audio-capture':
          errorMessage = 'Microphone non accessible. Vérifiez que le microphone est connecté et que les permissions sont accordées.';
          break;
        case 'network':
          errorMessage = 'Erreur réseau lors de la reconnaissance vocale';
          break;
        case 'not-allowed':
          errorMessage = 'Permission microphone refusée. Veuillez autoriser l\'accès au microphone dans les paramètres de votre navigateur.';
          break;
        case 'service-not-allowed':
          errorMessage = 'Service de reconnaissance vocale non autorisé';
          break;
        default:
          errorMessage = `Erreur de reconnaissance vocale: ${event.error}`;
      }
      
      setError(errorMessage);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Stop the microphone stream when recognition ends
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      // Clean up stream on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [language]);

  const requestPermission = useCallback(async (keepStreamActive: boolean = false): Promise<MediaStream | null> => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('L\'accès au microphone n\'est pas disponible dans ce navigateur');
      return null;
    }

    try {
      // First, check if permission is already granted using Permissions API (if available)
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          if (permissionStatus.state === 'granted') {
            // Permission already granted, get stream
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (!keepStreamActive) {
              // Stop immediately if we don't need to keep it active
              stream.getTracks().forEach(track => track.stop());
              setError(null);
              return null;
            }
            setError(null);
            return stream;
          }
        } catch (permErr) {
          // Permissions API not fully supported, fall through to getUserMedia
          console.log('Permissions API not available, using getUserMedia directly');
        }
      }

      // Request permission via getUserMedia - this will trigger browser prompt if needed
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      if (!keepStreamActive) {
        // Keep stream active briefly to ensure permission is fully registered
        await new Promise(resolve => setTimeout(resolve, 100));
        // Stop the stream - permission is now granted
        stream.getTracks().forEach(track => track.stop());
        setError(null);
        return null;
      }
      
      setError(null);
      return stream;
    } catch (err: any) {
      console.error('Microphone permission error:', err);
      let errorMessage = 'Erreur d\'accès au microphone';
      
      // Check for Permissions Policy violation (server-side restriction)
      const isPolicyViolation = 
        err.message?.includes('Permissions policy violation') ||
        err.message?.includes('microphone is not allowed') ||
        err.name === 'NotAllowedError' && err.message?.includes('policy');
      
      if (isPolicyViolation) {
        errorMessage = 'L\'accès au microphone est bloqué par la politique de sécurité du site. Veuillez contacter l\'administrateur.';
        setError(errorMessage);
        return null;
      }
      
      // Check permission status first if Permissions API is available
      let permissionDenied = false;
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          permissionDenied = permissionStatus.state === 'denied';
        } catch (permErr) {
          // Permissions API might not support 'microphone' query, use error name as fallback
          permissionDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
        }
      } else {
        // Fallback: use error name to determine if it's a permission issue
        permissionDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
      }
      
      if (permissionDenied) {
        errorMessage = 'Permission microphone refusée. Veuillez autoriser l\'accès au microphone dans les paramètres de votre navigateur.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'Aucun microphone trouvé. Veuillez connecter un microphone.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'Le microphone est déjà utilisé par une autre application.';
      } else {
        errorMessage = `Erreur d'accès au microphone: ${err.message || err.name}`;
      }
      
      setError(errorMessage);
      return null;
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
        // Stop stream when stopping recognition
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      } catch (err) {
        console.error('Error stopping recognition:', err);
      }
      return;
    }

    // Clean up any existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Request microphone permission and keep stream active
    // Some browsers (especially Chrome) need the stream to be active when SpeechRecognition starts
    const stream = await requestPermission(true);
    if (!stream) {
      // Error already set by requestPermission
      return;
    }

    // Store stream reference to keep it active
    streamRef.current = stream;

    // Small delay to ensure stream is fully active
    await new Promise(resolve => setTimeout(resolve, 200));

    try {
      setTranscript('');
      setError(null);
      
      // Ensure recognition is stopped before starting
      try {
        recognitionRef.current.stop();
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (e) {
        // Ignore errors if already stopped
      }
      
      recognitionRef.current.start();
    } catch (err: any) {
      console.error('Error starting recognition:', err);
      
      // Stop stream on error
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Handle specific error cases
      if (err?.message?.includes('already started') || err?.name === 'InvalidStateError') {
        // Recognition is already running, try to stop and restart
        try {
          recognitionRef.current.stop();
          setTimeout(async () => {
            try {
              setTranscript('');
              setError(null);
              // Request permission again and keep stream active
              const newStream = await requestPermission(true);
              if (newStream) {
                streamRef.current = newStream;
                await new Promise(resolve => setTimeout(resolve, 200));
                recognitionRef.current?.start();
              }
            } catch (retryErr) {
              console.error('Error restarting recognition:', retryErr);
              setError('Impossible de démarrer la reconnaissance vocale');
            }
          }, 300);
        } catch (stopErr) {
          console.error('Error stopping recognition:', stopErr);
          setError('Erreur lors du démarrage du microphone');
        }
      } else if (err?.error === 'not-allowed' || err?.name === 'NotAllowedError') {
        // Double-check permission status before showing permission error
        let isPermissionDenied = false;
        if (navigator.permissions && navigator.permissions.query) {
          try {
            const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
            isPermissionDenied = permissionStatus.state === 'denied';
          } catch (permErr) {
            // If we can't check, assume it's a permission issue based on error
            isPermissionDenied = true;
          }
        } else {
          isPermissionDenied = true;
        }
        
        if (isPermissionDenied) {
          setError('Permission microphone refusée. Veuillez autoriser l\'accès au microphone.');
        } else {
          setError(`Impossible de démarrer la reconnaissance vocale: ${err?.message || err?.error || 'Erreur inconnue'}.`);
        }
      } else {
        setError(`Impossible de démarrer la reconnaissance vocale: ${err?.message || err?.error || 'Erreur inconnue'}.`);
      }
    }
  }, [supported, isListening, requestPermission]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    // Stop stream when stopping listening
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, [isListening]);

  // Wrapper for requestPermission that returns boolean for backward compatibility
  const requestPermissionWrapper = useCallback(async (): Promise<boolean> => {
    const stream = await requestPermission(false);
    return stream !== null;
  }, [requestPermission]);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    supported,
    requestPermission: requestPermissionWrapper,
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
