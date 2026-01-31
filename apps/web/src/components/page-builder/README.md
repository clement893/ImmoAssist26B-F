# Page Builder Components

Visual page builder components for creating and editing pages with drag-and-drop functionality.

## 📦 Components

- **PageEditor** - Visual page editor with drag-and-drop sections
- **PagePreview** - Preview mode for page builder pages
- **SectionTemplates** - Library of pre-built section templates

## 📖 Usage Examples

### Page Editor

```tsx
import { PageEditor } from '@/components/page-builder';

<PageEditor
  initialSections={sections}
  onSave={async (sections) => await savePage(sections)}
  onPreview={() => handlePreview()}
/>;
```

### Page Preview

```tsx
import { PagePreview } from '@/components/page-builder';

<PagePreview sections={pageSections} />;
```

### Section Templates

```tsx
import { SectionTemplates } from '@/components/page-builder';

<SectionTemplates onSelectTemplate={(template) => handleSelectTemplate(template)} />;
```

## 🎨 Features

- **Drag-and-Drop**: Intuitive drag-and-drop interface
- **Section Types**: Hero, content, features, testimonials, CTA sections
- **Live Preview**: Real-time preview of changes
- **Template Library**: Pre-built section templates
- **Responsive Design**: Mobile-responsive sections
- **Custom Sections**: Create custom section types

## 🔧 Configuration

### PageEditor

- `initialSections`: Array of page sections
- `onSave`: Save callback
- `onPreview`: Preview callback
- `className`: Additional CSS classes

### PagePreview

- `sections`: Array of page sections to preview
- `className`: Additional CSS classes

### SectionTemplates

- `onSelectTemplate`: Template selection callback
- `category`: Filter by category (optional)

## 🔗 Related Components

- See `/components/content` for PagesManager
- See `/components/sections` for section components
- See `/components/ui` for base UI components
