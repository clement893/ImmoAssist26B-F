"""Empty transactions and promesses_achat tables. Respects FK constraints."""

import asyncio
import sys
from pathlib import Path

# Add parent to path for app imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text
from app.db.database import engine


async def main():
    async with engine.begin() as conn:
        # 1. Nullify FKs in lea_conversations
        await conn.execute(text(
            "UPDATE lea_conversations SET transaction_id = NULL, promesse_achat_id = NULL"
        ))
        # 2. Delete promesses_achat (references transactions)
        r2 = await conn.execute(text("DELETE FROM promesses_achat"))
        pa_deleted = r2.rowcount
        # 3. Delete transactions
        r3 = await conn.execute(text("DELETE FROM transactions"))
        tx_deleted = r3.rowcount
    print(f"Deleted {tx_deleted} transactions and {pa_deleted} promesses d'achat.")


if __name__ == "__main__":
    asyncio.run(main())
