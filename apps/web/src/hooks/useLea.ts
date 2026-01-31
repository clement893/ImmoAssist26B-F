/**
 * Hook for Léa AI Assistant
 */

import { useState, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api';
import { AxiosError } from 'axios';

export interface LeaMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
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

export interface UseLeaReturn {
  messages: LeaMessage[];
  isLoading: boolean;
  error: string | null;
  sessionId: string | null;
  sendMessage: (message: string) => Promise<void>;
  clearChat: () => void;
  resetContext: () => Promise<void>;
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

    try {
      const response = await apiClient.post<LeaChatResponse>(
        '/v1/lea/chat',
        {
          message,
          session_id: sessionId,
          provider: 'auto',
        },
        {
          signal: abortControllerRef.current.signal,
        }
      );

      // Update session ID if new
      if (response.data.session_id && !sessionId) {
        setSessionId(response.data.session_id);
      }

      // Add assistant response
      const assistantMessage: LeaMessage = {
        role: 'assistant',
        content: response.data.content,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      if (err instanceof Error && err.name === 'CanceledError') {
        // Request was cancelled, ignore
        return;
      }

      const axiosError = err as AxiosError<{ detail?: string }>;
      const errorMessage =
        axiosError.response?.data?.detail ||
        axiosError.message ||
        'Erreur lors de la communication avec Léa';

      setError(errorMessage);

      // Add error message to chat
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
  }, [isLoading, sessionId]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    // Keep session ID to maintain context
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
    clearChat,
    resetContext,
  };
}
