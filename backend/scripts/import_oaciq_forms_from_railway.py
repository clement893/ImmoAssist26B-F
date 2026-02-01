"""
Script d'importation des formulaires OACIQ depuis Railway
Ce script récupère tous les formulaires de la base Railway et les importe dans la base locale
"""

import asyncio
import os
import sys
from datetime import datetime
from typing import List, Optional

# Ajouter le chemin du projet au PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.core.logging import logger


# Configuration Railway (à remplacer par vos vraies credentials)
RAILWAY_DB_URL = os.getenv(
    'RAILWAY_DB_URL',
    'postgresql://postgres:knOTGbtTMRlrFNqFvmAIsNszFYfwHfyq@gondola.proxy.rlwy.net:57882/railway'
)

# Configuration base locale (utilise la config du projet)
LOCAL_DB_URL = str(settings.DATABASE_URL)


def extract_short_name(full_name: str) -> str:
    """Extraire le nom court du formulaire"""
    # Ex: "Promesse d'achat – Immeuble principalement résidentiel" → "Promesse d'achat"
    return full_name.split('–')[0].strip() if '–' in full_name else full_name.split('-')[0].strip()


def extract_version(name: str) -> str:
    """Extraire la version du formulaire"""
    import re
    match = re.search(r'\((\d{4})\)', name)
    return match.group(1) if match else '2022'


def generate_description(code: str, name: str) -> str:
    """Générer une description pour le formulaire"""
    descriptions = {
        'PA': "Formulaire utilisé pour soumettre une offre d'achat sur un immeuble résidentiel.",
        'CCVE': "Contrat par lequel un courtier s'engage de façon exclusive à vendre un immeuble.",
        'CCEA': "Contrat par lequel un courtier s'engage de façon exclusive à aider un acheteur.",
        'DV': "Déclarations obligatoires du vendeur sur l'état de l'immeuble.",
        'CP': "Formulaire utilisé pour proposer des modifications à une promesse d'achat.",
        'AF': "Annexe détaillant les conditions de financement hypothécaire.",
        'DR': "Annexe précisant les déboursés et la rétribution du courtier.",
        'AG': "Annexe générale pour ajouter des clauses supplémentaires.",
        'MO': "Formulaire de modification d'une promesse d'achat.",
        'PAC': "Promesse d'achat pour le Curateur public.",
        'MOCP': "Modification de promesse d'achat pour le Curateur public.",
        'BOCP': "Bon de commande pour le Curateur public.",
        'ACD': "Annexe de conditions de vente pour le Curateur public.",
        'ACI': "Annexe d'informations complémentaires pour le Curateur public.",
    }
    
    return descriptions.get(code, f"Formulaire OACIQ: {name}")


