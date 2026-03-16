"""Database tables router - GET /api/tables."""

from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import User, Transaction, PromesseAchat, LeaConversation

router = APIRouter()

TABLE_CONFIG = [
    ("users", User, ["id", "full_name", "permis_number"]),
    ("transactions", Transaction, ["id", "property_address", "sellers", "buyers", "offered_price", "transaction_type", "created_at"]),
    ("promesses_achat", PromesseAchat, ["id", "transaction_id", "acheteurs", "vendeurs", "acompte", "status", "created_at"]),
    ("lea_conversations", LeaConversation, ["id", "session_id", "user_id", "created_at"]),
]


def _row_to_dict(row, columns):
    """Convert SQLAlchemy row to dict for JSON."""
    d = {}
    for col in columns:
        val = getattr(row, col, None)
        if hasattr(val, "isoformat"):
            val = val.isoformat()
        d[col] = val
    return d


@router.get("/tables")
async def get_tables(db: AsyncSession = Depends(get_db)):
    """
    List Léa API tables with row counts and sample data (last 5 rows each).
    """
    result = {"tables": [], "error": None}
    try:
        for table_name, model, columns in TABLE_CONFIG:
            try:
                count_result = await db.execute(select(func.count()).select_from(model))
                count = count_result.scalar() or 0
                order_col = getattr(model, "created_at", None) or getattr(model, "id", None)
                if order_col:
                    rows_result = await db.execute(select(model).order_by(order_col.desc()).limit(5))
                else:
                    rows_result = await db.execute(select(model).limit(5))
                rows = rows_result.scalars().all()
                sample = [_row_to_dict(r, columns) for r in rows]
                result["tables"].append({
                    "name": table_name,
                    "count": count,
                    "columns": columns,
                    "sample": sample,
                })
            except Exception as e:
                result["tables"].append({
                    "name": table_name,
                    "count": 0,
                    "columns": columns,
                    "sample": [],
                    "error": str(e),
                })
    except Exception as e:
        result["error"] = str(e)
    return result
