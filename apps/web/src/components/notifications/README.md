# Notifications Components

Components for displaying and managing user notifications.

## 📦 Components

- **NotificationCenter** - Central notification hub
- **NotificationBell** - Notification bell icon with badge
- **NotificationSettings** - User notification preferences

## 📖 Usage Examples

### Notification Center

```tsx
import { NotificationCenter } from '@/components/notifications';

<NotificationCenter
  notifications={notificationsList}
  onNotificationClick={(notification) => handleClick(notification)}
  onMarkAllRead={() => handleMarkAllRead()}
/>;
```

### Notification Bell

```tsx
import { NotificationBell } from '@/components/notifications';

<NotificationBell unreadCount={5} onBellClick={() => handleBellClick()} />;
```

### Notification Settings

```tsx
import { NotificationSettings } from '@/components/notifications';

<NotificationSettings
  settings={notificationSettings}
  onSave={async (settings) => await saveSettings(settings)}
/>;
```

## 🎨 Features

- **Real-time Updates**: Live notification updates
- **Multiple Types**: Support for various notification types
- **Read/Unread**: Track read status
- **Grouping**: Group notifications by type or date
- **Actions**: Action buttons on notifications
- **Preferences**: User notification preferences
- **Sound Alerts**: Optional sound notifications

## 🔧 Configuration

### NotificationCenter

- `notifications`: Array of notification objects
- `onNotificationClick`: Click callback
- `onMarkAllRead`: Mark all as read callback
- `onNotificationDelete`: Delete callback

### NotificationBell

- `unreadCount`: Number of unread notifications
- `onBellClick`: Bell click callback
- `className`: Additional CSS classes

### NotificationSettings

- `settings`: Notification settings object
- `onSave`: Save callback

## 🔗 Related Components

- See `/components/ui` for Badge and Button components
- See `/components/settings` for settings components
