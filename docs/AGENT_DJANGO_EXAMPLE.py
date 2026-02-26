"""
Exemple complet d'implémentation de l'API Agent pour Django
À adapter selon votre architecture Django
"""

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
import uuid
import logging

logger = logging.getLogger(__name__)


def check_api_key(request):
    """Vérifie le header X-API-Key"""
    api_key = request.headers.get("X-API-Key")
    if not api_key:
        return Response(
            {"error": "Missing X-API-Key header"},
            status=status.HTTP_401_UNAUTHORIZED
        )
    if api_key != settings.AGENT_API_KEY:
        return Response(
            {"error": "Invalid X-API-Key"},
            status=status.HTTP_401_UNAUTHORIZED
        )
    return None


def call_llm(message, session_id=None, conversation_id=None):
    """
    Appelle le LLM pour obtenir une réponse.
    À adapter selon votre service LLM (OpenAI, Anthropic, etc.)
    """
    try:
        # Exemple avec OpenAI
        from openai import OpenAI
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        
        # Construire l'historique de conversation si conversation_id existe
        messages = [
            {
                "role": "system",
                "content": (
                    "Tu es Léa, une assistante immobilière experte au Québec. "
                    "Tu aides les courtiers immobiliers avec leurs questions sur les transactions, "
                    "les formulaires OACIQ, les procédures, etc. Sois professionnelle, claire et concise."
                )
            },
            {"role": "user", "content": message}
        ]
        
        # TODO: Charger l'historique si conversation_id existe
        
        response = client.chat.completions.create(
            model=getattr(settings, "OPENAI_MODEL", "gpt-4o-mini"),
            messages=messages,
            temperature=0.7,
            max_tokens=1000,
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        logger.error(f"Error calling LLM: {e}", exc_info=True)
        raise


def transcribe_audio(audio_file):
    """
    Transcrit l'audio en texte.
    À adapter selon votre service de transcription (Whisper, etc.)
    """
    try:
        from openai import OpenAI
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        
        # Réinitialiser le pointeur du fichier
        audio_file.seek(0)
        
        transcription = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            language="fr"
        )
        
        return transcription.text
        
    except Exception as e:
        logger.error(f"Error transcribing audio: {e}", exc_info=True)
        raise


def synthesize_speech(text):
    """
    Génère un audio TTS à partir du texte.
    Optionnel - retourne None si non implémenté.
    """
    try:
        from openai import OpenAI
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        
        response = client.audio.speech.create(
            model="tts-1",
            voice="alloy",  # ou "echo", "fable", "onyx", "nova", "shimmer"
            input=text
        )
        
        # TODO: Sauvegarder l'audio et retourner l'URL
        # Pour l'instant, retourner None
        return None
        
    except Exception as e:
        logger.error(f"Error synthesizing speech: {e}", exc_info=True)
        return None


@csrf_exempt
@api_view(["POST"])
def agent_chat(request):
    """
    Endpoint pour le chat texte.
    POST /api/external/agent/chat
    """
    # Vérifier l'authentification
    auth_error = check_api_key(request)
    if auth_error:
        return auth_error
    
    # Valider les données
    message = request.data.get("message")
    if not message:
        return Response(
            {"success": False, "error": "message is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    session_id = request.data.get("session_id")
    conversation_id = request.data.get("conversation_id")
    
    # Créer une nouvelle session si nécessaire
    if not session_id:
        session_id = str(uuid.uuid4())
    
    try:
        # Appeler le LLM
        response_text = call_llm(message, session_id, conversation_id)
        
        return Response({
            "success": True,
            "response": response_text,
            "session_id": session_id,
            "conversation_id": conversation_id,
            "model": getattr(settings, "OPENAI_MODEL", "gpt-4o-mini"),
            "provider": "openai",
            "assistant_audio_url": None,
        })
        
    except Exception as e:
        logger.error(f"Error in agent_chat: {e}", exc_info=True)
        return Response(
            {"success": False, "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@csrf_exempt
@api_view(["POST"])
def agent_chat_voice(request):
    """
    Endpoint pour le chat vocal.
    POST /api/external/agent/chat/voice
    """
    # Vérifier l'authentification
    auth_error = check_api_key(request)
    if auth_error:
        return auth_error
    
    # Récupérer le fichier audio (vérifier les deux noms possibles)
    audio_file = request.FILES.get("audio") or request.FILES.get("file")
    if not audio_file:
        return Response(
            {"success": False, "error": "audio or file is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    session_id = request.POST.get("session_id")
    conversation_id = request.POST.get("conversation_id")
    user_id = request.POST.get("user_id")
    user_email = request.POST.get("user_email")
    
    # Créer une nouvelle session si nécessaire
    if not session_id:
        session_id = str(uuid.uuid4())
    
    try:
        # 1. Transcrire l'audio
        transcription = transcribe_audio(audio_file)
        
        # 2. Obtenir la réponse du LLM
        response_text = call_llm(transcription, session_id, conversation_id)
        
        # 3. (Optionnel) Générer un audio TTS
        assistant_audio_url = synthesize_speech(response_text)
        
        return Response({
            "success": True,
            "transcription": transcription,
            "response": response_text,
            "session_id": session_id,
            "conversation_id": int(conversation_id) if conversation_id else None,
            "assistant_audio_url": assistant_audio_url,
        })
        
    except Exception as e:
        logger.error(f"Error in agent_chat_voice: {e}", exc_info=True)
        return Response(
            {"success": False, "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# urls.py
"""
from django.urls import path
from . import views

urlpatterns = [
    path("api/external/agent/chat", views.agent_chat, name="agent_chat"),
    path("api/external/agent/chat/voice", views.agent_chat_voice, name="agent_chat_voice"),
]
"""

# settings.py
"""
import os

# Clé API partagée avec ImmoAssist
AGENT_API_KEY = os.getenv("AGENT_API_KEY", "")

# Clés API pour les services LLM
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
"""
