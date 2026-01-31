"""OpenAI service for AI operations."""

import os
from typing import Optional, List, Dict, Any

try:
    from openai import AsyncOpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    AsyncOpenAI = None

# OpenAI configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")  # Default to cost-effective model
OPENAI_MAX_TOKENS = int(os.getenv("OPENAI_MAX_TOKENS", "1000"))
OPENAI_TEMPERATURE = float(os.getenv("OPENAI_TEMPERATURE", "0.7"))


class OpenAIService:
    """Service for OpenAI operations."""

    def __init__(self):
        """Initialize OpenAI service."""
        if not OPENAI_AVAILABLE:
            raise ValueError("OpenAI library is not installed. Install it with: pip install openai")
        
        if not OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is not configured")
        
        self.client = AsyncOpenAI(api_key=OPENAI_API_KEY)
        self.model = OPENAI_MODEL
        self.max_tokens = OPENAI_MAX_TOKENS
        self.temperature = OPENAI_TEMPERATURE

    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Create a chat completion.
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            model: Model to use (defaults to OPENAI_MODEL)
            temperature: Sampling temperature (defaults to OPENAI_TEMPERATURE)
            max_tokens: Maximum tokens to generate (defaults to OPENAI_MAX_TOKENS)
            
        Returns:
            Response dict with 'content' and other metadata
        """
        response = await self.client.chat.completions.create(
            model=model or self.model,
            messages=messages,
            temperature=temperature or self.temperature,
            max_tokens=max_tokens or self.max_tokens,
        )
        
        return {
            "content": response.choices[0].message.content,
            "model": response.model,
            "usage": {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens,
            },
            "finish_reason": response.choices[0].finish_reason,
        }

    async def simple_chat(
        self,
        user_message: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
    ) -> str:
        """
        Simple chat completion with a user message.
        
        Args:
            user_message: The user's message
            system_prompt: Optional system prompt
            model: Model to use
            
        Returns:
            The assistant's response content
        """
        messages = []
        
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        
        messages.append({"role": "user", "content": user_message})
        
        response = await self.chat_completion(messages, model=model)
        return response["content"]

    async def generate_text(
        self,
        prompt: str,
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
    ) -> str:
        """
        Generate text from a prompt.
        
        Args:
            prompt: The prompt text
            model: Model to use
            max_tokens: Maximum tokens to generate
            
        Returns:
            Generated text
        """
        messages = [{"role": "user", "content": prompt}]
        response = await self.chat_completion(messages, model=model, max_tokens=max_tokens)
        return response["content"]

    @staticmethod
    def is_configured() -> bool:
        """Check if OpenAI is properly configured."""
        return bool(OPENAI_AVAILABLE and OPENAI_API_KEY)

