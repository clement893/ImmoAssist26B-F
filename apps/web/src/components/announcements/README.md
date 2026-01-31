# Announcements Components

Components for displaying announcements and banner messages to users.

## 📦 Components

- **AnnouncementBanner** - Dismissible announcement banner

## 📖 Usage Examples

### Announcement Banner

```tsx
import { AnnouncementBanner } from '@/components/announcements';

<AnnouncementBanner
  message="New feature available! Check it out."
  type="info"
  dismissible={true}
  onDismiss={() => handleDismiss()}
/>;
```

## 🎨 Features

- **Dismissible**: Users can dismiss announcements
- **Multiple Types**: Info, success, warning, error variants
- **Persistent**: Can persist dismissal state
- **Theme-aware**: Supports light and dark modes

## 🔧 Configuration

The AnnouncementBanner component supports:

- `message`: The announcement text
- `type`: 'info' | 'success' | 'warning' | 'error'
- `dismissible`: Whether the banner can be dismissed
- `onDismiss`: Callback when dismissed

## 🔗 Related Components

- See `/components/ui` for Alert and Badge components
- See `/components/notifications` for notification components
