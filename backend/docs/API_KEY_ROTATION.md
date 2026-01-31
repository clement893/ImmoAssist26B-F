# API Key Rotation Policies

## Overview

The API key rotation system provides automated and manual rotation policies to enhance security by regularly rotating API keys.

## Rotation Policies

### Available Policies

- **`manual`** - No automatic rotation (default)
- **`30d`** - Rotate every 30 days
- **`60d`** - Rotate every 60 days
- **`90d`** - Rotate every 90 days
- **`180d`** - Rotate every 180 days
- **`365d`** - Rotate every 365 days

## Usage

### Creating an API Key with Rotation Policy

```python
POST /api/v1/api-keys/generate
{
    "name": "Production API Key",
    "description": "Key for production environment",
    "rotation_policy": "90d",
    "expires_in_days": 365
}
```

### Manual Rotation

```python
POST /api/v1/api-keys/{key_id}/rotate
```

This will:

1. Create a new API key with the same settings
2. Deactivate the old key
3. Return the new key (shown only once)

### Automatic Rotation Checking

Run the background task periodically:

```python
from app.tasks.api_key_rotation import check_and_rotate_api_keys

# Check for keys needing rotation
await check_and_rotate_api_keys()
```

**Note**: The system notifies when rotation is needed but doesn't auto-rotate. Users must manually rotate keys to maintain security control.

## Security Audit Logging

All API key operations are logged to the security audit log:

- `API_KEY_CREATED` - When a key is created
- `API_KEY_ROTATED` - When a key is rotated
- `API_KEY_REVOKED` - When a key is revoked
- `API_KEY_USED` - When a key is used for authentication
- `API_KEY_EXPIRED` - When a key needs rotation

## Best Practices

1. **Use appropriate rotation policies** - More sensitive keys should rotate more frequently
2. **Monitor rotation dates** - Set up alerts for keys approaching rotation
3. **Rotate compromised keys immediately** - Revoke and create new keys
4. **Track key usage** - Monitor `last_used_at` and `usage_count` for suspicious activity
5. **Set expiration dates** - Use `expires_in_days` for additional security

## Database Schema

The `api_keys` table includes:

- `rotation_policy` - Current rotation policy
- `last_rotated_at` - Last rotation timestamp
- `next_rotation_at` - Next rotation due date
- `rotation_count` - Number of times rotated
- `expires_at` - Optional expiration date
