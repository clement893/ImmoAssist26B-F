"""AI endpoints using OpenAI and Anthropic (Claude)."""

from typing import Optional, List, Literal
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.dependencies import get_current_user
from app.models import User
from app.services.ai_service import AIService, AIProvider
from app.services.documentation_service import get_documentation_service

router = APIRouter(prefix="/ai", tags=["ai"])


class ChatMessage(BaseModel):
    """Chat message schema."""
    role: str = Field(..., pattern="^(system|user|assistant)$")
    content: str = Field(..., min_length=1)


class ChatRequest(BaseModel):
    """Chat completion request schema."""
    messages: List[ChatMessage] = Field(..., min_items=1)
    provider: Optional[Literal["openai", "anthropic", "auto"]] = Field(default="auto", description="AI provider to use")
    model: Optional[str] = None
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(None, ge=1, le=4000)
    system_prompt: Optional[str] = None


class SimpleChatRequest(BaseModel):
    """Simple chat request schema."""
    message: str = Field(..., min_length=1)
    provider: Optional[Literal["openai", "anthropic", "auto"]] = Field(default="auto", description="AI provider to use")
    system_prompt: Optional[str] = None
    model: Optional[str] = None


class ChatResponse(BaseModel):
    """Chat completion response schema."""
    content: str
    model: str
    provider: str
    usage: dict
    finish_reason: str


@router.post("/chat", response_model=ChatResponse)
async def chat_completion(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
):
    """Create a chat completion using OpenAI or Anthropic (Claude)."""
    if not AIService.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No AI provider is configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY.",
        )
    
    try:
        # Resolve provider
        provider = AIProvider(request.provider) if request.provider != "auto" else AIProvider.AUTO
        service = AIService(provider=provider)
        
        # Convert Pydantic models to dicts
        messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        
        response = await service.chat_completion(
            messages=messages,
            model=request.model,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            system_prompt=request.system_prompt,
        )
        
        return ChatResponse(**response)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI service error: {str(e)}",
        )


@router.post("/chat/simple", response_model=dict)
async def simple_chat(
    request: SimpleChatRequest,
    current_user: User = Depends(get_current_user),
):
    """Simple chat completion using OpenAI or Anthropic (Claude)."""
    if not AIService.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No AI provider is configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY.",
        )
    
    try:
        # Resolve provider
        provider = AIProvider(request.provider) if request.provider != "auto" else AIProvider.AUTO
        service = AIService(provider=provider)
        
        response = await service.simple_chat(
            user_message=request.message,
            system_prompt=request.system_prompt,
            model=request.model,
        )
        
        return {
            "response": response,
            "provider": service.provider.value,
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI service error: {str(e)}",
        )


@router.post("/chat/template", response_model=ChatResponse)
async def template_chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Chat completion with template documentation context.
    This endpoint automatically includes template documentation in the system prompt.
    """
    if not AIService.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No AI provider is configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY.",
        )
    
    try:
        # Load documentation
        doc_service = get_documentation_service()
        documentation_context = doc_service.format_documentation_for_context(max_total_size=80000)
        doc_summary = doc_service.get_documentation_summary()
        
        # Build enhanced system prompt
        base_system_prompt = request.system_prompt or """You are a helpful AI assistant specialized in helping users understand and work with the Next.js Full-Stack Template.

You have access to the complete template documentation. Use this information to provide accurate, helpful answers about:
- Template features and capabilities
- Setup and configuration
- Architecture and design patterns
- API endpoints and usage
- Database schema and migrations
- Authentication and security
- Deployment and development workflows
- Customization and theming
- And any other template-related questions

Always cite specific documentation when providing answers. If you're unsure about something, say so rather than guessing.

Be friendly, professional, and concise. Format your responses clearly with proper markdown when appropriate."""

        enhanced_system_prompt = f"""{base_system_prompt}

=== TEMPLATE DOCUMENTATION ===

{doc_summary}

{documentation_context}

=== END DOCUMENTATION ===

Remember: You have access to the complete template documentation above. Use it to provide accurate, detailed answers."""

        # Resolve provider
        provider = AIProvider(request.provider) if request.provider != "auto" else AIProvider.AUTO
        service = AIService(provider=provider)
        
        # Convert Pydantic models to dicts
        messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        
        response = await service.chat_completion(
            messages=messages,
            model=request.model,
            temperature=request.temperature,
            max_tokens=request.max_tokens or 2000,  # Increased for longer responses
            system_prompt=enhanced_system_prompt,
        )
        
        return ChatResponse(**response)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI service error: {str(e)}",
        )


@router.get("/health")
async def ai_health_check(
    current_user: User = Depends(get_current_user),
):
    """Check AI provider configuration and connectivity."""
    result = {
        "configured": False,
        "available_providers": AIService.get_available_providers(),
        "providers": {},
    }
    
    # Check OpenAI
    if AIService.is_configured(AIProvider.OPENAI):
        try:
            service = AIService(provider=AIProvider.OPENAI)
            test_response = await service.simple_chat(
                user_message="Say 'OK' if you can hear me.",
            )
            result["providers"]["openai"] = {
                "configured": True,
                "available": True,
                "model": service.model,
                "test_response": test_response[:50],
            }
            result["configured"] = True
        except Exception as e:
            result["providers"]["openai"] = {
                "configured": True,
                "available": False,
                "error": str(e),
            }
    
    # Check Anthropic
    if AIService.is_configured(AIProvider.ANTHROPIC):
        try:
            service = AIService(provider=AIProvider.ANTHROPIC)
            test_response = await service.simple_chat(
                user_message="Say 'OK' if you can hear me.",
            )
            result["providers"]["anthropic"] = {
                "configured": True,
                "available": True,
                "model": service.model,
                "test_response": test_response[:50],
            }
            result["configured"] = True
        except Exception as e:
            result["providers"]["anthropic"] = {
                "configured": True,
                "available": False,
                "error": str(e),
            }
    
    if not result["configured"]:
        result["error"] = "No AI provider is configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY."
    
    return result

