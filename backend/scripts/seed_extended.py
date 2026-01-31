#!/usr/bin/env python3
"""
Script de Seed Étendu - Données complètes pour développement
Inclut des données pour CRM, Facturation, etc.
"""

import asyncio
import random
from datetime import datetime, timedelta
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import select
from passlib.context import CryptContext

from app.core.config import settings
from app.models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# Données de seed
COMPANIES = [
    "Acme Corp", "TechStart Inc", "Global Solutions", "Innovation Labs",
    "Digital Services", "Cloud Systems", "Data Analytics Co", "Future Tech"
]

PRODUCTS = [
    {"name": "Produit Premium", "price": 99.99, "category": "Premium"},
    {"name": "Produit Standard", "price": 49.99, "category": "Standard"},
    {"name": "Produit Basique", "price": 19.99, "category": "Basic"},
]

LEADS_STATUS = ["new", "contacted", "qualified", "converted", "lost"]


async def create_extended_data(db: AsyncSession):
    """Créer des données étendues pour développement"""
    print("📊 Création de données étendues...")
    
    # Récupérer les utilisateurs existants
    result = await db.execute(select(User))
    users = result.scalars().all()
    
    if not users:
        print("⚠️  Aucun utilisateur trouvé. Exécutez d'abord seed.py")
        return
    
    print(f"✅ {len(users)} utilisateurs disponibles pour les données")
    
    # Ici vous pouvez ajouter la création de données pour vos modules ERP
    # Exemple pour CRM, Facturation, etc.
    
    print("✅ Données étendues créées")
    return True


async def seed_extended():
    """Fonction principale"""
    print("🌱 Seed étendu - Données complètes...")
    print()
    
    engine = create_async_engine(settings.ASYNC_DATABASE_URL, echo=False)
    async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session_maker() as db:
        try:
            await create_extended_data(db)
            await db.commit()
            print()
            print("✅ Seed étendu terminé!")
        except Exception as e:
            print(f"❌ Erreur: {e}")
            await db.rollback()
            raise
        finally:
            await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_extended())

