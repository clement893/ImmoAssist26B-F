# Content Security Policy (CSP) Configuration Guide

## Overview

This guide explains how Content Security Policy (CSP) is configured in the template and how to customize it for production.

## Current Configuration

### Development Mode

In development, CSP is relaxed to allow:

- `unsafe-inline` for scripts and styles (for hot reload)
- `unsafe-eval` for scripts (for development tools)

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; ...
```

### Production Mode

In production, CSP is strict:

- No `unsafe-inline` or `unsafe-eval`
- Only allows scripts/styles from `'self'`
- Includes `upgrade-insecure-requests`

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; ... upgrade-insecure-requests
```

## Implementation

CSP headers are set in `backend/app/core/security_headers.py`:

```python
if settings.ENVIRONMENT == "production":
    # Strict CSP for production
    csp_policy = (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self'; "
        ...
    )
else:
    # Relaxed CSP for development
    csp_policy = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        ...
    )
```

## Using Nonces (Recommended for Production)

For even stricter security, use nonces:

### Backend (FastAPI)

```python
import secrets

def generate_nonce():
    return secrets.token_urlsafe(16)

# In middleware
nonce = generate_nonce()
csp_policy = f"script-src 'self' 'nonce-{nonce}'; style-src 'self' 'nonce-{nonce}'; ..."
response.headers["Content-Security-Policy"] = csp_policy
response.headers["X-Nonce"] = nonce  # Pass to frontend
```

### Frontend (Next.js)

```tsx
// In _document.tsx or layout
const nonce = headers().get('x-nonce') || '';

<Script nonce={nonce} strategy="afterInteractive">
  {/* Your script */}
</Script>

<style nonce={nonce}>
  {/* Your styles */}
</style>
```

## CSP Directives Explained

- `default-src 'self'` - Default source is same origin
- `script-src 'self'` - Scripts only from same origin
- `style-src 'self'` - Styles only from same origin
- `img-src 'self' data: https:` - Images from same origin, data URIs, and HTTPS
- `font-src 'self' data:` - Fonts from same origin and data URIs
- `connect-src 'self'` - API calls only to same origin
- `frame-ancestors 'none'` - Prevents embedding in iframes
- `base-uri 'self'` - Base tag only from same origin
- `form-action 'self'` - Forms submit only to same origin
- `object-src 'none'` - No object/embed/applet tags
- `upgrade-insecure-requests` - Upgrade HTTP to HTTPS

## Testing CSP

### Browser Console

Check browser console for CSP violations:

```
Content Security Policy: The page's settings blocked the loading of a resource at ...
```

### Report-Only Mode

Test CSP without blocking:

```python
response.headers["Content-Security-Policy-Report-Only"] = csp_policy
```

### Reporting Endpoint

Set up CSP reporting:

```python
csp_policy += "; report-uri /api/v1/csp-report; report-to csp-endpoint"
```

## Common Issues

### Inline Scripts

**Problem**: Inline scripts blocked in production

**Solution**: Move to external files or use nonces

### External Resources

**Problem**: External CDN resources blocked

**Solution**: Add to CSP:

```python
"script-src 'self' https://cdn.example.com;"
```

### WebSockets

**Problem**: WebSocket connections blocked

**Solution**: Add to CSP:

```python
"connect-src 'self' wss://your-websocket-domain.com;"
```

## Best Practices

1. ✅ Start with strict CSP in development
2. ✅ Use nonces for inline scripts/styles
3. ✅ Test CSP in staging before production
4. ✅ Monitor CSP violations in production
5. ✅ Keep CSP policy minimal and specific
6. ✅ Document all external resources
7. ✅ Use `report-uri` for monitoring

## References

- [MDN CSP Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
