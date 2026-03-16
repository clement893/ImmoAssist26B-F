"""Chat router - POST /api/chat + voice endpoints."""

import base64
import re
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas import ChatRequest, ChatResponse, VoiceSynthesizeRequest
from app.db.database import get_db
from app.services.state import load_state, save_state, merge_state, get_transaction_progress, get_pa_progress
from app.services.llm import call_llm
from app.services.actions import execute_action
from app.services.geocode import geocode_address_candidates
from app.services.voice import transcribe_whisper, synthesize_tts

router = APIRouter()

# Demo user for standalone
DEMO_USER = {
    "id": 1,
    "full_name": "Courtier Demo",
    "permis_number": "12345",
}


def _parse_address_choice(message: str, n_candidates: int) -> int | None:
    """Parse user message for address choice. Returns 1-based index or None."""
    t = message.strip().lower()
    # "oui", "ok", "confirmé", "correct" → first
    if t in ("oui", "ok", "ouais", "confirmé", "correct", "c'est ça", "correcte"):
        return 1
    # "1", "2", "la première", "la 1ère", "premier"
    m = re.match(r"^(?:la\s+)?(?:première|1ère|1ere|premier)\s*$", t)
    if m:
        return 1
    m = re.match(r"^(\d+)\s*$", t)
    if m:
        idx = int(m.group(1))
        if 1 <= idx <= n_candidates:
            return idx
    # "montréal", "montreal" → first Montréal candidate (assumed index 1 when we ranked Montreal first)
    if "montréal" in t or "montreal" in t:
        return 1
    return None


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    """
    Main chat endpoint. Receives message, calls LLM, executes actions, returns response.
    """
    conversation_id = request.conversation_id or str(uuid.uuid4())

    # 1. Load state
    state = await load_state(conversation_id, str(DEMO_USER["id"]), db)

    # 1b. Handle address confirmation if awaiting
    address_confirmed = False
    if state.get("awaiting_field") == "property_address_confirm":
        candidates = state.get("address_candidates") or []
        choice = _parse_address_choice(request.message, len(candidates))
        if choice is not None and 1 <= choice <= len(candidates):
            chosen = candidates[choice - 1]
            full_addr = chosen.get("full_address") if isinstance(chosen, dict) else chosen
            if full_addr:
                state["transaction"]["fields"]["property_address"] = full_addr
                state["awaiting_field"] = None
                state["address_candidates"] = []
                address_confirmed = True
                user_msg_for_llm = f"L'utilisateur a confirmé l'adresse : {full_addr}. Vérifie transaction.fields dans le draft : quels champs sont déjà remplis ? Passe au premier champ manquant ou fais le récapitulatif + demande confirmation si tout est rempli."
            else:
                user_msg_for_llm = request.message
        else:
            user_msg_for_llm = request.message
    elif state.get("awaiting_field") == "property_address_city":
        # User provides city → geocode (backend), then LLM interprets and responds
        partial = state.get("partial_address_pending", "").strip()
        city = request.message.strip()
        if partial and city:
            combined = f"{partial}, {city}"
            candidates = await geocode_address_candidates(combined)
            if candidates:
                state["address_candidates"] = candidates
                state["awaiting_field"] = "property_address_confirm"
                state["partial_address_pending"] = None
                user_msg_for_llm = f"L'utilisateur a fourni la ville pour compléter l'adresse : {city}. Le géocodage a trouvé des candidats (draft.address_candidates). Produis le message pour demander au courtier de confirmer l'adresse."
            else:
                state["awaiting_field"] = None
                state["partial_address_pending"] = None
                user_msg_for_llm = request.message
        else:
            user_msg_for_llm = request.message
    else:
        user_msg_for_llm = request.message

    # 2. Call LLM — understands message intent and decides actions
    llm_response = await call_llm(user_msg_for_llm, state, DEMO_USER, last_turn=state.get("history", [])[-2:])

    # 3. Extraction → mise à jour draft → barre à gauche reflète le draft
    state_updates = llm_response.get("state_updates") or {}
    fields = dict(state_updates.get("fields") or {})
    for domain in ("transaction", "promesse_achat"):
        d = state_updates.get(domain, {})
        if isinstance(d, dict) and d.get("fields"):
            fields.update(d["fields"])
    if fields:
        state = merge_state(state, {"fields": fields})

    # 4. Geocode si action (adresse partielle)
    actions_raw = llm_response.get("actions") or []
    geocode_actions = [a for a in actions_raw if isinstance(a, dict) and a.get("type") == "geocode_address"]
    for ga in geocode_actions:
        addr = (ga.get("payload") or {}).get("partial_address", "").strip()
        if addr and not address_confirmed:
            candidates = await geocode_address_candidates(addr)
            if candidates:
                state["address_candidates"] = candidates
                state["awaiting_field"] = "property_address_confirm"
                if len(candidates) == 1:
                    full = candidates[0].get("full_address", "")
                    llm_response["message"] = (
                        f"J'ai trouvé l'adresse suivante : {full}\n\n"
                        "Confirmez-vous que c'est bien celle-ci ? (répondez oui pour confirmer)"
                    )
                else:
                    lines = [f"{i}) {c.get('full_address', '')}" for i, c in enumerate(candidates, 1)]
                    llm_response["message"] = "J'ai trouvé plusieurs adresses. Laquelle correspond ?\n\n" + "\n".join(lines)
            else:
                state["partial_address_pending"] = addr
                state["awaiting_field"] = "property_address_city"
                llm_response["message"] = "Je n'ai pas trouvé cette adresse précisément. Pouvez-vous me donner la ville ?"
            break

    # 5. Execute actions — LLM décide (create_transaction, create_pa)
    actions = llm_response.get("actions") or []
    valid_actions = [a for a in actions if isinstance(a, dict) and a.get("type") and a.get("type") != "geocode_address"]
    executed_actions = []
    validation_message = None
    for action in valid_actions:
        result = await execute_action(action, state, DEMO_USER, db)
        if result.get("status") == "rejected":
            if result.get("reason") == "validation_error" and result.get("message"):
                validation_message = result["message"]
            continue
        executed_actions.append(action)
        if action.get("type") == "create_transaction" and result.get("id"):
            state["transaction"]["id"] = result["id"]
            state["transaction"]["status"] = "created"
        elif action.get("type") == "create_pa" and result.get("id"):
            state["promesse_achat"]["id"] = result["id"]
            state["promesse_achat"]["status"] = "created"

    # 6. History + sauvegarde
    response_message = validation_message or llm_response.get("message", "")
    if response_message and (response_message.strip().startswith("{") or '"state_updates"' in response_message or ',"actions":' in response_message):
        response_message = "Un instant, je vérifie les informations."
    state["history"] = state.get("history", [])
    state["history"].append({"role": "user", "content": request.message})
    state["history"].append({"role": "assistant", "content": response_message})

    await save_state(conversation_id, state, db)

    # Progress pour la barre gauche — mis à jour à chaque message (draft = source de vérité)
    tx_p = get_transaction_progress(state)
    pa_p = get_pa_progress(state)
    progress = {
        "transaction": {"filled": tx_p["filled"], "total": tx_p["total"], "fields": tx_p["fields"]},
        "promesse_achat": {"filled": pa_p["filled"], "total": pa_p["total"], "fields": pa_p["fields"]},
    }

    assistant_audio_base64 = None
    if request.with_tts and response_message:
        try:
            audio_bytes = await synthesize_tts(response_message, voice="coral", speed=1.0)
            assistant_audio_base64 = base64.b64encode(audio_bytes).decode()
        except Exception:
            pass

    return ChatResponse(
        message=response_message,
        actions=executed_actions,
        state=state,
        progress=progress,
        session_id=conversation_id,
        assistant_audio_base64=assistant_audio_base64,
    )


