'use client';

import { useState, useRef, useEffect } from 'react';
import { Button, Input, Card } from '@/components/ui';
import { apiClient } from '@/lib/api/client';
import { Loader2, Send, Bot, User, BookOpen, X } from 'lucide-react';
import { getErrorMessage } from '@/lib/errors';
import { useTranslations } from 'next-intl';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  provider?: string;
}

interface TemplateAIChatProps {
  className?: string;
  defaultOpen?: boolean;
}

export function TemplateAIChat({ className = '', defaultOpen = false }: TemplateAIChatProps) {
  const t = useTranslations('Dashboard.AIChat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Prepare messages for API
      const apiMessages = [...messages, userMessage].map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      interface ChatResponse {
        content: string;
        model: string;
        provider: string;
        usage: {
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
          input_tokens?: number;
          output_tokens?: number;
        };
        finish_reason: string;
      }

      const response = await apiClient.post<ChatResponse>('/api/v1/ai/chat/template', {
        messages: apiMessages,
        provider: 'auto',
        max_tokens: 2000,
      });

      if (!response.data) {
        throw new Error('No data received from AI service');
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.content,
        timestamp: new Date(),
        provider: response.data.provider,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err) || t('errors.sendFailed');
      setError(errorMessage);

      // Add error message to chat
      const errorMsg: Message = {
        role: 'assistant',
        content: `${t('errors.errorPrefix')}: ${errorMessage}`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  // Floating button when closed
  if (!isOpen) {
    return (
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full shadow-lg h-14 w-14 p-0"
          variant="primary"
        >
          <Bot className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  // Full chat interface when open
  return (
    <div className={`fixed bottom-6 right-6 z-50 w-96 h-[600px] ${className}`}>
      <Card className="flex flex-col h-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-primary-50 dark:bg-primary-900/20">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary-500" />
            <h3 className="font-semibold text-foreground">{t('title')}</h3>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                disabled={isLoading}
                className="text-xs"
              >
                {t('clear')}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} disabled={isLoading}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/50">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-primary-400" />
                <p className="font-medium">{t('welcome.title')}</p>
                <p className="text-sm mt-2">{t('welcome.description')}</p>
                <div className="mt-4 text-left space-y-2">
                  <p className="text-xs font-semibold">{t('welcome.examples')}:</p>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• {t('welcome.example1')}</li>
                    <li>• {t('welcome.example2')}</li>
                    <li>• {t('welcome.example3')}</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-primary-500 text-background'
                    : 'bg-background text-foreground border border-border'
                }`}
              >
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap break-words m-0">{message.content}</p>
                </div>
                {message.provider && message.role === 'assistant' && (
                  <p className="text-xs mt-2 opacity-70 capitalize">
                    {t('via')} {message.provider}
                  </p>
                )}
              </div>
              {message.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="bg-background rounded-lg p-3 border border-border">
                <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t bg-background">
          {error && (
            <div className="mb-2 p-2 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded text-sm text-error-600 dark:text-error-400">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('inputPlaceholder')}
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={sendMessage} disabled={!input.trim() || isLoading} variant="primary">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
