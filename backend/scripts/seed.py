#!/usr/bin/env python3
"""
Script de Seed de Données pour Développement
Génère des données de test pour le développement local
"""

import asyncio
import random
from datetime import datetime, timedelta
from pathlib import Path
import sys

# Ajouter le répertoire parent au path pour les imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import select
from passlib.context import CryptContext

from app.core.config import settings
from app.core.database import Base
from app.models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def create_users(db: AsyncSession, count: int = 10):
    """Créer des utilisateurs de test"""
    print(f"📝 Création de {count} utilisateurs...")
    
    users_data = [
        {
            "email": "admin@example.com",
            "hashed_password": pwd_context.hash("admin123"),
            "username": "admin",
            "first_name": "Admin",
            "last_name": "User",
            "is_active": True,
            "is_superuser": True,
        },
        {
            "email": "user@example.com",
            "hashed_password": pwd_context.hash("user123"),
            "username": "user",
            "first_name": "John",
            "last_name": "Doe",
            "is_active": True,
            "is_superuser": False,
        },
    ]
    
    # Générer des utilisateurs aléatoires
    first_names = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Henry", "Ivy", "Jack"]
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"]
    
    for i in range(count - 2):
        first_name = random.choice(first_names)
        last_name = random.choice(last_names)
        users_data.append({
            "email": f"{first_name.lower()}.{last_name.lower()}@example.com",
            "hashed_password": pwd_context.hash("password123"),
            "username": f"{first_name.lower()}{last_name.lower()}{i}",
            "first_name": first_name,
            "last_name": last_name,
            "is_active": random.choice([True, True, True, False]),  # 75% actifs
            "is_superuser": False,
        })
    
    users = []
    for user_data in users_data:
        # Vérifier si l'utilisateur existe déjà
        result = await db.execute(select(User).filter(User.email == user_data["email"]))
        existing_user = result.scalar_one_or_none()
        
        if not existing_user:
            user = User(**user_data)
            db.add(user)
            users.append(user)
        else:
            users.append(existing_user)
    
    await db.commit()
    
    for user in users:
        await db.refresh(user)
    
    print(f"✅ {len(users)} utilisateurs créés/vérifiés")
    return users


async def seed_database():
    """Fonction principale de seed"""
    print("🌱 Démarrage du seed de données...")
    print(f"   Database: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else 'local'}")
    print()
    
    # Créer l'engine
    engine = create_async_engine(settings.ASYNC_DATABASE_URL, echo=False)
    async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session_maker() as db:
        try:
            # Créer les utilisateurs
            users = await create_users(db, count=10)
            
            print()
            print("✅ Seed terminé avec succès!")
            print()
            print("📋 Comptes de test créés:")
            print("   Admin: admin@example.com / admin123")
            print("   User:  user@example.com / user123")
            print()
            
        except Exception as e:
            print(f"❌ Erreur lors du seed: {e}")
            await db.rollback()
            raise
        finally:
            await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_database())

