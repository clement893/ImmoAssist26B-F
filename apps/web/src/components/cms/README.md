# CMS Components

Content Management System components for building dynamic forms, menus, and SEO management.

## 📦 Components

- **MenuBuilder** - Drag-and-drop menu builder
- **CMSFormBuilder** - Advanced form builder with drag-and-drop
- **FormSubmissions** - View and manage form submissions
- **SEOManager** - SEO meta tags and settings manager

## 📖 Usage Examples

### Menu Builder

```tsx
import { MenuBuilder } from '@/components/cms';

<MenuBuilder menu={menuData} onSave={async (menu) => await saveMenu(menu)} />;
```

### CMS Form Builder

```tsx
import { CMSFormBuilder } from '@/components/cms';

<CMSFormBuilder form={formData} onSave={async (form) => await saveForm(form)} />;
```

### Form Submissions

```tsx
import { FormSubmissions } from '@/components/cms';

<FormSubmissions
  submissions={submissions}
  onView={(submission) => handleView(submission)}
  onDelete={async (id) => await deleteSubmission(id)}
/>;
```

### SEO Manager

```tsx
import { SEOManager } from '@/components/cms';

<SEOManager initialSettings={seoSettings} onSave={async (settings) => await saveSEO(settings)} />;
```

## 🎨 Features

- **Drag-and-Drop**: Intuitive drag-and-drop interfaces
- **Form Builder**: Create dynamic forms with validation
- **Menu Management**: Build navigation menus visually
- **SEO Tools**: Complete SEO meta tag management
- **Open Graph**: Social media sharing optimization
- **Schema Markup**: Structured data support

## 🔧 Configuration

### MenuBuilder

- `menu`: Menu object with items
- `onSave`: Save callback

### CMSFormBuilder

- `form`: Form configuration object
- `onSave`: Save callback

### FormSubmissions

- `submissions`: Array of submission objects
- `onView`: View submission callback
- `onDelete`: Delete submission callback

### SEOManager

- `initialSettings`: Initial SEO settings
- `onSave`: Save callback

## 🔗 Related Components

- See `/components/content` for content management
- See `/components/seo` for SchemaMarkup
- See `/components/ui` for base UI components
