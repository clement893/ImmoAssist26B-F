/**
 * Hook for Voice Synthesis (Text-to-Speech)
 * Uses Web Speech Synthesis API — Léa uses a feminine voice (French preferred).
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

const FEMALE_KEYWORDS = [
  'female', 'woman', 'femme', 'zira', 'hazel', 'catherine', 'helen', 'denise',
  'amelie', 'amélie', 'marie', 'sylvie', 'veronique', 'véronique', 'jolie', 'melanie', 'mélanie',
  'hortense', 'alice', 'claire', 'elise', 'léa', 'lea', 'victoire', 'valerie', 'valérie',
  'virginie', 'sabina', 'julie', 'anne', 'louise', 'charlotte', 'aria', 'eva', 'camille',
  'samantha', 'karen', 'moira', 'tessa', 'veena', 'linda', 'susan', 'laura', 'emma',
  'neural', 'premium', 'enhanced', 'microsoft hortense', 'microsoft virginie',
];
const MALE_KEYWORDS = [
  'thomas', 'paul', 'antoine', 'pierre', 'michel', 'jean', 'male', 'homme', 'marc', 'nicolas',
  'daniel', 'david', 'adam', 'alain', 'bertrand', 'guillaume', 'henri', 'hugo', 'fred', 'alex',
  'bruce', 'ralph', 'frank', 'andre', 'bernard', 'eric', 'gerard', 'philippe', 'roger', 'simon',
  'stephane', 'vincent', 'microsoft paul',
];

function isLikelyFemale(v: SpeechSynthesisVoice): boolean {
  const n = v.name.toLowerCase();
  return FEMALE_KEYWORDS.some((k) => n.includes(k)) && !MALE_KEYWORDS.some((k) => n.includes(k));
}

function isLikelyMale(v: SpeechSynthesisVoice): boolean {
  return MALE_KEYWORDS.some((k) => v.name.toLowerCase().includes(k));
}

function pickFrenchFemaleVoice(availableVoices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!availableVoices.length) return null;
  const frenchVoices = availableVoices.filter((v) => v.lang.startsWith('fr') || v.lang.startsWith('FR'));
  const frenchFemaleNeural = frenchVoices.find(
    (v) => isLikelyFemale(v) && ['neural', 'premium', 'enhanced'].some((k) => v.name.toLowerCase().includes(k))
  );
  if (frenchFemaleNeural) return frenchFemaleNeural;
  const hortenseOrVirginie = frenchVoices.find(
    (v) => !isLikelyMale(v) && (v.name.toLowerCase().includes('hortense') || v.name.toLowerCase().includes('virginie'))
  );
  if (hortenseOrVirginie) return hortenseOrVirginie;
  const frenchFemale = frenchVoices.find((v) => isLikelyFemale(v));
  if (frenchFemale) return frenchFemale;
  const frenchNotMale = frenchVoices.find((v) => !isLikelyMale(v));
  if (frenchNotMale) return frenchNotMale;
  // Ne pas prendre la première voix française si c'est un homme (ex. Paul)
  const anyFemale = availableVoices.find((v) => isLikelyFemale(v));
  if (anyFemale) return anyFemale;
  const notMale = availableVoices.find((v) => !isLikelyMale(v));
  if (notMale) return notMale;
  return availableVoices[0] ?? null;
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
      const preferred = pickFrenchFemaleVoice(availableVoices);
      if (preferred) setSelectedVoice(preferred);
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

      const cleanedText = cleanTextForSpeech(text);
      if (!cleanedText.trim()) return;

      // Resolve voice: use selected (female) or resolve again at speak-time (voices may load late)
      let voiceToUse = selectedVoice;
      if (!voiceToUse && 'speechSynthesis' in window) {
        const list = window.speechSynthesis.getVoices();
        voiceToUse = pickFrenchFemaleVoice(list);
      }

      const utterance = new SpeechSynthesisUtterance(cleanedText);
      utterance.rate = options.rate ?? 1.15;
      utterance.pitch = options.pitch ?? 1.06;
      utterance.volume = options.volume ?? 1.0;
      utterance.lang = options.lang ?? 'fr-FR';
      if (voiceToUse) {
        utterance.voice = voiceToUse;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
      };
      utterance.onerror = () => {
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
