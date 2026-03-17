"""Chat router - POST /api/chat + voice endpoints."""

import asyncio
import base64
import json
import re
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas import ChatRequest, ChatResponse, VoiceSynthesizeRequest
from app.db.database import get_db, AsyncSessionLocal
from app.services.state import load_state, save_state, merge_state, get_transaction_progress, get_pa_progress
from app.services.llm import call_llm
from app.services.actions import execute_action
from app.services.geocode import geocode_address_candidates, looks_partial
from app.services.voice import transcribe_whisper, synthesize_tts

router = APIRouter()

DEMO_USER = {
    "id": 1,
    "full_name": "Courtier Demo",
    "permis_number": "12345",
}


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
                    "Vérifie transaction.fields dans le draft : quels champs sont déjà remplis ? "
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
                    f"L'utilisateur a fourni la ville : {city}. "
                    "Le géocodage a trouvé des candidats (draft.address_candidates). "
                    "Demande au courtier de confirmer l'adresse."
                )
                return msg, state, False
            else:
                state["awaiting_field"] = None
                state["partial_address_pending"] = None

    return message, state, False


async def _handle_geocode_actions(
    actions_raw: list, state: dict, address_confirmed: bool
) -> tuple[str | None, dict]:
    for ga in [a for a in actions_raw if isinstance(a, dict) and a.get("type") == "geocode_address"]:
        addr = (ga.get("payload") or {}).get("partial_address", "").strip()
        if addr and not address_confirmed:
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
                return "Je n'ai pas trouvé cette adresse précisément. Pouvez-vous me donner la ville ?", state
    return None, state


async def _execute_llm_actions(
    actions_raw: list, state: dict, db: AsyncSession
) -> tuple[list, str | None, dict]:
    valid = [
        a for a in actions_raw
        if isinstance(a, dict) and a.get("type") and a.get("type") != "geocode_address"
    ]
    executed = []
    validation_message = None

    for action in valid:
        # Intercept create_transaction si l'adresse dans le payload est partielle
        # (pas de code postal) → forcer géocodage d'abord
        if action.get("type") == "create_transaction":
            payload = action.get("payload") or {}
            addr = payload.get("property_address") or state.get("transaction", {}).get("fields", {}).get("property_address", "")
            if addr and looks_partial(str(addr)):
                # Déclencher le géocodage au lieu de créer
                candidates = await geocode_address_candidates(str(addr))
                if candidates:
                    state["address_candidates"] = candidates
                    state["awaiting_field"] = "property_address_confirm"
                    if len(candidates) == 1:
                        full = candidates[0].get("full_address", "")
                        state["transaction"]["fields"]["property_address"] = None  # reset partielle
                        validation_message = f"J'ai trouvé l'adresse suivante : {full}. Confirmez-vous que c'est bien celle-ci ?"
                    else:
                        lines = [f"{i}) {c.get('full_address', '')}" for i, c in enumerate(candidates, 1)]
                        validation_message = "J'ai trouvé plusieurs adresses. Laquelle correspond ?\n\n" + "\n".join(lines)
                else:
                    state["partial_address_pending"] = addr
                    state["awaiting_field"] = "property_address_city"
                    validation_message = "Je n'ai pas trouvé cette adresse précisément. Pouvez-vous me donner la ville ?"
                continue  # Ne pas créer la transaction maintenant

        result = await execute_action(action, state, DEMO_USER, db)
        if result.get("status") == "rejected":
            if result.get("reason") == "validation_error":
                validation_message = result.get("message")
            continue
        executed.append(action)
        if action.get("type") == "create_transaction" and result.get("id"):
            state["transaction"]["id"] = result["id"]
            state["transaction"]["status"] = "created"
        elif action.get("type") == "create_pa" and result.get("id"):
            state["promesse_achat"]["id"] = result["id"]
            state["promesse_achat"]["status"] = "created"

    return executed, validation_message, state


