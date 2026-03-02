'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { useLea } from '@/hooks/useLea';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useVoiceSynthesis } from '@/hooks/useVoiceSynthesis';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { leaAPI } from '@/lib/api';
import { Mic, MicOff, X, Volume2, Square, ArrowUp, MessageSquare, Plus, MessageCircle, Copy } from 'lucide-react';
import { clsx } from 'clsx';
import LeaMessageBubble from './LeaMessageBubble';
import type { LeaMessage } from '@/hooks/useLea';

type ConversationItem = { session_id: string; title: string; updated_at: string | null };

function formatConversationDate(iso: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const now = new Date();
    const today = now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today) return "Aujourd'hui";
    if (d.toDateString() === yesterday.toDateString()) return 'Hier';
    return d.toLocaleDateString('fr-CA', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 18) return 'Bonsoir';
  if (h >= 12) return 'Bon après-midi';
  if (h >= 5) return 'Bonjour';
  return 'Bonsoir';
}

/** Formate la discussion + logs IA (raisonnement, appels, actions backend) pour copier-coller. */
function formatConversationForCopy(messages: LeaMessage[], sessionId: string | null): string {
  const lines: string[] = [
    '--- Conversation Léa ---',
    `Exporté le ${new Date().toLocaleString('fr-CA', { dateStyle: 'medium', timeStyle: 'short' })}`,
    sessionId ? `Session ID: ${sessionId}` : '',
    '',
  ];
  for (const msg of messages) {
    if (msg.role === 'user') {
      lines.push('Utilisateur:', msg.content.trim(), '');
      continue;
    }
    if (msg.role === 'assistant' || msg.role === 'system') {
      lines.push('========== Logs IA ==========');
      if (msg.timestamp) {
        lines.push(`Heure: ${new Date(msg.timestamp).toLocaleString('fr-CA', { dateStyle: 'short', timeStyle: 'medium' })}`);
      }
      lines.push('');
      lines.push('1. Logs d\'appels (modèle, fournisseur, tokens):');
      if (msg.model || msg.provider || (msg.usage && (msg.usage.prompt_tokens != null || msg.usage.completion_tokens != null))) {
        if (msg.model) lines.push(`   Modèle: ${msg.model}`);
        if (msg.provider) lines.push(`   Fournisseur: ${msg.provider}`);
        if (msg.usage) {
          const u = msg.usage;
          const parts = [];
          if (u.prompt_tokens != null) parts.push(`prompt=${u.prompt_tokens}`);
          if (u.completion_tokens != null) parts.push(`completion=${u.completion_tokens}`);
          if (u.total_tokens != null) parts.push(`total=${u.total_tokens}`);
          if (parts.length) lines.push(`   Usage: ${parts.join(', ')}`);
        }
      } else {
        lines.push('   (non disponible pour ce message)');
      }
      lines.push('');
      lines.push('2. Actions effectuées par le backend:');
      if (msg.actions?.length) {
        msg.actions.forEach((a) => lines.push(`   - ${a}`));
      } else {
        lines.push('   (aucune action enregistrée pour ce message)');
      }
      lines.push('');
      lines.push('3. Réponse Léa (raisonnement / contenu):');
      lines.push(msg.content.trim());
      lines.push('');
    }
  }
  return lines.join('\n');
}

/**
 * Léa2 - Agent AI vocal + texte avec volet vocal mis en avant.
 * UI inspirée des interfaces voice-first : grand cercle central micro,
 * thème sombre bleu/violet, "Tap to Start", état "Je vous écoute...".
 */
