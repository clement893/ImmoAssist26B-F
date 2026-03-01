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

/**
 * Clean and prepare text for speech synthesis
 * Removes HTML tags, URLs, special characters, and formats text for natural, human-like reading
 */
function cleanTextForSpeech(text: string): string {
  if (!text) return '';
  
  let cleaned = text;
  
  // Remove HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, '');
  
  // Remove markdown formatting (keep the text content)
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1'); // Bold
  cleaned = cleaned.replace(/\*(.*?)\*/g, '$1'); // Italic
  cleaned = cleaned.replace(/`(.*?)`/g, '$1'); // Code
  cleaned = cleaned.replace(/\[(.*?)\]\(.*?\)/g, '$1'); // Links
  
  // Remove URLs completely (they sound unnatural when read)
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, '');
  cleaned = cleaned.replace(/www\.[^\s]+/g, '');
  
  // Replace HTML entities with natural equivalents
  cleaned = cleaned.replace(/&nbsp;/g, ' ');
  cleaned = cleaned.replace(/&amp;/g, ' et ');
  cleaned = cleaned.replace(/&lt;/g, '');
  cleaned = cleaned.replace(/&gt;/g, '');
  cleaned = cleaned.replace(/&quot;/g, '"');
  cleaned = cleaned.replace(/&#39;/g, "'");
  cleaned = cleaned.replace(/&apos;/g, "'");
  
  // Remove emojis and special Unicode characters that cause issues
  cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}]/gu, ''); // Emoticons
  cleaned = cleaned.replace(/[\u{1F300}-\u{1F5FF}]/gu, ''); // Misc symbols
  cleaned = cleaned.replace(/[\u{1F680}-\u{1F6FF}]/gu, ''); // Transport
  cleaned = cleaned.replace(/[\u{2600}-\u{26FF}]/gu, ''); // Misc symbols
  cleaned = cleaned.replace(/[\u{2700}-\u{27BF}]/gu, ''); // Dingbats
  
  // Remove excessive whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  // Keep only readable characters (letters, numbers, punctuation, spaces)
  // Allow French accents and common punctuation
  cleaned = cleaned.replace(/[^\w\s.,!?;:()\-'""«»àâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ]/g, ' ');
  
  // Clean up multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  // Add natural pauses for punctuation (but don't overdo it)
  // Only add space after punctuation if not already present
  cleaned = cleaned.replace(/\.([^\s])/g, '. $1');
  cleaned = cleaned.replace(/!([^\s])/g, '! $1');
  cleaned = cleaned.replace(/\?([^\s])/g, '? $1');
  cleaned = cleaned.replace(/;([^\s])/g, '; $1');
  cleaned = cleaned.replace(/:([^\s])/g, ': $1');
  
  // Clean up multiple spaces again
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
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
      
      // Prefer French female voice for Léa (assistante)
      const frenchVoices = availableVoices.filter(
        (v) => v.lang.startsWith('fr') || v.lang.startsWith('FR')
      );

      // Keywords typically used for female voices (names / labels)
      const femaleKeywords = [
        'female', 'woman', 'femme', 'zira', 'hazel', 'catherine', 'helen', 'denise', 'claude',
        'amelie', 'amélie', 'marie', 'sylvie', 'veronique', 'véronique', 'jolie', 'melanie', 'mélanie',
        'hortense', 'alice', 'claire', 'elise', 'léa', 'lea', 'victoire', 'valerie', 'valérie',
        'neural', 'premium', 'enhanced',
      ];
      // Exclude common male voice names so we don't pick them by mistake
      const maleKeywords = [
        'thomas', 'paul', 'antoine', 'pierre', 'michel', 'jean', 'male', 'homme', 'marc', 'nicolas',
      ];
      const isLikelyFemale = (voice: SpeechSynthesisVoice) =>
        femaleKeywords.some((k) => voice.name.toLowerCase().includes(k));
      const isLikelyMale = (voice: SpeechSynthesisVoice) =>
        maleKeywords.some((k) => voice.name.toLowerCase().includes(k));

      // 1) French female (neural/premium first)
      const frenchFemaleNeural = frenchVoices.find(
        (v) => isLikelyFemale(v) && ['neural', 'premium', 'enhanced'].some((k) => v.name.toLowerCase().includes(k))
      );
      if (frenchFemaleNeural) {
        setSelectedVoice(frenchFemaleNeural);
        return;
      }

      // 2) Any French female voice
      const frenchFemale = frenchVoices.find((v) => isLikelyFemale(v) && !isLikelyMale(v));
      if (frenchFemale) {
        setSelectedVoice(frenchFemale);
        return;
      }

      // 3) First French voice that is not clearly male
      const frenchNotMale = frenchVoices.find((v) => !isLikelyMale(v));
      if (frenchNotMale) {
        setSelectedVoice(frenchNotMale);
        return;
      }

      // 4) Any French voice
      if (frenchVoices.length > 0 && frenchVoices[0]) {
        setSelectedVoice(frenchVoices[0]);
        return;
      }

      // 5) Any female voice in another language (e.g. en-GB female)
      const anyFemale = availableVoices.find((v) => isLikelyFemale(v) && !isLikelyMale(v));
      if (anyFemale) {
        setSelectedVoice(anyFemale);
        return;
      }

      if (availableVoices.length > 0 && availableVoices[0]) {
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

      // Clean text for better speech synthesis
      const cleanedText = cleanTextForSpeech(text);
      
      if (!cleanedText.trim()) return;

      const utterance = new SpeechSynthesisUtterance(cleanedText);
      
      // Set options optimized for natural, human-like speech (voix féminine)
      utterance.rate = options.rate ?? 0.78;
      utterance.pitch = options.pitch ?? 1.05; // Légèrement plus aigu pour une voix féminine
      utterance.volume = options.volume ?? 1.0;
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
