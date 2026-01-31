# SEO Components

Components for SEO optimization and structured data markup.

## 📦 Components

- **SchemaMarkup** - Inject JSON-LD structured data

## 📖 Usage Examples

### Schema Markup

```tsx
import { SchemaMarkup } from '@/components/seo';

// Organization schema
<SchemaMarkup
  type="organization"
  data={{
    name: 'Company Name',
    url: 'https://example.com',
    logo: 'https://example.com/logo.png',
  }}
/>

// Website schema
<SchemaMarkup
  type="website"
  data={{
    name: 'Website Name',
    url: 'https://example.com',
    description: 'Website description',
  }}
/>
```

## 🎨 Features

- **JSON-LD**: Structured data in JSON-LD format
- **Organization Schema**: Company/organization information
- **Website Schema**: Website metadata
- **Automatic Injection**: Automatically injects into document head
- **SEO Optimization**: Improves search engine understanding

## 🔧 Configuration

### SchemaMarkup

- `type`: 'organization' | 'website'
- `data`: Schema data object

## 🔗 Related Components

- See `/components/cms` for SEOManager component
- See `/lib/seo` for SEO utilities
