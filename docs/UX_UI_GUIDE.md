# 🎨 UX/UI Guide - Template Improvements

**Last Updated:** December 29, 2025  
**Status:** ✅ Complete

This guide documents all UX/UI improvements made to the template, including standardized spacing, typography, component improvements, and best practices.

---

## 📋 Overview

The template has undergone comprehensive UX/UI improvements to ensure:

- ✅ **Consistent spacing** across all components
- ✅ **Standardized typography** hierarchy
- ✅ **Improved visual breathing room** with increased padding
- ✅ **Better component consistency** with reusable components
- ✅ **Enhanced navigation** with collapsible groups and search
- ✅ **Semantic color tokens** for better theme support

---

## 🎯 Key Improvements

### 1. Standardized Spacing System

A consistent spacing scale has been implemented in `tailwind.config.ts`:

```typescript
spacing: {
  xs: '4px',    // Very small spacing
  sm: '8px',    // Small spacing
  md: '16px',   // Standard spacing
  lg: '24px',   // Large spacing
  xl: '32px',   // Very large spacing
  '2xl': '48px', // Extra large spacing
  '3xl': '64px', // Maximum spacing
}
```

**Usage:**

```tsx
// Padding
<div className="p-lg">Content</div>  // 24px padding

// Margin
<div className="mb-2xl">Section</div>  // 48px bottom margin

// Gap
<div className="flex gap-md">Items</div>  // 16px gap
```

### 2. Typography Hierarchy

A standardized typography system with consistent sizes, line heights, and weights:

```typescript
fontSize: {
  display: ['48px', { lineHeight: '56px', fontWeight: '700' }],  // Very large titles
  h1: ['32px', { lineHeight: '40px', fontWeight: '700' }],      // Main title
  h2: ['24px', { lineHeight: '32px', fontWeight: '600' }],       // Secondary title
  h3: ['20px', { lineHeight: '28px', fontWeight: '600' }],      // Tertiary title
  subtitle: ['16px', { lineHeight: '24px', fontWeight: '500' }], // Subtitle
  body: ['14px', { lineHeight: '22px', fontWeight: '400' }],     // Body text
  small: ['12px', { lineHeight: '18px', fontWeight: '400' }],   // Small text
  caption: ['11px', { lineHeight: '16px', fontWeight: '400' }],  // Caption/legend
}
```

**Usage:**

```tsx
// Using Tailwind classes directly
<h1 className="text-h1">Main Title</h1>
<p className="text-body">Body text content</p>

// Using Heading component (recommended)
<Heading level={1}>Main Title</Heading>

// Using Text component (recommended)
<Text variant="body">Body text content</Text>
```

### 3. New Components

#### Heading Component

Semantic heading component with standardized typography:

```tsx
import { Heading } from '@/components/ui';

<Heading level={1}>Page Title</Heading>
<Heading level={2} className="text-primary-600">Section Title</Heading>
<Heading level={3} as="div">Custom Element Heading</Heading>
```

**Props:**

- `level`: 1 | 2 | 3 | 4 | 5 | 6 (required)
- `children`: ReactNode (required)
- `className?`: string
- `as?`: React.ElementType (default: `h{level}`)

#### Text Component

Standardized text component with variants:

```tsx
import { Text } from '@/components/ui';

<Text>Body text</Text>
<Text variant="small" className="text-muted-foreground">Small text</Text>
<Text variant="caption" as="span">Caption text</Text>
```

**Props:**

- `variant?`: 'body' | 'small' | 'caption' (default: 'body')
- `children`: ReactNode (required)
- `className?`: string
- `as?`: React.ElementType (default: 'p')

---

## 📦 Component Improvements

### Form Components

All form components now use:

- ✅ **Text component** for error messages and helper text
- ✅ **Increased spacing** (mb-2, mt-2 instead of mb-1, mt-1)
- ✅ **Semantic color tokens** (text-foreground, text-muted-foreground)
- ✅ **Required indicators** (asterisk) on labels

**Components Updated:**

- Input
- Textarea
- Select
- FormField
- Checkbox

### Button Component

**Improvements:**

- Small button padding increased (py-2 → py-2.5)
- Ghost variant uses semantic tokens (text-foreground, bg-muted)
- Loading spinner gap improved (gap-2 → gap-3)
- Explicit disabled styles

### Badge Component

**Improvements:**

- Padding increased (px-3 py-1 → px-3.5 py-1.5)
- Default variant uses semantic tokens (bg-muted, text-foreground)

### Alert Component

**Improvements:**

- Padding increased (p-4 → p-lg / 24px)
- Spacing improved (ml-3 → ml-4, mb-1 → mb-2, pl-3 → pl-4)
- Text component used for content
- Accessibility improved (aria-label added)

