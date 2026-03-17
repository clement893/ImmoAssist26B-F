"""Migration one-shot : delai_acceptation DATE → VARCHAR(100). Lance une fois."""
import asyncio
import asyncpg

async def main():
    conn = await asyncpg.connect(
        host="localhost",
        port=5432,
        user="postgres",
        password="nukleo",
        database="immoassist_db_v2",
    )
    try:
        await conn.execute("""
            ALTER TABLE promesses_achat
            ALTER COLUMN delai_acceptation TYPE VARCHAR(100)
            USING delai_acceptation::text
        """)
        print("Migration OK: delai_acceptation est maintenant VARCHAR(100)")
    except Exception as e:
        print(f"Erreur: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