async def _process_message(
    user_message: str,
    conversation_id: str,
    db: AsyncSession,
    with_tts: bool = True,
) -> dict:
    """Pipeline central — partagé entre /chat et /voice/chat. Zéro duplication."""
    # 1. Charger le state
    state = await load_state(conversation_id, str(DEMO_USER["id"]), db)

    # 2. Résoudre les états d'attente adresse
    msg_for_llm, state, address_confirmed = await _resolve_address_state(user_message, state)

    # 3. Appel LLM
    llm_response = await call_llm(
        msg_for_llm, state, DEMO_USER,
        last_turn=state.get("history", [])[-4:],
    )
    # Après étape 3 (appel LLM) — debug temporaire
    print(f"DEBUG LLM RAW: {json.dumps(llm_response, ensure_ascii=False)[:500]}")

    # 4. Mettre à jour le draft
    state_updates = llm_response.get("state_updates") or {}
    fields = dict(state_updates.get("fields") or {})
    for domain in ("transaction", "promesse_achat"):
        d = state_updates.get(domain, {})
        if isinstance(d, dict) and d.get("fields"):
            fields.update(d["fields"])
    if fields:
        state = merge_state(state, {"fields": fields})
    if state_updates.get("active_domain"):
        state["active_domain"] = state_updates["active_domain"]
    if "awaiting_field" in state_updates:
        state["awaiting_field"] = state_updates["awaiting_field"]

    # 5. Gérer geocode — normaliser les actions (le LLM retourne parfois des strings)
    actions_raw = llm_response.get("actions") or []
    normalized = []
    for a in actions_raw:
        if isinstance(a, str):
            # Le LLM a retourné "geocode_address" au lieu de {"type": "geocode_address", ...}
            if a == "geocode_address":
                # Récupérer l'adresse depuis le state_updates ou le draft
                addr = (
                    (llm_response.get("state_updates") or {}).get("fields", {}).get("property_address")
                    or state.get("transaction", {}).get("fields", {}).get("property_address", "")
                )
                normalized.append({"type": "geocode_address", "payload": {"partial_address": addr}})
            else:
                normalized.append({"type": a, "payload": {}})
        elif isinstance(a, dict):
            normalized.append(a)
    actions_raw = normalized
    geocode_override, state = await _handle_geocode_actions(actions_raw, state, address_confirmed)
    if geocode_override:
        llm_response["message"] = geocode_override

    # 6. Exécuter actions métier
    executed_actions, validation_message, state = await _execute_llm_actions(actions_raw, state, db)

    # 7. Message final
    response_message = _guard_message(validation_message or llm_response.get("message", ""))

    # 8. Historique
    state.setdefault("history", [])
    state["history"].append({"role": "user", "content": user_message})
    state["history"].append({"role": "assistant", "content": response_message})

    # 9. TTS + sauvegarde en parallèle
    # save_state utilise sa propre session pour éviter les conflits après commit() dans actions.py
    async def _save() -> None:
        async with AsyncSessionLocal() as new_db:
            try:
                await save_state(conversation_id, state, new_db)
            except Exception:
                pass

    async def _tts() -> str | None:
        if not with_tts or not response_message:
            return None
        try:
            audio_bytes = await synthesize_tts(response_message, voice="nova", speed=1.0)
            return base64.b64encode(audio_bytes).decode()
        except Exception:
            return None

    assistant_audio_base64, _ = await asyncio.gather(
        _tts(),
        _save(),
    )

    return {
        "message": response_message,
        "actions": executed_actions,
        "state": state,
        "progress": _build_progress(state),
        "session_id": conversation_id,
        "assistant_audio_base64": assistant_audio_base64,
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    """Endpoint principal du chat textuel."""
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
        raise HTTPException(
            status_code=400,
            detail="Impossible de transcrire l'audio. Parlez plus distinctement ou vérifiez le format.",
        ) from e

    if not transcription:
        raise HTTPException(status_code=400, detail="Audio vide ou incompréhensible.")

    cid = conversation_id or session_id or str(uuid.uuid4())
    result = await _process_message(
        user_message=transcription,
        conversation_id=cid,
        db=db,
        with_tts=True,
    )

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
    """Transcrit l'audio en texte uniquement (sans LLM)."""
    try:
        content = await audio.read()
        text = await transcribe_whisper(content, audio.content_type or "audio/webm")
        return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur transcription: {e}") from e


@router.post("/voice/synthesize")
async def synthesize_speech(request: VoiceSynthesizeRequest):
    """TTS : texte → audio MP3 base64."""
    try:
        audio_bytes = await synthesize_tts(
            request.text,
            voice=request.voice or "nova",
            speed=request.speed or 1.0,
        )
        return {
            "audio_base64": base64.b64encode(audio_bytes).decode(),
            "content_type": "audio/mpeg",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur TTS: {e}") from e
