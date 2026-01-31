# Activity Components

Activity tracking, audit trails, and event history components.

## 📦 Components

- **ActivityLog** - Activity log display
- **AuditTrail** - Audit trail viewer
- **ActivityFeed** - Activity feed component
- **EventHistory** - Event history timeline

## 📖 Usage Examples

### Activity Log

```tsx
import { ActivityLog } from '@/components/activity';

<ActivityLog
  entries={activityEntries}
  filters={filters}
  onFilterChange={(filters) => handleFilterChange(filters)}
/>;
```

### Audit Trail

```tsx
import { AuditTrail } from '@/components/activity';

<AuditTrail entries={auditEntries} onEntryClick={(entry) => handleEntryClick(entry)} />;
```

## 🔗 Related

- [Activity Components Showcase](/components/activity)
