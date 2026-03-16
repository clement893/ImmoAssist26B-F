"""Pydantic schemas for Léa API."""

from typing import Optional, List, Any
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Chat request from frontend."""

    message: str = Field(..., min_length=1)
    conversation_id: Optional[str] = None
    with_tts: Optional[bool] = Field(True, description="Inclure l'audio TTS dans la réponse pour lecture immédiate")


class ChatResponse(BaseModel):
    """Chat response to frontend."""

    message: str
    actions: List[dict] = Field(default_factory=list)
    state: dict = Field(default_factory=dict)
    progress: Optional[dict] = Field(None, description="Transaction + PA progress for left bar (filled, total, fields)")
    session_id: Optional[str] = None
    assistant_audio_base64: Optional[str] = Field(None, description="Audio MP3 base64 pour lecture vocale")


class ProgressResponse(BaseModel):
    """Courtage advancement (transaction + PA progress)."""

    active_domain: Optional[str] = None
    transaction: dict = Field(default_factory=dict)
    promesse_achat: dict = Field(default_factory=dict)
    transaction_complete: bool = False
    pa_complete: bool = False


class KnowledgeDoc(BaseModel):
    """A document in the knowledge base."""

    name: str
    path: str
    description: Optional[str] = None


class KnowledgeListResponse(BaseModel):
    """List of knowledge base documents."""

    docs: List[KnowledgeDoc]
    root_path: str


class KnowledgeFileUpdate(BaseModel):
    """Request to update a knowledge file."""

    content: str


class VoiceSynthesizeRequest(BaseModel):
    """TTS request body."""

    text: str = Field(..., min_length=1)
    voice: Optional[str] = Field("coral", description="coral, marin, cedar, sage, shimmer, nova, etc.")
    speed: Optional[float] = Field(1.0, ge=0.25, le=2.0)
    instructions: Optional[str] = Field(None, description="Instructions TTS (sinon chargées depuis docs/lea_voice_instructions.md)")
