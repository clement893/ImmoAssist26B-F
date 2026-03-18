"""Chat router - POST /api/chat + /api/chat/stream (SSE) + voice + WebSocket Realtime."""

import asyncio
import logging

log = logging.getLogger(__name__)
import base64
import json
import re
import uuid
from pathlib import Path
from typing import AsyncGenerator

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas import ChatRequest, ChatResponse, VoiceSynthesizeRequest
from app.db.database import get_db, AsyncSessionLocal
from app.services.state import load_state, save_state, merge_state, get_transaction_progress, get_pa_progress
from app.services.llm import call_llm, call_llm_stream
from app.services.actions import execute_action
from app.services.geocode import geocode_address_candidates, looks_partial
from app.services.voice import transcribe_whisper, synthesize_tts, synthesize_tts_stream, transcribe_deepgram_stream
from app.config import get_settings

router = APIRouter()

DEMO_USER = {
    "id": 1,
    "full_name": "Courtier Demo",
    "permis_number": "12345",
}

_REALTIME_PROMPT_CACHE: str | None = None


def _get_realtime_system_prompt() -> str:
    """Prompt systeme pour le mode vocal Realtime = lea_courtier_assistant.md + lea_realtime_rules.md."""
    global _REALTIME_PROMPT_CACHE
    if _REALTIME_PROMPT_CACHE is None:
        docs_dir = Path(__file__).resolve().parent.parent.parent / "docs"
        base_path = docs_dir / "lea_courtier_assistant.md"
        rules_path = docs_dir / "lea_realtime_rules.md"
        base = base_path.read_text(encoding="utf-8") if base_path.exists() else ""
        rules = rules_path.read_text(encoding="utf-8") if rules_path.exists() else ""
        _REALTIME_PROMPT_CACHE = base + "\n\n" + rules
    return _REALTIME_PROMPT_CACHE

