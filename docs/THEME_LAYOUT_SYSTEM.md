# Layout System Guide

## Overview

The layout system allows you to theme spacing, gaps, and container widths across your application.

## Configuration

### Spacing

```json
{
  "layout": {
    "spacing": {
      "unit": "0.25rem",
      "scale": 1.5,
      "xs": "0.5rem",
      "sm": "0.75rem",
      "md": "1rem",
      "lg": "1.5rem",
      "xl": "2rem",
      "2xl": "3rem",
      "3xl": "4rem"
    }
  }
}
```

### Gaps

```json
{
  "layout": {
    "gaps": {
      "tight": "0.5rem",
      "normal": "1rem",
      "loose": "2rem"
    }
  }
}
```

### Containers

```json
{
  "layout": {
    "containers": {
      "sm": "640px",
      "md": "768px",
      "lg": "1024px",
      "xl": "1280px"
    }
  }
}
```

## Using Layout Components

### Container

```tsx
import { Container } from "@/components/ui";

<Container size="lg">Content</Container>;
```

### Stack

```tsx
import { Stack } from "@/components/ui";

<Stack gap="normal" direction="vertical">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</Stack>;
```

### Grid

```tsx
import { Grid } from "@/components/ui";

<Grid columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap="normal">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</Grid>;
```

## Using Layout Hooks

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

## CSS Variables

The layout system sets these CSS variables:

- `--spacing-xs` through `--spacing-3xl`
- `--gap-tight`, `--gap-normal`, `--gap-loose`
- `--container-sm` through `--container-xl`

## Tailwind Integration

Spacing values are integrated into Tailwind's spacing scale:

```ts
// tailwind.config.ts
spacing: {
  xs: 'var(--spacing-xs, 0.5rem)',
  sm: 'var(--spacing-sm, 0.75rem)',
  md: 'var(--spacing-md, 1rem)',
  // ...
}
```

## Examples

See the [Theme Examples](./THEME_EXAMPLES.md) for complete layout examples.
