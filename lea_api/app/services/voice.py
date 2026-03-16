"""
Voice service - Whisper transcription and OpenAI TTS synthesis.
"""

import base64
import re
from pathlib import Path
from typing import Optional

from app.config import get_settings

try:
    from openai import AsyncOpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    AsyncOpenAI = None

# Voices for gpt-4o-mini-tts (coral = chaleureuse, naturelle)
TTS_VOICES = ("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar")
TTS_INSTRUCTIONS_PATH = Path(__file__).parent.parent.parent / "docs" / "lea_voice_instructions.md"


def _load_tts_instructions() -> Optional[str]:
    """Load TTS instructions from lea_voice_instructions.md (first paragraph after ---)."""
    if not TTS_INSTRUCTIONS_PATH.exists():
        return None
    try:
        raw = TTS_INSTRUCTIONS_PATH.read_text(encoding="utf-8")
        # Extract content after first --- (horizontal rule)
        parts = re.split(r"\n---+\n", raw, maxsplit=1)
        if len(parts) > 1:
            body = parts[1].strip()
        else:
            body = raw.strip()
        # Remove markdown headers and take first substantial paragraph (max 500 chars for API)
        lines = [ln.strip() for ln in body.split("\n") if ln.strip() and not ln.strip().startswith("#")]
        text = " ".join(lines)
        return text[:500] if text else None
    except Exception:
        return None


async def transcribe_whisper(audio_bytes: bytes, content_type: str = "audio/webm") -> str:
    """
    Transcribe audio to text using OpenAI Whisper.
    Supports webm, mp3, mp4, mpeg, mpga, m4a, wav.
    """
    if not OPENAI_AVAILABLE:
        raise RuntimeError("OpenAI is not installed. pip install openai")
    settings = get_settings()
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is required for transcription")
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    # Whisper expects a file-like object
    from io import BytesIO
    file_obj = BytesIO(audio_bytes)
    file_obj.name = "recording.webm"
    response = await client.audio.transcriptions.create(
        model="whisper-1",
        file=file_obj,
        language="fr",
    )
    return (response.text or "").strip()


async def synthesize_tts(
    text: str,
    voice: Optional[str] = None,
    speed: float = 1.0,
    instructions: Optional[str] = None,
) -> bytes:
    """
    Synthesize speech from text using OpenAI TTS.
    Uses gpt-4o-mini-tts (natural, steerable) with coral voice.
    Instructions loaded from docs/lea_voice_instructions.md if not provided.
    """
    if not text or not text.strip():
        raise ValueError("Empty text for TTS")
    if not OPENAI_AVAILABLE:
        raise RuntimeError("OpenAI is not installed. pip install openai")
    settings = get_settings()
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is required for TTS")
    voice_name = (voice or "coral").strip().lower()
    if voice_name not in TTS_VOICES:
        voice_name = "coral"
    speed_val = max(0.25, min(2.0, float(speed)))
    instr = instructions if instructions and instructions.strip() else _load_tts_instructions()
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    params = {
        "model": "gpt-4o-mini-tts",
        "voice": voice_name,
        "input": text.strip(),
        "speed": speed_val,
    }
    if instr:
        params["instructions"] = instr.strip()[:4096]
    response = await client.audio.speech.create(**params)
    return response.content
