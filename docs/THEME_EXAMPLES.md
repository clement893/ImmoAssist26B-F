# Theme Examples

## Complete Theme Configurations

### Modern Minimal Theme

```json
{
  "primary_color": "#1f2937",
  "secondary_color": "#6b7280",
  "font_family": "system-ui, -apple-system, sans-serif",
  "border_radius": "0.375rem",
  "layout": {
    "spacing": {
      "unit": "0.25rem",
      "scale": 1.5,
      "md": "1rem",
      "lg": "1.5rem"
    },
    "gaps": {
      "normal": "1rem",
      "loose": "2rem"
    }
  }
}
```

### Neon Cyberpunk Theme

```json
{
  "primary_color": "#06b6d4",
  "secondary_color": "#a855f7",
  "font_family": "JetBrains Mono, monospace",
  "border_radius": "0.25rem",
  "mode": "dark",
  "effects": {
    "glassmorphism": {
      "enabled": true,
      "card": {
        "background": "rgba(6, 182, 212, 0.1)",
        "backdropBlur": "10px",
        "border": "1px solid rgba(6, 182, 212, 0.3)"
      }
    }
  }
}
```

### Corporate Professional Theme

```json
{
  "primary_color": "#1e40af",
  "secondary_color": "#475569",
  "font_family": "Roboto, sans-serif",
  "border_radius": "0.25rem",
  "layout": {
    "containers": {
      "sm": "600px",
      "md": "768px",
      "lg": "1024px"
    }
  },
  "typography": {
    "fontWeight": {
      "normal": "400",
      "medium": "500",
      "semibold": "600"
    }
  }
}
```

## Component Examples

### Themed Button

```tsx
import { Button } from "@/components/ui";

// Automatically uses theme sizes and variants
<Button variant="primary" size="md">
  Themed Button
</Button>;
```

### Themed Form

```tsx
import { Input, Select, Button } from "@/components/ui";

// All form elements use theme colors and sizes
<form>
  <Input label="Email" type="email" />
  <Select label="Country" options={options} />
  <Button variant="primary">Submit</Button>
</form>;
```

### Themed Layout

```tsx
import { Container, Stack, Grid } from "@/components/ui";

<Container size="lg">
  <Stack gap="normal">
    <Grid columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap="normal">
      <Card>Item 1</Card>
      <Card>Item 2</Card>
      <Card>Item 3</Card>
    </Grid>
  </Stack>
</Container>;
```

## See Live Examples

Visit the theme showcase pages:

- `/components/theme-showcase` - Main showcase
- `/components/theme-showcase/modern-minimal` - Modern Minimal
- `/components/theme-showcase/glassmorphism` - Glassmorphism
- `/components/theme-showcase/neon-cyberpunk` - Neon Cyberpunk
- `/components/theme-showcase/corporate-professional` - Corporate Professional
- `/components/theme-showcase/playful-colorful` - Playful Colorful
