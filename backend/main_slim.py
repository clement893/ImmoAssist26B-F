"""
Léa Chat API - Slim entry point.
Chat + Transactions + Promesses d'achat only.
Use: uvicorn main_slim:app --reload
"""

import asyncio
import os
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db, close_db
from app.api.v1.router_slim import api_router_slim

# Ensure models are loaded for DB creation
import app.models  # noqa: F401

# Ensure project root (backend/) is in path; docs/ is at parent
_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT = os.path.dirname(_BACKEND_DIR)
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Minimal startup: DB only."""
    print("Léa Chat API - Starting...", file=sys.stderr)
    try:
        await init_db()
        print("Database initialized", file=sys.stderr)
        # Seed demo user if LEA_DEMO_EMAIL set and no users exist
        await _maybe_seed_demo_user()
    except Exception as e:
        print(f"Startup warning: {e}", file=sys.stderr)
    yield
    await close_db()
    print("Léa Chat API - Shutdown", file=sys.stderr)


async def _maybe_seed_demo_user():
    """Create demo user if LEA_DEMO_EMAIL is set and no users exist."""
    demo_email = os.getenv("LEA_DEMO_EMAIL", "demo@test.com")
    demo_token = os.getenv("LEA_DEMO_TOKEN")
    if not demo_token:
        return
    try:
        from app.database import AsyncSessionLocal
        from sqlalchemy import select
        from app.models.user import User
        from app.core.auth import get_password_hash

        async with AsyncSessionLocal() as db:
            r = await db.execute(select(User).limit(1))
            if r.scalar_one_or_none():
                return  # Users exist, skip
            u = User(
                email=demo_email,
                hashed_password=get_password_hash("demo123"),
                first_name="Demo",
                last_name="User",
                is_active=True,
            )
            db.add(u)
            await db.commit()
            print(f"Created demo user: {demo_email}", file=sys.stderr)
    except Exception as e:
        print(f"Demo user seed skipped: {e}", file=sys.stderr)


app = FastAPI(
    title="Léa Chat API",
    description="Chat Léa + Transactions + Promesses d'achat (API de test)",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount slim API
app.include_router(api_router_slim, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    return {
        "service": "Léa Chat API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": ["/api/v1/lea/chat", "/api/v1/transactions", "/api/v1/oaciq-forms"],
    }
