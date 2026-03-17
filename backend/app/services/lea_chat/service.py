"""
LeaChatService — Point d'entrée unique pour le chat Léa.
Consolide : actions, contexte, LLM, persistance.
"""

import uuid
from typing import Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import RealEstateTransaction
from app.services.lea_chat.orchestrator import run as run_lea_actions
from app.services.lea_chat.response_composer import build_context as build_lea_context
from app.services.lea_chat.knowledge import load_lea_knowledge_async


class LeaChatService:
    """
    Service principal du chat Léa.
    Méthodes : run_actions, chat, chat_stream.
    """

    def __init__(self, db: AsyncSession, user_id: int):
        self.db = db
        self.user_id = user_id

    async def run_actions(
        self,
        message: str,
        last_assistant_message: Optional[str] = None,
        session_id: Optional[str] = None,
    ) -> tuple[list[str], Optional[RealEstateTransaction]]:
        """
        Exécute les actions Léa (transaction, adresse, PA, contacts, etc.).
        Retourne (lignes d'action pour le prompt, transaction créée si création).
        """
        return await run_lea_actions(
            self.db,
            self.user_id,
            message,
            last_assistant_message=last_assistant_message,
            session_id=session_id,
        )

    async def get_user_context(self) -> str:
        """Charge le contexte utilisateur (transactions, formulaires OACIQ)."""
        from app.api.v1.endpoints.lea import get_lea_user_context
        return await get_lea_user_context(self.db, self.user_id)

    async def get_knowledge(self) -> str:
        """Charge la base de connaissance Léa."""
        return await load_lea_knowledge_async(self.db)

    def build_system_prompt(
        self,
        user_context: str,
        action_lines: list[str],
        knowledge: Optional[str] = None,
    ) -> str:
        """Construit le prompt système pour le LLM."""
        system_prompt, _, _ = build_lea_context(
            user_context, action_lines, knowledge=knowledge
        )
        return system_prompt

    async def chat(
        self,
        message: str,
        session_id: Optional[str] = None,
        last_assistant_message: Optional[str] = None,
        transaction_id: Optional[int] = None,
    ) -> dict[str, Any]:
        """
        Flux complet : run_actions → contexte → LLM → persistance.
        Retourne {content, session_id, model, provider, usage, actions}.
        """
        from app.api.v1.endpoints.lea import (
            get_or_create_lea_conversation,
            build_llm_messages_from_history,
            persist_lea_messages,
            link_lea_session_to_transaction,
            _action_lines_contain_pa_fill_next_section,
            _action_lines_contain_pa_form_complete,
            _build_pa_fill_next_section_response,
            _build_pa_form_complete_response,
        )
        from app.services.ai_service import AIService, AIProvider
        from app.core.config import get_settings

        sid = session_id or str(uuid.uuid4())

        if transaction_id and sid:
            await link_lea_session_to_transaction(
                self.db, self.user_id, sid, transaction_id
            )

        action_lines, created_tx = await self.run_actions(
            message,
            last_assistant_message=last_assistant_message,
            session_id=sid,
        )

        user_context = await self.get_user_context()
        if action_lines:
            user_context += "\n\n--- Action effectuée ---\n" + "\n".join(action_lines)

        conv, sid = await get_or_create_lea_conversation(
            self.db, self.user_id, sid
        )

        if created_tx and action_lines:
            await link_lea_session_to_transaction(
                self.db, self.user_id, sid, created_tx.id
            )
            ref = created_tx.dossier_number or f"#{created_tx.id}"
            content = (
                f"C'est fait ! J'ai créé la transaction {ref} pour vous. "
                "Vous pouvez la voir et la compléter dans la section Transactions."
            )
            await persist_lea_messages(
                self.db, self.user_id, sid, message, content,
                meta={"actions": action_lines},
            )
            return {
                "content": content,
                "session_id": sid,
                "model": None,
                "provider": None,
                "usage": {},
                "actions": action_lines,
            }

        if _action_lines_contain_pa_fill_next_section(action_lines):
            content = _build_pa_fill_next_section_response(action_lines)
            if content:
                await persist_lea_messages(
                    self.db, self.user_id, sid, message, content,
                    meta={"actions": action_lines},
                )
                return {
                    "content": content,
                    "session_id": sid,
                    "model": None,
                    "provider": None,
                    "usage": {},
                    "actions": action_lines,
                }
        if _action_lines_contain_pa_form_complete(action_lines):
            content = _build_pa_form_complete_response(action_lines)
            if content:
                await persist_lea_messages(
                    self.db, self.user_id, sid, message, content,
                    meta={"actions": action_lines},
                )
                return {
                    "content": content,
                    "session_id": sid,
                    "model": None,
                    "provider": None,
                    "usage": {},
                    "actions": action_lines,
                }

        knowledge = await self.get_knowledge()
        system_prompt = self.build_system_prompt(
            user_context, action_lines or [], knowledge=knowledge
        )
        messages = build_llm_messages_from_history(
            conv.messages or [], message
        )
        settings = get_settings()
        service = AIService(provider=AIProvider.AUTO)
        result = await service.chat_completion(
            messages=messages,
            system_prompt=system_prompt,
            max_tokens=getattr(settings, "LEA_MAX_TOKENS", 256),
        )
        content = result.get("content", "")
        from app.api.v1.endpoints.lea import apply_lea_price_from_assistant_content
        content = await apply_lea_price_from_assistant_content(
            self.db, self.user_id, content
        )
        await persist_lea_messages(
            self.db, self.user_id, sid, message, content,
            meta={
                "actions": action_lines,
                "model": result.get("model"),
                "provider": result.get("provider"),
                "usage": result.get("usage"),
            },
        )
        return {
            "content": content,
            "session_id": sid,
            "model": result.get("model"),
            "provider": result.get("provider"),
            "usage": result.get("usage", {}),
            "actions": action_lines,
        }
