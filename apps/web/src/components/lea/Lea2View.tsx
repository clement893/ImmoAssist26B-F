'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/store';
import { useLea } from '@/hooks/useLea';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useVoiceSynthesis } from '@/hooks/useVoiceSynthesis';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { Mic, MicOff, X, Volume2, Square, ArrowUp, MessageSquare } from 'lucide-react';
import { clsx } from 'clsx';
import LeaMessageBubble from './LeaMessageBubble';

/**
 * Léa2 - Agent AI vocal + texte avec volet vocal mis en avant.
 * UI inspirée des interfaces voice-first : grand cercle central micro,
 * thème sombre bleu/violet, "Tap to Start", état "Je vous écoute...".
 */
export default function Lea2View() {
  const { user } = useAuthStore();
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
  const [autoSpeak, setAutoSpeak] = useState(true);
  const lastSpokenMessageRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevListeningRef = useRef(false);
  const justSentFromVoiceRef = useRef(false);
  const vocalTermineSentRef = useRef(false);
  const restartListeningAfterResponseRef = useRef(false);
  const prevIsSpeakingRef = useRef(false);

  const hasMessages = messages.length > 0;
  const firstName = user?.name?.split(' ')[0] || 'Vous';

  // Sync transcript to input: en direct pendant l'écoute; à l'arrêt seulement si on n'a pas envoyé
  useEffect(() => {
    if (isListening) {
      justSentFromVoiceRef.current = false;
      vocalTermineSentRef.current = false;
      setInput(transcript);
    } else if (transcript && !justSentFromVoiceRef.current) {
      setInput(transcript);
    }
  }, [transcript, isListening]);

  // Quand vous arrêtez de parler : envoi automatique → réponse immédiate de Léa (fallback si arrêt auto du navigateur)
  useEffect(() => {
    if (prevListeningRef.current === true && !isListening && transcript.trim() && !justSentFromVoiceRef.current) {
      const text = transcript.trim();
      justSentFromVoiceRef.current = true;
      setInput('');
      sendMessage(text);
    }
    prevListeningRef.current = isListening;
  }, [isListening, transcript, sendMessage]);

  // Détection "Vocal Terminé" (ou "Terminé", "Envoyer") → envoi immédiat sans cliquer
  const VOCAL_TERMINE_REGEX = /\s*(vocal(e)?\s+terminé|terminé\s*vocal(e)?|^\s*terminé\s*$|^\s*envoyer\s*$)\s*/gi;
  useEffect(() => {
    if (!isListening || !transcript.trim() || vocalTermineSentRef.current) return;
    const t = transcript.trim().toLowerCase();
    const hasTrigger =
      t.includes('vocal terminé') ||
      t.includes('vocale terminé') ||
      t.includes('terminé vocal') ||
      t.includes('terminé vocale') ||
      /\bterminé\s*$/.test(t) || // phrase qui se termine par "terminé" (ex: "créant une transaction vocale terminé")
      /^\s*terminé\s*$/.test(t) ||
      /^\s*envoyer\s*$/.test(t);
    if (!hasTrigger) return;
    vocalTermineSentRef.current = true;
    const messageToSend = transcript.replace(VOCAL_TERMINE_REGEX, ' ').replace(/\s+/g, ' ').trim();
    stopListening();
    justSentFromVoiceRef.current = true;
    setInput('');
    if (messageToSend) sendMessage(messageToSend);
    restartListeningAfterResponseRef.current = true;
  }, [isListening, transcript, stopListening, sendMessage]);

  // Auto-speak assistant responses
  useEffect(() => {
    if (autoSpeak && ttsSupported && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (
        lastMessage?.role === 'assistant' &&
        lastMessage.content &&
        !isSpeaking &&
        lastMessage.content !== lastSpokenMessageRef.current
      ) {
        lastSpokenMessageRef.current = lastMessage.content;
        setTimeout(() => {
          speak(lastMessage.content, { lang: 'fr-FR', rate: 0.82, pitch: 1.06, volume: 1.0 });
        }, 300);
      }
    }
    if (!autoSpeak) lastSpokenMessageRef.current = null;
  }, [messages, autoSpeak, ttsSupported, isSpeaking, speak]);

  // Réactiver le micro après la réponse de Léa pour enchaîner la conversation (vocal terminé / arrêt clic)
  useEffect(() => {
    if (!voiceSupported || isListening || isLoading) return;
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    const lastIsAssistant = lastMessage?.role === 'assistant';
    if (!lastIsAssistant || !restartListeningAfterResponseRef.current) return;

    // Avec TTS : réactiver quand Léa a fini de parler (isSpeaking passe de true à false)
    if (autoSpeak && ttsSupported) {
      if (prevIsSpeakingRef.current && !isSpeaking) {
        restartListeningAfterResponseRef.current = false;
        startListening().catch(() => {});
      } else if (!isSpeaking) {
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
      // Sans TTS : réactiver dès que la réponse est là
      restartListeningAfterResponseRef.current = false;
      startListening().catch(() => {});
    }
    prevIsSpeakingRef.current = isSpeaking;
    return;
  }, [isLoading, messages, isSpeaking, autoSpeak, ttsSupported, voiceSupported, isListening, startListening]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleListening = async () => {
    if (isListening) {
      // Envoi immédiat au clic sur "arrêter" : on utilise le transcript actuel (souvent perdu après onend)
      const text = transcript.trim();
      stopListening();
      if (text) {
        justSentFromVoiceRef.current = true;
        setInput('');
        sendMessage(text);
        restartListeningAfterResponseRef.current = true;
      }
    } else {
      try {
        await startListening();
        setInput('');
      } catch {
        // error set by hook
      }
    }
  };

  const handleCentralVoiceAction = async () => {
    if (voiceSupported) {
      await toggleListening();
    } else if (recordSupported) {
      await handleVoiceRecordToggle();
    }
  };

  const isCentralActive = isListening || isRecording;

  const handleVoiceRecordToggle = async () => {
    if (isRecording) {
      const blob = await stopRecording();
      if (blob) await sendVoiceMessage(blob);
    } else {
      await startRecording();
    }
  };

  const handleMessageSend = async (message: string) => {
    if (!message.trim() || isLoading) return;
    await sendMessage(message.trim());
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      handleMessageSend(input.trim());
    }
  };

  const displayError = error || voiceError;

  return (
    <div className="flex flex-col h-full min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Gradient background (no grain) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950/95 to-violet-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(99,102,241,0.15),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_80%,rgba(139,92,246,0.12),transparent)]" />
      </div>

      <div className="relative flex flex-col md:flex-row flex-1 min-h-0 z-10">
        {/* Header minimal */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0 md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white/95">Léa</span>
          </div>
          <div className="flex items-center gap-2">
            {ttsSupported && (
              <button
                type="button"
                onClick={() => {
                  setAutoSpeak(!autoSpeak);
                  if (isSpeaking) stopSpeaking();
                }}
                className={clsx(
                  'p-2 rounded-lg transition-colors',
                  autoSpeak ? 'text-violet-300 bg-white/10' : 'text-white/50 hover:text-white/70'
                )}
                title={autoSpeak ? 'Son activé' : 'Son désactivé'}
              >
                <Volume2 className="w-5 h-5" />
              </button>
            )}
            {hasMessages && (
              <button
                type="button"
                onClick={() => window.confirm('Effacer la conversation ?') && clearChat()}
                className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                title="Effacer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </header>

        {/* ——— CONVERSATION (gauche sur desktop, au-dessus sur mobile) ——— */}
        <div className={clsx(
          'flex flex-col min-h-0',
          hasMessages ? 'flex-1 md:min-w-0 min-h-[200px] max-h-[50vh] md:max-h-none' : 'hidden md:flex md:flex-1 md:min-w-0'
        )}>
          <div className="flex-1 min-h-0 flex flex-col mx-3 mt-3 md:mx-4 md:mt-4 md:mr-2">
            <div className="text-white/60 text-xs font-medium uppercase tracking-wider mb-2 px-1">
              Conversation
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden rounded-2xl bg-white/5 border border-white/10 shadow-inner scroll-smooth overscroll-contain">
              <div className="p-4 space-y-4 min-h-full">
                {hasMessages ? (
                  <>
                    {messages.map((msg, i) => (
                      <LeaMessageBubble
                        key={i}
                        content={msg.content}
                        role={msg.role === 'system' ? 'assistant' : msg.role}
                        isStreaming={false}
                        variant="dark"
                      />
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="px-4 py-2.5 rounded-2xl bg-white/10 text-white/80 text-sm border border-white/20">
                          Léa réfléchit...
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-white/40 text-sm">
                    <MessageSquare className="w-10 h-10 mb-3 opacity-50" />
                    <p>La conversation apparaîtra ici.</p>
                    <p className="mt-1">Utilisez le micro ou le champ ci-contre pour commencer.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ——— VOICE PANEL (droite sur desktop, en bas sur mobile) ——— */}
        <div className="shrink-0 flex flex-col md:w-[380px] md:border-l md:border-white/10 px-4 pb-6 pt-4">
          {/* Error */}
          {displayError && (
            <div className="mb-3 px-4 py-2 rounded-xl bg-red-500/20 border border-red-400/40 text-red-200 text-sm">
              {displayError}
              {displayError.includes('Permission') && (
                <button
                  type="button"
                  className="ml-2 underline"
                  onClick={async () => {
                    const ok = await requestPermission();
                    if (ok) await startListening();
                  }}
                >
                  Autoriser le micro
                </button>
              )}
            </div>
          )}
          {/* Greeting + CTA vocal */}
          <div className="text-center mb-6">
            <p className="text-white/90 text-lg">
              {isListening ? (
                <>
                  Je vous écoute, <span className="font-semibold text-white">{firstName}</span>…
                </>
              ) : (
                <>
                  Bonjour {firstName},{' '}
                  <span className="bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent font-semibold">
                    comment puis-je vous aider ?
                  </span>
                </>
              )}
            </p>
            {!isListening && (voiceSupported || recordSupported) && (
              <p className="text-white/50 text-sm mt-1">
                Appuyez sur le micro pour parler
              </p>
            )}
          </div>

          {/* Central big voice button / visualizer */}
          <div className="flex justify-center mb-6">
            <button
              type="button"
              onClick={handleCentralVoiceAction}
              disabled={isLoading || (!voiceSupported && !recordSupported)}
              className={clsx(
                'relative w-40 h-40 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-white/30',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                isCentralActive
                  ? 'bg-gradient-to-br from-amber-500/90 to-orange-600/90 shadow-2xl shadow-amber-500/40 scale-105'
                  : 'bg-gradient-to-br from-violet-500 to-indigo-600 shadow-2xl shadow-violet-500/40 hover:scale-105 hover:shadow-violet-500/50'
              )}
              title={isListening ? 'Arrêter l\'écoute' : isRecording ? 'Arrêter et envoyer' : 'Parler à Léa'}
            >
              {/* Glow ring */}
              <div
                className={clsx(
                  'absolute inset-0 rounded-full border-4 border-white/20',
                  isCentralActive && 'animate-pulse border-amber-300/40'
                )}
              />
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/10 to-transparent" />
              {isListening ? (
                <MicOff className="w-16 h-16 text-white drop-shadow-lg relative z-10" />
              ) : isRecording ? (
                <Square className="w-16 h-16 text-white drop-shadow-lg relative z-10" />
              ) : (
                <Mic className="w-16 h-16 text-white drop-shadow-lg relative z-10" />
              )}
            </button>
          </div>

          {/* Listening / Recording indicator */}
          {(isListening || isRecording) && (
            <div className="flex justify-center gap-2 mb-4">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 text-sm">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                {isListening ? 'Léa vous écoute... Dites « Vocal terminé » pour envoyer.' : 'Enregistrement... Cliquez pour envoyer.'}
              </span>
            </div>
          )}

          {/* Transcription en direct pendant que vous parlez */}
          {isListening && (
            <div className="max-w-xl mx-auto mb-4 min-h-[4rem] px-4 py-3 rounded-2xl bg-white/10 border border-white/20">
              <p className="text-white/60 text-xs uppercase tracking-wider mb-1">En direct</p>
              <p className="text-white text-lg leading-relaxed min-h-[1.5rem]">
                {transcript ? (
                  <span>{transcript}</span>
                ) : (
                  <span className="text-white/40">Parlez, le texte s&apos;affichera ici…</span>
                )}
              </p>
            </div>
          )}

          {/* Bottom pill: Cancel when listening */}
          <div className="flex justify-center gap-3 mb-4">
            {isListening && (
              <button
                type="button"
                onClick={stopListening}
                className="p-3 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
                title="Annuler"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Text input (secondary) */}
          <div className="max-w-xl mx-auto">
            <div className="flex gap-2 rounded-2xl bg-white/10 border border-white/20 p-2 focus-within:border-violet-400/50 focus-within:ring-2 focus-within:ring-violet-400/20 transition-all">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ou tapez votre message..."
                disabled={isLoading || isListening}
                className="flex-1 bg-transparent text-white placeholder:text-white/40 px-3 py-2 outline-none"
              />
              <button
                type="button"
                onClick={() => input.trim() && handleMessageSend(input.trim())}
                disabled={!input.trim() || isLoading || isListening}
                className={clsx(
                  'p-2 rounded-xl transition-colors',
                  input.trim() && !isLoading && !isListening
                    ? 'bg-violet-500 hover:bg-violet-400 text-white'
                    : 'text-white/40 cursor-not-allowed'
                )}
                title="Envoyer"
              >
                <ArrowUp className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
