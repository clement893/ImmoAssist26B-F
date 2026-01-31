"""
Logging utilities with data sanitization
Prevents logging sensitive information
"""

from typing import Any, Dict, Optional
import re


def sanitize_log_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Remove sensitive data from logs to prevent information leakage.
    
    Args:
        data: Dictionary containing log data
        
    Returns:
        Sanitized dictionary with sensitive values redacted
    """
    sensitive_keys = [
        'password', 'token', 'secret', 'api_key', 'authorization',
        'access_token', 'refresh_token', 'stripe_secret', 'stripe_key',
        'aws_secret', 'aws_key', 'secret_key', 'private_key',
        'credit_card', 'card_number', 'cvv', 'ssn', 'social_security'
    ]
    
    sanitized = data.copy()
    
    for key in sanitized:
        key_lower = key.lower()
        # Check if key contains any sensitive keyword
        if any(sensitive in key_lower for sensitive in sensitive_keys):
            sanitized[key] = "***REDACTED***"
        # Also check values that might contain sensitive data
        elif isinstance(sanitized[key], str):
            # Check for patterns like tokens, API keys, etc.
            if re.search(r'(token|key|secret|password)\s*[:=]\s*\S+', sanitized[key], re.IGNORECASE):
                sanitized[key] = "***REDACTED***"
    
    return sanitized


def safe_log_message(message: str, context: Optional[Dict[str, Any]] = None) -> tuple[str, Dict[str, Any]]:
    """
    Prepare a safe log message with sanitized context.
    
    Args:
        message: Log message
        context: Optional context dictionary
        
    Returns:
        Tuple of (message, sanitized_context)
    """
    sanitized_context = sanitize_log_data(context) if context else {}
    return message, sanitized_context

