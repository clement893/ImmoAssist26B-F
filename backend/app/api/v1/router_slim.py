"""
Slim API router - Chat Léa, Transactions, Promesses d'achat (OACIQ).
Use this for standalone testing of the chat + data API.
"""

from fastapi import APIRouter

from app.api.v1.endpoints import health, lea, transactions, oaciq_forms, oaciq_forms_import, auth

api_router_slim = APIRouter()

# Auth (for JWT - required by transactions, oaciq)
api_router_slim.include_router(auth.router, prefix="/auth", tags=["auth"])

# Health
api_router_slim.include_router(health.router, prefix="/health", tags=["health"])

# Léa chat (assistant conversationnel - supports X-LEA-Demo-Token or JWT)
api_router_slim.include_router(lea.router, tags=["lea"])

# Transactions (dossiers)
api_router_slim.include_router(transactions.router, tags=["transactions"])

# OACIQ forms (Promesses d'achat)
api_router_slim.include_router(oaciq_forms.router, tags=["oaciq-forms"])
api_router_slim.include_router(oaciq_forms_import.router, tags=["oaciq-forms"])
