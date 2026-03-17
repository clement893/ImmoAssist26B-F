# Animation System Guide

## Overview

The animation system allows you to customize animation durations and easing functions across your application.

## Configuration

### Durations

```json
{
  "animations": {
    "duration": {
      "fast": "150ms",
      "normal": "200ms",
      "slow": "300ms",
      "slower": "500ms"
    }
  }
}
```

### Easing Functions

```json
{
  "animations": {
    "easing": {
      "default": "cubic-bezier(0.4, 0, 0.2, 1)",
      "in": "cubic-bezier(0.4, 0, 1, 1)",
      "out": "cubic-bezier(0, 0, 0.2, 1)",
      "inOut": "cubic-bezier(0.4, 0, 0.2, 1)"
    }
  }
}
```

## CSS Variables

The animation system sets these CSS variables:

- `--animation-duration-fast`
- `--animation-duration-normal`
- `--animation-duration-slow`
- `--animation-duration-slower`
- `--animation-easing-default`
- `--animation-easing-in`
- `--animation-easing-out`
- `--animation-easing-inOut`

## Usage

### In CSS

```css
.my-element {
  transition-duration: var(--animation-duration-normal);
  transition-timing-function: var(--animation-easing-default);
}
```

### In Tailwind

```tsx
<div className="transition-all duration-[var(--animation-duration-normal)] ease-[var(--animation-easing-default)]">
  Content
</div>
```

### In Inline Styles

```tsx
<div
  style={{
    transitionDuration: "var(--animation-duration-normal)",
    transitionTimingFunction: "var(--animation-easing-default)",
  }}
>
  Content
</div>
```

## Examples

See the [Theme Examples](./THEME_EXAMPLES.md) for complete animation examples.
