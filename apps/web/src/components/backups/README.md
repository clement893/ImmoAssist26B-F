# Backups Components

Components for managing backups and data recovery.

## 📦 Components

- **BackupManager** - Backup creation and management interface

## 📖 Usage Examples

### Backup Manager

```tsx
import { BackupManager } from '@/components/backups';

<BackupManager
  onBackupCreate={() => handleCreateBackup()}
  onBackupRestore={(backupId) => handleRestore(backupId)}
/>;
```

## 🎨 Features

- **Backup Creation**: Create system backups
- **Backup List**: View all available backups
- **Backup Restoration**: Restore from backups
- **Scheduled Backups**: Configure automatic backups
- **Backup Verification**: Verify backup integrity

## 🔧 Configuration

The BackupManager component supports:

- `onBackupCreate`: Callback when creating a backup
- `onBackupRestore`: Callback when restoring a backup
- `onBackupDelete`: Callback when deleting a backup

## 🔗 Related Components

- See `/components/data` for data export/import
- See `/components/ui` for base UI components
