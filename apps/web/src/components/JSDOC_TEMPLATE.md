# JSDoc Documentation Template

This template should be used when adding JSDoc comments to components.

## Component Documentation Template

````tsx
/**
 * ComponentName Component
 *
 * Brief description of what the component does and its purpose.
 * Include any important notes about usage, behavior, or dependencies.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ComponentName prop="value" />
 *
 * // Advanced usage
 * <ComponentName
 *   prop1="value1"
 *   prop2="value2"
 *   onAction={(data) => handleAction(data)}
 * />
 * ```
 *
 * @see RelatedComponent - Link to related components
 */
````

## Interface Documentation Template

```tsx
/**
 * ComponentName Props
 */
interface ComponentNameProps {
  /** Brief description of the prop */
  propName: Type;

  /** Optional prop description */
  optionalProp?: Type;

  /**
   * Complex prop with multiple lines of description
   * Can include additional details about usage
   */
  complexProp: {
    /** Nested prop description */
    nestedProp: Type;
  };
}
```

## Prop Documentation Guidelines

### Required Props

- Always document required props
- Use clear, concise descriptions
- Include type information if helpful
- Mention default values if applicable

### Optional Props

- Mark with `?` in TypeScript
- Document default behavior
- Explain when to use

### Complex Props

- Break down nested objects
- Provide examples for complex structures
- Link to type definitions if available

### Callback Props

- Describe when the callback is called
- Document parameters passed to callback
- Provide example usage

## Examples

### Simple Component

````tsx
/**
 * Badge Component
 *
 * Displays a badge with text and optional variant styling.
 *
 * @example
 * ```tsx
 * <Badge variant="success">Active</Badge>
 * <Badge variant="error">Error</Badge>
 * ```
 */
interface BadgeProps {
  /** Badge text content */
  children: ReactNode;
  /** Visual style variant */
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
}
````

### Complex Component

````tsx
/**
 * DataTable Component
 *
 * Advanced data table with sorting, filtering, and pagination.
 * Supports custom cell rendering and row actions.
 *
 * @example
 * ```tsx
 * <DataTable
 *   data={users}
 *   columns={columns}
 *   onRowClick={(user) => handleUserClick(user)}
 *   searchable
 *   pagination
 * />
 * ```
 */
interface DataTableProps<T> {
  /** Table data array */
  data: T[];
  /** Column definitions */
  columns: Column<T>[];
  /** Row click handler */
  onRowClick?: (row: T) => void;
}
````

## Checklist

When documenting a component:

- [ ] Component description added
- [ ] Usage example(s) provided
- [ ] All props documented
- [ ] Type information included
- [ ] Default values mentioned
- [ ] Related components linked
- [ ] Complex props explained
- [ ] Callback props documented

## Priority Order

Document components in this order:

1. **High Priority** - Most commonly used components
   - Button, Input, Card, DataTable, Modal, etc.

2. **Medium Priority** - Feature components
   - BillingDashboard, AnalyticsDashboard, etc.

3. **Low Priority** - Utility and helper components
   - Internal utilities, wrappers, etc.
