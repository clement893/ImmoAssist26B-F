# Email Templates Components

Components for managing email templates with versioning and variable rendering.

## 📦 Components

- **EmailTemplateManager** - Create and manage email templates

## 📖 Usage Examples

### Email Template Manager

```tsx
import { EmailTemplateManager } from '@/components/email-templates';

<EmailTemplateManager
  templates={templatesList}
  onTemplateCreate={async (template) => await createTemplate(template)}
  onTemplateUpdate={async (id, template) => await updateTemplate(id, template)}
/>;
```

## 🎨 Features

- **Template Editor**: Rich text editor for email content
- **Variable Support**: Use variables in templates (e.g., {{name}})
- **Versioning**: Track template versions
- **Preview**: Preview emails before sending
- **HTML/Text**: Support for both HTML and plain text versions
- **Testing**: Test templates with sample data

## 🔧 Configuration

### EmailTemplateManager

- `templates`: Array of template objects
- `onTemplateCreate`: Create callback
- `onTemplateUpdate`: Update callback
- `onTemplateDelete`: Delete callback

## 🔗 Related Components

- See `/components/content` for content templates
- See `/components/ui` for base UI components
