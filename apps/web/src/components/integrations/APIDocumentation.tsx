/**
 * API Documentation Component
 * Interactive API documentation viewer
 */
'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import type { ColorVariant } from '@/components/ui/types';
import { Book, Code, Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { logger } from '@/lib/logger';

export interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  parameters?: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  requestBody?: {
    schema: Record<string, unknown>;
    example: unknown;
  };
  responses?: {
    status: number;
    description: string;
    example: unknown;
  }[];
  tags?: string[];
}

export interface APIDocumentationProps {
  endpoints?: APIEndpoint[];
  baseUrl?: string;
  onTryIt?: (endpoint: APIEndpoint) => void;
  className?: string;
}

const methodColors: Record<APIEndpoint['method'], ColorVariant> = {
  GET: 'success',
  POST: 'info', // Changed from 'primary' to 'info' since Badge doesn't support 'primary'
  PUT: 'warning',
  DELETE: 'error',
  PATCH: 'info',
};

const defaultEndpoints: APIEndpoint[] = [
  {
    method: 'GET',
    path: '/api/users',
    description: 'Retrieve a list of users',
    parameters: [
      {
        name: 'page',
        type: 'number',
        required: false,
        description: 'Page number',
      },
      {
        name: 'limit',
        type: 'number',
        required: false,
        description: 'Items per page',
      },
    ],
    responses: [
      {
        status: 200,
        description: 'Success',
        example: {
          users: [],
          total: 0,
        },
      },
    ],
    tags: ['users'],
  },
  {
    method: 'POST',
    path: '/api/users',
    description: 'Create a new user',
    requestBody: {
      schema: {
        name: 'string',
        email: 'string',
      },
      example: {
        name: 'John Doe',
        email: 'john@example.com',
      },
    },
    responses: [
      {
        status: 201,
        description: 'User created',
        example: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
        },
      },
    ],
    tags: ['users'],
  },
];

export default function APIDocumentation({
  endpoints = defaultEndpoints,
  baseUrl = 'https://api.example.com',
  onTryIt,
  className,
}: APIDocumentationProps) {
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set());
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const toggleEndpoint = (path: string) => {
    setExpandedEndpoints((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
      logger.info('Code copied to clipboard');
    } catch (error: unknown) {
      logger.error('Failed to copy to clipboard', error instanceof Error ? error : undefined);
    }
  };

  const getCodeExample = (endpoint: APIEndpoint) => {
    const url = `${baseUrl}${endpoint.path}`;
    const params = endpoint.parameters
      ?.filter((p) => p.required)
      .map((p) => `${p.name}=value`)
      .join('&');
    const fullUrl = params ? `${url}?${params}` : url;

    if (endpoint.method === 'GET') {
      return `curl -X GET "${fullUrl}" \\
  -H "Authorization: Bearer YOUR_API_KEY"`;
    }

    if (endpoint.requestBody) {
      return `curl -X ${endpoint.method} "${url}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '${JSON.stringify(endpoint.requestBody.example, null, 2)}'`;
    }

    return `curl -X ${endpoint.method} "${url}" \\
  -H "Authorization: Bearer YOUR_API_KEY"`;
  };

  const uniqueTags = Array.from(new Set(endpoints.flatMap((e) => e.tags || [])));

  return (
    <Card className={clsx('bg-background', className)}>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Book className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h3 className="text-lg font-semibold text-foreground">API Documentation</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Base URL:{' '}
          <code className="text-xs bg-muted px-2 py-1 rounded">{baseUrl}</code>
        </p>
      </div>

      {/* Tags Filter */}
      {uniqueTags.length > 0 && (
        <div className="mb-6 flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Tags:</span>
          {uniqueTags.map((tag) => (
            <Badge key={tag} variant="info">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Endpoints */}
      <div className="space-y-4">
        {endpoints.map((endpoint, index) => {
          const isExpanded = expandedEndpoints.has(endpoint.path);
          const codeId = `${endpoint.method}-${endpoint.path}`;
          const codeExample = getCodeExample(endpoint);

          return (
            <div key={index} className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleEndpoint(endpoint.path)}
                className="w-full p-4 flex items-center justify-between hover:bg-muted dark:hover:bg-background transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  <Badge variant={methodColors[endpoint.method]}>{endpoint.method}</Badge>
                  <code className="text-sm font-mono text-foreground">{endpoint.path}</code>
                  <span className="text-sm text-muted-foreground">{endpoint.description}</span>
                </div>
                {endpoint.tags && endpoint.tags.length > 0 && (
                  <div className="flex items-center gap-1">
                    {endpoint.tags.map((tag) => (
                      <Badge key={tag} variant="default">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </button>

              {isExpanded && (
                <div className="p-4 border-t border-border bg-muted space-y-4">
                  {/* Parameters */}
                  {endpoint.parameters && endpoint.parameters.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2">Parameters</h4>
                      <div className="space-y-2">
                        {endpoint.parameters.map((param, idx) => (
                          <div key={idx} className="text-sm p-2 bg-background rounded border border-border">
                            <div className="flex items-center gap-2">
                              <code className="font-mono text-primary-600 dark:text-primary-400">
                                {param.name}
                              </code>
                              <Badge variant="default">{param.type}</Badge>
                              {param.required && <Badge variant="error">Required</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{param.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Request Body */}
                  {endpoint.requestBody && (
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2">Request Body</h4>
                      <div className="relative">
                        <pre className="p-3 bg-muted rounded-lg text-xs text-muted-foreground overflow-x-auto">
                          <code>{JSON.stringify(endpoint.requestBody.example, null, 2)}</code>
                        </pre>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              JSON.stringify(endpoint.requestBody!.example, null, 2),
                              `${codeId}-body`
                            )
                          }
                          className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-muted-foreground"
                        >
                          {copiedCode === `${codeId}-body` ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Code Example */}
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Code className="w-4 h-4" />
                      Code Example
                    </h4>
                    <div className="relative">
                      <pre className="p-3 bg-muted rounded-lg text-xs text-muted-foreground overflow-x-auto">
                        <code>{codeExample}</code>
                      </pre>
                      <button
                        onClick={() => copyToClipboard(codeExample, codeId)}
                        className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-muted-foreground"
                      >
                        {copiedCode === codeId ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Responses */}
                  {endpoint.responses && endpoint.responses.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2">Responses</h4>
                      <div className="space-y-2">
                        {endpoint.responses.map((response, idx) => (
                          <div key={idx} className="p-3 bg-background rounded border border-border">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge
                                variant={
                                  response.status >= 200 && response.status < 300
                                    ? 'success'
                                    : response.status >= 400
                                      ? 'error'
                                      : 'warning'
                                }
                              >
                                {response.status}
                              </Badge>
                              <span className="text-sm text-foreground">{response.description}</span>
                            </div>
                            {response.example != null && (
                              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                                <code>{JSON.stringify(response.example, null, 2)}</code>
                              </pre>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Try It Button */}
                  {onTryIt && (
                    <div className="pt-2">
                      <Button variant="primary" onClick={() => onTryIt(endpoint)} fullWidth>
                        Try It Out
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
