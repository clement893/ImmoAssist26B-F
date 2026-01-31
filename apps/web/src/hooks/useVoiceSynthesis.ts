/**
 * Hook for Voice Synthesis (Text-to-Speech)
 * Uses Web Speech Synthesis API
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseVoiceSynthesisReturn {
  isSpeaking: boolean;
  speak: (text: string, options?: SpeechOptions) => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  supported: boolean;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  setVoice: (voice: SpeechSynthesisVoice | null) => void;
}

export interface SpeechOptions {
  rate?: number; // 0.1 to 10, default 1
  pitch?: number; // 0 to 2, default 1
  volume?: number; // 0 to 1, default 1
  lang?: string; // Language code, default 'fr-FR'
}

export function useVoiceSynthesis(): UseVoiceSynthesisReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Check if browser supports Speech Synthesis
    if (!('speechSynthesis' in window)) {
      setSupported(false);
      return;
    }

    setSupported(true);

    // Load voices
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      
      // Prefer French female voice for a soft, gentle voice
      // Look for French voices first, prioritizing female voices
      const frenchVoices = availableVoices.filter(
        (voice) => voice.lang.startsWith('fr') || voice.lang.startsWith('FR')
      );
      
      // Prefer female voices (names often contain keywords like "female", "woman", or specific names)
      const preferredFemaleKeywords = ['female', 'woman', 'femme', 'zira', 'hazel', 'catherine', 'thomas', 'helen'];
      const frenchFemaleVoice = frenchVoices.find((voice) =>
        preferredFemaleKeywords.some((keyword) =>
          voice.name.toLowerCase().includes(keyword.toLowerCase())
        )
      );
      
      if (frenchFemaleVoice) {
        setSelectedVoice(frenchFemaleVoice);
      } else if (frenchVoices.length > 0 && frenchVoices[0]) {
        // Use first French voice if no female voice found
        setSelectedVoice(frenchVoices[0]);
      } else if (availableVoices.length > 0 && availableVoices[0]) {
        // Fallback to first available voice
        setSelectedVoice(availableVoices[0]);
      }
    };

    loadVoices();
    
    // Some browsers load voices asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback(
    async (text: string, options: SpeechOptions = {}) => {
      if (!supported || !text.trim()) return;

      // Stop any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set options
      utterance.rate = options.rate ?? 1;
      utterance.pitch = options.pitch ?? 1;
      utterance.volume = options.volume ?? 1;
      utterance.lang = options.lang ?? 'fr-FR';
      
      // Set voice if selected
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      // Event handlers
      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsSpeaking(false);
        utteranceRef.current = null;
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [supported, selectedVoice]
  );

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    utteranceRef.current = null;
  }, []);

  const pause = useCallback(() => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }, []);

  return {
    isSpeaking,
    speak,
    stop,
    pause,
    resume,
    supported,
    voices,
    selectedVoice,
    setVoice: setSelectedVoice,
  };
}
