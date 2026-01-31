# ERP UI Component Library

Complete UI component library for ERP applications.

## 📦 Available Components

### Base Components

#### Button

Button with multiple variants and sizes.

```tsx
import { Button } from '@/components/ui';

<Button variant="primary" size="md" onClick={handleClick}>
  Click me
</Button>;
```

**Props:**

- `variant`: `'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'`
- `size`: `'sm' | 'md' | 'lg'`
- `disabled`: `boolean`
- `loading`: `boolean`

#### Input

Input field with icon support.

```tsx
import { Input } from '@/components/ui';

<Input
  placeholder="Enter text"
  leftIcon={<SearchIcon />}
  rightIcon={<ClearIcon />}
  error="Error message"
/>;
```

#### Checkbox

Checkbox with indeterminate state support.

```tsx
import { Checkbox } from '@/components/ui';

<Checkbox
  label="Accept terms"
  checked={checked}
  indeterminate={indeterminate}
  onChange={(checked) => setChecked(checked)}
/>;
```

#### Badge

Badge to display statuses or labels.

```tsx
import { Badge } from '@/components/ui';

<Badge variant="success">Active</Badge>
<Badge variant="error">Inactive</Badge>
```

**Variants:** `'default' | 'success' | 'warning' | 'error' | 'info'`

### Layout Components

#### Card

Card to display grouped content.

```tsx
import { Card } from '@/components/ui';

<Card title="Card Title" subtitle="Card subtitle" footer={<Button>Action</Button>}>
  Card content
</Card>;
```

#### Tabs

Tab navigation.

```tsx
import { Tabs } from '@/components/ui';

<Tabs
  tabs={[
    { id: '1', label: 'Tab 1', content: <div>Content 1</div> },
    { id: '2', label: 'Tab 2', content: <div>Content 2</div> },
  ]}
  variant="pills"
/>;
```

**Variants:** `'default' | 'pills' | 'underline'`

#### Accordion

Collapsible content.

```tsx
import { Accordion } from '@/components/ui';

<Accordion
  items={[
    {
      id: '1',
      title: 'Section 1',
      content: <div>Content</div>,
      defaultOpen: true,
    },
  ]}
  allowMultiple={false}
/>;
```

### Data Components

#### DataTable

Data table with search, sorting, and pagination.

```tsx
import { DataTable } from '@/components/ui';

<DataTable
  data={users}
  columns={[
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', filterable: true },
  ]}
  pageSize={10}
  searchable
  onRowClick={(row) => console.log(row)}
/>;
```

#### DataTableEnhanced

Enhanced version with multiple selection and bulk actions.

```tsx
import { DataTableEnhanced } from '@/components/ui';

<DataTableEnhanced
  data={users}
  columns={columns}
  selectable
  bulkActions={[
    {
      label: 'Delete',
      onClick: (selected) => deleteUsers(selected),
      variant: 'danger',
      requireConfirmation: true,
    },
  ]}
  exportOptions={[{ label: 'Export CSV', format: 'csv', onClick: exportCSV }]}
  onSelectionChange={(selected) => console.log(selected)}
/>;
```

### Overlay Components

#### Modal

Complete modal dialog.

```tsx
import { Modal } from '@/components/ui';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  size="lg"
  footer={<Button onClick={handleSave}>Save</Button>}
>
  Modal content
</Modal>;
```

**Sizes:** `'sm' | 'md' | 'lg' | 'xl' | 'full'`

#### ConfirmModal

Pre-configured confirmation modal.

```tsx
import { ConfirmModal } from '@/components/ui';

<ConfirmModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onConfirm={handleConfirm}
  message="Are you sure?"
  variant="danger"
/>;
```

#### Tooltip

Contextual tooltip.

```tsx
import { Tooltip } from '@/components/ui';

<Tooltip content="Tooltip text" position="top">
  <Button>Hover me</Button>
</Tooltip>;
```

**Positions:** `'top' | 'bottom' | 'left' | 'right'`

### Form Components

#### Form

Complete form with validation.

