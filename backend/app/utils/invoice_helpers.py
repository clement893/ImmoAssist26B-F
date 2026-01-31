"""
Invoice Helper Utilities
Shared utilities for invoice data conversion
"""

from app.models.invoice import Invoice
from app.schemas.erp import ERPInvoiceResponse


def convert_invoice_to_erp_response(invoice: Invoice) -> dict:
    """
    Convert Invoice model to ERP invoice response dictionary
    
    Args:
        invoice: Invoice model instance with user relationship loaded
        
    Returns:
        Dictionary ready for ERPInvoiceResponse.model_validate()
    """
    return {
        "id": invoice.id,
        "invoice_number": invoice.invoice_number or f"INV-{invoice.id}",
        "amount": str(invoice.amount_due),
        "amount_paid": str(invoice.amount_paid),
        "currency": invoice.currency,
        "status": invoice.status.value if hasattr(invoice.status, 'value') else str(invoice.status),
        "invoice_date": invoice.created_at,  # Use created_at as invoice date
        "due_date": invoice.due_date,
        "paid_at": invoice.paid_at,
        "client_id": invoice.user_id,
        "client_name": (
            f"{invoice.user.first_name or ''} {invoice.user.last_name or ''}".strip()
            if invoice.user else None
        ),
        "client_email": invoice.user.email if invoice.user else None,
        "pdf_url": invoice.invoice_pdf_url or invoice.hosted_invoice_url,
        "created_at": invoice.created_at,
        "updated_at": invoice.updated_at,
    }

