"""
Léa AI Assistant Endpoints
"""

import base64
import io
import json
import os
import uuid
from typing import Optional, Literal

import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, status, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, require_admin_or_superadmin
from app.models import User
from app.database import get_db
from app.services.lea_service import LeaService
from app.services.ai_service import AIService, AIProvider
from app.core.config import get_settings
from app.core.logging import logger

from sqlalchemy import select

try:
    from openai import AsyncOpenAI
    _OPENAI_AVAILABLE = True
except ImportError:
    _OPENAI_AVAILABLE = False
    AsyncOpenAI = None

AGENT_ERR_MSG = (
    "AGENT_API_URL and AGENT_API_KEY must be set in the Backend service (Railway → Backend → Variables). "
    "Example: AGENT_API_URL=https://agentia-immo-production.up.railway.app"
)

LEA_SYSTEM_PROMPT = (
    "Tu es Léa, une assistante immobilière experte au Québec. "
    "Tu aides les courtiers et les particuliers : transactions, formulaires OACIQ, vente, achat.\n\n"
    "Tu as accès aux informations de la plateforme de l'utilisateur connecté (ses transactions, dossiers). "
    "Utilise-les pour répondre aux questions sur ses dossiers en cours, ses transactions, etc. "
    "Si on te donne un résumé de ses transactions ci-dessous, base-toi dessus pour répondre.\n\n"
    "Règles importantes:\n"
    "- Réponds en français, de façon courtoise et professionnelle.\n"
    "- Garde tes réponses **courtes** (2 à 4 phrases max), sauf si l'utilisateur demande explicitement plus de détails.\n"
    "- Pour faire avancer la conversation, **pose une question pertinente** ou propose la prochaine étape quand c'est naturel.\n"
    "- Sois directe et efficace : pas de formules de politesse longues, va à l'essentiel."
)

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


class LeaSynthesizeRequest(BaseModel):
    """Léa text-to-speech synthesis request"""
    text: str = Field(..., min_length=1, description="Text to synthesize")
    voice: Optional[str] = Field("nova", description="Voix TTS: alloy, echo, fable, onyx, nova, shimmer")


class LeaSettingsResponse(BaseModel):
    """Léa settings (admin)"""
    system_prompt: str
    max_tokens: int
    tts_model: str
    tts_voice: str


class LeaSettingsUpdate(BaseModel):
    """Léa settings update (admin)"""
    system_prompt: Optional[str] = None
    max_tokens: Optional[int] = Field(None, ge=64, le=1024)
    tts_model: Optional[str] = None
    tts_voice: Optional[str] = None


def _use_external_agent() -> bool:
    """Retourne True si l'API agent externe est configurée."""
    settings = get_settings()
    url = (settings.AGENT_API_URL or "").strip().rstrip("/")
    key = (settings.AGENT_API_KEY or "").strip()
    return bool(url and key)


def _use_integrated_lea() -> bool:
    """Retourne True si l'IA intégrée (OpenAI/Anthropic) est configurée pour Léa en mode rapide."""
    return AIService.is_configured()


def _use_integrated_voice() -> bool:
    """True si on peut faire le vocal intégré (Whisper + LLM + TTS) avec OpenAI."""
    return bool(_OPENAI_AVAILABLE and os.getenv("OPENAI_API_KEY") and AIService.is_configured())


async def get_lea_user_context(db: AsyncSession, user_id: int) -> str:
    """
    Récupère un résumé des transactions de l'utilisateur (dossiers immo + portail)
    pour l'injecter dans le contexte de Léa.
    """
    lines = []
    try:
        # Transactions immobilières (dossiers du courtier)
        q_re = (
            select(RealEstateTransaction)
            .where(RealEstateTransaction.user_id == user_id)
            .order_by(RealEstateTransaction.updated_at.desc())
            .limit(15)
        )
        res_re = await db.execute(q_re)
        re_list = res_re.scalars().all()
        if re_list:
            lines.append("Transactions immobilières (dossiers) :")
            for t in re_list:
                addr = t.property_address or t.property_city or "Sans adresse"
                num = t.dossier_number or f"#{t.id}"
                lines.append(f"  - {num}: {t.name} — {addr} — statut: {t.status}")
        else:
            lines.append("Aucune transaction immobilière (dossier) enregistrée.")

        # Dossiers portail client (où l'utilisateur est le courtier)
        q_pt = (
            select(PortailTransaction)
            .where(PortailTransaction.courtier_id == user_id)
            .order_by(PortailTransaction.date_debut.desc())
            .limit(15)
        )
        res_pt = await db.execute(q_pt)
        pt_list = res_pt.scalars().all()
        if pt_list:
            lines.append("Dossiers portail client (vos clients) :")
            for t in pt_list:
                addr = t.adresse or t.ville or "—"
                lines.append(f"  - {t.type} — {addr} — statut: {t.statut}")
        else:
            lines.append("Aucun dossier portail client.")
    except Exception as e:
        logger.warning(f"get_lea_user_context: {e}")
        return "Impossible de charger les transactions pour le moment."
    return "\n".join(lines)