```tsx
import { Form } from '@/components/ui';

<Form
  fields={[
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      validation: (value) => {
        if (!value) return 'Email is required';
        if (!/\S+@\S+\.\S+/.test(String(value))) return 'Invalid email';
        return null;
      },
    },
    {
      name: 'role',
      label: 'Role',
      type: 'select',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'User', value: 'user' },
      ],
    },
  ]}
  onSubmit={handleSubmit}
  initialValues={{ email: 'user@example.com' }}
/>;
```

#### FormField

Form field with full control.

```tsx
import { FormField } from '@/components/ui';

<FormField
  label="Email"
  name="email"
  required
  error={errors.email}
  helpText="Enter your email address"
>
  <Input type="email" />
</FormField>;
```

### Feedback Components

#### Alert

Alerts and notifications.

```tsx
import { Alert } from '@/components/ui';

<Alert variant="success" title="Success" onClose={() => {}}>
  Operation completed successfully
</Alert>;
```

**Variants:** `'info' | 'success' | 'warning' | 'error'`

### Utility Components

#### Avatar

User avatar with fallback.

```tsx
import { Avatar } from '@/components/ui';

<Avatar src="/avatar.jpg" alt="User" fallback="JD" size="lg" />;
```

#### Pagination

Pagination for lists.

```tsx
import { Pagination } from '@/components/ui';

<Pagination currentPage={1} totalPages={10} onPageChange={(page) => setPage(page)} />;
```

## 🎨 Theme and Customization

All components support dark mode automatically via Tailwind `dark:` classes.

### Color Customization

Components use standardized color variants:

- **Primary**: Blue (`blue-600`)
- **Success**: Green (`green-600`)
- **Warning**: Yellow (`yellow-600`)
- **Error**: Red (`red-600`)
- **Info**: Light blue (`blue-500`)

## 📚 Usage Examples

### Complete Form with Validation

```tsx
'use client';

import { useState } from 'react';
import { Form, Modal, Alert } from '@/components/ui';

export function UserForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (data) => {
    try {
      await createUser(data);
      setSuccess(true);
      setIsOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Add User</button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add User">
        <Form
          fields={[
            { name: 'name', label: 'Name', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            {
              name: 'role',
              label: 'Role',
              type: 'select',
              options: [
                { label: 'Admin', value: 'admin' },
                { label: 'User', value: 'user' },
              ],
            },
          ]}
          onSubmit={handleSubmit}
        />
      </Modal>

      {success && (
        <Alert variant="success" onClose={() => setSuccess(false)}>
          User created successfully
        </Alert>
      )}
    </>
  );
}
```

### Table with Bulk Actions

```tsx
'use client';

import { DataTableEnhanced } from '@/components/ui';

export function UsersTable({ users }) {
  const handleBulkDelete = async (selected) => {
    await Promise.all(selected.map((user) => deleteUser(user.id)));
  };

  const handleExport = (data) => {
    // Export logic
    console.log('Exporting', data);
  };

  return (
    <DataTableEnhanced
      data={users}
      columns={[
        { key: 'name', label: 'Name', sortable: true },
        { key: 'email', label: 'Email', filterable: true },
        { key: 'role', label: 'Role' },
      ]}
      selectable
      bulkActions={[
        {
          label: 'Delete Selected',
          onClick: handleBulkDelete,
          variant: 'danger',
          requireConfirmation: true,
          confirmationMessage: 'Are you sure you want to delete selected users?',
        },
      ]}
      exportOptions={[
        { label: 'Export CSV', format: 'csv', onClick: handleExport },
        { label: 'Export Excel', format: 'xlsx', onClick: handleExport },
      ]}
    />
  );
}
```

## 🔧 TypeScript Types

All components are fully typed with TypeScript. Types are exported from `@/components/ui`:

```typescript
import type { Column, DataTableProps, ModalProps, FormProps, AlertVariant } from '@/components/ui';
```

## 📖 Complete Documentation

For more details on each component, see the source files in `src/components/ui/`.