async def import_forms_from_railway():
    """Importe les formulaires depuis Railway vers la base locale"""
    logger.info('📥 Début de l\'importation des formulaires OACIQ depuis Railway\n')

    # Connexion à Railway (synchrone pour la lecture)
    railway_engine = create_engine(RAILWAY_DB_URL, echo=False)
    
    # Connexion à la base locale (asynchrone)
    local_engine = create_async_engine(LOCAL_DB_URL, echo=False)
    async_session = sessionmaker(local_engine, class_=AsyncSession, expire_on_commit=False)

    try:
        # Récupérer tous les formulaires de Railway
        logger.info('🔍 Connexion à Railway PostgreSQL...')
        with railway_engine.connect() as conn:
            result = conn.execute(text("""
                SELECT 
                    id, code, name, category, pdf_url, fields, 
                    created_at, updated_at
                FROM forms
                WHERE code IS NOT NULL
                ORDER BY code
            """))
            
            railway_forms = result.fetchall()
            logger.info(f'✅ {len(railway_forms)} formulaires trouvés dans Railway\n')

        if not railway_forms:
            logger.warning('⚠️  Aucun formulaire trouvé dans Railway')
            return

        imported = 0
        updated = 0
        skipped = 0
        errors = []

        async with async_session() as session:
            for row in railway_forms:
                try:
                    form_id, code, name, category, pdf_url, fields, created_at, updated_at = row
                    
                    if not code:
                        skipped += 1
                        logger.warning(f'   ⚠️  Formulaire sans code ignoré: {name}')
                        continue

                    # Vérifier si le formulaire existe déjà
                    result = await session.execute(
                        text("SELECT id FROM forms WHERE code = :code"),
                        {"code": code}
                    )
                    existing = result.scalar_one_or_none()

                    form_data = {
                        "code": code,
                        "name": name,
                        "name_short": extract_short_name(name),
                        "category": category or "obligatoire",
                        "pdf_url": pdf_url,
                        "fields": fields or {},
                        "fields_extracted_at": datetime.now() if fields else None,
                        "fields_validated": False,
                        "version": extract_version(name),
                        "description": generate_description(code, name),
                        "is_active": True,
                        "requires_signature": True,
                        "can_be_amended": not code.startswith('MO'),
                        "updated_at": datetime.now(),
                    }

                    if existing:
                        # Mettre à jour
                        await session.execute(
                            text("""
                                UPDATE forms 
                                SET name = :name,
                                    category = :category,
                                    pdf_url = :pdf_url,
                                    fields = :fields,
                                    updated_at = :updated_at
                                WHERE code = :code
                            """),
                            {
                                "code": code,
                                "name": form_data["name"],
                                "category": form_data["category"],
                                "pdf_url": form_data["pdf_url"],
                                "fields": form_data["fields"],
                                "updated_at": form_data["updated_at"],
                            }
                        )
                        updated += 1
                        logger.info(f'   ✅ [{code}] {name[:50]}... - MIS À JOUR')
                    else:
                        # Insérer
                        await session.execute(
                            text("""
                                INSERT INTO forms (
                                    code, name, category, pdf_url, fields,
                                    created_at, updated_at, is_active,
                                    requires_signature, can_be_amended
                                )
                                VALUES (
                                    :code, :name, :category, :pdf_url, :fields,
                                    :created_at, :updated_at, :is_active,
                                    :requires_signature, :can_be_amended
                                )
                            """),
                            {
                                "code": form_data["code"],
                                "name": form_data["name"],
                                "category": form_data["category"],
                                "pdf_url": form_data["pdf_url"],
                                "fields": form_data["fields"],
                                "created_at": datetime.now(),
                                "updated_at": form_data["updated_at"],
                                "is_active": form_data["is_active"],
                                "requires_signature": form_data["requires_signature"],
                                "can_be_amended": form_data["can_be_amended"],
                            }
                        )
                        imported += 1
                        logger.info(f'   ✅ [{code}] {name[:50]}... - IMPORTÉ')

                    await session.commit()

                except Exception as e:
                    await session.rollback()
                    error_msg = f"[{code}] Erreur: {str(e)}"
                    errors.append(error_msg)
                    skipped += 1
                    logger.error(f'   ❌ {error_msg}')

        # Résumé
        logger.info(f'\n📊 Résumé de l\'importation:')
        logger.info(f'   - Nouveaux formulaires importés: {imported}')
        logger.info(f'   - Formulaires mis à jour: {updated}')
        logger.info(f'   - Formulaires ignorés (erreurs): {skipped}')
        logger.info(f'   - Total traité: {len(railway_forms)}')

        if errors:
            logger.warning(f'\n⚠️  Erreurs rencontrées ({len(errors)}):')
            for error in errors[:10]:  # Afficher les 10 premières erreurs
                logger.warning(f'   {error}')

    except Exception as e:
        logger.error(f'❌ Erreur lors de l\'importation: {e}', exc_info=True)
        raise
    finally:
        railway_engine.dispose()
        await local_engine.dispose()
        logger.info('\n✅ Importation terminée')


if __name__ == '__main__':
    asyncio.run(import_forms_from_railway())
