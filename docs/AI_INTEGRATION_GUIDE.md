# 🤖 AI Integration Guide

Complete guide to using OpenAI and Anthropic (Claude) AI integration in the template.

---

## ✅ What's Included

### **Backend**

- ✅ Unified AI Service (`AIService`) supporting both OpenAI and Anthropic
- ✅ Provider selection (OpenAI, Anthropic, or Auto)
- ✅ Chat completion endpoints
- ✅ Health check endpoint
- ✅ Configuration management

### **Frontend**

- ✅ AI Chat component (`AIChat`)
- ✅ Provider selector UI
- ✅ Chat interface with message history
- ✅ Error handling
- ✅ Loading states
- ✅ Demo page at `/ai/chat`

---

## 🚀 Quick Start

### 1. Install Dependencies

The required packages are already in `requirements.txt`:

- `openai>=1.0.0`
- `anthropic>=0.18.0`

Install them:

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure API Keys

Add to your `backend/.env`:

```env
# OpenAI (optional)
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.7

# Anthropic/Claude (optional)
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key
ANTHROPIC_MODEL=claude-3-haiku-20240307
ANTHROPIC_MAX_TOKENS=1024
ANTHROPIC_TEMPERATURE=0.7
```

**Note:** You only need to configure one provider, but both can be configured simultaneously.

### 3. Use the Chat Interface

Navigate to `/ai/chat` in your application, or use the `AIChat` component:

```tsx
import { AIChat } from "@/components/ai/AIChat";

export default function MyPage() {
  return (
    <AIChat
      systemPrompt="You are a helpful assistant."
      provider="auto" // or "openai" or "anthropic"
    />
  );
}
```

---

## 📡 API Endpoints

### **POST `/api/v1/ai/chat`**

Full chat completion with message history.

**Request:**

```json
{
  "messages": [
    { "role": "user", "content": "Hello!" },
    { "role": "assistant", "content": "Hi there!" },
    { "role": "user", "content": "What's the weather?" }
  ],
  "provider": "auto", // "openai", "anthropic", or "auto"
  "model": "gpt-4o-mini", // optional, uses default if not specified
  "temperature": 0.7, // optional
  "max_tokens": 1000, // optional
  "system_prompt": "You are a helpful assistant." // optional
}
```

**Response:**

```json
{
  "content": "I don't have access to real-time weather data...",
  "model": "gpt-4o-mini",
  "provider": "openai",
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 25,
    "total_tokens": 40
  },
  "finish_reason": "stop"
}
```

### **POST `/api/v1/ai/chat/simple`**

Simple chat without message history.

**Request:**

```json
{
  "message": "Hello!",
  "provider": "auto",
  "system_prompt": "You are helpful.", // optional
  "model": "gpt-4o-mini" // optional
}
```

**Response:**

```json
{
  "response": "Hello! How can I help you today?",
  "provider": "openai"
}
```

### **GET `/api/v1/ai/health`**

Check AI provider configuration and connectivity.

**Response:**

```json
{
  "configured": true,
  "available_providers": ["openai", "anthropic"],
  "providers": {
    "openai": {
      "configured": true,
      "available": true,
      "model": "gpt-4o-mini",
      "test_response": "OK"
    },
    "anthropic": {
      "configured": true,
      "available": true,
      "model": "claude-3-haiku-20240307",
      "test_response": "OK"
    }
  }
}
```

---

## 🎨 Frontend Component

### **AIChat Component**

```tsx
import { AIChat } from "@/components/ai/AIChat";

<AIChat
  systemPrompt="You are a helpful AI assistant."
  provider="auto" // "openai" | "anthropic" | "auto"
  model="gpt-4o-mini" // optional
  className="h-[600px]" // optional
/>;
```

**Props:**

- `systemPrompt` (optional): System prompt for the AI
- `provider` (optional): AI provider to use ("openai", "anthropic", or "auto")
- `model` (optional): Specific model to use
- `className` (optional): Additional CSS classes

**Features:**

- ✅ Message history
- ✅ Provider switching
- ✅ Loading states
- ✅ Error handling
- ✅ Auto-scroll
- ✅ Keyboard shortcuts (Enter to send)

