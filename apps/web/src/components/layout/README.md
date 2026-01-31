# Layout Components

Page layout and structure components for consistent application structure.

## 📦 Components

- **Header** - Site header
- **Footer** - Site footer
- **Sidebar** - Sidebar navigation
- **PageHeader** - Page header with breadcrumbs
- **PageContainer** - Page container wrapper
- **PageNavigation** - Page navigation component
- **Section** - Section wrapper
- **InternalLayout** - Internal page layout
- **LoadingState** - Loading state component
- **ErrorState** - Error state component
- **ExampleCard** - Example card component

## 📖 Usage Examples

### Page Layout

```tsx
import { PageContainer, PageHeader, Section } from '@/components/layout';

<PageContainer>
  <PageHeader
    title="Page Title"
    description="Page description"
    breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Page' }]}
  />
  <Section title="Content">{/* Your content */}</Section>
</PageContainer>;
```

### Internal Layout

```tsx
import InternalLayout from '@/components/layout/InternalLayout';

<InternalLayout>
  <YourContent />
</InternalLayout>;
```

## 🔗 Related

- [Layout Components Showcase](/components/layout)
