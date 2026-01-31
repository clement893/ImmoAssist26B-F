# Auth Components

Authentication and authorization components including MFA, social login, and route protection.

## 📦 Components

- **MFA** - Multi-factor authentication component
- **SocialAuth** - Social authentication (Google, GitHub, Microsoft)
- **ProtectedRoute** - Route protection wrapper
- **ProtectedSuperAdminRoute** - Super admin route protection
- **SignOutButton** - Sign out button
- **UserProfile** - User profile component

## 📖 Usage Examples

### Protected Route

```tsx
import { ProtectedRoute } from '@/components/auth';

<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>;
```

### MFA Component

```tsx
import { MFA } from '@/components/auth';

<MFA onVerify={(code) => handleVerify(code)} onResend={() => handleResend()} />;
```

### Social Auth

```tsx
import { SocialAuth } from '@/components/auth';

<SocialAuth providers={['google', 'github']} onSuccess={(user) => handleSuccess(user)} />;
```

## 🔗 Related

- [Auth Components Showcase](/components/auth)
- [Authentication Guide](../../docs/AUTH.md)
