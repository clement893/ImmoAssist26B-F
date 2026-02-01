"""
Schemas pour les actions de transaction
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class TransactionActionResponse(BaseModel):
    """Schéma de réponse pour une action"""
    id: int
    code: str
    name: str
    description: Optional[str] = None
    from_status: str
    to_status: str
    required_documents: List[str] = Field(default_factory=list)
    required_fields: List[str] = Field(default_factory=list)
    required_roles: List[str] = Field(default_factory=list)
    creates_deadline: bool = False
    deadline_days: Optional[int] = None
    deadline_type: Optional[str] = None
    generates_document: bool = False
    document_template: Optional[str] = None
    sends_notification: bool = True
    notification_recipients: List[str] = Field(default_factory=list)
    order_index: int = 0
    is_active: bool = True
    
    class Config:
        from_attributes = True


class ActionCompletionResponse(BaseModel):
    """Schéma de réponse pour une action complétée"""
    id: int
    transaction_id: int
    action_code: str
    action_name: Optional[str] = None
    completed_by: int
    completed_by_name: Optional[str] = None
    completed_at: datetime
    data: Dict[str, Any] = Field(default_factory=dict)
    notes: Optional[str] = None
    previous_status: str
    new_status: str
    
    class Config:
        from_attributes = True


class ExecuteActionRequest(BaseModel):
    """Schéma de requête pour exécuter une action"""
    action_code: str
    data: Dict[str, Any] = Field(default_factory=dict)
    notes: Optional[str] = None


class ExecuteActionResponse(BaseModel):
    """Schéma de réponse après exécution d'une action"""
    success: bool
    completion_id: int
    new_status: str
    previous_status: str
    deadline: Optional[Dict[str, Any]] = None
