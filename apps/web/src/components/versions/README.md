# Versions Components

Components for version history and change tracking.

## 📦 Components

- **VersionHistory** - View version history for entities
- **DiffViewer** - View differences between versions

## 📖 Usage Examples

### Version History

```tsx
import { VersionHistory } from '@/components/versions';

<VersionHistory entityType="page" entityId={123} onRestore={(version) => handleRestore(version)} />;
```

### Diff Viewer

```tsx
import { DiffViewer } from '@/components/versions';

<DiffViewer
  diff={{
    added: { newField: 'new value' },
    removed: { oldField: 'old value' },
    modified: {
      changedField: {
        old: 'old value',
        new: 'new value',
      },
    },
  }}
/>;
```

## 🎨 Features

- **Version Tracking**: Track all versions of entities
- **Version Comparison**: Compare versions side-by-side
- **Restore Versions**: Restore previous versions
- **Change Attribution**: See who made changes
- **Change Types**: Track added, removed, and modified fields
- **Timestamp Tracking**: When changes occurred
- **Diff Visualization**: Visual diff display

## 🔧 Configuration

### VersionHistory

- `entityType`: Type of entity
- `entityId`: ID of the entity
- `onRestore`: Restore version callback
- `className`: Additional CSS classes

### DiffViewer

- `diff`: Diff object with added, removed, and modified fields
- `className`: Additional CSS classes

## 🔗 Related Components

- See `/components/audit-trail` for audit trail components
- See `/components/activity` for activity tracking
- See `/components/ui` for base UI components
