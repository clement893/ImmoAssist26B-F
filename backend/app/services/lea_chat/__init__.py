"""
Module lea_chat — Refactor du chat AI Léa.
Router (Domain-Intent-Entities), orchestrator, actions, context_loader.
"""

from app.services.lea_chat.router import route_user_message
from app.services.lea_chat.context_loader import load_active_conversation_context

# Réduit aux exports réellement consommés par lea.py et autres modules
__all__ = [
    "route_user_message",
    "load_active_conversation_context",
]