async def _transcribe_whisper(audio_bytes: bytes, content_type: str) -> str:
    """Transcrit l'audio avec OpenAI Whisper."""
    client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    f = io.BytesIO(audio_bytes)
    f.name = "audio.webm" if "webm" in (content_type or "") else "audio.mp4"
    resp = await client.audio.transcriptions.create(model="whisper-1", file=f, language="fr")
    return (resp.text or "").strip()


async def _synthesize_tts(text: str, voice: str | None = None) -> bytes:
    """Synthèse vocale avec OpenAI TTS (qualité HD, voix configurable). Retourne les bytes audio (mp3)."""
    settings = get_settings()
    model = (settings.LEA_TTS_MODEL or "tts-1-hd").strip() or "tts-1-hd"
    voice_name = (voice or settings.LEA_TTS_VOICE or "nova").strip() or "nova"
    client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    resp = await client.audio.speech.create(model=model, voice=voice_name, input=text)
    return resp.content


async def _call_external_agent_chat(message: str, session_id: str | None, conversation_id: int | None) -> dict:
    """
    Appelle l'API agent externe (Django) pour le chat texte.
    Retourne {"response", "conversation_id", "session_id", "assistant_audio_url", "success"}.
    """
    settings = get_settings()
    url = (settings.AGENT_API_URL or "").strip().rstrip("/")
    key = (settings.AGENT_API_KEY or "").strip()
    if not url or not key:
        raise ValueError("AGENT_API_URL and AGENT_API_KEY must be set")
    endpoint_url = f"{url}/api/external/agent/chat"

    payload = {"message": message}
    if session_id:
        payload["session_id"] = session_id
    if conversation_id is not None:
        payload["conversation_id"] = conversation_id

    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            r = await client.post(
                endpoint_url,
                json=payload,
                headers={
                    "Content-Type": "application/json",
                    "X-API-Key": key,
                },
            )
            r.raise_for_status()
            return r.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                error_msg = (
                    f"Agent endpoint not found (404): {endpoint_url}. "
                    "Please verify that the agent server has the endpoint "
                    "POST /api/external/agent/chat implemented. "
                    f"Agent base URL: {url}"
                )
                logger.error(error_msg)
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=error_msg,
                )
            # Re-raise other HTTP errors to be handled by the caller
            raise
        except httpx.RequestError as e:
            logger.error(f"Agent request error: {e} for URL: {endpoint_url}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to connect to agent server: {str(e)}",
            )


async def _stream_lea_sse(message: str, session_id: str | None, user_context: str | None = None):
    """Génère les événements SSE pour le chat Léa intégré (streaming)."""
    sid = session_id or str(uuid.uuid4())
    try:
        settings = get_settings()
        system = LEA_SYSTEM_PROMPT
        if user_context:
            system += "\n\n--- Informations actuelles de l'utilisateur (plateforme) ---\n" + user_context
        service = AIService(provider=AIProvider.AUTO)
        messages = [{"role": "user", "content": message}]
        async for delta in service.stream_chat_completion(
            messages=messages,
            system_prompt=system,
            max_tokens=getattr(settings, "LEA_MAX_TOKENS", 256),
        ):
            yield f"data: {json.dumps({'delta': delta})}\n\n"
        yield f"data: {json.dumps({'done': True, 'session_id': sid})}\n\n"
    except Exception as e:
        logger.error(f"Léa stream error: {e}", exc_info=True)
        yield f"data: {json.dumps({'error': str(e)})}\n\n"


