# Templates Components

Components for managing content templates.

## 📦 Components

- **TemplateManager** - Manage content templates
- **TemplateEditor** - Edit template content

## 📖 Usage Examples

### Template Manager

```tsx
import { TemplateManager } from '@/components/templates';

<TemplateManager
  entityType="page"
  category="email"
  onSelect={(template) => handleSelect(template)}
/>;
```

### Template Editor

```tsx
import { TemplateEditor } from '@/components/templates';

<TemplateEditor
  entityType="page"
  templateId={123}
  onSave={async (template) => await saveTemplate(template)}
/>;
```

## 🎨 Features

- **Template Library**: Browse and manage templates
- **Template Editor**: Rich text editor for templates
- **Variables**: Use variables in templates (e.g., {{name}})
- **Categories**: Organize templates by category
- **Preview**: Preview templates before use
- **Public/Private**: Mark templates as public or private
- **Usage Tracking**: Track template usage

## 🔧 Configuration

### TemplateManager

- `entityType`: Type of entity (e.g., 'page', 'email')
- `category`: Filter by category (optional)
- `onSelect`: Template selection callback
- `className`: Additional CSS classes

### TemplateEditor

- `entityType`: Type of entity
- `templateId`: Template ID (for editing existing)
- `onSave`: Save callback

## 🔗 Related Components

- See `/components/content` for TemplatesManager
- See `/components/email-templates` for email templates
- See `/components/ui` for base UI components
