# AI Components

Artificial intelligence and chat components for conversational interfaces.

## 📦 Components

- **AIChat** - AI-powered chat interface with multiple provider support

## 📖 Usage Examples

### AI Chat

```tsx
import { AIChat } from '@/components/ai';

<AIChat provider="openai" systemPrompt="You are a helpful assistant." model="gpt-4" />;
```

## 🎨 Features

- **Multiple Providers**: Support for OpenAI, Anthropic, and auto-selection
- **System Prompts**: Customizable system prompts for AI behavior
- **Message History**: Persistent conversation history
- **Error Handling**: Graceful error handling and retry logic
- **Loading States**: Visual feedback during AI processing

## 🔧 Configuration

The AIChat component supports:

- `provider`: 'openai' | 'anthropic' | 'auto'
- `systemPrompt`: Custom system prompt string
- `model`: Specific model name (optional)
- `className`: Additional CSS classes

## 🔗 Related Components

- See `/components/ui` for base UI components
- See `/components/forms` for form components
