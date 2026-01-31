"""
Unified AI Service
Supports both OpenAI and Anthropic (Claude) APIs
"""

import os
from typing import Optional, List, Dict, Any, Literal
from enum import Enum

try:
    from openai import AsyncOpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    AsyncOpenAI = None

try:
    from anthropic import AsyncAnthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False
    AsyncAnthropic = None

from app.core.logging import logger


class AIProvider(str, Enum):
    """Supported AI providers"""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    AUTO = "auto"  # Auto-select based on availability


class AIService:
    """Unified AI service supporting OpenAI and Anthropic"""
    
    def __init__(self, provider: AIProvider = AIProvider.AUTO):
        """
        Initialize AI service.
        
        Args:
            provider: AI provider to use (openai, anthropic, or auto)
        """
        self.provider = self._resolve_provider(provider)
        self._initialize_client()
    
    def _resolve_provider(self, provider: AIProvider) -> AIProvider:
        """Resolve provider, defaulting to available one"""
        if provider == AIProvider.AUTO:
            # Prefer OpenAI if both available, otherwise use what's available
            if OPENAI_AVAILABLE and self._is_openai_configured():
                return AIProvider.OPENAI
            elif ANTHROPIC_AVAILABLE and self._is_anthropic_configured():
                return AIProvider.ANTHROPIC
            else:
                raise ValueError("No AI provider is configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY")
        
        return provider
    
    def _is_openai_configured(self) -> bool:
        """Check if OpenAI is configured"""
        return bool(os.getenv("OPENAI_API_KEY"))
    
    def _is_anthropic_configured(self) -> bool:
        """Check if Anthropic is configured"""
        return bool(os.getenv("ANTHROPIC_API_KEY"))
    
    def _initialize_client(self):
        """Initialize the appropriate client"""
        if self.provider == AIProvider.OPENAI:
            if not OPENAI_AVAILABLE:
                raise ValueError("OpenAI library is not installed. Install it with: pip install openai")
            if not self._is_openai_configured():
                raise ValueError("OPENAI_API_KEY is not configured")
            
            self.client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
            self.max_tokens = int(os.getenv("OPENAI_MAX_TOKENS", "1000"))
            self.temperature = float(os.getenv("OPENAI_TEMPERATURE", "0.7"))
            
        elif self.provider == AIProvider.ANTHROPIC:
            if not ANTHROPIC_AVAILABLE:
                raise ValueError("Anthropic library is not installed. Install it with: pip install anthropic")
            if not self._is_anthropic_configured():
                raise ValueError("ANTHROPIC_API_KEY is not configured")
            
            self.client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
            self.model = os.getenv("ANTHROPIC_MODEL", "claude-3-haiku-20240307")
            self.max_tokens = int(os.getenv("ANTHROPIC_MAX_TOKENS", "1024"))
            self.temperature = float(os.getenv("ANTHROPIC_TEMPERATURE", "0.7"))
        else:
            raise ValueError(f"Unsupported provider: {self.provider}")
    
    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        system_prompt: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create a chat completion.
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            model: Model to use (defaults to configured model)
            temperature: Sampling temperature (defaults to configured temperature)
            max_tokens: Maximum tokens to generate (defaults to configured max_tokens)
            system_prompt: System prompt (for Anthropic, prepended to messages)
            
        Returns:
            Response dict with 'content', 'model', 'usage', 'finish_reason', 'provider'
        """
        if self.provider == AIProvider.OPENAI:
            return await self._openai_chat_completion(
                messages, model, temperature, max_tokens, system_prompt
            )
        elif self.provider == AIProvider.ANTHROPIC:
            return await self._anthropic_chat_completion(
                messages, model, temperature, max_tokens, system_prompt
            )
        else:
            raise ValueError(f"Unsupported provider: {self.provider}")
    
    async def _openai_chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str],
        temperature: Optional[float],
        max_tokens: Optional[int],
        system_prompt: Optional[str],
    ) -> Dict[str, Any]:
        """OpenAI chat completion"""
        # Add system prompt if provided
        if system_prompt:
            # Check if first message is already a system message
            if not messages or messages[0].get("role") != "system":
                messages.insert(0, {"role": "system", "content": system_prompt})
        
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
            "provider": "openai",
        }
    
    async def _anthropic_chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str],
        temperature: Optional[float],
        max_tokens: Optional[int],
        system_prompt: Optional[str],
    ) -> Dict[str, Any]:
        """Anthropic (Claude) chat completion"""
        # Convert messages format for Anthropic
        # Anthropic uses 'user' and 'assistant' roles, and system is separate
        anthropic_messages = []
        
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            
            # Skip system messages (handled separately)
            if role == "system":
                if not system_prompt:
                    system_prompt = content
                continue
            
            # Convert to Anthropic format
            if role in ["user", "assistant"]:
                anthropic_messages.append({
                    "role": role,
                    "content": content,
                })
        
        # Use system prompt parameter or the one from messages
        system = system_prompt or None
        
        response = await self.client.messages.create(
            model=model or self.model,
            max_tokens=max_tokens or self.max_tokens,
            temperature=temperature or self.temperature,
            system=system,
            messages=anthropic_messages,
        )
        
        # Extract content (Anthropic returns content as a list)
        content = ""
        if response.content:
            for block in response.content:
                if hasattr(block, 'text'):
                    content += block.text
        
        return {
            "content": content,
            "model": response.model,
            "usage": {
                "input_tokens": response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens,
                "total_tokens": response.usage.input_tokens + response.usage.output_tokens,
            },
            "finish_reason": response.stop_reason,
            "provider": "anthropic",
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
        messages = [{"role": "user", "content": user_message}]
        response = await self.chat_completion(
            messages=messages,
            model=model,
            system_prompt=system_prompt,
        )
        return response["content"]
    
    @staticmethod
    def is_configured(provider: Optional[AIProvider] = None) -> bool:
        """Check if any AI provider is configured"""
        if provider == AIProvider.OPENAI or provider is None:
            if OPENAI_AVAILABLE and bool(os.getenv("OPENAI_API_KEY")):
                return True
        
        if provider == AIProvider.ANTHROPIC or provider is None:
            if ANTHROPIC_AVAILABLE and bool(os.getenv("ANTHROPIC_API_KEY")):
                return True
        
        return False
    
    @staticmethod
    def get_available_providers() -> List[str]:
        """Get list of available and configured providers"""
        providers = []
        
        if OPENAI_AVAILABLE and bool(os.getenv("OPENAI_API_KEY")):
            providers.append("openai")
        
        if ANTHROPIC_AVAILABLE and bool(os.getenv("ANTHROPIC_API_KEY")):
            providers.append("anthropic")
        
        return providers

