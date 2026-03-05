/**
 * Hook for Léa AI Assistant
 * Uses streaming when available for fast, fluid responses.
 */

import { useState, useCallback, useRef } from 'react';
import { leaAPI } from '@/lib/api';
import { AxiosError } from 'axios';

/** Joue l'audio une fois le buffer prêt pour éviter que la première lettre soit coupée. Exporté pour LeaChat TTS. */
export function playLeaAudioWhenReady(audio: HTMLAudioElement): void {
  let played = false;
  const doPlay = () => {
    if (played) return;
    played = true;
    audio.play().catch(() => {});
  };
  audio.addEventListener('canplaythrough', doPlay, { once: true });
  audio.addEventListener('loadeddata', doPlay, { once: true });
  setTimeout(() => {
    if (!played && audio.readyState >= 2) doPlay();
  }, 2000);
}

/** Minimal voice response shape so both leaAPI (Axios) and demoLeaAPI (fetch) are assignable. */
export type LeaVoiceResponseData = {
  success: boolean;
  transcription?: string;
  response?: string;
  session_id?: string;
  assistant_audio_base64?: string;
  actions?: string[];
  [key: string]: unknown;
};

/** API shape used by useLea (leaAPI or demoLeaAPI). Uses { data } return shape so both Axios and fetch clients fit. */
export type LeaAPIClient = {
  chatStream: typeof leaAPI.chatStream;
  chat: (
    message: string,
    sessionId?: string,
    provider?: string,
    transactionId?: number,
    lastAssistantMessage?: string
  ) => Promise<{ data: LeaChatResponse }>;
  chatVoice: (
    audioBlob: Blob,
    sessionId?: string,
    conversationId?: number
  ) => Promise<{ data: LeaVoiceResponseData }>;
  getContext: (sessionId?: string) => Promise<{ data: { session_id: string; messages?: Array<{ role?: string; content?: string; timestamp?: string }> } }>;
  resetContext: (sessionId?: string) => Promise<unknown>;
  listConversations: (limit?: number) => Promise<{ data: Array<{ session_id: string; title: string; updated_at: string | null }> }>;
};

