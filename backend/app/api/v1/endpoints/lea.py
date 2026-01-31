"""
Léa AI Assistant Endpoints
"""

from typing import Optional, Literal
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user
from app.models import User
from app.database import get_db
from app.services.lea_service import LeaService
from app.services.ai_service import AIProvider
from app.core.logging import logger

router = APIRouter(prefix="/lea", tags=["lea"])


class LeaChatRequest(BaseModel):
    """Léa chat request"""
    message: str = Field(..., min_length=1, description="User message")
    session_id: Optional[str] = Field(None, description="Conversation session ID")
    provider: Optional[Literal["openai", "anthropic", "auto"]] = Field(
        default="auto",
        description="AI provider to use"
    )


class LeaChatResponse(BaseModel):
    """Léa chat response"""
    content: str
    session_id: str
    model: Optional[str] = None
    provider: Optional[str] = None
    usage: Optional[dict] = None


class LeaContextResponse(BaseModel):
    """Léa conversation context"""
    session_id: str
    message_count: int
    messages: list


@router.post("/chat", response_model=LeaChatResponse)
async def lea_chat(
    request: LeaChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Chat with Léa AI assistant.
    """
    try:
        provider = AIProvider(request.provider) if request.provider != "auto" else AIProvider.AUTO
        lea_service = LeaService(db=db, user_id=current_user.id, provider=provider)
        
        response = await lea_service.chat(
            user_message=request.message,
            session_id=request.session_id
        )
        
        return LeaChatResponse(**response)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Error in Léa chat: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Léa service error: {str(e)}",
        )


@router.get("/context", response_model=LeaContextResponse)
async def get_lea_context(
    session_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get Léa conversation context.
    """
    try:
        lea_service = LeaService(db=db, user_id=current_user.id)
        conversation = await lea_service.get_or_create_conversation(session_id)
        
        return LeaContextResponse(
            session_id=conversation.session_id,
            message_count=len(conversation.messages or []),
            messages=conversation.messages or []
        )
        
    except Exception as e:
        logger.error(f"Error getting Léa context: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting context: {str(e)}",
        )


@router.delete("/context")
async def reset_lea_context(
    session_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Reset Léa conversation context.
    """
    try:
        from app.models.lea_conversation import LeaConversation
        from sqlalchemy import select, delete
        
        if session_id:
            # Delete specific conversation
            stmt = delete(LeaConversation).where(
                LeaConversation.session_id == session_id,
                LeaConversation.user_id == current_user.id
            )
        else:
            # Delete all user conversations
            stmt = delete(LeaConversation).where(
                LeaConversation.user_id == current_user.id
            )
        
        await db.execute(stmt)
        await db.commit()
        
        return {"message": "Context reset successfully"}
        
    except Exception as e:
        logger.error(f"Error resetting Léa context: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error resetting context: {str(e)}",
        )


@router.post("/voice/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Transcribe audio to text using OpenAI Whisper API.
    Note: This is a placeholder. For production, implement proper audio transcription.
    """
    try:
        # TODO: Implement actual audio transcription
        # For now, return a placeholder response
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Audio transcription not yet implemented. Use Web Speech API on frontend for now.",
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error transcribing audio: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error transcribing audio: {str(e)}",
        )


@router.post("/voice/synthesize")
async def synthesize_speech(
    text: str = Field(..., min_length=1),
    voice: Optional[str] = Field("alloy", description="Voice to use"),
    current_user: User = Depends(get_current_user),
):
    """
    Synthesize text to speech using OpenAI TTS API.
    Note: This is a placeholder. For production, implement proper TTS.
    """
    try:
        # TODO: Implement actual TTS
        # For now, return a placeholder response
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Text-to-speech not yet implemented. Use Web Speech Synthesis API on frontend for now.",
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error synthesizing speech: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error synthesizing speech: {str(e)}",
        )