REALTIME_TOOLS = [
    {
        "type": "function",
        "name": "get_draft",
        "description": "Recuperer les infos enregistrees dans le draft. Appeler quand le courtier demande de redonner/repeter une info (adresse, telephone, courriel, etc.).",
        "parameters": {"type": "object", "properties": {}},
    },
    {
        "type": "function",
        "name": "geocode_address",
        "description": "Geocoder une adresse partielle. Appeler des que le courtier donne un numero + rue.",
        "parameters": {
            "type": "object",
            "properties": {"partial_address": {"type": "string"}},
            "required": ["partial_address"],
        },
    },
    {
        "type": "function",
        "name": "update_draft",
        "description": "OBLIGATOIRE: Sauvegarder TOUS les champs extraits (adresse, noms, tel, courriel, prix, etc.) dans le draft. Appeler a CHAQUE message. La barre gauche affiche ces champs.",
        "parameters": {
            "type": "object",
            "properties": {
                "transaction_fields": {
                    "type": "object",
                    "properties": {
                        "property_address": {"type": "string"},
                        "sellers": {"type": "array", "items": {"type": "string"}},
                        "buyers": {"type": "array", "items": {"type": "string"}},
                        "offered_price": {"type": "number"},
                        "transaction_type": {"type": "string", "enum": ["vente", "achat"]},
                    },
                },
                "pa_fields": {
                    "type": "object",
                    "properties": {
                        "acheteur_adresse": {"type": "string"},
                        "acheteur_telephone": {"type": "string"},
                        "acheteur_courriel": {"type": "string"},
                        "vendeur_adresse": {"type": "string"},
                        "vendeur_telephone": {"type": "string"},
                        "vendeur_courriel": {"type": "string"},
                        "description_immeuble": {"type": "string"},
                        "acompte": {"type": "number"},
                        "date_acompte": {"type": "string"},
                        "delai_remise_depot": {"type": "string"},
                        "mode_paiement": {"type": "string"},
                        "montant_hypotheque": {"type": "number"},
                        "delai_financement": {"type": "string"},
                        "date_acte_vente": {"type": "string"},
                        "condition_inspection": {"type": "boolean"},
                        "date_limite_inspection": {"type": "string"},
                        "condition_documents": {"type": "boolean"},
                        "inclusions": {"type": "array", "items": {"type": "string"}},
                        "exclusions": {"type": "string"},
                        "autres_conditions": {"type": "string"},
                        "delai_acceptation": {"type": "string"},
                    },
                },
            },
        },
    },
    {
        "type": "function",
        "name": "create_transaction",
        "description": "Creer la transaction en BD. SEULEMENT quand les 5 champs sont remplis ET que le courtier a REPONDU 'oui'/'je confirme'/'c'est bon' dans un MESSAGE SEPARE. Ne JAMAIS appeler dans le meme tour que ta question 'Je confirme?' - attends le tour suivant.",
        "parameters": {
            "type": "object",
            "properties": {
                "property_address": {"type": "string"},
                "sellers": {"type": "array", "items": {"type": "string"}},
                "buyers": {"type": "array", "items": {"type": "string"}},
                "offered_price": {"type": "number"},
                "transaction_type": {"type": "string", "enum": ["vente", "achat"]},
            },
            "required": ["property_address", "sellers", "buyers", "offered_price", "transaction_type"],
        },
    },
    {
        "type": "function",
        "name": "create_pa",
        "description": "Creer la Promesse d'Achat en BD. SEULEMENT quand la transaction existe, tous les champs PA sont remplis ET que le courtier a REPONDU 'oui' dans un MESSAGE SEPARE. Ne JAMAIS appeler dans le meme tour que ta question de confirmation.",
        "parameters": {
            "type": "object",
            "properties": {
                "acheteur_adresse": {"type": "string"},
                "acheteur_telephone": {"type": "string"},
                "acheteur_courriel": {"type": "string"},
                "vendeur_adresse": {"type": "string"},
                "vendeur_telephone": {"type": "string"},
                "vendeur_courriel": {"type": "string"},
                "description_immeuble": {"type": "string"},
                "acompte": {"type": "number"},
                "date_acompte": {"type": "string"},
                "delai_remise_depot": {"type": "string"},
                "mode_paiement": {"type": "string"},
                "montant_hypotheque": {"type": "number"},
                "delai_financement": {"type": "string"},
                "date_acte_vente": {"type": "string"},
                "condition_inspection": {"type": "boolean"},
                "date_limite_inspection": {"type": "string"},
                "condition_documents": {"type": "boolean"},
                "inclusions": {"type": "array", "items": {"type": "string"}},
                "exclusions": {"type": "string"},
                "autres_conditions": {"type": "string"},
                "delai_acceptation": {"type": "string"},
            },
        },
    },
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _parse_address_choice(message: str, n_candidates: int) -> int | None:
    t = message.strip().lower()
    if t in ("oui", "ok", "ouais", "confirmé", "correct", "c'est ça", "correcte", "parfait"):
        return 1
    m = re.match(r"^(?:la\s+)?(?:première|1ère|1ere|premier)\s*$", t)
    if m:
        return 1
    m = re.match(r"^(\d+)\s*$", t)
    if m:
        idx = int(m.group(1))
        if 1 <= idx <= n_candidates:
            return idx
    if "montréal" in t or "montreal" in t:
        return 1
    return None


def _build_progress(state: dict) -> dict:
    tx_p = get_transaction_progress(state)
    pa_p = get_pa_progress(state)
    return {
        "transaction": {"filled": tx_p["filled"], "total": tx_p["total"], "fields": tx_p["fields"]},
        "promesse_achat": {"filled": pa_p["filled"], "total": pa_p["total"], "fields": pa_p["fields"]},
    }


def _guard_message(msg: str) -> str:
    if msg and (msg.strip().startswith("{") or '"state_updates"' in msg or ',"actions":' in msg):
        return "Un instant, je vérifie les informations."
    return msg


async def _resolve_address_state(message: str, state: dict) -> tuple[str, dict, bool]:
    """Gère confirmation adresse en attente. Retourne (msg_llm, state, address_confirmed)."""
    if state.get("awaiting_field") == "property_address_confirm":
        candidates = state.get("address_candidates") or []
        choice = _parse_address_choice(message, len(candidates))
        if choice is not None and 1 <= choice <= len(candidates):
            chosen = candidates[choice - 1]
            full_addr = chosen.get("full_address") if isinstance(chosen, dict) else chosen
            if full_addr:
                state["transaction"]["fields"]["property_address"] = full_addr
                state["awaiting_field"] = None
                state["address_candidates"] = []
                msg = (
                    f"L'utilisateur a confirmé l'adresse : {full_addr}. "
                    "Vérifie le draft — quels champs TX sont déjà remplis ? "
                    "Passe au premier champ manquant ou fais le récapitulatif si tout est rempli."
                )
                return msg, state, True

    elif state.get("awaiting_field") == "property_address_city":
        partial = state.get("partial_address_pending", "").strip()
        city = message.strip()
        if partial and city:
            combined = f"{partial}, {city}"
            candidates = await geocode_address_candidates(combined)
            if candidates:
                state["address_candidates"] = candidates
                state["awaiting_field"] = "property_address_confirm"
                state["partial_address_pending"] = None
                msg = (
                    f"Ville fournie : {city}. Géocodage trouvé. "
                    "Demande au courtier de confirmer l'adresse."
                )
                return msg, state, False
            else:
                state["awaiting_field"] = None
                state["partial_address_pending"] = None

    return message, state, False


async def _handle_geocode(
    actions: list, state: dict, address_confirmed: bool
) -> tuple[str | None, dict]:
    """Exécute geocode_address. Bloque si adresse déjà confirmée."""
    tx_fields = state.get("transaction", {}).get("fields", {})
    tx_status = state.get("transaction", {}).get("status")
    address_already_set = bool(tx_fields.get("property_address")) or tx_status == "created"

    for a in [x for x in actions if isinstance(x, dict) and x.get("type") == "geocode_address"]:
        addr = (a.get("payload") or {}).get("partial_address", "").strip()
        if addr and not address_confirmed and not address_already_set:
            candidates = await geocode_address_candidates(addr)
            if candidates:
                state["address_candidates"] = candidates
                state["awaiting_field"] = "property_address_confirm"
                if len(candidates) == 1:
                    full = candidates[0].get("full_address", "")
                    return f"J'ai trouvé l'adresse suivante : {full}. Confirmez-vous que c'est bien celle-ci ?", state
                else:
                    lines = [f"{i}) {c.get('full_address', '')}" for i, c in enumerate(candidates, 1)]
                    return "J'ai trouvé plusieurs adresses. Laquelle correspond ?\n\n" + "\n".join(lines), state
            else:
                state["partial_address_pending"] = addr
                state["awaiting_field"] = "property_address_city"
                return "Je n'ai pas trouvé cette adresse. Pouvez-vous me donner la ville ?", state
    return None, state


async def _execute_actions(
    actions: list, state: dict, db: AsyncSession
) -> tuple[list, str | None, dict]:
    """Exécute create_transaction et create_pa."""
    valid = [
        a for a in actions
        if isinstance(a, dict) and a.get("type") not in ("geocode_address", None)
    ]
    executed = []
    validation_message = None

    for action in valid:
        # Intercepter create_transaction si adresse partielle
        if action.get("type") == "create_transaction":
            payload = action.get("payload") or {}
            addr = (
                payload.get("property_address")
                or state.get("transaction", {}).get("fields", {}).get("property_address", "")
            )
            if addr and looks_partial(str(addr)):
                candidates = await geocode_address_candidates(str(addr))
                if candidates:
                    state["address_candidates"] = candidates
                    state["awaiting_field"] = "property_address_confirm"
                    if len(candidates) == 1:
                        full = candidates[0].get("full_address", "")
                        state["transaction"]["fields"]["property_address"] = None
                        validation_message = f"J'ai trouvé l'adresse suivante : {full}. Confirmez-vous que c'est bien celle-ci ?"
                    else:
                        lines = [f"{i}) {c.get('full_address', '')}" for i, c in enumerate(candidates, 1)]
                        validation_message = "J'ai trouvé plusieurs adresses. Laquelle correspond ?\n\n" + "\n".join(lines)
                else:
                    state["partial_address_pending"] = addr
                    state["awaiting_field"] = "property_address_city"
                    validation_message = "Je n'ai pas trouvé cette adresse. Pouvez-vous me donner la ville ?"
                continue

        result = await execute_action(action, state, DEMO_USER, db)
        if result.get("status") == "rejected":
            if result.get("reason") == "validation_error":
                validation_message = result.get("message")
            continue
        executed.append(action)
        if action.get("type") == "create_transaction" and result.get("id"):
            state["transaction"]["id"] = result["id"]
            state["transaction"]["status"] = "created"
            # Copier le payload dans state fields pour la barre de progression
            payload = action.get("payload") or {}
            state.setdefault("transaction", {}).setdefault("fields", {}).update(
                {k: v for k, v in payload.items() if v is not None}
            )
        elif action.get("type") == "create_pa" and result.get("id"):
            state["promesse_achat"]["id"] = result["id"]
            state["promesse_achat"]["status"] = "created"
            # Copier le payload dans state fields pour la barre de progression
            payload = action.get("payload") or {}
            state.setdefault("promesse_achat", {}).setdefault("fields", {}).update(
                {k: v for k, v in payload.items() if v is not None}
            )

    return executed, validation_message, state


async def _finalize(
    user_message: str,
    conversation_id: str,
    state: dict,
    response_message: str,
    executed_actions: list,
    with_tts: bool,
) -> dict:
    """Sauvegarde historique + TTS + state en parallèle."""
    state.setdefault("history", [])
    state["history"].append({"role": "user", "content": user_message})
    state["history"].append({"role": "assistant", "content": response_message})

    async def _save():
        async with AsyncSessionLocal() as new_db:
            try:
                await save_state(conversation_id, state, new_db)
            except Exception:
                pass

    async def _tts():
        if not with_tts or not response_message:
            return None
        try:
            audio_bytes = await synthesize_tts(response_message, voice="nova", speed=1.15)
            return base64.b64encode(audio_bytes).decode()
        except Exception:
            return None

    audio_b64, _ = await asyncio.gather(_tts(), _save())

    return {
        "message": response_message,
        "actions": executed_actions,
        "state": state,
        "progress": _build_progress(state),
        "session_id": conversation_id,
        "assistant_audio_base64": audio_b64,
    }


# ---------------------------------------------------------------------------
# Pipeline central — non-streaming (voice + fallback)
# ---------------------------------------------------------------------------

async def _process_message(
    user_message: str,
    conversation_id: str,
    db: AsyncSession,
    with_tts: bool = True,
) -> dict:
    state = await load_state(conversation_id, str(DEMO_USER["id"]), db)
    msg_for_llm, state, address_confirmed = await _resolve_address_state(user_message, state)

    llm_response = await call_llm(msg_for_llm, state, DEMO_USER, last_turn=state.get("history", [])[-4:])

    # Mettre à jour le draft avec les champs extraits
    state_fields = llm_response.get("state_updates", {}).get("fields") or {}
    if state_fields:
        state = merge_state(state, {"fields": state_fields})

    actions = llm_response.get("actions") or []
    geocode_msg, state = await _handle_geocode(actions, state, address_confirmed)

    executed_actions, validation_message, state = await _execute_actions(actions, state, db)

    response_message = _guard_message(
        validation_message or geocode_msg or llm_response.get("message", "")
    )

    return await _finalize(user_message, conversation_id, state, response_message, executed_actions, with_tts)


# ---------------------------------------------------------------------------
# Pipeline streaming — /chat/stream
# Texte s'affiche token par token, TTS démarre dès la 1ère phrase
# ---------------------------------------------------------------------------

async def _stream_pipeline(
    user_message: str,
    conversation_id: str,
    db: AsyncSession,
) -> AsyncGenerator[str, None]:
    """
    Vrai streaming avec function calling :
    1. Texte de Léa s'affiche token par token (comme Claude/ChatGPT)
    2. TTS lancé par phrase dès qu'une phrase est complète
    3. Tool calls traités à la fin (geocode, create_tx, create_pa)
    """
    state = await load_state(conversation_id, str(DEMO_USER["id"]), db)
    msg_for_llm, state, address_confirmed = await _resolve_address_state(user_message, state)

    full_text = ""
    actions = []
    state_fields = {}
    sentence_buffer = ""
    # File d'attente audio — synthèse en parallèle, envoi dans l'ordre
    audio_queue = asyncio.Queue()

    async def _tts_and_queue(sentence: str):
        """TTS streaming — retourne plus vite qu'un batch complet."""
        try:
            full_bytes = b""
            async for chunk in synthesize_tts_stream(sentence.strip(), voice="nova", speed=1.15):
                if chunk:
                    full_bytes += chunk
            if full_bytes:
                await audio_queue.put(base64.b64encode(full_bytes).decode())
        except Exception:
            await audio_queue.put(None)

    async def _tts_sentence(sentence: str):
        """Synthèse directe (pour geocode/fallback)."""
        try:
            audio_bytes = await synthesize_tts(sentence.strip(), voice="nova", speed=1.15)
            return base64.b64encode(audio_bytes).decode()
        except Exception:
            return None

    def _split_sentences(text: str) -> tuple[list[str], str]:
        """Extrait phrases complètes (.!?) — min 4 chars pour TTS plus tôt."""
        sentences = []
        remaining = text
        while True:
            m = re.search(r'[.!?][\s]', remaining)
            if m and len(remaining[:m.end()]) > 4:  # min 4 chars — TTS plus tôt
                sentences.append(remaining[:m.end()].strip())
                remaining = remaining[m.end():]
            else:
                break
        return sentences, remaining

    # Consommer le stream LLM — lancer TTS en parallèle sans bloquer
    tts_tasks = []
    spoken_text = ""  # Texte déjà synthétisé — pour éviter les doublons
    async for event in call_llm_stream(msg_for_llm, state, DEMO_USER):

        if event["type"] == "text_delta":
            delta = event["delta"]
            full_text += delta
            sentence_buffer += delta

            # Envoyer le delta au frontend immédiatement
            yield f"data: {json.dumps({'type': 'text', 'delta': delta}, ensure_ascii=False)}\n\n"

            # Laisser les tâches TTS progresser
            await asyncio.sleep(0)
            # Envoyer l'audio dès qu'il est prêt (synchro texte ↔ voix)
            while True:
                try:
                    audio_b64 = audio_queue.get_nowait()
                    if audio_b64:
                        yield f"data: {json.dumps({'type': 'audio', 'chunk': audio_b64}, ensure_ascii=False)}\n\n"
                except asyncio.QueueEmpty:
                    break

            # Lancer TTS dès qu'une phrase est complète — non-bloquant
            sentences, sentence_buffer = _split_sentences(sentence_buffer)
            for sentence in sentences:
                spoken_text += sentence + " "
                task = asyncio.create_task(_tts_and_queue(sentence))
                tts_tasks.append(task)

        elif event["type"] == "done":
            actions = event.get("actions") or []
            state_fields = event.get("state_fields") or {}
            if not full_text:
                full_text = event.get("message", "")

    # TTS du reste du buffer (fin de string sans espace après ponctuation)
    if sentence_buffer.strip():
        spoken_text += sentence_buffer.strip()
        task = asyncio.create_task(_tts_and_queue(sentence_buffer.strip()))
        tts_tasks.append(task)

    # Attendre que tous les TTS soient prêts et les envoyer dans l'ordre
    for task in tts_tasks:
        await task
    while not audio_queue.empty():
        audio_b64 = await audio_queue.get()
        if audio_b64:
            yield f"data: {json.dumps({'type': 'audio', 'chunk': audio_b64}, ensure_ascii=False)}\n\n"

    # Traiter les actions après le stream
    if state_fields:
        state = merge_state(state, {"fields": state_fields})
        yield f"data: {json.dumps({'type': 'progress', 'progress': _build_progress(state)}, ensure_ascii=False)}\n\n"

    geocode_msg, state = await _handle_geocode(actions, state, address_confirmed)
    if geocode_msg:
        full_text = geocode_msg
        yield f"data: {json.dumps({'type': 'text_clear'}, ensure_ascii=False)}\n\n"
        yield f"data: {json.dumps({'type': 'text_override', 'text': full_text}, ensure_ascii=False)}\n\n"
        audio_b64 = await _tts_sentence(full_text)
        if audio_b64:
            spoken_text = full_text  # Marquer comme déjà parlé
            yield f"data: {json.dumps({'type': 'audio', 'chunk': audio_b64}, ensure_ascii=False)}\n\n"

    executed_actions, validation_message, state = await _execute_actions(actions, state, db)
    if validation_message:
        full_text = validation_message

    response_message = _guard_message(full_text)

    # Fallback TTS SEULEMENT si rien n'a été parlé du tout (pure tool call sans texte)
    if not spoken_text.strip() and response_message:
        audio_b64 = await _tts_sentence(response_message)
        if audio_b64:
            yield f"data: {json.dumps({'type': 'text_override', 'text': response_message}, ensure_ascii=False)}\n\n"
            yield f"data: {json.dumps({'type': 'audio', 'chunk': audio_b64}, ensure_ascii=False)}\n\n"

    # Sauvegarder
    state.setdefault("history", [])
    state["history"].append({"role": "user", "content": user_message})
    state["history"].append({"role": "assistant", "content": response_message})

    async with AsyncSessionLocal() as new_db:
        try:
            await save_state(conversation_id, state, new_db)
        except Exception:
            pass

    yield f"data: {json.dumps({'type': 'done', 'message': response_message, 'session_id': conversation_id, 'progress': _build_progress(state)}, ensure_ascii=False)}\n\n"


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/chat/stream")
async def chat_stream(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    """Stream SSE : texte token par token + audio TTS par phrase."""
    conversation_id = request.conversation_id or str(uuid.uuid4())
    return StreamingResponse(
        _stream_pipeline(request.message, conversation_id, db),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    """Endpoint chat non-streaming (fallback)."""
    conversation_id = request.conversation_id or str(uuid.uuid4())
    result = await _process_message(
        user_message=request.message,
        conversation_id=conversation_id,
        db=db,
        with_tts=request.with_tts if request.with_tts is not None else True,
    )
    return ChatResponse(
        message=result["message"],
        actions=result["actions"],
        state=result["state"],
        progress=result["progress"],
        session_id=result["session_id"],
        assistant_audio_base64=result["assistant_audio_base64"],
    )


@router.post("/voice/chat")
async def voice_chat(
    audio: UploadFile = File(...),
    conversation_id: str = Form(default=None),
    session_id: str = Form(default=None),
    db: AsyncSession = Depends(get_db),
):
    """Endpoint vocal : audio → Whisper → LLM → TTS."""
    try:
        content = await audio.read()
        if not content:
            raise HTTPException(status_code=400, detail="Fichier audio vide.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Impossible de lire l'audio: {e}") from e

    try:
        transcription = await transcribe_whisper(content, audio.content_type or "audio/webm")
    except Exception as e:
        raise HTTPException(status_code=400, detail="Impossible de transcrire l'audio.") from e

    if not transcription:
        raise HTTPException(status_code=400, detail="Audio vide ou incompréhensible.")

    cid = conversation_id or session_id or str(uuid.uuid4())
    result = await _process_message(user_message=transcription, conversation_id=cid, db=db, with_tts=True)

    return {
        "success": True,
        "transcription": transcription,
        "response": result["message"],
        "session_id": result["session_id"],
        "state": result["state"],
        "progress": result["progress"],
        "assistant_audio_base64": result["assistant_audio_base64"],
        "actions": result["actions"] or None,
    }


@router.post("/voice/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    try:
        content = await audio.read()
        text = await transcribe_whisper(content, audio.content_type or "audio/webm")
        return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur transcription: {e}") from e


@router.post("/voice/synthesize")
async def synthesize_speech(request: VoiceSynthesizeRequest):
    try:
        audio_bytes = await synthesize_tts(request.text, voice=request.voice or "nova", speed=request.speed or 1.0)
        return {"audio_base64": base64.b64encode(audio_bytes).decode(), "content_type": "audio/mpeg"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur TTS: {e}") from e


# ---------------------------------------------------------------------------
# WebSocket vocal — Deepgram STT temps réel + LLM stream + TTS stream
# Architecture comme Vapi : latence ~500ms, pas de bouton stop
# ---------------------------------------------------------------------------

@router.websocket("/ws/voice")
async def websocket_voice(websocket: WebSocket):
    """
    WebSocket vocal temps réel.

    Protocole :
    Client → serveur :
      - bytes audio (webm/opus) en continu pendant que le courtier parle
      - JSON {"type": "start", "conversation_id": "..."} pour démarrer
      - JSON {"type": "stop"} pour arrêter l'audio

    Serveur → client :
      - JSON {"type": "transcript_partial", "text": "..."}  — transcription en temps réel
      - JSON {"type": "transcript_final", "text": "..."}    — phrase complète détectée
      - JSON {"type": "text_delta", "delta": "..."}         — réponse Léa token par token
      - JSON {"type": "audio_chunk", "data": "<base64>"}    — audio TTS chunk
      - JSON {"type": "done", "progress": {...}}            — fin de réponse
      - JSON {"type": "error", "message": "..."}            — erreur
    """
    await websocket.accept()

    conversation_id = str(uuid.uuid4())
    audio_queue: asyncio.Queue = asyncio.Queue()
    is_speaking = False  # Léa est en train de parler

    async def receive_loop():
        """Reçoit les messages du client et les route."""
        nonlocal conversation_id, is_speaking
        try:
            while True:
                message = await websocket.receive()

                if message["type"] == "websocket.disconnect":
                    await audio_queue.put(None)
                    break

                # Message JSON (contrôle)
                if "text" in message:
                    try:
                        data = json.loads(message["text"])
                        if data.get("type") == "start":
                            conversation_id = data.get("conversation_id") or conversation_id
                        elif data.get("type") == "stop":
                            await audio_queue.put(None)
                            break
                        elif data.get("type") == "interrupt":
                            # Courtier interrompt Léa
                            is_speaking = False
                    except Exception:
                        pass

                # Bytes audio
                elif "bytes" in message:
                    if not is_speaking:  # Ne pas envoyer à Deepgram si Léa parle
                        await audio_queue.put(message["bytes"])

        except WebSocketDisconnect:
            await audio_queue.put(None)
        except Exception:
            await audio_queue.put(None)

    async def audio_generator():
        """Génère les chunks audio depuis la queue."""
        while True:
            chunk = await audio_queue.get()
            if chunk is None:
                break
            yield chunk

    async def process_transcript(transcript: str):
        """
        Traite un transcript final en réutilisant exactement le même pipeline que le chat texte.
        Traduit les événements SSE en messages WebSocket.
        """
        nonlocal is_speaking
        if not transcript.strip():
            return

        is_speaking = True

        # Notifier le client — phrase finale détectée
        await websocket.send_text(json.dumps({
            "type": "transcript_final",
            "text": transcript
        }))

        # Réutiliser EXACTEMENT le même pipeline que /chat/stream
        # Les événements SSE sont traduits en messages WebSocket
        async with AsyncSessionLocal() as db:
            async for sse_line in _stream_pipeline(transcript, conversation_id, db):
                if not is_speaking:
                    break
                # sse_line = "data: {...}\n\n"
                if not sse_line.startswith("data: "):
                    continue
                try:
                    event = json.loads(sse_line[6:].strip())
                    evt_type = event.get("type")

                    if evt_type == "text":
                        # SSE "text" → WS "text_delta"
                        await websocket.send_text(json.dumps({
                            "type": "text_delta",
                            "delta": event.get("delta", "")
                        }))
                    elif evt_type == "text_clear":
                        await websocket.send_text(json.dumps({"type": "text_clear"}))
                    elif evt_type == "text_override":
                        await websocket.send_text(json.dumps({
                            "type": "text_override",
                            "text": event.get("text", "")
                        }))
                    elif evt_type == "audio":
                        # SSE "audio" → WS "audio_chunk"
                        await websocket.send_text(json.dumps({
                            "type": "audio_chunk",
                            "data": event.get("chunk", "")
                        }))
                    elif evt_type == "done":
                        await websocket.send_text(json.dumps({
                            "type": "done",
                            "message": event.get("message", ""),
                            "session_id": event.get("session_id", conversation_id),
                            "progress": event.get("progress", {})
                        }))
                except Exception:
                    pass

        is_speaking = False

    # Lancer la réception en parallèle
    receive_task = asyncio.create_task(receive_loop())

    try:
        # Stream Deepgram — transcription temps réel
        last_partial = ""
        async for transcript_event in transcribe_deepgram_stream(audio_generator()):

            if transcript_event.get("type") == "error":
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": transcript_event.get("text", "Erreur STT")
                }))
                break

            text = transcript_event.get("text", "")
            is_final = transcript_event.get("is_final", False)
            speech_final = transcript_event.get("speech_final", False)

            if text:
                if not is_final:
                    # Transcription partielle — afficher en temps réel
                    await websocket.send_text(json.dumps({
                        "type": "transcript_partial",
                        "text": text
                    }))
                    last_partial = text

                elif speech_final:
                    final_text = (text or last_partial).strip()
                    last_partial = ""
                    if final_text:
                        await process_transcript(final_text)

                elif is_final:
                    last_partial = text

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_text(json.dumps({"type": "error", "message": str(e)}))
        except Exception:
            pass
    finally:
        receive_task.cancel()
        try:
            await websocket.close()
        except Exception:
            pass


# ---------------------------------------------------------------------------
# WebSocket OpenAI Realtime - STT + LLM + TTS en un seul WebSocket ~300ms
# ---------------------------------------------------------------------------

@router.websocket("/ws/realtime")
async def websocket_realtime(websocket: WebSocket):
    """
    OpenAI Realtime API - conversation vocale temps reel.

    Client -> serveur :
      - bytes audio PCM16 24kHz mono en continu
      - JSON {"type": "start", "conversation_id": "..."}
      - JSON {"type": "interrupt"}

    Serveur -> client :
      - JSON {"type": "transcript", "role": "user"|"assistant", "text": "..."}
      - JSON {"type": "text_delta", "delta": "..."}
      - JSON {"type": "audio_chunk", "data": "<base64 PCM16>"}
      - JSON {"type": "function_call", "name": "...", "result": "..."}
      - JSON {"type": "progress", "progress": {...}}
      - JSON {"type": "done", "session_id": "...", "progress": {...}}
      - JSON {"type": "error", "message": "..."}
    """
    await websocket.accept()

    settings = get_settings()
    if not settings.openai_api_key:
        await websocket.send_text(json.dumps({"type": "error", "message": "OPENAI_API_KEY manquant"}))
        await websocket.close()
        return

    try:
        import websockets as ws_lib
    except ImportError:
        await websocket.send_text(json.dumps({"type": "error", "message": "pip install websockets"}))
        await websocket.close()
        return

    conversation_id = str(uuid.uuid4())
    state: dict = {}
    async with AsyncSessionLocal() as db:
        state = await load_state(conversation_id, "1", db)

    realtime_url = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17"
    headers = {
        "Authorization": f"Bearer {settings.openai_api_key}",
        "OpenAI-Beta": "realtime=v1",
    }

    try:
        async with ws_lib.connect(realtime_url, additional_headers=headers) as openai_ws:
            session_cfg = {
                "modalities": ["text", "audio"],
                "instructions": _get_realtime_system_prompt(),
                "voice": "shimmer",
                "input_audio_format": "pcm16",
                "output_audio_format": "pcm16",
                "input_audio_noise_reduction": {"type": "near_field"},
                "turn_detection": {
                    "type": "server_vad",
                    "threshold": 0.6,
                    "prefix_padding_ms": 300,
                    "silence_duration_ms": 1200,
                },
                "tools": REALTIME_TOOLS,
                "tool_choice": "auto",
                "temperature": 0.7,
            }
            if not get_settings().realtime_disable_transcription:
                session_cfg["input_audio_transcription"] = {"model": "whisper-1", "language": "fr"}
            await openai_ws.send(json.dumps({"type": "session.update", "session": session_cfg}))

            audio_chunks_received = 0

            msg_count = 0

            async def handle_client():
                nonlocal conversation_id, state, audio_chunks_received, msg_count
                try:
                    while True:
                        message = await websocket.receive()
                        msg_count += 1
                        if msg_count <= 2:
                            log.info("Realtime WS recu #%d: keys=%s", msg_count, list(message.keys()) if isinstance(message, dict) else type(message))
                        if message.get("type") == "websocket.disconnect":
                            break
                        if "text" in message:
                            try:
                                data = json.loads(message["text"])
                                if data.get("type") == "start":
                                    client_cid = (data.get("conversation_id") or "").strip()
                                    if client_cid:
                                        conversation_id = client_cid
                                        async with AsyncSessionLocal() as db:
                                            loaded = await load_state(conversation_id, "1", db)
                                            state.clear()
                                            state.update(loaded)
                                        await websocket.send_text(json.dumps({
                                            "type": "progress",
                                            "progress": _build_progress(state),
                                        }))
                                    else:
                                        conversation_id = data.get("conversation_id") or conversation_id
                                elif data.get("type") == "interrupt":
                                    await openai_ws.send(json.dumps({"type": "response.cancel"}))
                                    await websocket.send_text(json.dumps({"type": "interrupt_ack"}))
                                elif data.get("type") == "stop":
                                    await openai_ws.close()
                                    break
                            except Exception:
                                pass
                        elif "bytes" in message:
                            b = message["bytes"]
                            audio_chunks_received += 1
                            if audio_chunks_received <= 3:
                                log.info("Realtime: audio reçu #%d (%d bytes) -> OpenAI", audio_chunks_received, len(b))
                            audio_b64 = base64.b64encode(b).decode()
                            await openai_ws.send(json.dumps({
                                "type": "input_audio_buffer.append",
                                "audio": audio_b64,
                            }))
                        else:
                            if msg_count <= 5:
                                log.warning("Realtime WS msg #%d sans text/bytes: %s", msg_count, {k: type(v).__name__ for k, v in message.items()})
                except WebSocketDisconnect:
                    pass
                except Exception:
                    pass

            audio_chunks_sent = 0
            is_responding = False  # Track si OpenAI a une réponse active

            async def handle_openai():
                nonlocal state, audio_chunks_sent, is_responding
                pending_calls: dict = {}
                try:
                    async for raw_msg in openai_ws:
                        try:
                            event = json.loads(raw_msg)
                        except Exception:
                            continue
                        evt = event.get("type", "")
                        if evt and evt not in ("response.audio.delta", "response.output_audio.delta"):
                            print(f"[Léa] OpenAI event: {evt}")  # noqa: T201

                        # Tracker l'état de la réponse
                        if evt == "response.created":
                            is_responding = True
                            audio_chunks_sent = 0
                        elif evt in ("response.done", "response.cancelled"):
                            is_responding = False

                        # Interruption — seulement si réponse active
                        if evt == "input_audio_buffer.speech_started":
                            if is_responding:
                                await openai_ws.send(json.dumps({"type": "response.cancel"}))
                                await websocket.send_text(json.dumps({"type": "interrupted"}))
                                is_responding = False
                                audio_chunks_sent = 0

                        if evt == "input_audio_buffer.committed" and get_settings().realtime_disable_transcription:
                            await websocket.send_text(json.dumps({"type": "transcript", "role": "user", "text": "[voix]"}))

                        elif evt == "conversation.item.input_audio_transcription.completed":
                            transcript = (event.get("transcript") or "").strip()
                            HALLUCINATIONS = {
                                "sous-titres réalisés", "amara.org", "merci d'avoir regardé",
                                "sous-titrage", "transcription", "sous-titres par", "♪", "♫",
                                "music", "applause", "applaudissements", "[musique]", "[silence]",
                            }
                            is_hallucination = (
                                not transcript
                                or len(transcript) < 3
                                or any(h in transcript.lower() for h in HALLUCINATIONS)
                            )
                            if transcript and not is_hallucination:
                                print(f"[Léa] User: {transcript[:80]}")  # noqa: T201
                                await websocket.send_text(json.dumps({"type": "transcript", "role": "user", "text": transcript}))
                                state.setdefault("history", []).append({"role": "user", "content": transcript})
                            elif is_hallucination and transcript:
                                print(f"[Léa] Hallucination Whisper filtrée: {transcript[:60]}")  # noqa: T201

                        elif evt == "conversation.item.input_audio_transcription.failed":
                            err = event.get("error", {}) or event.get("details", {})
                            err_msg = err.get("message", err.get("code", str(err)))
                            err_code = err.get("code") if isinstance(err, dict) else None
                            log.warning(
                                "Realtime transcription failed: %s (code=%s, full error=%s)",
                                err_msg, err_code, err
                            )
                            # Placeholder pour afficher qqch côté client; le modèle a quand même l'audio brut
                            await websocket.send_text(json.dumps({"type": "transcript", "role": "user", "text": "[voix]"}))

                        elif evt in ("response.text.delta", "response.output_text.delta"):
                            delta = event.get("delta", "")
                            if delta:
                                print(f"[Léa] Assistant (text): {delta[:80]}")  # noqa: T201
                                await websocket.send_text(json.dumps({"type": "text_delta", "delta": delta}))

                        elif evt in ("response.text.done", "response.output_text.done"):
                            text = event.get("text", "")
                            if text:
                                state.setdefault("history", []).append({"role": "assistant", "content": text})

                        elif evt in ("response.audio.delta", "response.output_audio.delta"):
                            audio_b64 = event.get("delta", "")
                            if audio_b64:
                                audio_chunks_sent += 1
                                if audio_chunks_sent <= 3:
                                    print(f"[Léa] Audio envoyé au client #{audio_chunks_sent}")  # noqa: T201
                                await websocket.send_text(json.dumps({"type": "audio_chunk", "data": audio_b64}))

                        elif evt in ("response.audio_transcript.delta", "response.output_audio_transcript.delta"):
                            delta = event.get("delta", "")
                            if delta:
                                print(f"[Léa] Assistant (audio transcript): {delta[:80]}")  # noqa: T201
                                await websocket.send_text(json.dumps({"type": "transcript", "role": "assistant", "text": delta}))

                        elif evt == "response.function_call_arguments.delta":
                            call_id = event.get("call_id", "")
                            if call_id not in pending_calls:
                                pending_calls[call_id] = {"name": event.get("name", ""), "arguments": ""}
                            pending_calls[call_id]["arguments"] += event.get("delta", "")

                        elif evt == "response.function_call_arguments.done":
                            call_id = event.get("call_id", "")
                            fn_name = event.get("name", "") or pending_calls.get(call_id, {}).get("name", "")
                            fn_args_str = event.get("arguments", "") or pending_calls.get(call_id, {}).get("arguments", "")
                            try:
                                fn_args = json.loads(fn_args_str) if fn_args_str else {}
                            except Exception:
                                fn_args = {}
                            result_str = await _handle_realtime_function(fn_name, fn_args, state, conversation_id, websocket)
                            await openai_ws.send(json.dumps({
                                "type": "conversation.item.create",
                                "item": {
                                    "type": "function_call_output",
                                    "call_id": call_id,
                                    "output": result_str,
                                },
                            }))
                            await openai_ws.send(json.dumps({"type": "response.create"}))
                            if call_id in pending_calls:
                                del pending_calls[call_id]

                        elif evt == "response.done":
                            resp = event.get("response", {}) or {}
                            out = resp.get("output", [])
                            out_preview = [(x.get("type"), x.get("role"), str(x.get("content", ""))[:60]) for x in (out if isinstance(out, list) else [])]
                            print(f"[Léa] response.done — {audio_chunks_sent} audio chunks, output: {out_preview}")  # noqa: T201
                            hist = state.get("history", [])
                            last_msg = next((h["content"] for h in reversed(hist) if h.get("role") == "assistant"), "")
                            if not last_msg and event.get("response", {}).get("output"):
                                for item in event["response"]["output"]:
                                    if item.get("type") == "message" and item.get("role") == "assistant":
                                        for part in item.get("content", []):
                                            if part.get("type") in ("output_text", "text") and part.get("text"):
                                                last_msg = part.get("text", "")
                                                break
                                    if last_msg:
                                        break
                            await websocket.send_text(json.dumps({
                                "type": "done",
                                "session_id": conversation_id,
                                "message": last_msg,
                                "progress": _build_progress(state),
                            }))

                        elif evt == "error":
                            error_msg = event.get("error", {}).get("message", "Erreur OpenAI Realtime")
                            log.warning("Realtime OpenAI error: %s", error_msg)
                            await websocket.send_text(json.dumps({"type": "error", "message": error_msg}))

                except Exception as e:
                    try:
                        await websocket.send_text(json.dumps({"type": "error", "message": str(e)}))
                    except Exception:
                        pass

            await asyncio.gather(handle_client(), handle_openai())

    except Exception as e:
        try:
            await websocket.send_text(json.dumps({"type": "error", "message": f"Connexion Realtime echouee: {str(e)}"}))
        except Exception:
            pass
    finally:
        try:
            await websocket.close()
        except Exception:
            pass


async def _handle_realtime_function(
    fn_name: str, fn_args: dict, state: dict, conversation_id: str, websocket: WebSocket
) -> str:
    """Execute les tools appeles par le modele Realtime."""
    if fn_name == "get_draft":
        tx_f = state.get("transaction", {}).get("fields", {})
        pa_f = state.get("promesse_achat", {}).get("fields", {})
        draft_summary = {
            "transaction": {k: v for k, v in tx_f.items() if v not in (None, [], "")},
            "promesse_achat": {k: v for k, v in pa_f.items() if v not in (None, [], "")},
        }
        return json.dumps({
            "success": True,
            "draft": draft_summary,
            "message": "Voici les infos enregistrees. Utilise-les pour repondre au courtier."
        })

    if fn_name == "geocode_address":
        partial = fn_args.get("partial_address", "")
        candidates = await geocode_address_candidates(partial)
        if candidates:
            if len(candidates) == 1:
                full = candidates[0].get("full_address", "")
                state.setdefault("transaction", {}).setdefault("fields", {})["property_address"] = full
                state["awaiting_field"] = None
                await websocket.send_text(json.dumps({"type": "function_call", "name": "geocode_address", "result": f"Adresse : {full}"}))
                return json.dumps({"success": True, "address": full, "message": f"Adresse confirmee : {full}. Dis-le au courtier et continue."})
            else:
                addresses = [c.get("full_address", "") for c in candidates[:3]]
                return json.dumps({"success": True, "candidates": addresses, "message": "Plusieurs adresses trouvees, demande confirmation au courtier."})
        return json.dumps({"success": False, "message": "Adresse introuvable, demande la ville au courtier."})

    elif fn_name == "update_draft":
        tx_fields = fn_args.get("transaction_fields") or {}
        pa_fields = fn_args.get("pa_fields") or {}
        all_fields = {**tx_fields, **pa_fields}
        if all_fields:
            merge_state(state, {"fields": all_fields})
            async with AsyncSessionLocal() as save_db:
                await save_state(conversation_id, state, save_db)
        await websocket.send_text(json.dumps({"type": "progress", "progress": _build_progress(state)}))
        return json.dumps({"success": True, "updated": list(all_fields.keys())})

    elif fn_name == "create_transaction":
        async with AsyncSessionLocal() as db:
            action = {"type": "create_transaction", "payload": fn_args}
            result = await execute_action(action, state, DEMO_USER, db)
            if result.get("status") == "created":
                state["transaction"]["id"] = result["id"]
                state["transaction"]["status"] = "created"
                state.setdefault("transaction", {}).setdefault("fields", {}).update(
                    {k: v for k, v in fn_args.items() if v is not None}
                )
                async with AsyncSessionLocal() as save_db:
                    await save_state(conversation_id, state, save_db)
                await websocket.send_text(json.dumps({
                    "type": "function_call",
                    "name": "create_transaction",
                    "result": f"Transaction creee id={result['id']}",
                    "progress": _build_progress(state),
                }))
                return json.dumps({"success": True, "transaction_id": result["id"], "message": "Transaction enregistree avec succes."})
            return json.dumps({"success": False, "message": result.get("message", "Erreur creation transaction")})

    elif fn_name == "create_pa":
        async with AsyncSessionLocal() as db:
            action = {"type": "create_pa", "payload": fn_args}
            result = await execute_action(action, state, DEMO_USER, db)
            if result.get("status") == "created":
                state["promesse_achat"]["id"] = result["id"]
                state["promesse_achat"]["status"] = "created"
                state.setdefault("promesse_achat", {}).setdefault("fields", {}).update(
                    {k: v for k, v in fn_args.items() if v is not None}
                )
                async with AsyncSessionLocal() as save_db:
                    await save_state(conversation_id, state, save_db)
                await websocket.send_text(json.dumps({
                    "type": "function_call",
                    "name": "create_pa",
                    "result": f"PA creee id={result['id']}",
                    "progress": _build_progress(state),
                }))
                return json.dumps({"success": True, "pa_id": result["id"], "message": "Promesse d'achat enregistree avec succes."})
            return json.dumps({"success": False, "message": result.get("message", "Erreur creation PA")})

    return json.dumps({"success": False, "message": f"Fonction inconnue: {fn_name}"})
