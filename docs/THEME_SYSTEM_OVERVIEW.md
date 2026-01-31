# Theme System Overview

## Introduction

The theme system in this template goes far beyond simple color and font customization. It provides a comprehensive solution for creating completely different visual designs while using the same components.

## Key Features

### 🎨 Visual Customization

- **Colors**: Full color palette with automatic shade generation
- **Typography**: Custom fonts, sizes, weights, and families
- **Spacing**: Themeable spacing units, gaps, and container widths
- **Layout**: Customizable grid systems and container sizes
- **Effects**: Glassmorphism, shadows, gradients, and custom effects
- **Animations**: Customizable durations and easing functions

### 🧩 Component Theming

- **Sizes**: Themeable component dimensions (padding, font size, min height)
- **Variants**: Customizable component variants (buttons, badges, alerts)
- **Layouts**: Themeable component layouts and arrangements

### 🛠️ Developer Tools

- **Theme Builder UI**: Visual editor with live preview (`/admin/themes/builder`)
- **Presets**: 5 pre-configured theme presets
- **Export/Import**: JSON-based theme sharing
- **API**: Full REST API for theme management

## Architecture

### Backend

- **Database**: Themes stored in PostgreSQL
- **API**: RESTful endpoints for CRUD operations
- **Validation**: Pydantic schemas for type safety

### Frontend

- **Provider**: `GlobalThemeProvider` applies themes globally
- **Hooks**: Custom hooks for accessing theme values
- **CSS Variables**: Themes applied via CSS custom properties
- **Components**: All components use theme-aware classes

## Quick Start

### 1. Access Theme Management

Navigate to `/admin/themes` (requires superadmin access)

### 2. Use Theme Builder

Navigate to `/admin/themes/builder` for visual theme editing

### 3. Create a Theme

1. Click "Create New Theme"
2. Choose a preset or start from scratch
3. Customize colors, typography, spacing, etc.
4. Preview changes in real-time
5. Save and activate

## Theme Configuration Structure

```json
{
  "primary_color": "#3b82f6",
  "secondary_color": "#8b5cf6",
  "font_family": "Inter, sans-serif",
  "border_radius": "0.5rem",
  "layout": {
    "spacing": { "unit": "0.25rem", "scale": 1.5 },
    "gaps": { "tight": "0.5rem", "normal": "1rem" },
    "containers": { "sm": "640px", "md": "768px" }
  },
  "components": {
    "button": {
      "sizes": { "md": { "paddingX": "0.75rem", "paddingY": "0.5rem" } },
      "variants": { "primary": { "background": "#3b82f6" } }
    }
  },
  "animations": {
    "duration": { "fast": "150ms", "normal": "200ms" },
    "easing": { "default": "cubic-bezier(0.4, 0, 0.2, 1)" }
  },
  "effects": {
    "glassmorphism": {
      "enabled": true,
      "card": { "background": "rgba(255, 255, 255, 0.1)" }
    }
  }
}
```

## Documentation

- **[Theme Setup Guide](./THEME_SETUP.md)** - Initial setup and configuration
- **[Theme Management](./THEME_MANAGEMENT.md)** - Managing themes via API and UI
- **[Theme Creation Guide](./THEME_CREATION_GUIDE.md)** - Creating custom themes
- **[Component Customization](./THEME_COMPONENT_CUSTOMIZATION.md)** - Theming components
- **[Layout System](./THEME_LAYOUT_SYSTEM.md)** - Layout theming guide
- **[Animation System](./THEME_ANIMATION_SYSTEM.md)** - Animation theming guide
- **[Theme Examples](./THEME_EXAMPLES.md)** - Complete theme examples

## Showcase

See 5 different design styles in action:

- `/components/theme-showcase` - Main showcase page
- `/components/theme-showcase/modern-minimal` - Modern Minimal design
- `/components/theme-showcase/glassmorphism` - Glassmorphism design
- `/components/theme-showcase/neon-cyberpunk` - Neon Cyberpunk design
- `/components/theme-showcase/corporate-professional` - Corporate Professional design
- `/components/theme-showcase/playful-colorful` - Playful Colorful design

## Benefits

1. **Complete Design Control**: Change entire visual appearance without code changes
2. **Component Reusability**: Same components, different looks
3. **Easy Customization**: Visual editor makes it accessible to non-developers
4. **Consistent Theming**: All components automatically use theme values
5. **Export/Share**: Themes can be exported and shared as JSON
6. **Presets**: Start quickly with pre-configured themes

## Next Steps

1. Read the [Theme Setup Guide](./THEME_SETUP.md) for initial configuration
2. Explore the [Theme Builder UI](../apps/web/src/app/[locale]/admin/themes/builder) for visual editing
3. Check out the [Theme Examples](./THEME_EXAMPLES.md) for inspiration
4. Review [Component Customization](./THEME_COMPONENT_CUSTOMIZATION.md) for advanced theming
