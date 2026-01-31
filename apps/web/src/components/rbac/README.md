# RBAC Components

Role-Based Access Control components for managing permissions and roles.

## 📦 Components

- **RBACDemo** - Demo component for RBAC functionality

## 📖 Usage Examples

### RBAC Demo

```tsx
import { RBACDemo } from '@/components/rbac';

<RBACDemo />;
```

## 🎨 Features

- **Role Management**: Manage user roles
- **Permission Checks**: Check user permissions
- **Protected Routes**: Route protection based on roles
- **UI Components**: UI components that respect permissions
- **Demo Interface**: Interactive demo of RBAC features

## 🔧 Configuration

### RBACDemo

- `className`: Additional CSS classes

## 🔗 Related Components

- See `/components/auth` for ProtectedRoute components
- See `/lib/portal/utils` for permission utilities
- See `/components/ui` for base UI components

## 📚 Related Documentation

- See `/lib/constants/portal.ts` for portal navigation with permissions
- See `/lib/dependencies/rbac.py` for backend RBAC implementation
