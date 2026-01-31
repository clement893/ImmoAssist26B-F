# Settings Components

User and organization settings components for configuration and preferences.

## 📦 Components

- **UserSettings** - User profile and preferences
- **OrganizationSettings** - Organization configuration
- **SecuritySettings** - Security and password settings
- **NotificationSettings** - Notification preferences
- **PrivacySettings** - Privacy and data settings
- **APIKeys** - API key management
- **WebhooksSettings** - Webhook configuration

## 📖 Usage Examples

### User Settings

```tsx
import { UserSettings } from '@/components/settings';

<UserSettings settings={userSettings} onSave={(data) => handleSaveSettings(data)} />;
```

### Security Settings

```tsx
import { SecuritySettings } from '@/components/settings';

<SecuritySettings settings={securitySettings} onSave={(data) => handleSaveSecurity(data)} />;
```

## 🔗 Related

- [Settings Components Showcase](/components/settings)
