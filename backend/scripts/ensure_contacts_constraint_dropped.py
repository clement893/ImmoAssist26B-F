#!/usr/bin/env python3
"""
Applique le correctif contrainte unique sur real_estate_contacts.user_id.
Exécuté au démarrage (entrypoint.sh) pour que plusieurs contacts par utilisateur
(vendeurs/acheteurs) fonctionnent même si la migration 050 n'a pas pu s'exécuter.
Idempotent : sans effet si la contrainte est déjà supprimée.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from sqlalchemy import create_engine, text
    from app.core.config import settings
except Exception as e:
    print(f"⚠️  ensure_contacts_constraint_dropped: skip ({e})", file=sys.stderr)
    sys.exit(0)


def main() -> None:
    try:
        database_url = str(settings.DATABASE_URL)
        if "postgresql+asyncpg://" in database_url:
            database_url = database_url.replace("postgresql+asyncpg://", "postgresql+psycopg2://")
        elif "postgresql://" in database_url and "+" not in database_url:
            database_url = database_url.replace("postgresql://", "postgresql+psycopg2://")

        engine = create_engine(database_url)
        with engine.begin() as conn:
            conn.execute(text(
                "ALTER TABLE real_estate_contacts DROP CONSTRAINT IF EXISTS uq_real_estate_contacts_user_id"
            ))
            conn.execute(text(
                "ALTER TABLE real_estate_contacts DROP CONSTRAINT IF EXISTS ix_real_estate_contacts_user_id"
            ))
            conn.execute(text("DROP INDEX IF EXISTS ix_real_estate_contacts_user_id"))
        print("✅ Contrainte unique real_estate_contacts.user_id vérifiée (plusieurs contacts par user OK)")
    except Exception as e:
        print(f"⚠️  ensure_contacts_constraint_dropped: {e}", file=sys.stderr)
        sys.exit(0)


if __name__ == "__main__":
    main()
