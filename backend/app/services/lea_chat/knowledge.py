"""
Knowledge Léa : charge LEA_KNOWLEDGE_PA.md, LEA_INSTRUCTION_PA.md et la base de connaissance.
"""

from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger

# docs/oaciq depuis la racine projet (parent de backend/)
_LEA_DOCS_ROOT = Path(__file__).resolve().parent.parent.parent.parent.parent / "docs" / "oaciq"
LEA_PA_KNOWLEDGE_PATH = _LEA_DOCS_ROOT / "LEA_KNOWLEDGE_PA.md"
LEA_INSTRUCTION_PA_PATH = _LEA_DOCS_ROOT / "LEA_INSTRUCTION_PA.md"

LEA_KNOWLEDGE_KEY_OACIQ = "oaciq"
LEA_KNOWLEDGE_FOLDER = "lea_knowledge"


def load_pa_files() -> str:
    """Charge LEA_KNOWLEDGE_PA.md et LEA_INSTRUCTION_PA.md. Retourne le contenu concaténé."""
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
    Charge toute la base de connaissance Léa pour l'injecter dans le prompt système.
    Inclut : contenu OACIQ (DB ou fichier), guide expert, PA knowledge, PA instructions, documents.
    """
    parts = []
    try:
        try:
            from app.models.lea_knowledge_content import LeaKnowledgeContent
            from app.models import File
        except ImportError:
            LeaKnowledgeContent = None
            File = None

        if LeaKnowledgeContent is not None:
            q = select(LeaKnowledgeContent).where(LeaKnowledgeContent.key == LEA_KNOWLEDGE_KEY_OACIQ)
            result = await db.execute(q)
            row = result.scalar_one_or_none()
            if row and getattr(row, "content", None) and str(row.content).strip():
                parts.append(str(row.content).strip())

        oaciq_path = _LEA_DOCS_ROOT / "LEA_KNOWLEDGE_OACIQ.md"
        if not parts and oaciq_path.exists():
            content = oaciq_path.read_text(encoding="utf-8")
            if content.strip():
                parts.append(content.strip())

        guide_path = _LEA_DOCS_ROOT / "OACIQ_Guide_Expert_IA.md"
        if guide_path.exists():
            try:
                guide_content = guide_path.read_text(encoding="utf-8")
                if guide_content.strip():
                    parts.append(guide_content.strip())
            except Exception as e:
                logger.warning("Could not load OACIQ Guide Expert for Léa: %s", e)

        pa_content = load_pa_files()
        if pa_content:
            parts.append(pa_content)

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
