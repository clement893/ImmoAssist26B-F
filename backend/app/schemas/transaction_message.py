"""
Transaction Message Schemas (Portail client ImmoAssist)
"""

from datetime import datetime
from pydantic import BaseModel


class TransactionMessageCreate(BaseModel):
    """Schema for sending a message"""
    transaction_id: int
    message: str


class TransactionMessageResponse(BaseModel):
    """Schema for transaction message response"""
    id: int
    transaction_id: int
    expediteur_id: int
    message: str
    date_envoi: datetime
    lu: bool

    model_config = {"from_attributes": True}
