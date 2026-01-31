# Integrations Components

Components for managing third-party integrations and webhooks.

## 📦 Components

- **IntegrationList** - List available integrations
- **IntegrationConfig** - Configure integration settings
- **WebhookManager** - Manage webhooks
- **APIDocumentation** - API documentation viewer

## 📖 Usage Examples

### Integration List

```tsx
import { IntegrationList } from '@/components/integrations';

<IntegrationList
  integrations={integrationsList}
  onIntegrationSelect={(integration) => handleSelect(integration)}
/>;
```

### Integration Config

```tsx
import { IntegrationConfig } from '@/components/integrations';

<IntegrationConfig
  integration={integrationData}
  onSave={async (config) => await saveConfig(config)}
/>;
```

### Webhook Manager

```tsx
import { WebhookManager } from '@/components/integrations';

<WebhookManager
  webhooks={webhooksList}
  onWebhookCreate={async (webhook) => await createWebhook(webhook)}
  onWebhookTest={async (id) => await testWebhook(id)}
/>;
```

### API Documentation

```tsx
import { APIDocumentation } from '@/components/integrations';

<APIDocumentation endpoints={apiEndpoints} onEndpointClick={(endpoint) => handleClick(endpoint)} />;
```

## 🎨 Features

- **Integration Catalog**: Browse available integrations
- **OAuth Support**: OAuth integration setup
- **API Keys**: Manage API keys
- **Webhook Management**: Create and manage webhooks
- **Event Logging**: Track integration events
- **API Documentation**: Interactive API docs

## 🔧 Configuration

### IntegrationList

- `integrations`: Array of integration objects
- `onIntegrationSelect`: Select callback

### IntegrationConfig

- `integration`: Integration object
- `onSave`: Save callback
- `fields`: Configuration fields

### WebhookManager

- `webhooks`: Array of webhook objects
- `onWebhookCreate`: Create callback
- `onWebhookTest`: Test callback

### APIDocumentation

- `endpoints`: Array of API endpoint objects
- `onEndpointClick`: Click callback

## 🔗 Related Components

- See `/components/ui` for base UI components
- See `/components/settings` for settings components
