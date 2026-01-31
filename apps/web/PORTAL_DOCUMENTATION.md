# 🏢 Portal System Documentation

Complete guide to the Client Portal and Employee/ERP Portal system.

**Last Updated**: 2025-01-27  
**Version**: 1.0.0

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Client Portal](#client-portal)
- [Employee Portal](#employee-portal)
- [Permissions](#permissions)
- [Usage Examples](#usage-examples)
- [API Reference](#api-reference)
- [Testing](#testing)

---

## 🎯 Overview

The portal system provides separate interfaces for different user types:

- **Client Portal** (`/client/*`) - For clients to view their orders, invoices, projects, and submit support tickets
- **Employee Portal** (`/erp/*`) - For employees to manage all ERP operations
- **Admin Portal** (`/admin/*`) - For system administrators

### Key Features

- ✅ **Role-based access control** - Permissions determine portal access
- ✅ **Data scoping** - Users only see their own data (clients) or authorized data (employees)
- ✅ **Multi-tenancy support** - Works with tenant isolation
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Documented** - Comprehensive code documentation

---

## 🏗️ Architecture

### Portal Detection

The system automatically detects which portal a user should access based on:

1. **User roles** - Client role → Client Portal, Employee role → Employee Portal
2. **Route path** - `/client/*` → Client Portal, `/erp/*` → Employee Portal
3. **Permissions** - Required permissions checked for each route

### Portal Utilities

Located in `apps/web/src/lib/portal/utils.ts`:

```typescript
import { detectPortalType, hasPortalAccess, hasPermission } from '@/lib/portal/utils';

// Detect portal from pathname
const portalType = detectPortalType('/client/dashboard'); // 'client'

// Check if user has portal access
const canAccess = hasPortalAccess(user, 'client'); // true/false

// Check if user has permission
const hasPerm = hasPermission(user, 'client:view:invoices'); // { hasPermission: true }
```

### Portal Constants

Located in `apps/web/src/lib/constants/portal.ts`:

- `PORTAL_ROUTES` - Route prefixes
- `CLIENT_PORTAL_ROUTES` - Client portal route definitions
- `EMPLOYEE_PORTAL_ROUTES` - Employee portal route definitions
- `CLIENT_PORTAL_NAVIGATION` - Client navigation items
- `EMPLOYEE_PORTAL_NAVIGATION` - Employee navigation items

---

## 👤 Client Portal

### Overview

The Client Portal allows clients to:

- View their orders
- View and download invoices
- Track project progress
- Submit and track support tickets
- View dashboard statistics

### Routes

All client portal routes are prefixed with `/client`:

- `/client/dashboard` - Main dashboard with statistics
- `/client/invoices` - List of invoices
- `/client/invoices/[id]` - Invoice details
- `/client/projects` - List of projects
- `/client/projects/[id]` - Project details
- `/client/tickets` - List of support tickets
- `/client/tickets/[id]` - Ticket details
- `/client/tickets/new` - Create new ticket

### Components

#### ClientNavigation

Navigation sidebar for client portal:

```tsx
import { ClientNavigation } from '@/components/client';

<ClientNavigation />;
```

#### ClientDashboard

Dashboard component showing statistics:

```tsx
import { ClientDashboard } from '@/components/client';

<ClientDashboard />;
```

### API Client

Use `clientPortalAPI` for client portal API calls:

```typescript
import { clientPortalAPI } from '@/lib/api/client-portal';

// Get dashboard stats
const stats = await clientPortalAPI.getDashboardStats();

// Get invoices
const invoices = await clientPortalAPI.getInvoices({ skip: 0, limit: 10 });

// Get a specific invoice
const invoice = await clientPortalAPI.getInvoice(123);

// Create a support ticket
const ticket = await clientPortalAPI.createTicket({
  subject: 'Need help',
  description: 'I have a question',
  priority: 'medium',
  category: 'general',
});
```

### Permissions Required

- `client:view:orders` - View orders
- `client:view:invoices` - View invoices
- `client:view:projects` - View projects
- `client:view:tickets` - View tickets
- `client:submit:tickets` - Create tickets
- `client:view:profile` - View dashboard

---

## 👔 Employee Portal

### Overview

The Employee Portal (ERP) allows employees to:

- Manage all orders
- Manage inventory
- Manage clients
- Manage invoices
- View reports
- Access all ERP modules

### Routes

All employee portal routes are prefixed with `/erp`:

- `/erp/dashboard` - ERP dashboard
- `/erp/orders` - Order management
- `/erp/inventory` - Inventory management
- `/erp/clients` - Client management
- `/erp/invoices` - Invoice management
- `/erp/reports` - Reports and analytics

### Permissions Required

- `erp:view:all:orders` - View all orders
- `erp:manage:orders` - Manage orders
- `erp:view:inventory` - View inventory
- `erp:manage:inventory` - Manage inventory
- `erp:view:clients` - View clients
- `erp:manage:clients` - Manage clients
- `erp:view:invoices` - View invoices
- `erp:manage:invoices` - Manage invoices
- `erp:view:reports` - View reports

**Note**: Employee Portal frontend will be implemented in Batch 5.

---

## 🔐 Permissions

### Permission Structure

Permissions follow the pattern: `{portal}:{action}:{resource}`

Examples:

- `client:view:invoices` - Client can view invoices
- `client:submit:tickets` - Client can submit tickets
- `erp:view:all:orders` - Employee can view all orders
- `erp:manage:inventory` - Employee can manage inventory

### Checking Permissions

```typescript
import { hasPermission } from '@/lib/portal/utils';

const check = hasPermission(user, 'client:view:invoices');
if (check.hasPermission) {
  // User can view invoices
}
```

### Backend Permission Checks

Backend endpoints use the `@require_permission` decorator:

```python
from app.core.permissions import Permission, require_permission

@router.get("/client/invoices")
@require_permission(Permission.CLIENT_VIEW_INVOICES)
async def get_client_invoices(...):
    # Only users with CLIENT_VIEW_INVOICES permission can access
    ...
```

---

## 💻 Usage Examples

### Creating a Client Portal Page

```tsx
'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useApi } from '@/hooks/useApi';
import { clientPortalAPI } from '@/lib/api/client-portal';

function MyClientPage() {
  const { data, isLoading } = useApi({
    url: '/v1/client/invoices',
  });

  return (
    <div>
      <h1>My Invoices</h1>
      {/* Your content */}
    </div>
  );
}

export default function Page() {
  return (
    <ProtectedRoute>
      <MyClientPage />
    </ProtectedRoute>
  );
}
```

### Using Portal Utilities

```tsx
import { detectPortalType, getUserPrimaryPortal } from '@/lib/portal/utils';
import { useAuthStore } from '@/lib/store';

function MyComponent() {
  const { user } = useAuthStore();
  const pathname = usePathname();

  // Detect current portal
  const currentPortal = detectPortalType(pathname);

  // Get user's primary portal
  const userPortal = getUserPrimaryPortal(user);

  // Check if user should be redirected
  if (currentPortal !== userPortal) {
    // Redirect to user's portal
  }
}
```

### Creating Portal Navigation

```tsx
import { CLIENT_PORTAL_NAVIGATION } from '@/lib/constants/portal';
import { hasPermission } from '@/lib/portal/utils';

function CustomNavigation() {
  const { user } = useAuthStore();

  const visibleItems = CLIENT_PORTAL_NAVIGATION.filter((item) => {
    if (!item.permission) return true;
    return hasPermission(user, item.permission).hasPermission;
  });

  return (
    <nav>
      {visibleItems.map((item) => (
        <Link key={item.id} href={item.path}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
```

---

## 📚 API Reference

### Client Portal API

See `apps/web/src/lib/api/client-portal.ts` for complete API reference.

#### Methods

- `getDashboardStats()` - Get dashboard statistics
- `getInvoices(params?)` - Get list of invoices
- `getInvoice(invoiceId)` - Get specific invoice
- `getProjects(params?)` - Get list of projects
- `getProject(projectId)` - Get specific project
- `getTickets(params?)` - Get list of tickets
- `getTicket(ticketId)` - Get specific ticket
- `createTicket(ticketData)` - Create new ticket

### Backend API Endpoints

#### Client Portal Endpoints

- `GET /api/v1/client/dashboard/stats` - Dashboard statistics
- `GET /api/v1/client/invoices` - List invoices
- `GET /api/v1/client/invoices/{id}` - Get invoice
- `GET /api/v1/client/projects` - List projects
- `GET /api/v1/client/projects/{id}` - Get project
- `GET /api/v1/client/tickets` - List tickets
- `GET /api/v1/client/tickets/{id}` - Get ticket
- `POST /api/v1/client/tickets` - Create ticket

All endpoints require authentication and appropriate permissions.

---

## 🧪 Testing

### Testing Client Portal

1. **Create a client user**:

   ```bash
   cd backend
   python scripts/seed_client_role.py
   ```

2. **Assign client role to user**:
   - Use admin panel or API to assign "client" role

3. **Access client portal**:
   - Navigate to `/client/dashboard`
   - Or use the test link on main dashboard

### Test Portal Link

A test portal link is available on the main dashboard (`/dashboard`) under "Service Tests" section.

### Manual Testing Checklist

- [ ] Client can access `/client/dashboard`
- [ ] Client can view invoices
- [ ] Client can view projects
- [ ] Client can view tickets
- [ ] Client can create tickets
- [ ] Client cannot access `/erp/*` routes
- [ ] Non-client users cannot access `/client/*` routes
- [ ] Permissions are enforced correctly

---

## 📝 Code Documentation

All portal-related code includes comprehensive JSDoc comments:

- **Components**: Component purpose, props, usage examples
- **API Functions**: Parameters, return types, examples
- **Utilities**: Function purpose, parameters, examples
- **Types**: Type definitions with descriptions

### Example Documentation

````typescript
/**
 * Client Portal Navigation Component
 *
 * Navigation sidebar for the client portal.
 * Displays navigation items based on client permissions.
 *
 * @module ClientNavigation
 * @see {@link ../../lib/constants/portal.ts CLIENT_PORTAL_NAVIGATION}
 *
 * @example
 * ```tsx
 * <ClientNavigation />
 * ```
 */
````

---

## 🔗 Related Documentation

- [ERP Readiness Assessment](./ERP_READINESS_ASSESSMENT.md)
- [ERP Implementation Plan](./ERP_IMPLEMENTATION_PLAN.md)
- [Portal Types](../packages/types/src/portal.ts)
- [Portal Constants](../apps/web/src/lib/constants/portal.ts)
- [Portal Utilities](../apps/web/src/lib/portal/utils.ts)

---

## 🚀 Next Steps

- **Batch 4**: Employee Portal Backend
- **Batch 5**: Employee Portal Frontend
- **Batch 6**: Portal Navigation & Layouts
- **Batch 7**: Portal Dashboards Enhancement

---

**For questions or issues**, please refer to the main [README](../README.md) or create an issue.
