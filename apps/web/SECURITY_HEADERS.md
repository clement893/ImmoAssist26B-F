# 🔒 Security Headers Configuration

This document explains the security headers configuration, including Content Security Policy (CSP) settings.

## 📋 Overview

Security headers are configured in `next.config.js` via the `headers()` function. These headers provide multiple layers of security protection.

## 🛡️ Security Headers

### Content Security Policy (CSP)

**Location**: `apps/web/next.config.js` → `headers()` function

#### Development Mode

In development, CSP uses `unsafe-inline` and `unsafe-eval` directives:

```javascript
"script-src 'self' 'unsafe-eval' 'unsafe-inline'";
"style-src 'self' 'unsafe-inline'";
```

**Why?**

- Next.js development mode requires `unsafe-eval` for Fast Refresh and HMR (Hot Module Replacement)
- Tailwind CSS requires `unsafe-inline` for dynamic class injection
- This is **acceptable for development** but **MUST be tightened in production**

#### Production Mode

In production, CSP should use nonces instead of `unsafe-inline`:

```javascript
"script-src 'self' 'nonce-{random}'";
"style-src 'self' 'nonce-{random}'";
```

**Implementation Required**:

1. Generate nonces in middleware or server components
2. Pass nonces to client components via props
3. Apply nonces to inline scripts/styles

**Example** (Future Implementation):

```tsx
// middleware.ts or layout.tsx
const nonce = generateNonce();

// Apply to inline scripts
<script nonce={nonce}>...</script>

// Apply to inline styles
<style nonce={nonce}>...</style>
```

#### Current CSP Directives

**Development**:

- `script-src 'self' 'unsafe-eval' 'unsafe-inline'` - Required for Next.js dev
- `style-src 'self' 'unsafe-inline'` - Required for Tailwind CSS
- `connect-src` - Includes localhost and API URLs
- `frame-src 'none'` - Prevents iframe embedding
- `object-src 'none'` - Prevents object/embed tags

**Production** (Backend):

- Strict CSP without `unsafe-inline` or `unsafe-eval`
- Uses nonces for inline content (when implemented)

### Other Security Headers

- **X-Frame-Options**: `DENY` - Prevents clickjacking
- **X-Content-Type-Options**: `nosniff` - Prevents MIME sniffing
- **Referrer-Policy**: `strict-origin-when-cross-origin` - Controls referrer information
- **Strict-Transport-Security**: Enabled in production only
- **Permissions-Policy**: Restricts browser features (camera, microphone, geolocation)

## 🔧 Configuration

### Environment Detection

CSP automatically detects environment:

```javascript
const isProduction = process.env.NODE_ENV === 'production';
```

### API URL Configuration

CSP includes API URLs in `connect-src`:

```javascript
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
```

## ⚠️ Important Notes

1. **Development CSP is Relaxed**: This is intentional and acceptable for local development
2. **Production Must Use Nonces**: Never use `unsafe-inline` in production
3. **Third-Party Scripts**: Add external domains to appropriate CSP directives
4. **Testing**: Test CSP in production builds, not just development

## 📚 References

- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
- [MDN Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [CSP Nonce Implementation](https://web.dev/strict-csp/)

## 🚀 Future Improvements

- [ ] Implement nonce-based CSP for production
- [ ] Add CSP violation reporting endpoint
- [ ] Document third-party script CSP requirements
- [ ] Add CSP testing in CI/CD
