"""Voice service - Deepgram streaming STT + OpenAI TTS."""

import asyncio
import json
from typing import Optional, AsyncGenerator
from app.config import get_settings

try:
    from openai import AsyncOpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

try:
    from deepgram import DeepgramClient, LiveTranscriptionEvents, LiveOptions
    DEEPGRAM_AVAILABLE = True
except ImportError:
    DEEPGRAM_AVAILABLE = False

TTS_VOICES = ("alloy", "echo", "fable", "onyx", "nova", "shimmer")
TTS_DEFAULT_VOICE = "nova"
TTS_MODEL = "tts-1"


# ---------------------------------------------------------------------------
# STT — Deepgram streaming (temps réel)
# ---------------------------------------------------------------------------

async def transcribe_deepgram_stream(
    audio_chunks: AsyncGenerator[bytes, None],
) -> AsyncGenerator[dict, None]:
    """
    Stream audio vers Deepgram, yield transcriptions en temps réel.
    Yield: {"type": "partial"|"final", "text": "...", "is_final": bool}
    """
    if not DEEPGRAM_AVAILABLE:
        yield {"type": "error", "text": "deepgram-sdk non installé. pip install deepgram-sdk"}
        return

    settings = get_settings()
    if not settings.deepgram_api_key:
        yield {"type": "error", "text": "DEEPGRAM_API_KEY manquant dans .env"}
        return

    deepgram = DeepgramClient(settings.deepgram_api_key)
    transcript_queue: asyncio.Queue = asyncio.Queue()

    try:
        dg_connection = deepgram.listen.asynclive.v("1")

        async def on_message(self, result, **kwargs):
            try:
                sentence = result.channel.alternatives[0].transcript
                is_final = result.is_final
                speech_final = getattr(result, "speech_final", False)
                if sentence:
                    await transcript_queue.put({
                        "type": "final" if is_final else "partial",
                        "text": sentence,
                        "is_final": is_final,
                        "speech_final": speech_final,
                    })
            except Exception:
                pass

        async def on_close(self, close, **kwargs):
            await transcript_queue.put(None)

        async def on_error(self, error, **kwargs):
            await transcript_queue.put({"type": "error", "text": str(error)})

        dg_connection.on(LiveTranscriptionEvents.Transcript, on_message)
        dg_connection.on(LiveTranscriptionEvents.Close, on_close)
        dg_connection.on(LiveTranscriptionEvents.Error, on_error)

        options = LiveOptions(
            model="nova-2",
            language="fr",
            smart_format=True,
            interim_results=True,
            utterance_end_ms="1800",  # 1.8s — laisse le courtier finir sa phrase (1000 = coupe trop tôt)
            vad_events=True,
        )

        await dg_connection.start(options)

        async def send_audio():
            try:
                async for chunk in audio_chunks:
                    if chunk:
                        await dg_connection.send(chunk)
            finally:
                await dg_connection.finish()

        async def keepalive_loop():
            """Envoie KeepAlive toutes les 4 s pour éviter le timeout NET-0001 (10 s sans audio)."""
            try:
                while True:
                    await asyncio.sleep(4)
                    await dg_connection.send(json.dumps({"type": "KeepAlive"}))
            except asyncio.CancelledError:
                pass

        send_task = asyncio.create_task(send_audio())
        keepalive_task = asyncio.create_task(keepalive_loop())

        try:
            while True:
                item = await transcript_queue.get()
                if item is None:
                    break
                yield item
        finally:
            keepalive_task.cancel()
            try:
                await keepalive_task
            except asyncio.CancelledError:
                pass
            await send_task

    except Exception as e:
        yield {"type": "error", "text": str(e)}


# ---------------------------------------------------------------------------
# STT — Whisper batch (fallback HTTP)
# ---------------------------------------------------------------------------

async def transcribe_whisper(audio_bytes: bytes, content_type: str = "audio/webm") -> str:
    """Transcrit via Whisper — fallback pour /voice/chat HTTP."""
    if not OPENAI_AVAILABLE:
        raise RuntimeError("OpenAI non installé.")
    settings = get_settings()
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY requis")

    from io import BytesIO
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    file_obj = BytesIO(audio_bytes)
    file_obj.name = "recording.webm"

    response = await client.audio.transcriptions.create(
        model="whisper-1",
        file=file_obj,
        language="fr",
        prompt=(
            "Transcription exacte. Courtier immobilier québécois. "
            "Noms : Ford, Clark, Martin, Tremblay. "
            "Adresses : 5554, 1200, 345. Prix : 855000, 325000. "
            "Termes : transaction, achat, vente, promesse d'achat, hypothèque."
        ),
    )
    return (response.text or "").strip()


# ---------------------------------------------------------------------------
# TTS — OpenAI streaming (chunks)
# ---------------------------------------------------------------------------

async def synthesize_tts_stream(
    text: str,
    voice: Optional[str] = None,
    speed: float = 1.0,
) -> AsyncGenerator[bytes, None]:
    """
    TTS streaming — yield chunks MP3 au fur et à mesure.
    Premier chunk en ~200ms au lieu d'attendre le fichier complet.
    """
    if not text or not text.strip():
        return
    if not OPENAI_AVAILABLE:
        return

    settings = get_settings()
    if not settings.openai_api_key:
        return

    voice_name = (voice or TTS_DEFAULT_VOICE).strip().lower()
    if voice_name not in TTS_VOICES:
        voice_name = TTS_DEFAULT_VOICE

    try:
        client = AsyncOpenAI(api_key=settings.openai_api_key)
        async with client.audio.speech.with_streaming_response.create(
            model=TTS_MODEL,
            voice=voice_name,
            input=text.strip(),
            speed=max(0.25, min(4.0, float(speed))),
            response_format="mp3",
        ) as response:
            async for chunk in response.iter_bytes(chunk_size=4096):
                yield chunk
    except Exception:
        return


# ---------------------------------------------------------------------------
# TTS — batch (fallback)
# ---------------------------------------------------------------------------

async def synthesize_tts(
    text: str,
    voice: Optional[str] = None,
    speed: float = 1.0,
    hd: bool = False,
) -> bytes:
    """TTS batch — retourne MP3 complet. Pour /voice/chat HTTP."""
    if not text or not text.strip():
        raise ValueError("Texte vide")
    if not OPENAI_AVAILABLE:
        raise RuntimeError("OpenAI non installé.")

    settings = get_settings()
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY requis")

    voice_name = (voice or TTS_DEFAULT_VOICE).strip().lower()
    if voice_name not in TTS_VOICES:
        voice_name = TTS_DEFAULT_VOICE

    model = "tts-1-hd" if hd else TTS_MODEL
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    response = await client.audio.speech.create(
        model=model,
        voice=voice_name,
        input=text.strip(),
        speed=max(0.25, min(4.0, float(speed))),
        response_format="mp3",
    )
    return response.content
