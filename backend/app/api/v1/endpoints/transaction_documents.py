"""
Transaction Documents Endpoints (Portail client ImmoAssist)
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models import User, PortailTransaction, TransactionDocument
from app.schemas.transaction_document import TransactionDocumentResponse

router = APIRouter(prefix="/portail/transaction-documents", tags=["portail-documents"])


async def _can_access_transaction(db: AsyncSession, transaction_id: int, user: User) -> PortailTransaction | None:
    result = await db.execute(
        select(PortailTransaction).where(PortailTransaction.id == transaction_id)
    )
    t = result.scalar_one_or_none()
    if not t:
        return None
    if t.courtier_id == user.id:
        return t
    if user.client_invitation_id and t.client_invitation_id == user.client_invitation_id:
        return t
    return None


@router.post("", response_model=TransactionDocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    transaction_id: int = Form(...),
    categorie: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a document for a transaction (courtier)."""
    transaction = await _can_access_transaction(db, transaction_id, current_user)
    if not transaction or transaction.courtier_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    content = await file.read()
    size_kb = len(content) / 1024
    # Store URL placeholder (in production: upload to S3 and set url)
    url = f"/uploads/portail/{transaction_id}/{file.filename}"
    ext = (file.filename or "").split(".")[-1].lower() if file.filename else "bin"
    doc = TransactionDocument(
        transaction_id=transaction_id,
        nom=file.filename or "document",
        type=ext,
        categorie=categorie,
        taille=f"{size_kb:.1f} KB",
        url=url,
        partage_par_id=current_user.id,
        nouveau=True,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return TransactionDocumentResponse.model_validate(doc)


@router.get("/transaction/{transaction_id}", response_model=List[TransactionDocumentResponse])
async def list_documents(
    transaction_id: int,
    categorie: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List documents for a transaction (courtier or client)."""
    transaction = await _can_access_transaction(db, transaction_id, current_user)
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction non trouvée")
    query = (
        select(TransactionDocument)
        .where(TransactionDocument.transaction_id == transaction_id)
    )
    if categorie:
        query = query.where(TransactionDocument.categorie == categorie)
    query = query.order_by(TransactionDocument.date_partage.desc())
    result = await db.execute(query)
    docs = list(result.scalars().all())
    return [TransactionDocumentResponse.model_validate(d) for d in docs]
