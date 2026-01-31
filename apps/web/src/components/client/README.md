# Client Portal Components

Components for the Client Portal interface.

## Components

### ClientNavigation

Navigation sidebar for the client portal. Displays navigation items based on user permissions.

**Usage:**

```tsx
import { ClientNavigation } from '@/components/client';

<ClientNavigation />;
```

**Features:**

- Permission-based visibility
- Active route highlighting
- Badge support for notifications

### ClientDashboard

Dashboard component showing client statistics and overview.

**Usage:**

```tsx
import { ClientDashboard } from '@/components/client';

<ClientDashboard />;
```

**Features:**

- Order statistics
- Invoice statistics
- Project statistics
- Support ticket statistics
- Financial overview

## Portal Routes

All client portal routes are under `/client/*`:

- `/client/dashboard` - Main dashboard
- `/client/invoices` - Invoice list
- `/client/projects` - Project list
- `/client/tickets` - Support tickets

## Permissions

Components automatically check permissions:

- `client:view:orders` - View orders
- `client:view:invoices` - View invoices
- `client:view:projects` - View projects
- `client:view:tickets` - View tickets
- `client:submit:tickets` - Create tickets

## See Also

- [Portal Documentation](../../PORTAL_DOCUMENTATION.md)
- [Portal Constants](../../lib/constants/portal.ts)
- [Portal Utilities](../../lib/portal/utils.ts)