---

## 🔧 Backend Service

### **Using AIService Directly**

```python
from app.services.ai_service import AIService, AIProvider

# Auto-select provider
service = AIService(provider=AIProvider.AUTO)

# Or specify provider
service = AIService(provider=AIProvider.OPENAI)
service = AIService(provider=AIProvider.ANTHROPIC)

# Simple chat
response = await service.simple_chat(
    user_message="Hello!",
    system_prompt="You are helpful.",
)

# Full chat with history
messages = [
    {"role": "user", "content": "Hello!"},
    {"role": "assistant", "content": "Hi!"},
    {"role": "user", "content": "What's 2+2?"}
]

response = await service.chat_completion(
    messages=messages,
    model="gpt-4o-mini",
    temperature=0.7,
    max_tokens=1000,
    system_prompt="You are a math tutor.",
)
```

---

## 🎯 Use Cases

### **1. Real Estate AI Assistant**

```python
system_prompt = """
You are a real estate assistant. Help users find properties,
answer questions about neighborhoods, and provide market insights.
"""

response = await service.simple_chat(
    user_message="Tell me about properties in downtown",
    system_prompt=system_prompt,
)
```

### **2. Coaching Platform**

```python
system_prompt = """
You are a coaching assistant. Help students with their questions,
provide encouragement, and guide them through learning materials.
"""

response = await service.chat_completion(
    messages=conversation_history,
    system_prompt=system_prompt,
)
```

### **3. E-commerce Support**

```python
system_prompt = """
You are a customer support assistant for an e-commerce platform.
Help customers with orders, products, shipping, and returns.
"""

response = await service.simple_chat(
    user_message="Where is my order?",
    system_prompt=system_prompt,
)
```

---

## ⚙️ Configuration

### **Environment Variables**

| Variable                | Description       | Default                   |
| ----------------------- | ----------------- | ------------------------- |
| `OPENAI_API_KEY`        | OpenAI API key    | -                         |
| `OPENAI_MODEL`          | OpenAI model      | `gpt-4o-mini`             |
| `OPENAI_MAX_TOKENS`     | Max tokens        | `1000`                    |
| `OPENAI_TEMPERATURE`    | Temperature       | `0.7`                     |
| `ANTHROPIC_API_KEY`     | Anthropic API key | -                         |
| `ANTHROPIC_MODEL`       | Anthropic model   | `claude-3-haiku-20240307` |
| `ANTHROPIC_MAX_TOKENS`  | Max tokens        | `1024`                    |
| `ANTHROPIC_TEMPERATURE` | Temperature       | `0.7`                     |

### **Available Models**

**OpenAI:**

- `gpt-4o-mini` (default, cost-effective)
- `gpt-4o`
- `gpt-4-turbo`
- `gpt-3.5-turbo`

**Anthropic:**

- `claude-3-haiku-20240307` (default, fastest)
- `claude-3-sonnet-20240229`
- `claude-3-opus-20240229`

---

## 🔒 Security

- ✅ Authentication required for all endpoints
- ✅ Rate limiting (configured via existing rate limit middleware)
- ✅ Input validation
- ✅ Error handling
- ✅ API keys stored securely in environment variables

---

## 📊 Provider Comparison

| Feature      | OpenAI            | Anthropic              |
| ------------ | ----------------- | ---------------------- |
| **Speed**    | Fast              | Very Fast              |
| **Cost**     | Low (gpt-4o-mini) | Low (haiku)            |
| **Context**  | 128K tokens       | 200K tokens            |
| **Best For** | General purpose   | Long context, analysis |

---

## 🐛 Troubleshooting

### **"No AI provider is configured"**

- Ensure at least one API key is set in environment variables
- Check that the key is correct and has proper permissions

### **"Provider not available"**

- Verify the API key is valid
- Check your internet connection
- Ensure the provider's service is operational

### **Rate Limiting**

- Both providers have rate limits
- Consider implementing caching for frequent queries
- Use the cheaper models for high-volume use cases

---

## 📚 Examples

See the demo page at `/ai/chat` for a working example.

---

**Last Updated:** 2025-01-27  
**Template Version:** 1.0.0
