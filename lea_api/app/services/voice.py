"""Voice service - Whisper transcription + OpenAI TTS."""

from typing import Optional
from app.config import get_settings

try:
    from openai import AsyncOpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

TTS_VOICES = ("alloy", "echo", "fable", "onyx", "nova", "shimmer")
TTS_DEFAULT_VOICE = "nova"  # Féminine, naturelle, bonne en français
TTS_MODEL = "tts-1"         # ✅ Correct — "gpt-4o-mini-tts" n'existe pas
TTS_MODEL_HD = "tts-1-hd"   # Meilleure qualité, légèrement plus lent


async def transcribe_whisper(audio_bytes: bytes, content_type: str = "audio/webm") -> str:
    """Transcrit l'audio en texte via Whisper. Optimisé français québécois."""
    if not OPENAI_AVAILABLE:
        raise RuntimeError("OpenAI n'est pas installé. pip install openai")
    settings = get_settings()
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY requis pour la transcription")

    from io import BytesIO
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    file_obj = BytesIO(audio_bytes)
    file_obj.name = "recording.webm"

    response = await client.audio.transcriptions.create(
        model="whisper-1",
        file=file_obj,
        language="fr",
        prompt=(
            "Transcription exacte sans ponctuation superflue. "
            "Courtier immobilier québécois. "
            "Noms propres courants : Ford, Clark, Martin, Tremblay, Gagnon, Côté, Roy, Dubois. "
            "Adresses en chiffres groupés sans point : 5554, 1200, 345. "
            "Prix : 855000, 325000, 1200000. "
            "Termes : transaction, achat, vente, promesse d'achat, acompte, hypothèque, vendeur, acheteur."
        ),
    )
    return (response.text or "").strip()


async def synthesize_tts(
    text: str,
    voice: Optional[str] = None,
    speed: float = 1.0,
    hd: bool = False,
) -> bytes:
    """
    Synthétise la voix de Léa via OpenAI TTS. Retourne bytes MP3.

    Args:
        text:  Texte à synthétiser (français)
        voice: nova (défaut), alloy, echo, fable, onyx, shimmer
        speed: 0.25 à 4.0 (défaut: 1.0)
        hd:    True = tts-1-hd (meilleure qualité), False = tts-1 (plus rapide)
    """
    if not text or not text.strip():
        raise ValueError("Texte vide pour la synthèse vocale")
    if not OPENAI_AVAILABLE:
        raise RuntimeError("OpenAI n'est pas installé. pip install openai")

    settings = get_settings()
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY requis pour la synthèse vocale")

    voice_name = (voice or TTS_DEFAULT_VOICE).strip().lower()
    if voice_name not in TTS_VOICES:
        voice_name = TTS_DEFAULT_VOICE

    speed_val = max(0.25, min(4.0, float(speed)))
    model = TTS_MODEL_HD if hd else TTS_MODEL

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    response = await client.audio.speech.create(
        model=model,
        voice=voice_name,
        input=text.strip(),
        speed=speed_val,
        response_format="mp3",
    )
    return response.content
