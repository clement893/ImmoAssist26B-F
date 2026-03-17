"""
Client Invitations Endpoints (Portail client ImmoAssist)
API for broker-to-client invitations
"""

import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models import User, ClientInvitation, PortailTransaction
from app.schemas.client_invitation import (
    ClientInvitationCreate,
    ClientInvitationUpdate,
    ClientInvitationResponse,
    ClientInvitationList,
    ClientInvitationByToken,
    ClientInvitationActivate,
)
from app.services.email_service import EmailService
from app.core.logging import logger

router = APIRouter(prefix="/client-invitations", tags=["portail-client-invitations"])


@router.post("", response_model=ClientInvitationResponse, status_code=status.HTTP_201_CREATED)
async def create_invitation(
    data: ClientInvitationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new client invitation (courtier)."""
    result = await db.execute(
        select(ClientInvitation).where(ClientInvitation.email == data.email)
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cet email est déjà invité",
        )
    token = ClientInvitation.generate_token()
    invitation = ClientInvitation(
        courtier_id=current_user.id,
        prenom=data.prenom,
        nom=data.nom,
        email=data.email,
        telephone=data.telephone,
        type_projet=data.type_projet,
        token=token,
        message_personnalise=data.message_personnalise,
        acces_documents=data.acces_documents,
        acces_messagerie=data.acces_messagerie,
        acces_taches=data.acces_taches,
        acces_calendrier=data.acces_calendrier,
        acces_proprietes=data.acces_proprietes,
        statut="invite",
    )
    db.add(invitation)
    await db.commit()
    await db.refresh(invitation)

    # Envoyer l'email d'invitation via SendGrid (si SENDGRID_API_KEY est configurée)
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
    default_locale = os.getenv("FRONTEND_DEFAULT_LOCALE", "fr")
    invitation_url = f"{frontend_url}/{default_locale}/portail-client/activation/{token}"
    courtier_nom = f"{current_user.first_name or ''} {current_user.last_name or ''}".strip() or current_user.email
    email_service = EmailService()
    if email_service.is_configured():
        try:
            email_service.send_invitation_portail_email(
                to_email=data.email,
                prenom=data.prenom,
                courtier_nom=courtier_nom,
                invitation_url=invitation_url,
                message_personnalise=data.message_personnalise,
            )
            logger.info("Invitation email sent", extra={"to": data.email, "invitation_id": invitation.id})
        except Exception as e:
            logger.warning("Failed to send invitation email (invitation created)", extra={"error": str(e), "to": data.email})
    else:
        logger.info("SendGrid not configured: invitation created but no email sent", extra={"to": data.email})

    return ClientInvitationResponse.model_validate(invitation)


@router.get("", response_model=List[ClientInvitationList])
async def list_invitations(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    statut: Optional[str] = Query(None),
    type_projet: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all invitations for the current courtier."""
    query = (
        select(ClientInvitation)
        .where(ClientInvitation.courtier_id == current_user.id)
    )
    if statut:
        query = query.where(ClientInvitation.statut == statut)
    if type_projet:
        query = query.where(ClientInvitation.type_projet == type_projet)
    query = query.offset(skip).limit(limit).order_by(ClientInvitation.date_invitation.desc())
    result = await db.execute(query)
    invitations = list(result.scalars().all())
    return [ClientInvitationList.model_validate(i) for i in invitations]


@router.get("/by-token/{token}", response_model=ClientInvitationByToken)
async def get_invitation_by_token(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    """Get invitation by token (public, for activation page)."""
    result = await db.execute(
        select(ClientInvitation).where(ClientInvitation.token == token)
    )
    invitation = result.scalar_one_or_none()
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lien d'invitation invalide ou expiré")
    if invitation.statut == "actif":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ce lien a déjà été utilisé. Connectez-vous avec votre mot de passe.",
        )
    return ClientInvitationByToken(
        email=invitation.email,
        prenom=invitation.prenom,
        nom=invitation.nom,
        statut=invitation.statut,
    )


@router.get("/{invitation_id}", response_model=ClientInvitationResponse)
async def get_invitation(
    invitation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get invitation by ID (courtier only)."""
    result = await db.execute(
        select(ClientInvitation)
        .where(
            ClientInvitation.id == invitation_id,
            ClientInvitation.courtier_id == current_user.id,
        )
    )
    invitation = result.scalar_one_or_none()
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation non trouvée")
    return ClientInvitationResponse.model_validate(invitation)


@router.put("/{invitation_id}", response_model=ClientInvitationResponse)
async def update_invitation(
    invitation_id: int,
    data: ClientInvitationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an invitation (courtier only)."""
    result = await db.execute(
        select(ClientInvitation)
        .where(
            ClientInvitation.id == invitation_id,
            ClientInvitation.courtier_id == current_user.id,
        )
    )
    invitation = result.scalar_one_or_none()
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation non trouvée")
    update_dict = data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(invitation, key, value)
    await db.commit()
    await db.refresh(invitation)
    return ClientInvitationResponse.model_validate(invitation)


@router.post("/activate/{token}")
async def activate_invitation(
    token: str,
    data: ClientInvitationActivate,
    db: AsyncSession = Depends(get_db),
):
    """Activate invitation and create client user (public with token)."""
    from datetime import datetime, timezone
    from app.core.security import hash_password

    result = await db.execute(
        select(ClientInvitation).where(ClientInvitation.token == token)
    )
    invitation = result.scalar_one_or_none()
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation invalide")
    if invitation.statut == "actif":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invitation déjà activée")

    # Check if user already exists with this email
    result_user = await db.execute(select(User).where(User.email == invitation.email))
    if result_user.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un compte existe déjà avec cet email",
        )

    user = User(
        email=invitation.email,
        hashed_password=hash_password(data.password),
        first_name=data.first_name or invitation.prenom,
        last_name=data.last_name or invitation.nom,
        client_invitation_id=invitation.id,
        is_active=True,
    )
    db.add(user)
    invitation.statut = "actif"
    invitation.date_activation = datetime.now(timezone.utc)

    # Create a default transaction for the client
    transaction = PortailTransaction(
        client_invitation_id=invitation.id,
        courtier_id=invitation.courtier_id,
        type=invitation.type_projet,
        statut="recherche",
        progression=0,
    )
    db.add(transaction)

    await db.commit()
    return {"message": "Compte activé avec succès"}
