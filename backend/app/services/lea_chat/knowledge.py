"""
Knowledge Léa : charge la base de connaissance.
Source unique : LEA_KNOWLEDGE.md (domaines, intents, entities, champs PA, cas métier, tout).
"""

from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger

# docs/ depuis la racine projet (parent de backend/)
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent.parent
_LEA_DOCS_ROOT = _PROJECT_ROOT / "docs" / "oaciq"
_LEA_PROMPTS_ROOT = _PROJECT_ROOT / "docs" / "lea" / "prompts"

# Source unique : tout dans un fichier (domaines, intents, champs, cas, etc.)
LEA_KNOWLEDGE_PATH = _LEA_DOCS_ROOT / "LEA_KNOWLEDGE.md"

# Fichiers legacy (fallback si LEA_KNOWLEDGE.md absent)
LEA_CORE_INSTRUCTIONS_PATH = _LEA_DOCS_ROOT / "LEA_CORE_INSTRUCTIONS.md"
LEA_OACIQ_KNOWLEDGE_PATH = _LEA_DOCS_ROOT / "LEA_KNOWLEDGE_OACIQ.md"
LEA_OACIQ_GUIDE_EXPERT_PATH = _LEA_DOCS_ROOT / "OACIQ_Guide_Expert_IA.md"
LEA_PA_KNOWLEDGE_PATH = _LEA_DOCS_ROOT / "LEA_KNOWLEDGE_PA.md"
LEA_INSTRUCTION_PA_PATH = _LEA_DOCS_ROOT / "LEA_INSTRUCTION_PA.md"
# Préférer le nouveau format Domain-Intent-Entities dans docs/lea/prompts/
LEA_ROUTING_KNOWLEDGE_PATH = _LEA_PROMPTS_ROOT / "LEA_ROUTING_KNOWLEDGE.md"
LEA_ROUTING_KNOWLEDGE_LEGACY_PATH = _LEA_DOCS_ROOT / "LEA_ROUTING_KNOWLEDGE.md"

LEA_KNOWLEDGE_KEY_OACIQ = "oaciq"
LEA_KNOWLEDGE_FOLDER = "lea_knowledge"


def _load_single_knowledge() -> str:
    """Charge LEA_KNOWLEDGE.md (source unique). Retourne contenu ou chaîne vide."""
    if LEA_KNOWLEDGE_PATH.exists():
        try:
            return LEA_KNOWLEDGE_PATH.read_text(encoding="utf-8").strip()
        except Exception as e:
            logger.warning("Could not load LEA_KNOWLEDGE: %s", e)
    return ""


def load_pa_files() -> str:
    """Charge LEA_KNOWLEDGE_PA.md et LEA_INSTRUCTION_PA.md (fallback legacy)."""
    parts = []
    for path in (LEA_PA_KNOWLEDGE_PATH, LEA_INSTRUCTION_PA_PATH):
        if path.exists():
            try:
                content = path.read_text(encoding="utf-8")
                if content.strip():
                    parts.append(content.strip())
            except Exception as e:
                logger.warning("Could not load %s for Léa: %s", path.name, e)
    return "\n\n".join(parts) if parts else ""


async def load_lea_knowledge_async(db: AsyncSession) -> str:
    """
    Charge la base de connaissance Léa pour l'injecter dans le prompt système.
    Priorité : LEA_KNOWLEDGE.md (source unique) > DB LeaKnowledgeContent > fichiers legacy > docs uploadés.
    """
    parts = []
    try:
        try:
            from app.models.lea_knowledge_content import LeaKnowledgeContent
            from app.models import File
        except ImportError:
            LeaKnowledgeContent = None
            File = None

        # 1. Source unique : LEA_KNOWLEDGE.md (tout : domaines, intents, champs, cas)
        single_knowledge = _load_single_knowledge()
        if single_knowledge:
            parts.append(single_knowledge)
        else:
            # 2. Fallback legacy : DB ou fichiers multiples
            if LeaKnowledgeContent is not None:
                q = select(LeaKnowledgeContent).where(LeaKnowledgeContent.key == LEA_KNOWLEDGE_KEY_OACIQ)
                result = await db.execute(q)
                row = result.scalar_one_or_none()
                if row and getattr(row, "content", None) and str(row.content).strip():
                    parts.append(str(row.content).strip())

            if not parts and LEA_OACIQ_KNOWLEDGE_PATH.exists():
                content = LEA_OACIQ_KNOWLEDGE_PATH.read_text(encoding="utf-8")
                if content.strip():
                    parts.append(content.strip())

            if LEA_CORE_INSTRUCTIONS_PATH.exists():
                try:
                    core_content = LEA_CORE_INSTRUCTIONS_PATH.read_text(encoding="utf-8")
                    if core_content.strip():
                        parts.insert(0, core_content.strip())
                except Exception as e:
                    logger.warning("Could not load LEA_CORE_INSTRUCTIONS: %s", e)

            pa_content = load_pa_files()
            if pa_content:
                parts.append(pa_content)

            if LEA_OACIQ_GUIDE_EXPERT_PATH.exists():
                try:
                    guide_content = LEA_OACIQ_GUIDE_EXPERT_PATH.read_text(encoding="utf-8")
                    if guide_content.strip():
                        parts.append(guide_content.strip())
                except Exception as e:
                    logger.warning("Could not load OACIQ Guide Expert: %s", e)

        # 3. Documents uploadés par l'utilisateur (supplément)
        if File is not None:
            q_files = (
                select(File)
                .where(File.folder == LEA_KNOWLEDGE_FOLDER, File.content_text.isnot(None))
                .order_by(File.created_at.asc())
            )
            res = await db.execute(q_files)
            for f in res.scalars().all():
                if getattr(f, "content_text", None) and str(f.content_text).strip():
                    parts.append(
                        f"\n\n--- Document : {f.original_filename or f.filename or 'sans nom'} ---\n{str(f.content_text).strip()}"
                    )
    except Exception as e:
        logger.warning("Could not load knowledge for Léa: %s", e)
    return "\n\n".join(parts) if parts else ""


def load_routing_knowledge() -> str:
    """
    Charge LEA_ROUTING_KNOWLEDGE.md pour le routeur LLM.
    Source unique : docs/lea/prompts/LEA_ROUTING_KNOWLEDGE.md (format Domain-Intent-Entities).
    Fallback sur docs/oaciq/LEA_ROUTING_KNOWLEDGE.md (legacy) si le fichier principal n'existe pas.
    """
    if LEA_ROUTING_KNOWLEDGE_PATH.exists():
        try:
            return LEA_ROUTING_KNOWLEDGE_PATH.read_text(encoding="utf-8").strip()
        except Exception as e:
            logger.warning("Could not load LEA_ROUTING_KNOWLEDGE from %s: %s", LEA_ROUTING_KNOWLEDGE_PATH.name, e)
    if LEA_ROUTING_KNOWLEDGE_LEGACY_PATH.exists():
        try:
            return LEA_ROUTING_KNOWLEDGE_LEGACY_PATH.read_text(encoding="utf-8").strip()
        except Exception as e:
            logger.warning("Could not load legacy LEA_ROUTING_KNOWLEDGE: %s", e)
    return ""
