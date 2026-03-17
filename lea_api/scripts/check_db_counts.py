"""Check row counts in transactions and promesses_achat."""
import asyncio
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text
from app.db.database import engine

async def main():
    async with engine.connect() as conn:
        for name, table in [("transactions", "transactions"), ("promesses_achat", "promesses_achat")]:
            r = await conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
            count = r.scalar_one()
            print(f"{name}: {count}")

if __name__ == "__main__":
    asyncio.run(main())
