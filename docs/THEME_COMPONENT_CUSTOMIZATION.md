# Component Customization Guide

## Overview

Components in this template are fully themeable. They automatically use theme values for colors, sizes, spacing, and variants.

## How Components Use Themes

### 1. Colors

Components use CSS variables that are set by the theme:

- `--color-foreground` - Primary text color
- `--color-muted-foreground` - Secondary text color
- `--color-background` - Background color
- `--color-muted` - Muted background color
- `--color-border` - Border color
- `--color-primary-*` - Primary color shades
- `--color-secondary-*` - Secondary color shades

### 2. Sizes

Components use `useComponentConfig` hook to get theme-defined sizes:

```tsx
const { getComponentSize } = useComponentConfig();
const sizeConfig = getComponentSize("button", "md");
// Returns: { paddingX, paddingY, fontSize, minHeight, borderRadius }
```

### 3. Variants

Components use `useComponentConfig` hook to get theme-defined variants:

```tsx
const { getComponentVariant } = useComponentConfig();
const variantConfig = getComponentVariant("button", "primary");
// Returns: { background, text, border, hover, ... }
```

## Themeable Components

### Core Components

- ✅ Button - Sizes and variants
- ✅ Input - Sizes and colors
- ✅ Textarea - Sizes and colors
- ✅ Select - Sizes and colors
- ✅ Checkbox - Sizes and colors
- ✅ Radio - Sizes and colors
- ✅ Switch - Sizes and colors
- ✅ Card - Padding and colors
- ✅ Badge - Variants
- ✅ Alert - Variants

### Layout Components

- ✅ Container - Widths
- ✅ Stack - Gaps
- ✅ Grid - Gaps and columns
- ✅ Table - Colors and spacing

### Interactive Components

- ✅ Modal - Glassmorphism effects
- ✅ Dropdown - Glassmorphism effects
- ✅ Tabs - Colors and variants
- ✅ Accordion - Colors
- ✅ Breadcrumb - Colors
- ✅ Pagination - Colors

## Configuring Component Themes

### In Theme Config

```json
{
  "components": {
    "button": {
      "sizes": {
        "sm": {
          "paddingX": "0.5rem",
          "paddingY": "0.25rem",
          "fontSize": "0.875rem",
          "minHeight": "2rem",
          "borderRadius": "0.25rem"
        },
        "md": {
          "paddingX": "0.75rem",
          "paddingY": "0.5rem",
          "fontSize": "1rem",
          "minHeight": "2.5rem",
          "borderRadius": "0.375rem"
        }
      },
      "variants": {
        "primary": {
          "background": "#3b82f6",
          "text": "#ffffff",
          "hover": "#2563eb",
          "border": "none",
          "boxShadow": "0 1px 2px rgba(0,0,0,0.1)"
        },
        "secondary": {
          "background": "#6b7280",
          "text": "#ffffff",
          "hover": "#4b5563"
        }
      }
    },
    "input": {
      "sizes": {
        "md": {
          "paddingX": "0.75rem",
          "paddingY": "0.5rem",
          "fontSize": "0.875rem",
          "minHeight": "2.5rem"
        }
      }
    }
  }
}
```

## Using Theme Hooks

### useComponentConfig

```tsx
import { useComponentConfig } from "@/lib/theme/use-component-config";

function MyComponent() {
  const { getComponentSize, getComponentVariant } = useComponentConfig();

  const sizeConfig = getComponentSize("button", "md");
  const variantConfig = getComponentVariant("button", "primary");

  return (
    <button
      style={{
        paddingLeft: sizeConfig.paddingX,
        paddingRight: sizeConfig.paddingX,
        paddingTop: sizeConfig.paddingY,
        paddingBottom: sizeConfig.paddingY,
        fontSize: sizeConfig.fontSize,
        backgroundColor: variantConfig.background,
        color: variantConfig.text,
      }}
    >
      Themed Button
    </button>
  );
}
```

### useThemeSpacing

```tsx
import { useThemeSpacing } from "@/lib/theme/use-theme-spacing";

function MyComponent() {
  const { getSpacing, getGap } = useThemeSpacing();

  return (
    <div style={{ padding: getSpacing("md"), gap: getGap("normal") }}>
      Content
    </div>
  );
}
```

### useLayout

```tsx
import { useLayout } from "@/lib/theme/use-layout";

function MyComponent() {
  const { getGap, getContainerWidth } = useLayout();

  return (
    <div style={{ gap: getGap("normal"), maxWidth: getContainerWidth("lg") }}>
      Content
    </div>
  );
}
```

## Best Practices

1. **Use CSS Variables**: Prefer CSS variables over hardcoded values
2. **Use Theme Hooks**: Use theme hooks for dynamic values
3. **Provide Fallbacks**: Always provide default fallback values
4. **Test Themes**: Test components with different themes
5. **Document Customization**: Document any component-specific theme options

## Examples

See the [Theme Examples](./THEME_EXAMPLES.md) for complete examples of themed components.
