#!/usr/bin/env python3
"""
Script pour initialiser les actions de transaction dans la base de données
À exécuter après les migrations Alembic
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.services.transaction_action_service import TransactionActionService
from app.core.config import settings
import asyncio


async def seed_actions():
    """Initialise les actions de transaction"""
    try:
        database_url = str(settings.DATABASE_URL)
        if not database_url:
            print("⚠️  DATABASE_URL not set, skipping action seeding...")
            return
        
        # Create async engine
        engine = create_async_engine(database_url, echo=False)
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        
        async with async_session() as db:
            service = TransactionActionService(db)
            count = await service.seed_actions()
            print(f"✅ {count} transaction actions initialized successfully")
        
        await engine.dispose()
        
    except Exception as e:
        print(f"⚠️  Error seeding transaction actions: {e}")
        print("Actions will be initialized on first use or can be seeded manually via API")
        # Don't fail the startup if seeding fails
        return


if __name__ == "__main__":
    asyncio.run(seed_actions())
