# Authentication and Security

This document describes the complete authentication and security configuration for the application.

## 🔐 Google OAuth Configuration

### Prerequisites

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google+ API (or Google Identity)
3. Create OAuth 2.0 credentials
4. Configure authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://your-domain.com/api/auth/callback/google` (production)

### Required Environment Variables

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
```

### Secret Generation

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate JWT_SECRET
openssl rand -base64 32
```

## 🎫 JWT Token Management

### Token Types

1. **Access Token**: Short-lived access token (15 minutes by default)
2. **Refresh Token**: Long-lived refresh token (30 days by default)

### Configuration

```env
JWT_SECRET=your-jwt-secret
JWT_ISSUER=modele-app
JWT_AUDIENCE=modele-users
JWT_ACCESS_TOKEN_EXPIRES=15m
JWT_REFRESH_TOKEN_EXPIRES=30d
```

### Usage

```typescript
import { createAccessToken, verifyToken } from '@/lib/auth/jwt';

// Create a token
const token = await createAccessToken({
  userId: 'user-id',
  email: 'user@example.com',
  role: 'user',
});

// Verify a token
const payload = await verifyToken(token);
```

## 🛡️ Authentication Middleware

### Next.js Middleware

The `src/middleware.ts` automatically protects all routes except:

- `/auth/*` (authentication pages)
- `/api/auth/*` (NextAuth routes)
- `/api/public/*` (public routes)

### Usage in API Routes

#### Simple Protected Route

```typescript
import { withAuth } from '@/lib/auth/middleware';

async function handler(request: NextRequest, { user }: { user: TokenPayload }) {
  return NextResponse.json({ user });
}

export const GET = withAuth(handler);
```

#### Route with Role Control

```typescript
import { withRole } from '@/lib/auth/middleware';

async function handler(request: NextRequest, { user }: { user: TokenPayload }) {
  return NextResponse.json({ message: 'Admin only' });
}

export const GET = withRole(['admin'], handler);
```

### Usage in Server Components

```typescript
import { auth } from '@/lib/auth';

export default async function Page() {
  const session = await auth();

  if (!session) {
    redirect('/auth/signin');
  }

  return <div>Hello {session.user.email}</div>;
}
```

## 📋 Environment Variables

### Automatic Validation

Environment variables are automatically validated on startup in development mode.

### Available Scripts

```bash
# Validate environment variables
pnpm env:validate

# Display documentation
pnpm env:docs

# Generate .env.example file
pnpm env:generate
```

### Required Variables

| Variable               | Description                 | Example                          |
| ---------------------- | --------------------------- | -------------------------------- |
| `NEXTAUTH_URL`         | Base URL of the application | `http://localhost:3000`          |
| `NEXTAUTH_SECRET`      | Secret for NextAuth         | Generated with openssl           |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID      | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret  | `xxx`                            |
| `JWT_SECRET`           | Secret for JWT              | Generated with openssl           |

### Optional Variables

| Variable                    | Description              | Default        |
| --------------------------- | ------------------------ | -------------- |
| `JWT_ISSUER`                | JWT issuer               | `modele-app`   |
| `JWT_AUDIENCE`              | JWT audience             | `modele-users` |
| `JWT_ACCESS_TOKEN_EXPIRES`  | Access token expiration  | `15m`          |
| `JWT_REFRESH_TOKEN_EXPIRES` | Refresh token expiration | `30d`          |
| `ALLOWED_EMAIL_DOMAINS`     | Allowed email domains    | All            |

## 🔒 Security

### Implemented Best Practices

1. **Secure JWT tokens**: Using `jose` for creation and verification
2. **Refresh tokens**: Automatic access token rotation
3. **HTTPS in production**: All tokens are transmitted via HTTPS
4. **Domain validation**: Option to restrict email domains
5. **Token expiration**: Short-lived access tokens
6. **Secure secrets**: Random secret generation

### CSRF Protection

NextAuth automatically handles CSRF protection for all authentication routes.

### XSS Protection

Tokens are stored in HTTP-only cookies (via NextAuth) and are not accessible from client-side JavaScript.

## 🧪 Testing

### Testing Google Authentication

1. Start the application: `pnpm dev`
2. Visit `/auth/signin`
3. Click "Sign in with Google"
4. Select a Google account
5. Verify redirect to the original page

### Testing Protected Routes

```bash
# Without authentication (should redirect to /auth/signin)
curl http://localhost:3000/api/protected

# With authentication (add token in header)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/protected
```

## 📚 Additional Documentation

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

## 🐛 Troubleshooting

### Error "Invalid credentials"

- Verify that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Verify that the redirect URI is configured in Google Cloud Console

### Error "NEXTAUTH_SECRET is not set"

- Generate a secret: `openssl rand -base64 32`
- Add to `.env.local`: `NEXTAUTH_SECRET=your-secret`

### Expired Tokens

- Access tokens expire after 15 minutes
- Use the refresh token to obtain a new access token
- Endpoint: `POST /api/auth/refresh`