export default function Lea2View() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const sessionFromUrl = searchParams.get('session');
  const {
    messages,
    isLoading,
    isConnecting,
    error,
    sendMessage,
    sendVoiceMessage,
    clearChat,
    sessionId,
    loadConversation,
    startNewConversation,
  } = useLea();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const hasLoadedSessionFromUrl = useRef(false);
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

  // Ouvrir la conversation depuis l'URL ?session= (ex: lien depuis fiche transaction)
  useEffect(() => {
    if (!sessionFromUrl || hasLoadedSessionFromUrl.current) return;
    hasLoadedSessionFromUrl.current = true;
    loadConversation(sessionFromUrl);
  }, [sessionFromUrl, loadConversation]);

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

  const fetchConversations = useCallback(async () => {
    setLoadingConversations(true);
    try {
      const res = await leaAPI.listConversations();
      const data = res.data as ConversationItem[] | { data?: ConversationItem[] };
      const list = Array.isArray(data) ? data : (data as { data?: ConversationItem[] }).data ?? [];
      setConversations(list);
    } catch {
      setConversations([]);
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (sessionId) fetchConversations();
  }, [sessionId, fetchConversations]);

  const handleNewConversation = () => {
    startNewConversation();
  };

  const handleSelectConversation = (sid: string) => {
    if (sid === sessionId) return;
    loadConversation(sid);
  };

  const handleDeleteConversation = async (e: React.MouseEvent, sid: string) => {
    e.stopPropagation();
    if (!window.confirm('Supprimer cette conversation ?')) return;
    try {
      await leaAPI.resetContext(sid);
      if (sessionId === sid) startNewConversation();
      setConversations((prev) => prev.filter((c) => c.session_id !== sid));
      await fetchConversations();
    } catch {
      // error already in hook or show toast
    }
  };

  const handleCopyConversation = async () => {
    if (messages.length === 0) return;
    const text = formatConversationForCopy(messages, sessionId);
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch {
      // fallback for older browsers
      setCopyFeedback(false);
    }
  };

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
    stopSpeaking();
    lastSpokenMessageRef.current = null;
    const messageToSend = transcript.replace(VOCAL_TERMINE_REGEX, ' ').replace(/\s+/g, ' ').trim();
    stopListening();
    justSentFromVoiceRef.current = true;
    setInput('');
    if (messageToSend) sendMessage(messageToSend);
    restartListeningAfterResponseRef.current = true;
  }, [isListening, transcript, stopListening, stopSpeaking, sendMessage]);

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

  // Pas d'auto-scroll : la page reste fixe, pas de défilement vers le bas quand la conversation avance
  // (messagesEndRef conservé pour compatibilité si besoin plus tard)

  const toggleListening = async () => {
    if (isListening) {
      // Envoi immédiat au clic sur "arrêter" : on utilise le transcript actuel (souvent perdu après onend)
      const text = transcript.trim();
      stopListening();
      if (text) {
        stopSpeaking();
        lastSpokenMessageRef.current = null;
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
    stopSpeaking();
    lastSpokenMessageRef.current = null;
    restartListeningAfterResponseRef.current = true; // réactiver le micro après la réponse de Léa
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
    <div className="flex flex-col h-full min-h-0 bg-slate-950 text-white overflow-hidden">
      {/* Fond sombre avec gradient et légère texture */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/98 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(59,130,246,0.12),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_60%,rgba(99,102,241,0.08),transparent_50%)]" />
        {/* Légers points type sparkle */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
      </div>

      <div className="relative flex flex-col md:flex-row flex-1 min-h-0 z-10">
        {/* ——— SIDEBAR: Historique des conversations ——— */}
        <aside className="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-white/10 flex flex-col bg-slate-900/50">
          <div className="p-3 border-b border-white/10">
            <button
              type="button"
              onClick={handleNewConversation}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nouvelle conversation
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto py-2">
            <p className="px-3 text-white/50 text-xs uppercase tracking-wider mb-2">Historique</p>
            {loadingConversations ? (
              <div className="px-3 text-white/40 text-sm">Chargement…</div>
            ) : conversations.length === 0 ? (
              <div className="px-3 text-white/40 text-sm">Aucune conversation</div>
            ) : (
              <ul className="space-y-0.5">
                {conversations.map((c) => (
                  <li key={c.session_id}>
                    <button
                      type="button"
                      onClick={() => handleSelectConversation(c.session_id)}
                      className={clsx(
                        'w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2 group',
                        sessionId === c.session_id
                          ? 'bg-violet-600/80 text-white'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      )}
                    >
                      <MessageCircle className="w-4 h-4 shrink-0 opacity-70" />
                      <span className="flex-1 min-w-0 truncate text-sm" title={c.title}>
                        {c.title}
                      </span>
                      <span className="text-[10px] text-white/50 shrink-0">
                        {formatConversationDate(c.updated_at)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteConversation(e, c.session_id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/20 text-white/70 hover:text-white"
                        title="Supprimer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Main: header + (conversation | voice) */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0">
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
              <>
                <button
                  type="button"
                  onClick={handleCopyConversation}
                  className={clsx(
                    'p-2 rounded-lg transition-colors',
                    copyFeedback ? 'text-green-400' : 'text-white/60 hover:text-white hover:bg-white/10'
                  )}
                  title="Copier la discussion (avec logs IA : actions backend, modèle, usage)"
                >
                  <Copy className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => window.confirm('Effacer la conversation ?') && clearChat()}
                  className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  title="Effacer"
                >
                  <X className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </header>

        {/* Row: conversation (gauche) | micro/voice (droite) — toujours côte à côte */}
        <div className="flex-1 flex flex-row min-h-0 min-w-0">
        {/* ——— CONVERSATION (zone scrollable à gauche) ——— */}
        <div className={clsx(
          'flex flex-col min-h-0 min-w-0',
          hasMessages ? 'flex-1 min-h-[200px]' : 'hidden md:flex md:flex-1'
        )}>
          <div className="flex-1 min-h-0 flex flex-col h-full">
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden rounded-2xl mx-3 mt-3 md:mx-4 md:mt-4 md:mr-2 bg-white/5 border border-white/10 shadow-inner overscroll-contain scrollbar-hide">
              {/* Contenu centré : max-width pour centraliser les bulles */}
              <div className="max-w-2xl mx-auto px-4 py-5 min-h-full flex flex-col">
                {hasMessages ? (
                  <>
                    <p className="text-white/50 text-xs uppercase tracking-wider mb-4 sticky top-0 bg-slate-950/90 backdrop-blur py-1 z-10">
                      Discussion
                    </p>
                    <div className="space-y-4 flex-1">
                      {messages.map((msg, i) => {
                        const isAssistant = msg.role === 'assistant' || msg.role === 'system';
                        const lastAssistantIndex = messages.reduce((acc, m, idx) => (m.role === 'assistant' || m.role === 'system' ? idx : acc), -1);
                        const isBeingRead = isSpeaking && isAssistant && i === lastAssistantIndex;
                        return (
                        <div key={i} className="space-y-1">
                          <LeaMessageBubble
                            content={msg.content}
                            role={msg.role === 'system' ? 'assistant' : msg.role}
                            isStreaming={false}
                            variant="dark"
                            isBeingRead={isBeingRead}
                          />
                          {/* Logs IA internes (actions backend, modèle, usage) pour comprendre le cheminement */}
                          {(msg.role === 'assistant' || msg.role === 'system') &&
                            ((msg.actions?.length ?? 0) > 0 || msg.model != null || msg.provider != null || (msg.usage && (msg.usage.prompt_tokens != null || msg.usage.completion_tokens != null))) && (
                              <div className="pl-2 py-2 rounded-lg bg-white/5 border border-white/10 text-white/50 text-xs font-mono space-y-1 max-w-[85%]">
                                <span className="text-white/40 font-sans font-medium">Logs IA</span>
                                {msg.timestamp && (
                                  <div>Heure: {new Date(msg.timestamp).toLocaleString('fr-CA', { dateStyle: 'short', timeStyle: 'medium' })}</div>
                                )}
                                {msg.actions?.length ? (
                                  <div>
                                    <div className="text-white/40">Actions backend:</div>
                                    <ul className="list-disc list-inside ml-1">
                                      {msg.actions.map((a, j) => (
                                        <li key={j}>{a}</li>
                                      ))}
                                    </ul>
                                  </div>
                                ) : null}
                                {(msg.model || msg.provider) && (
                                  <div>
                                    {msg.model && <span>Modèle: {msg.model}</span>}
                                    {msg.model && msg.provider && ' · '}
                                    {msg.provider && <span>Fournisseur: {msg.provider}</span>}
                                  </div>
                                )}
                                {msg.usage && (msg.usage.prompt_tokens != null || msg.usage.completion_tokens != null) && (
                                  <div>
                                    Usage: prompt={msg.usage.prompt_tokens ?? '—'}, completion={msg.usage.completion_tokens ?? '—'}
                                    {msg.usage.total_tokens != null && `, total=${msg.usage.total_tokens}`}
                                  </div>
                                )}
                              </div>
                            )}
                        </div>
                      );
                      })}
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="px-4 py-2.5 rounded-2xl bg-white/10 text-white/80 text-sm border border-white/20">
                            {isConnecting ? 'Connexion établie, Léa réfléchit…' : 'Léa réfléchit...'}
                          </div>
                        </div>
                      )}
                    </div>
                    <div ref={messagesEndRef} className="h-2 shrink-0" />
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-white/40 text-sm flex-1">
                    <MessageSquare className="w-10 h-10 mb-3 opacity-50" />
                    <p>La conversation apparaîtra ici.</p>
                    <p className="mt-1">Utilisez le micro ou le champ à droite pour commencer.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ——— VOICE PANEL (style Ombrion : barre centrale + micro à droite) ——— */}
        <div className="shrink-0 flex flex-col w-[320px] sm:w-[360px] md:w-[380px] border-l border-white/10 px-3 sm:px-4 pb-6 pt-6 overflow-y-auto">
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

          {/* Salutation type Ombrion — bien mise en avant */}
          <div className="text-center mb-8 mt-4">
            <p className="text-white text-xl sm:text-2xl font-medium tracking-tight">
              {getGreeting()}{' '}
              <span className="font-semibold text-white">{firstName}</span>
            </p>
            <p className="text-white/70 text-base sm:text-lg mt-1">
              {isListening ? 'Je vous écoute…' : 'Comment puis-je vous aider ?'}
            </p>
          </div>

          {/* Barre de saisie unique + micro à droite (bouton micro assez grand) */}
          <div className="flex flex-col gap-3 flex-1 min-h-0">
            {/* Transcription en direct au-dessus de la barre quand on parle */}
            {isListening && (
              <div className="rounded-2xl bg-white/10 border border-white/20 px-4 py-3">
                <p className="text-white/60 text-xs uppercase tracking-wider mb-1">En direct</p>
                <p className="text-white text-base leading-relaxed min-h-[1.5rem]">
                  {transcript ? (
                    <span>{transcript}</span>
                  ) : (
                    <span className="text-white/40">Parlez…</span>
                  )}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="inline-flex items-center gap-2 text-amber-400/90 text-sm">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    Léa vous écoute. Dites « Vocal terminé » pour envoyer.
                  </span>
                  <button
                    type="button"
                    onClick={stopListening}
                    className="p-2 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
                    title="Annuler"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {(isListening || isRecording) && !displayError && (
              <div className="flex justify-center">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-sm">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  {isListening ? 'Écoute en cours…' : 'Enregistrement…'}
                </span>
              </div>
            )}

            {/* Grande barre type Ombrion : input + micro à droite (saisie clavier possible même micro activé) */}
            <div className="flex items-stretch gap-2 rounded-2xl bg-white/10 border border-white/20 p-2 focus-within:border-blue-400/50 focus-within:ring-2 focus-within:ring-blue-400/20 transition-all shadow-lg">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isListening ? "Vous pouvez aussi taper ici…" : "Posez votre question…"}
                disabled={isLoading}
                className="flex-1 min-w-0 bg-transparent text-white placeholder:text-white/40 px-4 py-3 outline-none text-base"
              />
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => input.trim() && handleMessageSend(input.trim())}
                  disabled={!input.trim() || isLoading}
                  className={clsx(
                    'p-2 rounded-xl transition-colors',
                    input.trim() && !isLoading
                      ? 'bg-blue-500 hover:bg-blue-400 text-white'
                      : 'text-white/40 cursor-not-allowed'
                  )}
                  title="Envoyer"
                >
                  <ArrowUp className="w-5 h-5" />
                </button>
                {/* Bouton micro bien visible, type Ombrion (cercle bleu clair) */}
                <button
                  type="button"
                  onClick={handleCentralVoiceAction}
                  disabled={isLoading || (!voiceSupported && !recordSupported)}
                  className={clsx(
                    'flex items-center justify-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/40',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'w-14 h-14 shrink-0',
                    isCentralActive
                      ? 'bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-500/30'
                      : 'bg-blue-500/90 hover:bg-blue-400 text-white shadow-lg shadow-blue-500/20'
                  )}
                  title={isListening ? 'Arrêter l\'écoute' : isRecording ? 'Arrêter et envoyer' : 'Parler à Léa'}
                >
                  {isListening ? (
                    <MicOff className="w-7 h-7" />
                  ) : isRecording ? (
                    <Square className="w-7 h-7" />
                  ) : (
                    <Mic className="w-7 h-7" />
                  )}
                </button>
              </div>
            </div>

            {/* Rappel court */}
            {(voiceSupported || recordSupported) && !isListening && !isRecording && (
              <p className="text-center text-white/45 text-sm">
                Tapez ou appuyez sur le micro pour parler
              </p>
            )}
          </div>
        </div>
        </div>
        </div>
      </div>
    </div>
  );
}
