'use client';

import { AIChat } from '@/components/ai/AIChat';
import Container from '@/components/ui/Container';

export default function AIChatPage() {
  return (
    <Container className="py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">AI Chat Assistant</h1>
        <p className="text-muted-foreground">
          Chat with OpenAI GPT or Anthropic Claude. Choose your preferred AI provider or let the
          system auto-select.
        </p>
      </div>

      <div className="h-[600px]">
        <AIChat
          systemPrompt="You are a helpful AI assistant. Be concise, accurate, and friendly."
          provider="auto"
        />
      </div>
    </Container>
  );
}
