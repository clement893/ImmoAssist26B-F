# Search Components

Components for search functionality with autocomplete and advanced filtering.

## 📦 Components

- **SearchBar** - Search bar with autocomplete
- **AdvancedFilters** - Advanced filtering interface

## 📖 Usage Examples

### Search Bar

```tsx
import { SearchBar } from '@/components/search';

<SearchBar
  entityType="users"
  onResults={(results) => handleResults(results)}
  onSelect={(item) => handleSelect(item)}
  placeholder="Search users..."
/>;
```

### Advanced Filters

```tsx
import { AdvancedFilters } from '@/components/search';
import type { FilterConfig } from '@/components/search';

<AdvancedFilters
  filters={filterConfigs}
  availableFields={[
    { value: 'name', label: 'Name', type: 'string' },
    { value: 'email', label: 'Email', type: 'string' },
    { value: 'created_at', label: 'Created At', type: 'date' },
  ]}
  onFiltersChange={(filters) => handleFiltersChange(filters)}
/>;
```

## 🎨 Features

- **Autocomplete**: Real-time search suggestions
- **Entity Support**: Search across different entity types
- **Advanced Filters**: Complex filtering with multiple operators
- **Debouncing**: Debounced search queries
- **Keyboard Navigation**: Arrow key navigation
- **Accessibility**: ARIA labels and keyboard support

## 🔧 Configuration

### SearchBar

- `entityType`: Type of entity to search ('users' | 'projects')
- `onResults`: Results callback
- `onSelect`: Selection callback
- `placeholder`: Input placeholder
- `showAutocomplete`: Show autocomplete suggestions
- `className`: Additional CSS classes

### AdvancedFilters

- `filters`: Array of filter configurations
- `availableFields`: Available fields for filtering
- `onFiltersChange`: Filters change callback
- `className`: Additional CSS classes

## 🔗 Related Components

- See `/components/ui` for Input component
- See `/components/data` for data export/import