@router.post("/chat/stream")
async def lea_chat_stream(
    request: LeaChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Chat with Léa in streaming mode (SSE).
    Used when OPENAI_API_KEY or ANTHROPIC_API_KEY is set for fast, fluid responses.
    Léa a accès aux transactions de l'utilisateur connecté (injectées dans le contexte).
    """
    if not _use_integrated_lea():
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Streaming requires OPENAI_API_KEY or ANTHROPIC_API_KEY in the Backend.",
        )
    user_context = await get_lea_user_context(db, current_user.id)
    return StreamingResponse(
        _stream_lea_sse(request.message, request.session_id, user_context=user_context),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/chat", response_model=LeaChatResponse)
async def lea_chat(
    request: LeaChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Chat with Léa AI assistant.
    Utilise l'agent externe si configuré, sinon l'IA intégrée (OpenAI/Anthropic) avec accès aux transactions.
    """
    # 1) IA intégrée (avec contexte plateforme) si pas d'agent externe
    if not _use_external_agent() and _use_integrated_lea():
        try:
            user_context = await get_lea_user_context(db, current_user.id)
            system_prompt = LEA_SYSTEM_PROMPT
            if user_context:
                system_prompt += "\n\n--- Informations actuelles de l'utilisateur (plateforme) ---\n" + user_context
            settings = get_settings()
            service = AIService(provider=AIProvider.AUTO)
            result = await service.chat_completion(
                messages=[{"role": "user", "content": request.message}],
                system_prompt=system_prompt,
                max_tokens=getattr(settings, "LEA_MAX_TOKENS", 256),
            )
            return LeaChatResponse(
                content=result.get("content", ""),
                session_id=request.session_id or "",
                model=result.get("model"),
                provider=result.get("provider"),
                usage=result.get("usage", {}),
            )
        except Exception as e:
            logger.error(f"Léa chat integrated error: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Léa service error: {str(e)}",
            )

    # 2) Agent externe
    if not _use_external_agent():
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail=AGENT_ERR_MSG,
        )
    try:
        data = await _call_external_agent_chat(
            message=request.message,
            session_id=request.session_id,
            conversation_id=None,
        )
        if not data.get("success"):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=data.get("error", "External agent error"),
            )
        return LeaChatResponse(
            content=data["response"],
            session_id=data.get("session_id", request.session_id or ""),
            model=data.get("model", "gpt-4o-mini"),
            provider=data.get("provider", "openai"),
            usage=data.get("usage", {}),
        )

    except httpx.HTTPError as e:
        logger.error(f"External agent HTTP error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"External agent unavailable: {str(e)}",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error in Léa chat: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Léa service error: {str(e)}",
        )


