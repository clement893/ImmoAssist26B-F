"""
ERP/Employee Portal Schemas
Pydantic schemas for employee/ERP portal API responses
"""

from datetime import datetime
from typing import Optional, List
from decimal import Decimal

from pydantic import BaseModel, Field, ConfigDict


# Base schemas
class ERPOrderBase(BaseModel):
    """Base order schema for ERP portal"""
    order_number: str
    status: str
    total_amount: Decimal
    order_date: datetime
    client_id: Optional[int] = None
    client_name: Optional[str] = None


class ERPOrderResponse(ERPOrderBase):
    """ERP order response schema"""
    id: int
    order_number: str
    status: str
    total_amount: Decimal
    order_date: datetime
    delivery_date: Optional[datetime] = None
    client_id: Optional[int] = None
    client_name: Optional[str] = None
    client_email: Optional[str] = None
    items_count: int = Field(default=0, description="Number of items in the order")
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ERPOrderListResponse(BaseModel):
    """List of ERP orders"""
    items: List[ERPOrderResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ERPInventoryProductBase(BaseModel):
    """Base inventory product schema"""
    sku: str
    name: str
    description: Optional[str] = None
    price: Decimal
    stock_quantity: int


class ERPInventoryProductResponse(ERPInventoryProductBase):
    """ERP inventory product response schema"""
    id: int
    sku: str
    name: str
    description: Optional[str] = None
    price: Decimal
    stock_quantity: int
    low_stock_threshold: int = Field(default=10)
    category: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ERPInventoryProductListResponse(BaseModel):
    """List of inventory products"""
    items: List[ERPInventoryProductResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ERPInventoryMovementBase(BaseModel):
    """Base inventory movement schema"""
    movement_type: str  # 'in', 'out', 'adjustment'
    quantity: int
    reference_type: Optional[str] = None  # 'order', 'invoice', etc.
    reference_id: Optional[int] = None


class ERPInventoryMovementResponse(ERPInventoryMovementBase):
    """ERP inventory movement response schema"""
    id: int
    product_id: int
    product_name: Optional[str] = None
    movement_type: str
    quantity: int
    reference_type: Optional[str] = None
    reference_id: Optional[int] = None
    notes: Optional[str] = None
    created_by_id: Optional[int] = None
    created_by_name: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ERPInventoryMovementListResponse(BaseModel):
    """List of inventory movements"""
    items: List[ERPInventoryMovementResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ERPClientBase(BaseModel):
    """Base client schema for ERP"""
    name: str
    email: str
    phone: Optional[str] = None


class ERPClientResponse(ERPClientBase):
    """ERP client response schema"""
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    company_name: Optional[str] = None
    address: Optional[str] = None
    is_active: bool = True
    total_orders: int = Field(default=0)
    total_spent: Decimal = Field(default=Decimal("0.00"))
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ERPClientListResponse(BaseModel):
    """List of ERP clients"""
    items: List[ERPClientResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ERPInvoiceBase(BaseModel):
    """Base invoice schema for ERP"""
    invoice_number: str
    amount: Decimal
    currency: str = "USD"
    status: str
    invoice_date: datetime
    client_id: Optional[int] = None
    client_name: Optional[str] = None


class ERPInvoiceResponse(ERPInvoiceBase):
    """ERP invoice response schema"""
    id: int
    invoice_number: str
    amount: Decimal
    amount_paid: Decimal = Field(default=Decimal("0.00"))
    currency: str = "USD"
    status: str
    invoice_date: datetime
    due_date: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    client_id: Optional[int] = None
    client_name: Optional[str] = None
    client_email: Optional[str] = None
    pdf_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ERPInvoiceListResponse(BaseModel):
    """List of ERP invoices"""
    items: List[ERPInvoiceResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ERPReportBase(BaseModel):
    """Base report schema"""
    report_type: str
    period_start: datetime
    period_end: datetime
    filters: Optional[dict] = None


class ERPReportResponse(ERPReportBase):
    """ERP report response schema"""
    id: int
    report_type: str
    title: str
    period_start: datetime
    period_end: datetime
    data: dict
    filters: Optional[dict] = None
    generated_by_id: Optional[int] = None
    generated_by_name: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ERPReportListResponse(BaseModel):
    """List of ERP reports"""
    items: List[ERPReportResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ERPDashboardStats(BaseModel):
    """ERP dashboard statistics"""
    total_orders: int = 0
    pending_orders: int = 0
    completed_orders: int = 0
    total_invoices: int = 0
    pending_invoices: int = 0
    paid_invoices: int = 0
    total_clients: int = 0
    active_clients: int = 0
    total_projects: int = 0
    active_projects: int = 0
    total_products: int = 0
    low_stock_products: int = 0
    total_revenue: Decimal = Field(default=Decimal("0.00"))
    pending_revenue: Decimal = Field(default=Decimal("0.00"))
    department_stats: Optional[dict] = None

