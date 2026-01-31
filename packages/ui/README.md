# @immoassist/ui

Bibliothèque de composants UI partagés pour ImmoAssist.

## Installation

```bash
pnpm add @immoassist/ui
```

## Usage

### Composants

```tsx
import { Button, Card, Input } from '@immoassist/ui';

export default function MyComponent() {
  return (
    <Card>
      <Input label="Email" type="email" />
      <Button variant="primary">Submit</Button>
    </Card>
  );
}
```

### Hooks

```tsx
import { useForm, usePagination } from '@immoassist/ui/hooks';

function MyForm() {
  const { register, handleSubmit } = useForm();
  // ...
}
```

## Structure

- `components/` - Composants React réutilisables
- `hooks/` - Hooks React partagés

## Composants Disponibles

### Form Components
- Button, Input, Textarea, Select, Checkbox, Radio, Switch
- DatePicker, TimePicker, FileUpload, ColorPicker
- TagInput, MultiSelect, Autocomplete

### Layout Components
- Card, Container, Stack, Grid
- Tabs, Accordion, Divider, Breadcrumb

### Data Display
- DataTable, Table, Chart, KanbanBoard
- Timeline, TreeView, VirtualTable

### Feedback
- Alert, Modal, Toast, Loading, Progress
- Drawer, Popover, Tooltip

### Navigation
- Pagination, CommandPalette, SearchBar

## Développement

```bash
# Build
pnpm build

# Watch mode
pnpm dev

# Type check
pnpm type-check

# Lint
pnpm lint

# Test
pnpm test
```
