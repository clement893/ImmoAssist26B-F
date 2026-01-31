'use client';

import { useState, useRef, useEffect } from 'react';
import { Button, Input, Card } from '@/components/ui';
import { apiClient } from '@/lib/api/client';
import { Loader2, Send, Bot, User } from 'lucide-react';
import { getErrorMessage } from '@/lib/errors';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  provider?: string;
}

interface AIChatProps {
  systemPrompt?: string;
  provider?: 'openai' | 'anthropic' | 'auto';
  model?: string;
  className?: string;
}

export function AIChat({ systemPrompt, provider = 'auto', model, className = '' }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentProvider, setCurrentProvider] = useState<string>(provider);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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

      const response = await apiClient.post<ChatResponse>('/api/v1/ai/chat', {
        messages: apiMessages,
        provider: currentProvider,
        model,
        system_prompt: systemPrompt,
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
      const errorMessage = getErrorMessage(err) || 'Failed to send message';
      setError(errorMessage);

      // Add error message to chat
      const errorMsg: Message = {
        role: 'assistant',
        content: `Error: ${errorMessage}`,
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

  return (
    <Card className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary-500" />
          <h3 className="font-semibold">AI Assistant</h3>
          {currentProvider !== 'auto' && (
            <span className="text-xs text-muted-foreground capitalize">({currentProvider})</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={currentProvider}
            onChange={(e) => setCurrentProvider(e.target.value)}
            className="text-xs px-2 py-1 border border-border rounded bg-background text-foreground"
            disabled={isLoading}
          >
            <option value="auto">Auto</option>
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
          </select>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearChat} disabled={isLoading}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p>Start a conversation with AI</p>
              <p className="text-sm mt-2">Ask anything and get intelligent responses</p>
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
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-primary-500 text-background'
                  : 'bg-muted text-foreground'
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
              {message.provider && message.role === 'assistant' && (
                <p className="text-xs mt-1 opacity-70 capitalize">via {message.provider}</p>
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
            <div className="bg-muted rounded-lg p-3">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
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
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={!input.trim() || isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
