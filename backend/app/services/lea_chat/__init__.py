"""
Module lea_chat — Chat AI Léa.
Point d'entrée : LeaChatService.chat() / run_actions().
"""

from app.services.lea_chat.router import route_user_message
from app.services.lea_chat.context_loader import load_active_conversation_context
from app.services.lea_chat.service import LeaChatService

__all__ = [
    "LeaChatService",
    "route_user_message",
    "load_active_conversation_context",
]
