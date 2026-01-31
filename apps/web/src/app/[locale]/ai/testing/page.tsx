'use client';

import { useState } from 'react';
import { aiAPI } from '@/lib/api';
import { AxiosError } from 'axios';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {
  Button,
  Card,
  Input,
  Textarea,
  Alert,
  Badge,
  Select,
  Tabs,
  TabList,
  Tab,
} from '@/components/ui';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface HealthStatus {
  status: string;
  configured?: boolean;
  model?: string;
  available?: boolean;
  error?: string;
  [key: string]: unknown;
}

interface ApiErrorResponse {
  detail?: string;
  message?: string;
}

function AITestContent() {
  const [mode, setMode] = useState<'simple' | 'chat'>('simple');
  const [simpleMessage, setSimpleMessage] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([{ role: 'user', content: '' }]);
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [model, setModel] = useState('gpt-4o-mini');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);

  const checkHealth = async () => {
    try {
      const res = await aiAPI.health();
      setHealthStatus(res.data as HealthStatus);
      setError('');
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setError(axiosError.response?.data?.detail || 'Failed to check health');
      setHealthStatus(null);
    }
  };

  const handleSimpleChat = async () => {
    if (!simpleMessage.trim()) {
      setError('Please enter a message');
      return;
    }

    setIsLoading(true);
    setError('');
    setResponse('');

    try {
      const res = await aiAPI.simpleChat(simpleMessage, systemPrompt || undefined, model);
      setResponse(res.data.response);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setError(axiosError.response?.data?.detail || 'Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChat = async () => {
    const validMessages = messages.filter((m) => m.content.trim());
    if (validMessages.length === 0) {
      setError('Please add at least one message');
      return;
    }

    setIsLoading(true);
    setError('');
    setResponse('');

    try {
      const res = await aiAPI.chat(validMessages, model, temperature, maxTokens);
      setResponse(res.data.content);

      setMessages([...validMessages, { role: 'assistant', content: res.data.content }]);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setError(axiosError.response?.data?.detail || 'Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };

  const addMessage = () => {
    setMessages([...messages, { role: 'user', content: '' }]);
  };

  const updateMessage = (index: number, content: string) => {
    const newMessages = [...messages];
    const message = newMessages[index];
    if (message) {
      message.content = content;
      setMessages(newMessages);
    }
  };

  const removeMessage = (index: number) => {
    setMessages(messages.filter((_, i) => i !== index));
  };

  const changeMessageRole = (index: number, role: 'system' | 'user' | 'assistant') => {
    const newMessages = [...messages];
    const message = newMessages[index];
    if (message) {
      message.role = role;
      setMessages(newMessages);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 dark:from-muted dark:to-muted py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card title="AI Test Interface">
          {/* Health Check */}
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-foreground">Health Check</h2>
              <Button variant="primary" onClick={checkHealth} size="sm">
                Check Status
              </Button>
            </div>
            {healthStatus && (
              <div className="mt-2 text-sm space-y-2">
                <div className="flex items-center gap-2">
                  <strong className="text-foreground">Configured:</strong>
                  <Badge variant={healthStatus.configured ? 'success' : 'error'}>
                    {healthStatus.configured ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <p className="text-foreground">
                  <strong>Model:</strong> {healthStatus.model ? String(healthStatus.model) : 'N/A'}
                </p>
                <p className="text-foreground">
                  <strong>Available:</strong> {healthStatus.available ? 'Yes' : 'No'}
                </p>
                {healthStatus.error && (
                  <Alert variant="error" className="mt-2">
                    Error: {String(healthStatus.error)}
                  </Alert>
                )}
              </div>
            )}
          </div>

          {/* Mode Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-foreground">Mode</label>
            <Tabs defaultTab={mode} onChange={(value) => setMode(value as 'simple' | 'chat')}>
              <TabList>
                <Tab value="simple">Simple Chat</Tab>
                <Tab value="chat">Full Chat</Tab>
              </TabList>
            </Tabs>
          </div>

          {/* Model Settings */}
          <Card title="Model Settings" className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                options={[
                  { label: 'gpt-4o-mini', value: 'gpt-4o-mini' },
                  { label: 'gpt-4o', value: 'gpt-4o' },
                  { label: 'gpt-4-turbo', value: 'gpt-4-turbo' },
                  { label: 'gpt-3.5-turbo', value: 'gpt-3.5-turbo' },
                ]}
                fullWidth
              />
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">
                  Temperature: {temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <Input
                type="number"
                label="Max Tokens"
                value={maxTokens.toString()}
                onChange={(e) => setMaxTokens(parseInt(e.target.value) || 1000)}
                min={1}
                max={4000}
                fullWidth
              />
            </div>
          </Card>

          {/* Simple Chat Mode */}
          {mode === 'simple' && (
            <div className="space-y-4">
              <Textarea
                label="System Prompt (optional)"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="You are a helpful assistant..."
                rows={2}
                fullWidth
              />
              <Textarea
                label="Your Message"
                value={simpleMessage}
                onChange={(e) => setSimpleMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={4}
                required
                fullWidth
              />
              <Button
                onClick={handleSimpleChat}
                disabled={isLoading}
                loading={isLoading}
                variant="primary"
                fullWidth
              >
                {isLoading ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          )}

          {/* Full Chat Mode */}
          {mode === 'chat' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground">Messages</label>
                  <Button variant="primary" onClick={addMessage} size="sm">
                    + Add Message
                  </Button>
                </div>
                {messages.map((msg, index) => (
                  <Card key={index} className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Select
                        value={msg.role}
                        onChange={(e) =>
                          changeMessageRole(index, e.target.value as Message['role'])
                        }
                        options={[
                          { label: 'System', value: 'system' },
                          { label: 'User', value: 'user' },
                          { label: 'Assistant', value: 'assistant' },
                        ]}
                        className="flex-1"
                      />
                      {messages.length > 1 && (
                        <Button variant="danger" onClick={() => removeMessage(index)} size="sm">
                          Remove
                        </Button>
                      )}
                    </div>
                    <Textarea
                      value={msg.content}
                      onChange={(e) => updateMessage(index, e.target.value)}
                      placeholder={`${msg.role} message...`}
                      rows={2}
                      fullWidth
                    />
                  </Card>
                ))}
              </div>
              <Button
                onClick={handleChat}
                disabled={isLoading}
                loading={isLoading}
                variant="primary"
                fullWidth
              >
                {isLoading ? 'Sending...' : 'Send Chat'}
              </Button>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="error" title="Error" className="mt-4">
              {error}
            </Alert>
          )}

          {/* Response Display */}
          {response && (
            <Alert variant="success" title="AI Response" className="mt-6">
              <div className="text-foreground whitespace-pre-wrap mt-2">{response}</div>
            </Alert>
          )}
        </Card>
      </div>
    </main>
  );
}

export default function AITestPage() {
  return (
    <ProtectedRoute>
      <AITestContent />
    </ProtectedRoute>
  );
}
