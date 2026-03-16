"""
Léa API - Courtier Assistant
FastAPI backend for Transaction + Promesse d'Achat chat.
"""

from contextlib import asynccontextmanager

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse

from app.routers import chat, knowledge, progress, tables, conversations, transactions
from app.db.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="Léa API - Courtier Assistant",
    description="API de chat pour la création de transactions et promesses d'achat (Québec)",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


SPA_PATHS = frozenset(["/", "/chat", "/transactions", "/tables", "/knowledge"])


@app.middleware("http")
async def spa_and_permissions(request, call_next):
    """Serve index.html for SPA routes (refresh works) + Permissions-Policy for mic."""
    path = (request.scope.get("path") or "/").rstrip("/") or "/"
    if request.method == "GET" and path in SPA_PATHS:
        fp = Path(__file__).parent.parent / "frontend" / "index.html"
        if fp.exists():
            return FileResponse(fp, media_type="text/html")
    response = await call_next(request)
    if response.status_code == 404 and request.method == "GET":
        p = request.scope.get("path") or ""
        if not p.startswith("/api") and p != "/health":
            fp = Path(__file__).parent.parent / "frontend" / "index.html"
            if fp.exists():
                return FileResponse(fp, media_type="text/html")
    response.headers["Permissions-Policy"] = "camera=(), microphone=(self), geolocation=()"
    return response

app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(knowledge.router, prefix="/api", tags=["knowledge"])
app.include_router(progress.router, prefix="/api", tags=["progress"])
app.include_router(tables.router, prefix="/api", tags=["tables"])
app.include_router(conversations.router, prefix="/api", tags=["conversations"])
app.include_router(transactions.router, prefix="/api", tags=["transactions"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "lea-api"}

frontend_path = Path(__file__).parent.parent / "frontend"
_index_path = frontend_path / "index.html"


def _serve_index():
    """Serve index.html for SPA (used by multiple routes)."""
    if _index_path.exists():
        return FileResponse(_index_path, media_type="text/html")
    return HTMLResponse("<html><body>Léa — index.html introuvable</body></html>", status_code=200)


# Routes SPA explicites - DOIT être avant le mount pour être prioritaire
@app.get("/chat", response_class=HTMLResponse)
@app.get("/transactions", response_class=HTMLResponse)
@app.get("/tables", response_class=HTMLResponse)
@app.get("/knowledge", response_class=HTMLResponse)
async def serve_spa_pages():
    return _serve_index()


# Mount StaticFiles en dernier - pour /, /index.html et les assets
if frontend_path.exists():
    app.mount("/", StaticFiles(directory=str(frontend_path), html=True), name="frontend")
