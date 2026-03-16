"""Knowledge base router - GET /api/knowledge."""

from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Query
from fastapi.responses import FileResponse, PlainTextResponse

from app.schemas import KnowledgeDoc, KnowledgeListResponse, KnowledgeFileUpdate

router = APIRouter()

# Base de connaissance: docs folder
KNOWLEDGE_ROOT = Path(__file__).parent.parent.parent / "docs"


def _validate_filename(filename: str) -> Optional[Path]:
    """Validate filename and return path if safe."""
    if ".." in filename or "/" in filename or "\\" in filename:
        return None
    path = KNOWLEDGE_ROOT / filename
    if not path.exists() or not path.is_file():
        return None
    try:
        path.resolve().relative_to(KNOWLEDGE_ROOT.resolve())
    except ValueError:
        return None
    return path


@router.get("/knowledge", response_model=KnowledgeListResponse)
async def list_knowledge():
    """
    List all .md and .docx files in the base de connaissance (docs folder).
    """
    docs = []
    if KNOWLEDGE_ROOT.exists():
        for f in KNOWLEDGE_ROOT.iterdir():
            if f.is_file() and f.suffix.lower() in (".md", ".docx", ".txt"):
                desc = None
                if f.suffix == ".md":
                    if "lea_courtier" in f.name:
                        desc = "Guide LLM pour Léa (intents, entités, actions)"
                    elif "fiche_technique" in f.name:
                        desc = "Fiche technique API Chat"
                    elif "lea_voice" in f.name:
                        desc = "Instructions vocales TTS pour le ton et le style de Léa"
                docs.append(
                    KnowledgeDoc(
                        name=f.name,
                        path=f"/api/knowledge/file/{f.name}",
                        description=desc,
                    )
                )
    docs.sort(key=lambda d: d.name)
    return KnowledgeListResponse(
        docs=docs,
        root_path=str(KNOWLEDGE_ROOT),
    )


@router.get("/knowledge/file/{filename}")
async def get_knowledge_file(
    filename: str,
    download: bool = Query(False, description="Force download"),
):
    """Serve a knowledge file (preview in browser or download)."""
    path = _validate_filename(filename)
    if not path:
        return {"detail": "File not found"}
    return FileResponse(
        path,
        filename=filename if download else None,
        media_type="application/octet-stream" if download else None,
    )


@router.get("/knowledge/raw/{filename}")
async def get_knowledge_raw(filename: str):
    """Get raw text content of a .md or .txt file (for view/edit)."""
    path = _validate_filename(filename)
    if not path:
        return {"detail": "File not found"}
    if path.suffix.lower() not in (".md", ".txt"):
        return {"detail": "Only .md and .txt files can be viewed/edited as text"}
    content = path.read_text(encoding="utf-8", errors="replace")
    return PlainTextResponse(content)


@router.put("/knowledge/file/{filename}")
async def put_knowledge_file(filename: str, body: KnowledgeFileUpdate):
    """Update content of a .md or .txt file."""
    path = _validate_filename(filename)
    if not path:
        return {"detail": "File not found"}
    if path.suffix.lower() not in (".md", ".txt"):
        return {"detail": "Only .md and .txt files can be edited"}
    path.write_text(body.content, encoding="utf-8")
    return {"ok": True, "filename": filename}
