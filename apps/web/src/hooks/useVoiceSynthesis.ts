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
 * Removes HTML tags, URLs, special characters, and formats text for natural reading
 */
function cleanTextForSpeech(text: string): string {
  if (!text) return '';
  
  let cleaned = text;
  
  // Remove HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, '');
  
  // Remove markdown formatting
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1'); // Bold
  cleaned = cleaned.replace(/\*(.*?)\*/g, '$1'); // Italic
  cleaned = cleaned.replace(/`(.*?)`/g, '$1'); // Code
  cleaned = cleaned.replace(/\[(.*?)\]\(.*?\)/g, '$1'); // Links
  
  // Remove URLs but keep the text
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, '');
  cleaned = cleaned.replace(/www\.[^\s]+/g, '');
  
  // Replace special characters with their spoken equivalents
  cleaned = cleaned.replace(/&nbsp;/g, ' ');
  cleaned = cleaned.replace(/&amp;/g, ' et ');
  cleaned = cleaned.replace(/&lt;/g, ' moins que ');
  cleaned = cleaned.replace(/&gt;/g, ' plus que ');
  cleaned = cleaned.replace(/&quot;/g, '"');
  cleaned = cleaned.replace(/&#39;/g, "'");
  
  // Remove excessive whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  // Remove special characters that cause stuttering
  cleaned = cleaned.replace(/[^\w\s.,!?;:()\-'"]/g, ' ');
  
  // Clean up multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  // Add pauses for punctuation
  cleaned = cleaned.replace(/\./g, '. ');
  cleaned = cleaned.replace(/!/g, '! ');
  cleaned = cleaned.replace(/\?/g, '? ');
  cleaned = cleaned.replace(/;/g, '; ');
  cleaned = cleaned.replace(/:/g, ': ');
  
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

      // Clean text for better speech synthesis
      const cleanedText = cleanTextForSpeech(text);
      
      if (!cleanedText.trim()) return;

      const utterance = new SpeechSynthesisUtterance(cleanedText);
      
      // Set options with improved defaults for smoother, more natural speech
      utterance.rate = options.rate ?? 0.9; // Slightly slower for better clarity
      utterance.pitch = options.pitch ?? 1.1; // Slightly higher for a more pleasant voice
      utterance.volume = options.volume ?? 0.95; // Slightly softer for comfort
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
