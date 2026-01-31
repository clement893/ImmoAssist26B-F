# Sharing Components

Components for sharing content with users, teams, and public links.

## 📦 Components

- **ShareDialog** - Dialog for sharing content
- **ShareList** - List of active shares

## 📖 Usage Examples

### Share Dialog

```tsx
import { ShareDialog } from '@/components/sharing';

<ShareDialog
  entityType="document"
  entityId={123}
  onClose={() => handleClose()}
  onShare={() => handleShare()}
/>;
```

### Share List

```tsx
import { ShareList } from '@/components/sharing';

<ShareList entityType="document" entityId={123} />;
```

## 🎨 Features

- **User Sharing**: Share with specific users
- **Team Sharing**: Share with teams
- **Public Links**: Generate public sharing links
- **Permission Levels**: View, comment, edit, admin permissions
- **Password Protection**: Optional password protection
- **Expiration**: Set expiration dates for shares
- **Share Management**: View and manage active shares

## 🔧 Configuration

### ShareDialog

- `entityType`: Type of entity being shared
- `entityId`: ID of the entity
- `onClose`: Close callback
- `onShare`: Share callback

### ShareList

- `entityType`: Type of entity
- `entityId`: ID of the entity
- `className`: Additional CSS classes

## 🔗 Related Components

- See `/components/ui` for Modal and Button components
- See `/components/rbac` for permission management