export interface LeaMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  /** Actions effectuées par le backend pour ce tour (logs). */
  actions?: string[];
  /** Logs IA : modèle, fournisseur, usage (pour debug / copier-coller). */
  model?: string;
  provider?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export interface LeaChatResponse {
  content: string;
  session_id: string;
  model?: string;
  provider?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export interface LeaVoiceResponse {
  transcription: string;
  response: string;
  conversation_id?: number;
  session_id?: string;
  assistant_audio_url?: string;
  /** Audio MP3 en base64 (retourné par la plateforme quand vocal intégré) */
  assistant_audio_base64?: string;
  success: boolean;
}

export interface UseLeaReturn {
  messages: LeaMessage[];
  isLoading: boolean;
  /** True when stream is established but no content yet (for "Léa réfléchit..." indicator) */
  isConnecting: boolean;
  error: string | null;
  sessionId: string | null;
  sendMessage: (message: string) => Promise<void>;
  sendVoiceMessage: (audioBlob: Blob) => Promise<void>;
  clearChat: () => void;
  resetContext: () => Promise<void>;
  loadConversation: (sessionId: string) => Promise<void>;
  startNewConversation: () => void;
}

export function useLea(
  initialSessionId?: string,
  api: LeaAPIClient = leaAPI,
  transactionId?: number
): UseLeaReturn {
  const [messages, setMessages] = useState<LeaMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null);
  const abortControllerRef = useRef<AbortController | null>(null);
  /** Ref pour toujours envoyer le dernier message assistant au backend (évite closure périmée). */
  const messagesRef = useRef<LeaMessage[]>([]);
  messagesRef.current = messages;

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setIsConnecting(false);

    // Add user message immediately
    const userMessage: LeaMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Placeholder assistant message for streaming (content will grow)
    const assistantPlaceholder: LeaMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, assistantPlaceholder]);

    // Dernier message assistant = contexte pour que le backend enregistre adresse / vendeurs / acheteurs
    const lastAssistantContent =
      messagesRef.current.filter((m) => m.role === 'assistant').pop()?.content?.trim() ?? undefined;

    const usedStream = await api.chatStream(
      {
        message,
        sessionId: sessionId ?? undefined,
        lastAssistantMessage: lastAssistantContent,
        transactionId,
      },
      {
        onConnecting: () => setIsConnecting(true),
        onDelta: (delta) => {
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === 'assistant') {
              next[next.length - 1] = { ...last, content: last.content + delta };
            }
            return next;
          });
        },
        onDone: (newSessionId, meta) => {
          if (newSessionId && !sessionId) setSessionId(newSessionId);
          if (meta && (meta.actions?.length || meta.model != null || meta.provider != null || meta.usage != null)) {
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last?.role === 'assistant') {
                next[next.length - 1] = {
                  ...last,
                  ...(meta.actions != null && { actions: meta.actions }),
                  ...(meta.model != null && { model: meta.model }),
                  ...(meta.provider != null && { provider: meta.provider }),
                  ...(meta.usage != null && { usage: meta.usage }),
                };
              }
              return next;
            });
          }
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === 'assistant' && !last.content.trim()) {
              next[next.length - 1] = {
                ...last,
                content: "Je n'ai pas pu générer de réponse. Vous pouvez reformuler ou réessayer.",
              };
            }
            return next;
          });
          setIsLoading(false);
          abortControllerRef.current = null;
          setIsConnecting(false);
        },
        onError: (errMsg) => {
          setError(errMsg);
          setIsConnecting(false);
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === 'assistant') {
              next[next.length - 1] = { ...last, content: `❌ Erreur: ${errMsg}` };
            }
            return next;
          });
          setIsLoading(false);
          abortControllerRef.current = null;
        },
      }
    );

    // Fallback: backend does not support streaming (501/404)
    if (!usedStream) {
      setMessages((prev) => prev.slice(0, -1)); // remove placeholder
      try {
        const response = await api.chat(
          message,
          sessionId ?? undefined,
          'openai',
          transactionId,
          lastAssistantContent
        );

        if (response.data.session_id && !sessionId) {
          setSessionId(response.data.session_id);
        }

        const assistantMessage: LeaMessage = {
          role: 'assistant',
          content: response.data.content,
          timestamp: new Date().toISOString(),
          actions: (response.data as { actions?: string[] }).actions ?? undefined,
          model: response.data.model,
          provider: response.data.provider,
          usage: response.data.usage,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        if (err instanceof Error && (err.name === 'CanceledError' || err.name === 'AbortError')) return;

        const axiosError = err as AxiosError<{ detail?: string }>;
        const errorMessage =
          (axiosError.response?.data as { detail?: string } | undefined)?.detail ||
          (err instanceof Error ? err.message : String(err)) ||
          'Erreur lors de la communication avec Léa';

        setError(errorMessage);
        const errorMsg: LeaMessage = {
          role: 'assistant',
          content: `❌ Erreur: ${errorMessage}`,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    }
  }, [isLoading, sessionId, api, transactionId]);

  const sendVoiceMessage = useCallback(
    async (audioBlob: Blob) => {
      if (isLoading) return;

      setIsLoading(true);
      setError(null);

      const userPlaceholder: LeaMessage = {
        role: 'user',
        content: '[Message vocal...]',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userPlaceholder]);

      try {
        const response = await api.chatVoice(audioBlob, sessionId ?? undefined);
        const data = response.data as LeaVoiceResponse;

        if (!data.success) {
          throw new Error(data.response || 'Erreur du chat vocal');
        }

        if (data.session_id && !sessionId) {
          setSessionId(data.session_id);
        }

        setMessages((prev) => {
          const withoutPlaceholder = prev.filter((m) => m.content !== '[Message vocal...]');
          const assistantMsg: LeaMessage = {
            role: 'assistant',
            content: data.response,
            timestamp: new Date().toISOString(),
            actions: (data as LeaVoiceResponse & { actions?: string[] }).actions,
            model: (data as LeaVoiceResponse & { model?: string }).model,
            provider: (data as LeaVoiceResponse & { provider?: string }).provider,
            usage: (data as LeaVoiceResponse & { usage?: LeaMessage['usage'] }).usage,
          };
          return [
            ...withoutPlaceholder,
            { role: 'user', content: data.transcription, timestamp: new Date().toISOString() },
            assistantMsg,
          ];
        });

        if (data.assistant_audio_url) {
          playLeaAudioWhenReady(new Audio(data.assistant_audio_url));
        } else if (data.assistant_audio_base64) {
          const dataUrl = `data:audio/mpeg;base64,${data.assistant_audio_base64}`;
          playLeaAudioWhenReady(new Audio(dataUrl));
        }
      } catch (err) {
        const axiosError = err as AxiosError<{ detail?: string }>;
        const errorMessage =
          axiosError.response?.data?.detail ||
          axiosError.message ||
          'Erreur lors du chat vocal';

        setError(errorMessage);
        setMessages((prev) => {
          const withoutPlaceholder = prev.filter((m) => m.content !== '[Message vocal...]');
          return [
            ...withoutPlaceholder,
            {
              role: 'user',
              content: 'Message vocal',
              timestamp: new Date().toISOString(),
            },
            {
              role: 'assistant',
              content: `❌ ${errorMessage}`,
              timestamp: new Date().toISOString(),
            },
          ];
        });
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, sessionId, api]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    // Keep session ID to maintain context
  }, []);

  const loadConversation = useCallback(async (sid: string) => {
    setError(null);
    try {
      const res = await api.getContext(sid);
      const data = (res as { data: { session_id: string; messages?: Array<{ role?: string; content?: string; timestamp?: string }> } }).data;
      const raw = data.messages ?? [];
      const mapped: LeaMessage[] = raw
        .filter((m) => m && typeof m.role === 'string' && typeof m.content === 'string')
        .map((m) => ({
          role: (m.role === 'user' || m.role === 'assistant' || m.role === 'system' ? m.role : 'assistant') as LeaMessage['role'],
          content: m.content ?? '',
          timestamp: m.timestamp,
        }));
      setMessages(mapped);
      setSessionId(data.session_id ?? sid);
    } catch (err) {
      const axiosError = err as AxiosError<{ detail?: string }>;
      setError((axiosError.response?.data as { detail?: string } | undefined)?.detail ?? (err instanceof Error ? err.message : 'Impossible de charger la conversation'));
    }
  }, [api]);

  const startNewConversation = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    setError(null);
  }, []);

  const resetContext = useCallback(async () => {
    if (!sessionId) return;

    try {
      await api.resetContext(sessionId);
      setMessages([]);
      setSessionId(null);
      setError(null);
    } catch (err) {
      const axiosError = err as AxiosError<{ detail?: string }>;
      setError(
        (axiosError.response?.data as { detail?: string } | undefined)?.detail ||
          (err instanceof Error ? err.message : 'Erreur lors de la réinitialisation du contexte')
      );
    }
  }, [sessionId, api]);

  return {
    messages,
    isLoading,
    isConnecting,
    error,
    sessionId,
    sendMessage,
    sendVoiceMessage,
    clearChat,
    resetContext,
    loadConversation,
    startNewConversation,
  };
}
