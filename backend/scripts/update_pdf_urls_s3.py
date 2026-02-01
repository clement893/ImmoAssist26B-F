#!/usr/bin/env python3
"""
Script pour mettre à jour les URLs des PDF OACIQ vers S3
"""

import asyncio
import sys
import os
from pathlib import Path

# Ajouter le dossier parent au path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models.form import Form


# Mapping des codes FR vers EN
CODE_MAPPING = {
    'DR': 'RC', 'PA': 'PP', 'CCV': 'EBCS', 'MO': 'AM', 'DVD': 'DSD',
    'EAU': 'DW', 'EXP': 'AE', 'DV': 'DS', 'CP': 'CP', 'AF': 'AF',
    'AR': 'AR', 'AHQ': 'ASQ', 'CCA': 'EBCP', 'CCD': 'EBCR', 'CCL': 'EBCRL',
    'PAD': 'PPCD', 'PAI': 'PPCI', 'PAM': 'PPMH', 'AVIS-CCA': 'NOTICE-EBCNA',
    'AVIS-CVAN': 'NOTICE-SVBUB', 'AVIS-DAVP': 'NOTICE-DARP',
    'BO': 'SB', 'AS': 'NFC', 'D': 'RCOM', 'AG': 'AG', 'AL': 'AL',
    'CM': 'CDI', 'CVHP': 'CVPH', 'DH': 'IRM', 'DRCOP': 'IRCS',
    'LD': 'DTL', 'PL': 'PRL', 'PSL': 'PSL', 'ML': 'ARL', 'VI': 'VI',
    'CCG': 'EBCS', 'CCC': 'EBCCL', 'PAG': 'PP', 'PLC': 'PCL',
    'CCSL': 'EBCSL', 'CPC': 'CPCL', 'CPL': 'CPRL',
    'BCL': 'BCL', 'BCM': 'BCM', 'CNED': 'NEBCD', 'CNEI': 'NEBCI', 'CNEV': 'NEBCS',
    'CCADI': 'EBCPCD', 'CCADU': 'EBCPCI', 'CCDE': 'EBCSCD', 'CCDNE': 'NEBSCD',
    'CCIE': 'EBCSCI', 'CCINE': 'NEBSCI', 'CCVE': 'EBCS', 'CCVNE': 'NEBS',
    'CCM': 'EBCSMH',
    # Curateur public
    'ACD': 'ACD', 'ACI': 'ACI', 'PAC': 'PAC', 'BOCP': 'BOCP', 'CPCP': 'CPCP', 'MOCP': 'MOCP'
}

# URL de base S3
S3_BASE_URL = "https://immoassist.s3.us-east-2.amazonaws.com/formulaires_oaciq_pdf"


async def update_pdf_urls():
    """Mettre à jour les URLs des PDF vers S3"""
    
    print("🚀 Mise à jour des URLs PDF vers S3...")
    
    # Connexion à la base de données
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ Erreur: DATABASE_URL non défini")
        return
    
    # Convertir en async
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
            # Récupérer tous les formulaires OACIQ
            result = await session.execute(
                select(Form).where(Form.code.isnot(None))
            )
            forms = result.scalars().all()
            
            print(f"✅ {len(forms)} formulaires trouvés\n")
            print(f"🔄 Mise à jour des URLs...\n")
            
            updated_count = 0
            error_count = 0
            
            for idx, form in enumerate(forms, 1):
                code = form.code
                
                try:
                    # Construire les URLs S3
                    # URL française
                    pdf_url_fr = f"{S3_BASE_URL}/francais/{code}.pdf"
                    
                    # URL anglaise (utiliser le mapping)
                    code_en = CODE_MAPPING.get(code, code)
                    pdf_url_en = f"{S3_BASE_URL}/anglais/{code_en}.pdf"
                    
                    # Mettre à jour le formulaire
                    # On stocke l'URL française par défaut dans pdf_url
                    form.pdf_url = pdf_url_fr
                    
                    print(f"  [{idx}/{len(forms)}] {code} - {form.name[:50]}...")
                    print(f"      FR: {pdf_url_fr}")
                    print(f"      EN: {pdf_url_en}")
                    
                    updated_count += 1
                
                except Exception as e:
                    print(f"  [{idx}/{len(forms)}] {code} - ❌ Erreur: {e}")
                    error_count += 1
                    continue
            
            # Commit des modifications
            try:
                await session.commit()
                print(f"\n💾 Modifications enregistrées")
            except Exception as e:
                await session.rollback()
                print(f"\n❌ Erreur lors de l'enregistrement: {e}")
                return
            
            # Résumé
            print(f"\n📊 Résumé:")
            print(f"  - Formulaires mis à jour: {updated_count}")
            print(f"  - Erreurs: {error_count}")
            
            print(f"\n✅ Mise à jour terminée avec succès!")
        
        await engine.dispose()
    
    except Exception as e:
        print(f"\n❌ Erreur: {e}")
        return


if __name__ == "__main__":
    asyncio.run(update_pdf_urls())