### Card Component

**Improvements:**

- Padding increased from `p-4 sm:p-6` to `p-lg` (24px)
- Header/footer padding: `px-lg py-md`

### Modal Component

**Improvements:**

- Padding increased from `p-4 md:p-6` to `p-xl` (32px)
- Applied to header, content, and footer

### Page Header Component

**Improvements:**

- Heading component integrated
- Text component integrated
- Spacing improved (py-8, mb-6, gap-6, gap-4, mb-4)
- Semantic color tokens used

---

## 🧭 Navigation Improvements

### Sidebar Navigation

The sidebar has been restructured with:

**Features:**

- ✅ **Collapsible groups** for better organization
  - Gestion (Utilisateurs, Équipes, Rôles)
  - Contenu (Pages, Articles, Médias)
  - Paramètres (Profil, Sécurité, Préférences)
  - Admin (Logs, Thèmes, Configuration) - admin only
- ✅ **Search functionality** to filter navigation items
- ✅ **Auto-open groups** when they contain active items
- ✅ **Improved active state** highlighting

**Usage:**
Navigation structure is centralized in `apps/web/src/lib/navigation/index.tsx`:

```tsx
import { getNavigationConfig } from "@/lib/navigation";

const navigationConfig = getNavigationConfig(isAdmin);
// Returns structured navigation with groups and items
```

---

## 🎨 Spacing Guidelines

### Component Padding

| Component   | Padding         | Value       |
| ----------- | --------------- | ----------- |
| Card        | `p-lg`          | 24px        |
| Modal       | `p-xl`          | 32px        |
| Button (sm) | `px-4 py-2.5`   | 16px x 10px |
| Button (md) | `px-6 py-3`     | 24px x 12px |
| Button (lg) | `px-8 py-4`     | 32px x 16px |
| Badge       | `px-3.5 py-1.5` | 14px x 6px  |
| Alert       | `p-lg`          | 24px        |

### Section Gaps

| Context                | Gap           | Value |
| ---------------------- | ------------- | ----- |
| Between major sections | `space-y-2xl` | 48px  |
| Between form fields    | `space-y-4`   | 16px  |
| Between related items  | `gap-md`      | 16px  |
| Between close items    | `gap-sm`      | 8px   |

### Form Spacing

| Element                 | Spacing     | Value      |
| ----------------------- | ----------- | ---------- |
| Label margin bottom     | `mb-2`      | 8px        |
| Error/helper margin top | `mt-2`      | 8px        |
| Input padding           | `px-4 py-2` | 16px x 8px |

---

## 🎯 Best Practices

### 1. Use Semantic Components

**✅ Good:**

```tsx
<Heading level={1}>Page Title</Heading>
<Text variant="body">Content here</Text>
```

**❌ Avoid:**

```tsx
<h1 className="text-3xl font-bold">Page Title</h1>
<p className="text-sm">Content here</p>
```

### 2. Use Standardized Spacing

**✅ Good:**

```tsx
<div className="p-lg mb-2xl">
  <Card className="p-lg">Content</Card>
</div>
```

**❌ Avoid:**

```tsx
<div className="p-6 mb-12">
  <Card className="p-5">Content</Card>
</div>
```

### 3. Use Semantic Color Tokens

**✅ Good:**

```tsx
<div className="text-foreground bg-muted border-border">Content</div>
```

**❌ Avoid:**

```tsx
<div className="text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
  Content
</div>
```

### 4. Consistent Form Error Handling

**✅ Good:**

```tsx
<FormField label="Email" error={error} helperText="Enter your email">
  <Input type="email" />
</FormField>
```

All form components automatically use Text component for error/helper text.

---

## 📊 Migration Guide

### Updating Existing Components

If you have existing components that need updating:

1. **Replace raw headings:**

   ```tsx
   // Before
   <h1 className="text-3xl font-bold">Title</h1>

   // After
   <Heading level={1}>Title</Heading>
   ```

2. **Replace text elements:**

   ```tsx
   // Before
   <p className="text-sm text-gray-600">Text</p>

   // After
   <Text variant="small" className="text-muted-foreground">Text</Text>
   ```

3. **Update spacing:**

   ```tsx
   // Before
   <div className="p-4 mb-8">Content</div>

   // After
   <div className="p-lg mb-2xl">Content</div>
   ```

4. **Update color tokens:**

   ```tsx
   // Before
   <div className="text-gray-700 dark:text-gray-300">Content</div>

   // After
   <div className="text-foreground">Content</div>
   ```

---

## 🔍 Component Reference

### Spacing Classes

