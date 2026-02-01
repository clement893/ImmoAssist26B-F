"""
Transaction Actions Endpoints
Endpoints pour gérer les actions de transaction immobilière
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models import User, RealEstateTransaction
from app.schemas.transaction_action import (
    TransactionActionResponse,
    ActionCompletionResponse,
    ExecuteActionRequest,
    ExecuteActionResponse
)
from app.services.transaction_action_service import TransactionActionService
from app.core.logging import logger

router = APIRouter(prefix="/transactions", tags=["transaction-actions"])


@router.get("/{transaction_id}/actions/available", response_model=List[TransactionActionResponse])
async def get_available_actions(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Récupère les actions disponibles pour une transaction
    """
    try:
        # Vérifier que la transaction existe et appartient à l'utilisateur
        transaction_result = await db.execute(
            select(RealEstateTransaction).where(
                and_(
                    RealEstateTransaction.id == transaction_id,
                    RealEstateTransaction.user_id == current_user.id
                )
            )
        )
        transaction = transaction_result.scalar_one_or_none()
        
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction introuvable"
            )
        
        service = TransactionActionService(db)
        actions = await service.get_available_actions(transaction, current_user)
        
        return [TransactionActionResponse.model_validate(action) for action in actions]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting available actions: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la récupération des actions"
        )


@router.get("/{transaction_id}/actions/history", response_model=List[ActionCompletionResponse])
async def get_action_history(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Récupère l'historique des actions d'une transaction
    """
    try:
        # Vérifier que la transaction existe et appartient à l'utilisateur
        transaction_result = await db.execute(
            select(RealEstateTransaction).where(
                and_(
                    RealEstateTransaction.id == transaction_id,
                    RealEstateTransaction.user_id == current_user.id
                )
            )
        )
        transaction = transaction_result.scalar_one_or_none()
        
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction introuvable"
            )
        
        service = TransactionActionService(db)
        history = await service.get_action_history(transaction_id)
        
        # Enrichir avec les noms d'action et d'utilisateur
        completions = []
        for completion in history:
            completion_dict = ActionCompletionResponse.model_validate(completion).model_dump()
            if completion.action:
                completion_dict['action_name'] = completion.action.name
            if completion.user:
                first_name = getattr(completion.user, 'first_name', '') or ''
                last_name = getattr(completion.user, 'last_name', '') or ''
                name = f"{first_name} {last_name}".strip()
                if not name:
                    name = getattr(completion.user, 'email', 'Utilisateur')
                completion_dict['completed_by_name'] = name
            completions.append(completion_dict)
        
        return completions
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting action history: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la récupération de l'historique"
        )


@router.post("/{transaction_id}/actions/execute", response_model=ExecuteActionResponse)
async def execute_action(
    transaction_id: int,
    request_data: ExecuteActionRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Exécute une action sur une transaction
    """
    try:
        # Vérifier que la transaction existe et appartient à l'utilisateur
        transaction_result = await db.execute(
            select(RealEstateTransaction).where(
                and_(
                    RealEstateTransaction.id == transaction_id,
                    RealEstateTransaction.user_id == current_user.id
                )
            )
        )
        transaction = transaction_result.scalar_one_or_none()
        
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction introuvable"
            )
        
        service = TransactionActionService(db)
        
        # Récupérer l'IP et user agent
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
        
        result = await service.execute_action(
            transaction_id=transaction_id,
            action_code=request_data.action_code,
            user=current_user,
            data=request_data.data,
            notes=request_data.notes,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        return ExecuteActionResponse(
            success=True,
            completion_id=result['completion'].id,
            new_status=result['new_status'],
            previous_status=result['previous_status'],
            deadline=result.get('deadline')
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error executing action: {e}", exc_info=True)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de l'exécution de l'action"
        )


@router.post("/actions/seed", status_code=status.HTTP_201_CREATED)
async def seed_actions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Initialise les actions dans la base de données (admin seulement)
    """
    # TODO: Vérifier que l'utilisateur est admin
    # if current_user.role != 'admin':
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
    
    try:
        service = TransactionActionService(db)
        count = await service.seed_actions()
        
        return {"success": True, "count": count, "message": f"{count} actions initialisées"}
        
    except Exception as e:
        logger.error(f"Error seeding actions: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de l'initialisation des actions"
        )
