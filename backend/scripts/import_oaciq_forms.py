#!/usr/bin/env python3
"""
Script d'importation des formulaires OACIQ
Importe les formulaires depuis le fichier JSON dans la base de données
"""

import asyncio
import json
import sys
import os
from pathlib import Path

# Ajouter le dossier parent au path pour pouvoir importer les modules du backend
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models.form import Form
from app.core.database import Base


async def import_forms():
    """Importer les formulaires OACIQ depuis le fichier JSON"""
    
    print("🚀 Importation des formulaires OACIQ...")
    
    # Lire le fichier JSON
    json_path = "/home/ubuntu/oaciq_api_import_payload.json"
    print(f"📁 Lecture du fichier: {json_path}")
    
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"❌ Erreur: Fichier {json_path} introuvable")
        return
    except json.JSONDecodeError as e:
        print(f"❌ Erreur de parsing JSON: {e}")
        return
    
    forms_data = data.get('forms', [])
    overwrite_existing = data.get('overwrite_existing', False)
    
    print(f"✅ {len(forms_data)} formulaires chargés")
    print(f"🔄 Mode: {'Mise à jour' if overwrite_existing else 'Création uniquement'}")
    
    # Connexion à la base de données
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ Erreur: DATABASE_URL non défini dans les variables d'environnement")
        return
    
    # Convertir postgresql:// en postgresql+asyncpg://
    if database_url.startswith('postgresql://'):
        database_url = database_url.replace('postgresql://', 'postgresql+asyncpg://', 1)
    elif database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql+asyncpg://', 1)
    
    print(f"🔌 Connexion à la base de données...")
    
    try:
        engine = create_async_engine(database_url, echo=False)
        async_session = sessionmaker(
            engine, class_=AsyncSession, expire_on_commit=False
        )
        
        async with async_session() as session:
            created_count = 0
            updated_count = 0
            error_count = 0
            categories_count = {}
            
            print(f"\n🔄 Traitement des formulaires...\n")
            
            for idx, form_data in enumerate(forms_data, 1):
                code = form_data.get('code', '').strip()
                name = form_data.get('name_fr', form_data.get('name', '')).strip()
                category = form_data.get('category', '').strip()
                
                if not code:
                    print(f"  [{idx}/{len(forms_data)}] ⚠️  Formulaire sans code, ignoré")
                    error_count += 1
                    continue
                
                try:
                    # Vérifier si le formulaire existe déjà
                    result = await session.execute(
                        select(Form).where(Form.code == code)
                    )
                    existing_form = result.scalar_one_or_none()
                    
                    # Préparer les données du formulaire
                    form_dict = {
                        'name': name,
                        'description': form_data.get('objective', '').strip(),
                        'code': code,
                        'category': category,
                        'pdf_url': form_data.get('pdf_url', '').strip() or None,
                        'fields': {},  # Champ JSON vide par défaut
                        'user_id': None,
                        'transaction_id': None,
                    }
                    
                    if existing_form and overwrite_existing:
                        # Mettre à jour le formulaire existant
                        for key, value in form_dict.items():
                            setattr(existing_form, key, value)
                        
                        print(f"  [{idx}/{len(forms_data)}] {code} - {name[:50]}... ✅ Mis à jour")
                        updated_count += 1
                    
                    elif not existing_form:
                        # Créer un nouveau formulaire
                        new_form = Form(**form_dict)
                        session.add(new_form)
                        
                        print(f"  [{idx}/{len(forms_data)}] {code} - {name[:50]}... ✅ Créé")
                        created_count += 1
                    
                    else:
                        # Formulaire existe déjà et overwrite_existing est False
                        print(f"  [{idx}/{len(forms_data)}] {code} - {name[:50]}... ⏭️  Ignoré (existe déjà)")
                        continue
                    
                    # Compter par catégorie
                    categories_count[category] = categories_count.get(category, 0) + 1
                
                except Exception as e:
                    print(f"  [{idx}/{len(forms_data)}] {code} - {name[:50]}... ❌ Erreur: {e}")
                    error_count += 1
                    continue
            
            # Commit de toutes les modifications
            try:
                await session.commit()
                print(f"\n💾 Modifications enregistrées dans la base de données")
            except Exception as e:
                await session.rollback()
                print(f"\n❌ Erreur lors de l'enregistrement: {e}")
                return
            
            # Afficher le résumé
            print(f"\n📊 Résumé:")
            print(f"  - Formulaires créés: {created_count}")
            print(f"  - Formulaires mis à jour: {updated_count}")
            print(f"  - Erreurs: {error_count}")
            print(f"  - Total traité: {created_count + updated_count}")
            
            if categories_count:
                print(f"\n📈 Par catégorie:")
                for cat, count in sorted(categories_count.items()):
                    print(f"  - {cat}: {count}")
            
            print(f"\n✅ Importation terminée avec succès!")
        
        await engine.dispose()
    
    except Exception as e:
        print(f"\n❌ Erreur de connexion à la base de données: {e}")
        return


if __name__ == "__main__":
    asyncio.run(import_forms())
