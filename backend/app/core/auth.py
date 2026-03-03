"""
Compatibility module for auth helpers. Re-exports from app.core.security
so tests and code that import from app.core.auth keep working.
"""
from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)

# Alias expected by tests and other callers
get_password_hash = hash_password

__all__ = [
    "create_access_token",
    "get_password_hash",
    "hash_password",
    "verify_password",
]