@router.post("/chat/voice")
async def chat_voice(
    audio: UploadFile = File(...),
    session_id: str | None = Form(None),
    conversation_id: str | None = Form(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Voice message: audio → Whisper transcription → chat flow → optional TTS.
    Returns transcription, response text, and assistant audio in base64.
    """
    try:
        content = await audio.read()
        content_type = audio.content_type or "audio/webm"
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Impossible de lire l'audio: {e}") from e

    try:
        transcription = await transcribe_whisper(content, content_type)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail="Impossible de transcrire l'audio. Parlez plus distinctement ou vérifiez le format.",
        ) from e

    if not transcription:
        raise HTTPException(
            status_code=400,
            detail="Audio vide ou incompréhensible.",
        )

    # Use same flow as POST /chat (including address confirmation)
    cid = conversation_id or session_id or str(uuid.uuid4())
    state = await load_state(cid, str(DEMO_USER["id"]), db)

    address_confirmed = False
    if state.get("awaiting_field") == "property_address_confirm":
        candidates = state.get("address_candidates") or []
        choice = _parse_address_choice(transcription, len(candidates))
        if choice is not None and 1 <= choice <= len(candidates):
            chosen = candidates[choice - 1]
            full_addr = chosen.get("full_address") if isinstance(chosen, dict) else chosen
            if full_addr:
                state["transaction"]["fields"]["property_address"] = full_addr
                state["awaiting_field"] = None
                state["address_candidates"] = []
                address_confirmed = True
                user_msg = f"L'utilisateur a confirmé l'adresse : {full_addr}. Passe au champ suivant."
            else:
                user_msg = transcription
        else:
            user_msg = transcription
    elif state.get("awaiting_field") == "property_address_city":
        partial = state.get("partial_address_pending", "").strip()
        city = transcription.strip()
        if partial and city:
            combined = f"{partial}, {city}"
            candidates = await geocode_address_candidates(combined)
            if candidates:
                state["address_candidates"] = candidates
                state["awaiting_field"] = "property_address_confirm"
                state["partial_address_pending"] = None
                user_msg = f"L'utilisateur a fourni la ville pour compléter l'adresse : {city}. Le géocodage a trouvé des candidats (draft.address_candidates). Produis le message pour demander au courtier de confirmer l'adresse."
            else:
                state["awaiting_field"] = None
                state["partial_address_pending"] = None
                user_msg = transcription
        else:
            user_msg = transcription
    else:
        user_msg = transcription

    llm_response = await call_llm(user_msg, state, DEMO_USER, last_turn=state.get("history", [])[-2:])
    state_updates = llm_response.get("state_updates") or {}
    fields = dict(state_updates.get("fields") or {})
    for domain in ("transaction", "promesse_achat"):
        d = state_updates.get(domain, {})
        if isinstance(d, dict) and d.get("fields"):
            fields.update(d["fields"])
    state_updates["fields"] = fields
    state = merge_state(state, state_updates)

    # Handle geocode_address action — LLM calls when it has enough (numéro + rue)
    actions_raw = llm_response.get("actions") or []
    for ga in [a for a in actions_raw if isinstance(a, dict) and a.get("type") == "geocode_address"]:
        addr = (ga.get("payload") or {}).get("partial_address", "").strip()
        if addr and not address_confirmed:
            candidates = await geocode_address_candidates(addr)
            if candidates:
                state["address_candidates"] = candidates
                state["awaiting_field"] = "property_address_confirm"
                if len(candidates) == 1:
                    llm_response["message"] = f"J'ai trouvé l'adresse suivante : {candidates[0].get('full_address', '')}. Confirmez-vous ?"
                else:
                    lines = [f"{i}) {c.get('full_address', '')}" for i, c in enumerate(candidates, 1)]
                    llm_response["message"] = "J'ai trouvé plusieurs adresses. Laquelle correspond ?\n\n" + "\n".join(lines)
            else:
                state["partial_address_pending"] = addr
                state["awaiting_field"] = "property_address_city"
                llm_response["message"] = "Je n'ai pas trouvé cette adresse précisément. Pouvez-vous me donner la ville ?"
            break

    actions = llm_response.get("actions") or []
    valid_actions = [a for a in actions if isinstance(a, dict) and a.get("type") and a.get("type") != "geocode_address"]
    executed_actions = []
    validation_message_voice = None
    for action in valid_actions:
        result = await execute_action(action, state, DEMO_USER, db)
        if result.get("status") == "rejected":
            if result.get("reason") == "validation_error" and result.get("message"):
                validation_message_voice = result["message"]
            continue
        executed_actions.append(action)
        if action.get("type") == "create_transaction" and result.get("id"):
            state["transaction"]["id"] = result["id"]
            state["transaction"]["status"] = "created"
        elif action.get("type") == "create_pa" and result.get("id"):
            state["promesse_achat"]["id"] = result["id"]
            state["promesse_achat"]["status"] = "created"

    response_text = validation_message_voice or llm_response.get("message", "")
    if response_text and (response_text.strip().startswith("{") or '"state_updates"' in response_text or ',"actions":' in response_text):
        response_text = "Un instant, je vérifie les informations."
    state["history"] = state.get("history", [])
    state["history"].append({"role": "user", "content": transcription})
    state["history"].append({"role": "assistant", "content": response_text})
    await save_state(cid, state, db)

    tx_p = get_transaction_progress(state)
    pa_p = get_pa_progress(state)
    progress = {
        "transaction": {"filled": tx_p["filled"], "total": tx_p["total"], "fields": tx_p["fields"]},
        "promesse_achat": {"filled": pa_p["filled"], "total": pa_p["total"], "fields": pa_p["fields"]},
    }

    # TTS: synthesize Léa's response
    assistant_audio_base64 = None
    if response_text:
        try:
            audio_bytes = await synthesize_tts(response_text, voice="coral", speed=1.0)
            assistant_audio_base64 = base64.b64encode(audio_bytes).decode()
        except Exception:
            pass  # Fallback: text only, no audio

    return {
        "success": True,
        "transcription": transcription,
        "response": response_text,
        "session_id": cid,
        "state": state,
        "progress": progress,
        "assistant_audio_base64": assistant_audio_base64,
        "actions": executed_actions if executed_actions else None,
    }


@router.post("/voice/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    """Transcribe audio to text (OpenAI Whisper)."""
    try:
        content = await audio.read()
        text = await transcribe_whisper(content, audio.content_type or "audio/webm")
        return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur transcription: {e}") from e


@router.post("/voice/synthesize")
async def synthesize_speech(request: VoiceSynthesizeRequest):
    """TTS: text → audio (base64). Voice: shimmer (féminin) or nova."""
    try:
        audio_bytes = await synthesize_tts(
            request.text,
            voice=request.voice,
            speed=request.speed or 1.0,
            instructions=request.instructions,
        )
        return {
            "audio_base64": base64.b64encode(audio_bytes).decode(),
            "content_type": "audio/mpeg",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur TTS: {e}") from e
