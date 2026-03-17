"""
Strategy Pattern Implementation

Provides strategy classes for implementing different algorithms/interfaces.
Supports runtime algorithm selection and extensibility.

@example
```python
from app.core.patterns.strategy import PaymentStrategy, StripeStrategy, PayPalStrategy

# Use different payment strategies
stripe_strategy = StripeStrategy()
paypal_strategy = PayPalStrategy()

# Process payment with selected strategy
payment_processor = PaymentProcessor(stripe_strategy)
payment_processor.process_payment(amount=100, currency="USD")
```
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional


class PaymentStrategy(ABC):
    """Base strategy for payment processing"""
    
    @abstractmethod
    def process_payment(self, amount: float, currency: str, **kwargs) -> Dict[str, Any]:
        """Process a payment"""
        pass
    
    @abstractmethod
    def refund_payment(self, transaction_id: str, amount: Optional[float] = None) -> Dict[str, Any]:
        """Refund a payment"""
        pass


class StripeStrategy(PaymentStrategy):
    """Stripe payment strategy"""
    
    def process_payment(self, amount: float, currency: str, **kwargs) -> Dict[str, Any]:
        """
        Process payment using Stripe.
        
        @param amount - Payment amount
        @param currency - Currency code
        @param kwargs - Additional Stripe parameters
        @returns Payment result dictionary
        """
        import stripe
        from app.core.config import settings
        
        stripe.api_key = settings.STRIPE_SECRET_KEY
        
        try:
            intent = stripe.PaymentIntent.create(
                amount=int(amount * 100),  # Convert to cents
                currency=currency.lower(),
                **kwargs
            )
            
            return {
                "success": True,
                "transaction_id": intent.id,
                "status": intent.status,
                "amount": amount,
                "currency": currency,
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
            }
    
    def refund_payment(self, transaction_id: str, amount: Optional[float] = None) -> Dict[str, Any]:
        """Refund payment using Stripe"""
        import stripe
        from app.core.config import settings
        
        stripe.api_key = settings.STRIPE_SECRET_KEY
        
        try:
            refund_params = {"payment_intent": transaction_id}
            if amount:
                refund_params["amount"] = int(amount * 100)
            
            refund = stripe.Refund.create(**refund_params)
            
            return {
                "success": True,
                "refund_id": refund.id,
                "amount": refund.amount / 100,
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
            }


class PayPalStrategy(PaymentStrategy):
    """PayPal payment strategy (placeholder for future implementation)"""
    
    def process_payment(self, amount: float, currency: str, **kwargs) -> Dict[str, Any]:
        """Process payment using PayPal"""
        # Placeholder implementation
        return {
            "success": False,
            "error": "PayPal integration not yet implemented",
        }
    
    def refund_payment(self, transaction_id: str, amount: Optional[float] = None) -> Dict[str, Any]:
        """Refund payment using PayPal"""
        return {
            "success": False,
            "error": "PayPal integration not yet implemented",
        }


class PaymentProcessor:
    """Payment processor using strategy pattern"""
    
    def __init__(self, strategy: PaymentStrategy):
        """
        Initialize payment processor with a strategy.
        
        @param strategy - Payment strategy to use
        """
        self.strategy = strategy
    
    def process_payment(self, amount: float, currency: str, **kwargs) -> Dict[str, Any]:
        """Process payment using the configured strategy"""
        return self.strategy.process_payment(amount, currency, **kwargs)
    
    def refund_payment(self, transaction_id: str, amount: Optional[float] = None) -> Dict[str, Any]:
        """Refund payment using the configured strategy"""
        return self.strategy.refund_payment(transaction_id, amount)
    
    def set_strategy(self, strategy: PaymentStrategy):
        """Change payment strategy at runtime"""
        self.strategy = strategy


class EmailStrategy(ABC):
    """Base strategy for email sending"""
    
    @abstractmethod
    def send_email(
        self,
        to: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send an email"""
        pass


class SendGridStrategy(EmailStrategy):
    """SendGrid email strategy"""
    
    def send_email(
        self,
        to: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send email using SendGrid"""
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail, Email, To, Content
        from app.core.config import settings
        
        try:
            sg = SendGridAPIClient(api_key=settings.SENDGRID_API_KEY)
            
            message = Mail(
                from_email=Email(settings.SENDGRID_FROM_EMAIL, settings.SENDGRID_FROM_NAME),
                to_emails=To(to),
                subject=subject,
                plain_text_content=Content("text/plain", body),
            )
            
            if html_body:
                message.add_content(Content("text/html", html_body))
            
            response = sg.send(message)
            
            return {
                "success": True,
                "status_code": response.status_code,
                "message_id": response.headers.get("X-Message-Id"),
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
            }

