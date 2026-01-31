# UI Components

Core reusable UI component library - Foundation components used throughout the application.

## 🎨 UX/UI Improvements

This component library has been enhanced with:

- ✅ **Standardized spacing** - Consistent padding and margins
- ✅ **Typography system** - Heading and Text components for consistency
- ✅ **Improved visual breathing room** - Increased padding across components
- ✅ **Semantic color tokens** - Better theme support
- ✅ **Enhanced accessibility** - ARIA labels and semantic HTML

See [UX/UI Guide](../../../../docs/UX_UI_GUIDE.md) for complete documentation.

## 📦 Components

### Typography Components

- **Heading** - Semantic heading component (h1-h6) with standardized typography
- **Text** - Text component with variants (body, small, caption)

### Form Components

- **Button** - Versatile button with multiple variants and sizes
- **Input** - Text input with validation and icons
- **Textarea** - Multi-line text input
- **Select** - Dropdown select with search
- **Checkbox** - Checkbox input
- **Radio** - Radio button group
- **Switch** - Toggle switch
- **DatePicker** - Date selection picker
- **TimePicker** - Time selection picker
- **FileUpload** - File upload component
- **FileUploadWithPreview** - File upload with preview
- **Slider** - Range slider input
- **Range** - Dual-handle range slider
- **ColorPicker** - Color selection picker
- **TagInput** - Tag input with autocomplete
- **Autocomplete** - Autocomplete input
- **MultiSelect** - Multi-select dropdown
- **RichTextEditor** - WYSIWYG rich text editor
- **Form** & **FormField** - Form wrapper and field components
- **FormBuilder** - Dynamic form builder

### Layout Components

- **Card** - Card container component
- **Container** - Page container wrapper
- **Tabs** - Tab navigation (TabList, Tab, TabPanels, TabPanel)
- **Accordion** - Collapsible accordion
- **Sidebar** - Sidebar navigation
- **Divider** - Visual divider
- **Breadcrumb** - Breadcrumb navigation
- **Drawer** - Slide-out drawer panel
- **Popover** - Popover overlay
- **Stepper** - Step-by-step wizard
- **TreeView** - Hierarchical tree view

### Data Display Components

- **DataTable** - Advanced data table with sorting/filtering
- **DataTableEnhanced** - Enhanced data table with bulk actions
- **Table** - Table primitives (TableHead, TableBody, TableRow, TableHeader, TableCell)
- **VirtualTable** - Virtualized table for large datasets
- **Pagination** - Pagination controls
- **EmptyState** - Empty state placeholder
- **StatsCard** - Statistics card display
- **Timeline** - Timeline component
- **List** - List component
- **KanbanBoard** - Kanban board for task management
- **Calendar** - Calendar component with events
- **Chart** - Basic chart component
- **AdvancedCharts** - Advanced chart types (scatter, radar, etc.)

### Feedback Components

- **Alert** - Alert/notification component
- **Toast** & **ToastContainer** - Toast notifications
- **Loading** - Loading spinner
- **Skeleton** - Skeleton loading state
- **Progress** - Progress bar
- **Spinner** - Spinner component
- **Modal** & **ConfirmModal** - Modal dialogs
- **Tooltip** - Tooltip component
- **Banner** - Banner notification

### Utility Components

- **Badge** - Badge component
- **Dropdown** - Dropdown menu
- **Avatar** - Avatar component (AvatarImage, AvatarFallback)
- **ThemeToggle** - Theme switcher
- **ClientOnly** - Client-side only wrapper
- **SearchBar** - Search input component
- **CommandPalette** - Command palette (Cmd+K)
- **CRUDModal** - CRUD operation modal
- **ExportButton** - Data export button
- **ErrorBoundary** - Error boundary wrapper

## 📖 Usage Examples

### Button

```tsx
import { Button } from '@/components/ui';

<Button variant="primary" size="md" onClick={handleClick}>
  Click me
</Button>;
```

### Input

```tsx
import { Input } from '@/components/ui';

<Input label="Email" type="email" placeholder="your@email.com" required error="Invalid email" />;
```

### DataTable

```tsx
import { DataTable } from '@/components/ui';

<DataTable data={users} columns={columns} onRowClick={handleRowClick} pagination searchable />;
```

### Modal

```tsx
import { Modal } from '@/components/ui';

<Modal isOpen={isOpen} onClose={handleClose} title="Confirm">
  <p>Are you sure?</p>
</Modal>;
```

## 🎨 Theming

All UI components support theming via CSS variables:

```tsx
// Components automatically use theme variables
<Button variant="primary">Themed Button</Button>
```

## ♿ Accessibility

All components include:

- ARIA labels and roles
- Keyboard navigation
- Focus management
- Screen reader support

## 📚 Storybook

View interactive component documentation:

```bash
pnpm storybook
```

## 🔗 Related

- [Component Showcase](/components)
- [Form Components Showcase](/components/forms)
- [Data Components Showcase](/components/data)
- [Feedback Components Showcase](/components/feedback)
