"""
Client Portal Schemas
Pydantic schemas for client portal API responses
"""

from datetime import datetime
from typing import Optional, List
from decimal import Decimal

from pydantic import BaseModel, Field, ConfigDict


# Base schemas
class ClientOrderBase(BaseModel):
    """Base order schema for client portal"""
    order_number: str
    status: str
    total_amount: Decimal
    order_date: datetime


class ClientOrderResponse(ClientOrderBase):
    """Client order response schema"""
    id: int
    order_number: str
    status: str
    total_amount: Decimal
    order_date: datetime
    delivery_date: Optional[datetime] = None
    items_count: int = Field(default=0, description="Number of items in the order")
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ClientOrderListResponse(BaseModel):
    """List of client orders"""
    items: List[ClientOrderResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ClientInvoiceBase(BaseModel):
    """Base invoice schema for client portal"""
    invoice_number: str
    amount: Decimal
    currency: str = "USD"
    status: str
    invoice_date: datetime
    due_date: Optional[datetime] = None


class ClientInvoiceResponse(ClientInvoiceBase):
    """Client invoice response schema"""
    id: int
    invoice_number: str
    amount: Decimal
    amount_paid: Decimal = Field(default=Decimal("0.00"))
    currency: str = "USD"
    status: str
    invoice_date: datetime
    due_date: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    pdf_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ClientInvoiceListResponse(BaseModel):
    """List of client invoices"""
    items: List[ClientInvoiceResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ClientProjectBase(BaseModel):
    """Base project schema for client portal"""
    name: str
    description: Optional[str] = None
    status: str


class ClientProjectResponse(ClientProjectBase):
    """Client project response schema"""
    id: int
    name: str
    description: Optional[str] = None
    status: str
    progress: int = Field(default=0, ge=0, le=100, description="Project progress percentage")
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ClientProjectListResponse(BaseModel):
    """List of client projects"""
    items: List[ClientProjectResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ClientTicketBase(BaseModel):
    """Base support ticket schema for client portal"""
    subject: str
    description: str
    priority: str = "medium"
    status: str = "open"


class ClientTicketResponse(ClientTicketBase):
    """Client support ticket response schema"""
    id: int
    subject: str
    description: Optional[str] = None  # First message content
    category: str
    priority: str
    status: str
    created_at: datetime
    updated_at: datetime
    last_reply_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class ClientTicketCreate(ClientTicketBase):
    """Schema for creating a new support ticket"""
    subject: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10)
    priority: str = Field(default="medium", pattern="^(low|medium|high|urgent)$")
    category: str = Field(default="general", pattern="^(technical|billing|feature|general|bug)$")


class ClientTicketListResponse(BaseModel):
    """List of client support tickets"""
    items: List[ClientTicketResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ClientDashboardStats(BaseModel):
    """Client dashboard statistics"""
    total_orders: int = 0
    pending_orders: int = 0
    completed_orders: int = 0
    total_invoices: int = 0
    pending_invoices: int = 0
    paid_invoices: int = 0
    total_projects: int = 0
    active_projects: int = 0
    open_tickets: int = 0
    total_spent: Decimal = Field(default=Decimal("0.00"))
    pending_amount: Decimal = Field(default=Decimal("0.00"))

