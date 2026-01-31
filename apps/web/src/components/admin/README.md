# Admin Components

Administrative management components for users, roles, teams, and invitations.

## 📦 Components

- **InvitationManagement** - User invitation management
- **RoleManagement** - Role and permission management
- **TeamManagement** - Team management interface
- **ThemeManager** - Theme management for superadmins (in `/admin/themes`)

## 📖 Usage Examples

### Invitation Management

```tsx
import InvitationManagement from '@/components/admin/InvitationManagement';

<InvitationManagement
  invitations={invitations}
  onInvite={(email, role) => handleInvite(email, role)}
  onResend={(id) => handleResend(id)}
  onRevoke={(id) => handleRevoke(id)}
/>;
```

### Role Management

```tsx
import RoleManagement from '@/components/admin/RoleManagement';

<RoleManagement
  roles={roles}
  onCreateRole={(data) => handleCreateRole(data)}
  onUpdateRole={(id, data) => handleUpdateRole(id, data)}
  onDeleteRole={(id) => handleDeleteRole(id)}
/>;
```

## 🔗 Related

- [Admin Components Showcase](/components/admin)
- [RBAC Documentation](../../docs/RBAC.md)
