# Audit Trail Components

Components for viewing and managing audit trails and change history.

## 📦 Components

- **AuditTrailViewer** - View audit trail entries for entities

## 📖 Usage Examples

### Audit Trail Viewer

```tsx
import { AuditTrailViewer } from '@/components/audit-trail';

<AuditTrailViewer
  entityType="user"
  entityId={123}
  onEntryClick={(entry) => handleEntryClick(entry)}
/>;
```

## 🎨 Features

- **Entity Tracking**: Track changes for any entity type
- **Change History**: View complete change history
- **User Attribution**: See who made changes
- **Timestamp Tracking**: When changes occurred
- **Filtering**: Filter by user, date, or action type

## 🔧 Configuration

The AuditTrailViewer component supports:

- `entityType`: Type of entity being tracked
- `entityId`: ID of the entity
- `onEntryClick`: Callback when an entry is clicked

## 🔗 Related Components

- See `/components/activity` for activity tracking
- See `/components/ui` for DataTable component
