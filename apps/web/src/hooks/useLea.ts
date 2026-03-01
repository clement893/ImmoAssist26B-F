/**
 * Hook for Léa AI Assistant
 * Uses streaming when available for fast, fluid responses.
 */

import { useState, useCallback, useRef } from 'react';
import { apiClient, leaAPI } from '@/lib/api';
import { AxiosError } from 'axios';

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
  error: string | null;
  sessionId: string | null;
  sendMessage: (message: string) => Promise<void>;
  sendVoiceMessage: (audioBlob: Blob) => Promise<void>;
  clearChat: () => void;
  resetContext: () => Promise<void>;
  /** Load a conversation by session_id (fetches messages from API). */
  loadConversation: (sessionId: string) => Promise<void>;
  /** Start a new conversation (clear state; next send will create new session). */
  startNewConversation: () => void;
}

export function useLea(initialSessionId?: string): UseLeaReturn {
  const [messages, setMessages] = useState<LeaMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

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

    const lastAssistantContent = messages.filter((m) => m.role === 'assistant').pop()?.content ?? undefined;

    const usedStream = await leaAPI.chatStream(
      {
        message,
        sessionId: sessionId ?? undefined,
        lastAssistantMessage: lastAssistantContent,
      },
      {
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
        },
        onError: (errMsg) => {
          setError(errMsg);
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
        const response = await apiClient.post<LeaChatResponse>(
          '/v1/lea/chat',
          {
            message,
            session_id: sessionId,
            last_assistant_message: lastAssistantContent,
            provider: 'openai',
          },
          { signal: abortControllerRef.current.signal }
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
        if (err instanceof Error && err.name === 'CanceledError') return;

        const axiosError = err as AxiosError<{ detail?: string }>;
        const errorMessage =
          axiosError.response?.data?.detail ||
          axiosError.message ||
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
  }, [isLoading, sessionId]);

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
        const response = await leaAPI.chatVoice(audioBlob, sessionId ?? undefined);
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
          const audio = new Audio(data.assistant_audio_url);
          audio.play().catch(() => {});
        } else if (data.assistant_audio_base64) {
          const dataUrl = `data:audio/mpeg;base64,${data.assistant_audio_base64}`;
          const audio = new Audio(dataUrl);
          audio.play().catch(() => {});
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
    [isLoading, sessionId]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    // Keep session ID to maintain context
  }, []);

  const loadConversation = useCallback(async (sid: string) => {
    setError(null);
    try {
      const res = await leaAPI.getContext(sid);
      const data = res.data as { session_id: string; messages?: Array<{ role?: string; content?: string; timestamp?: string }> };
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
      setError(axiosError.response?.data?.detail ?? 'Impossible de charger la conversation');
    }
  }, []);

  const startNewConversation = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    setError(null);
  }, []);

  const resetContext = useCallback(async () => {
    if (!sessionId) return;

    try {
      await apiClient.delete('/v1/lea/context', {
        params: { session_id: sessionId },
      });
      setMessages([]);
      setSessionId(null);
      setError(null);
    } catch (err) {
      const axiosError = err as AxiosError<{ detail?: string }>;
      setError(
        axiosError.response?.data?.detail ||
          'Erreur lors de la réinitialisation du contexte'
      );
    }
  }, [sessionId]);

  return {
    messages,
    isLoading,
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
