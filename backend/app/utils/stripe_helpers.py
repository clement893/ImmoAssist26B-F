"""
Stripe Helper Utilities
Shared utilities for Stripe operations
"""

from typing import Dict
from app.models.subscription import SubscriptionStatus


STRIPE_STATUS_MAP: Dict[str, SubscriptionStatus] = {
    "active": SubscriptionStatus.ACTIVE,
    "trialing": SubscriptionStatus.TRIALING,
    "past_due": SubscriptionStatus.PAST_DUE,
    "canceled": SubscriptionStatus.CANCELED,
    "unpaid": SubscriptionStatus.UNPAID,
    "incomplete": SubscriptionStatus.INCOMPLETE,
    "incomplete_expired": SubscriptionStatus.INCOMPLETE_EXPIRED,
}


def map_stripe_status(stripe_status: str) -> SubscriptionStatus:
    """Map Stripe subscription status to our SubscriptionStatus enum"""
    return STRIPE_STATUS_MAP.get(stripe_status.lower(), SubscriptionStatus.INCOMPLETE)


def parse_timestamp(timestamp: int) -> int:
    """Parse Unix timestamp, return 0 if invalid"""
    return timestamp if timestamp and timestamp > 0 else 0