@router.post("/chat/voice")
async def lea_chat_voice(
    audio: UploadFile = File(...),
    session_id: Optional[str] = Form(None),
    conversation_id: Optional[int] = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Message vocal → transcription + réponse Léa + TTS.
    Si OPENAI_API_KEY est défini : flux intégré (Whisper + LLM + TTS) sur la plateforme.
    Sinon : proxy vers l'agent externe (AGENT_API_URL + AGENT_API_KEY).
    """
    # 1. Voix intégrée (plateforme) : Whisper + AIService + TTS
    if _use_integrated_voice():
        try:
            sid = session_id or str(uuid.uuid4())
            content = await audio.read()
            content_type = audio.content_type or "audio/webm"

            transcription = await _transcribe_whisper(content, content_type)
            if not transcription:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Impossible de transcrire l'audio. Parlez plus distinctement ou vérifiez le format.",
                )

            user_context = await get_lea_user_context(db, current_user.id)
            system_prompt = LEA_SYSTEM_PROMPT
            if user_context:
                system_prompt += "\n\n--- Informations actuelles de l'utilisateur (plateforme) ---\n" + user_context

            service = AIService(provider=AIProvider.AUTO)
            messages = [{"role": "user", "content": transcription}]
            settings = get_settings()
            result = await service.chat_completion(
                messages=messages,
                system_prompt=system_prompt,
                max_tokens=getattr(settings, "LEA_MAX_TOKENS", 256),
            )
            response_text = result.get("content") or ""

            audio_bytes: bytes | None = None
            if response_text:
                try:
                    audio_bytes = await _synthesize_tts(response_text)
                except Exception as tts_err:
                    logger.warning(f"TTS failed, response text only: {tts_err}")

            return {
                "success": True,
                "transcription": transcription,
                "response": response_text,
                "session_id": sid,
                "conversation_id": conversation_id,
                "assistant_audio_url": None,
                "assistant_audio_base64": base64.b64encode(audio_bytes).decode() if audio_bytes else None,
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Léa voice integrated error: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erreur agent vocal: {str(e)}",
            )

    # 2. Agent externe (Django)
    if not _use_external_agent():
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Vocal nécessite OPENAI_API_KEY (plateforme) ou AGENT_API_URL + AGENT_API_KEY (agent externe).",
        )
    try:
        settings = get_settings()
        url = (settings.AGENT_API_URL or "").strip().rstrip("/")
        key = (settings.AGENT_API_KEY or "").strip()
        content = await audio.read()
        field_name = settings.AGENT_VOICE_FIELD or "audio"
        content_type = audio.content_type or "audio/webm"
        files = {field_name: (audio.filename or "recording.webm", content, content_type)}
        data_form = {
            "user_id": str(current_user.id),
            "user_email": current_user.email or "",
        }
        if session_id:
            data_form["session_id"] = session_id
        if conversation_id is not None:
            data_form["conversation_id"] = str(conversation_id)
        async with httpx.AsyncClient(timeout=90.0) as client:
            r = await client.post(
                f"{url}/api/external/agent/chat/voice",
                files=files,
                data=data_form,
                headers={"X-API-Key": key},
            )
        r.raise_for_status()
        return r.json()
    except httpx.HTTPStatusError as e:
        # 400: format refusé - inclure la réponse agent pour débogage
        body = e.response.text
        try:
            err_json = e.response.json()
            detail_msg = err_json.get("detail", str(err_json))
        except Exception:
            detail_msg = body or str(e)
        logger.error(
            f"External agent voice 400: {e} | body={body[:500] if body else '-'}",
            context={"agent_response": body[:500] if body else None},
            exc_info=e,
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Agent a refusé la requête (400): {detail_msg}",
        )
    except httpx.HTTPError as e:
        logger.error(f"External agent voice HTTP error: {e}", exc_info=e)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"External agent unavailable: {str(e)}",
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


@router.get("/settings", response_model=LeaSettingsResponse)
async def get_lea_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_admin_or_superadmin),
):
    """
    Get Léa settings (admin/superadmin). Returns current config from environment and defaults.
    """
    settings = get_settings()
    return LeaSettingsResponse(
        system_prompt=LEA_SYSTEM_PROMPT,
        max_tokens=getattr(settings, "LEA_MAX_TOKENS", 256),
        tts_model=getattr(settings, "LEA_TTS_MODEL", "tts-1-hd"),
        tts_voice=getattr(settings, "LEA_TTS_VOICE", "nova"),
    )


@router.put("/settings", response_model=LeaSettingsResponse)
async def update_lea_settings(
    payload: LeaSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_admin_or_superadmin),
):
    """
    Update Léa settings (admin/superadmin). Persistence not implemented yet; returns 501.
    When implemented, store in global_settings and use in chat/voice endpoints.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="L'enregistrement des paramètres Léa n'est pas encore implémenté. Utilisez les variables d'environnement LEA_MAX_TOKENS, LEA_TTS_MODEL, LEA_TTS_VOICE et le prompt dans le code (LEA_SYSTEM_PROMPT) pour l'instant.",
    )


@router.post("/voice/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Transcrit l'audio en texte (OpenAI Whisper).
    Nécessite OPENAI_API_KEY.
    """
    if not _OPENAI_AVAILABLE or not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Transcription nécessite OPENAI_API_KEY.",
        )
    try:
        content = await audio.read()
        text = await _transcribe_whisper(content, audio.content_type or "audio/webm")
        return {"text": text}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error transcribing audio: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur transcription: {str(e)}",
        )


@router.post("/voice/synthesize")
async def synthesize_speech(
    request: LeaSynthesizeRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Synthèse vocale (OpenAI TTS). Retourne l'audio en base64.
    Nécessite OPENAI_API_KEY.
    """
    if not _OPENAI_AVAILABLE or not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="TTS nécessite OPENAI_API_KEY.",
        )
    try:
        audio_bytes = await _synthesize_tts(request.text, voice=request.voice)
        return {"audio_base64": base64.b64encode(audio_bytes).decode(), "content_type": "audio/mpeg"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error synthesizing speech: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur TTS: {str(e)}",
        )