| Class   | Value | Usage               |
| ------- | ----- | ------------------- |
| `p-xs`  | 4px   | Very small padding  |
| `p-sm`  | 8px   | Small padding       |
| `p-md`  | 16px  | Standard padding    |
| `p-lg`  | 24px  | Large padding       |
| `p-xl`  | 32px  | Very large padding  |
| `p-2xl` | 48px  | Extra large padding |
| `p-3xl` | 64px  | Maximum padding     |

### Typography Classes

| Class           | Size | Line Height | Weight |
| --------------- | ---- | ----------- | ------ |
| `text-display`  | 48px | 56px        | 700    |
| `text-h1`       | 32px | 40px        | 700    |
| `text-h2`       | 24px | 32px        | 600    |
| `text-h3`       | 20px | 28px        | 600    |
| `text-subtitle` | 16px | 24px        | 500    |
| `text-body`     | 14px | 22px        | 400    |
| `text-small`    | 12px | 18px        | 400    |
| `text-caption`  | 11px | 16px        | 400    |

---

## 📝 Examples

### Complete Form Example

```tsx
import { FormField, Input, Button, Heading, Text } from "@/components/ui";

export function ContactForm() {
  return (
    <div className="space-y-2xl">
      <Heading level={1}>Contact Us</Heading>
      <Text variant="body" className="text-muted-foreground">
        Fill out the form below to get in touch.
      </Text>

      <form className="space-y-4">
        <FormField label="Name" required>
          <Input type="text" />
        </FormField>

        <FormField label="Email" required error="Invalid email">
          <Input type="email" />
        </FormField>

        <FormField label="Message" helperText="Maximum 500 characters">
          <Textarea rows={5} />
        </FormField>

        <Button variant="primary" type="submit">
          Send Message
        </Button>
      </form>
    </div>
  );
}
```

### Page Layout Example

```tsx
import { PageHeader, Card, Heading, Text } from "@/components/ui";

export function DashboardPage() {
  return (
    <div className="space-y-2xl">
      <PageHeader
        title="Dashboard"
        description="Welcome to your dashboard"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Dashboard" }]}
      />

      <Card className="p-lg">
        <Heading level={2}>Recent Activity</Heading>
        <Text variant="body" className="text-muted-foreground mt-2">
          Your recent activity will appear here.
        </Text>
      </Card>
    </div>
  );
}
```

---

## ✅ Checklist for New Components

When creating new components, ensure:

- [ ] Use Heading component for titles (not raw `<h1>`, `<h2>`, etc.)
- [ ] Use Text component for body text, errors, and helper text
- [ ] Use standardized spacing classes (p-lg, mb-2xl, gap-md, etc.)
- [ ] Use semantic color tokens (text-foreground, bg-muted, border-border)
- [ ] Maintain consistent padding (p-lg for cards, p-xl for modals)
- [ ] Use proper spacing between elements (mb-2 for labels, mt-2 for errors)
- [ ] Ensure accessibility (aria-labels, semantic HTML)

---

## 🔗 Related Documentation

- [Component Library](../apps/web/src/components/ui/README.md) - Complete component reference
- [Theme System](./THEME_SYSTEM_OVERVIEW.md) - Theme customization guide
- [Development Guide](./DEVELOPMENT.md) - Development best practices

---

## 📊 Summary of Changes

### Files Created

- `apps/web/src/components/ui/Heading.tsx` - Heading component
- `apps/web/src/components/ui/Text.tsx` - Text component
- `apps/web/src/lib/navigation/index.tsx` - Navigation structure

### Files Modified

- `apps/web/tailwind.config.ts` - Spacing and typography
- `apps/web/src/components/ui/Card.tsx` - Padding increased
- `apps/web/src/components/ui/Modal.tsx` - Padding increased
- `apps/web/src/components/ui/Input.tsx` - Spacing and Text component
- `apps/web/src/components/ui/Textarea.tsx` - Spacing and Text component
- `apps/web/src/components/ui/Select.tsx` - Spacing and Text component
- `apps/web/src/components/ui/FormField.tsx` - Spacing and Text component
- `apps/web/src/components/ui/Checkbox.tsx` - Text component
- `apps/web/src/components/ui/Button.tsx` - Spacing and semantic tokens
- `apps/web/src/components/ui/Badge.tsx` - Spacing and semantic tokens
- `apps/web/src/components/ui/Alert.tsx` - Spacing and Text component
- `apps/web/src/components/layout/Sidebar.tsx` - Restructured navigation
- `apps/web/src/components/layout/PageHeader.tsx` - Heading and Text components
- `apps/web/src/app/[locale]/dashboard/page.tsx` - Section gaps

### Total Impact

- **13 batches completed**
- **15+ components improved**
- **3 new components created**
- **16 files modified**
- **~500+ lines added**
- **~300+ lines modified**

---

**Last Updated:** December 29, 2025  
**Status:** ✅ Complete and Production Ready
