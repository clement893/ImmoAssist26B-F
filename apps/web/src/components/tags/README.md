# Tags Components

Components for managing and inputting tags for content organization.

## 📦 Components

- **TagInput** - Input component for adding tags
- **TagManager** - Manage tags for entities

## 📖 Usage Examples

### Tag Input

```tsx
import { TagInput } from '@/components/tags';

<TagInput
  entityType="post"
  entityId={123}
  selectedTags={selectedTags}
  onTagsChange={(tags) => handleTagsChange(tags)}
  placeholder="Add tags..."
  allowCreate={true}
/>;
```

### Tag Manager

```tsx
import { TagManager } from '@/components/tags';

<TagManager entityType="post" />;
```

## 🎨 Features

- **Autocomplete**: Tag suggestions as you type
- **Tag Creation**: Create new tags on the fly
- **Tag Colors**: Assign colors to tags
- **Tag Management**: View and manage all tags
- **Usage Tracking**: Track tag usage counts
- **Popular Tags**: Show popular tags
- **Entity Support**: Support for any entity type

## 🔧 Configuration

### TagInput

- `entityType`: Type of entity
- `entityId`: ID of the entity
- `selectedTags`: Array of selected tag objects
- `onTagsChange`: Tags change callback
- `placeholder`: Input placeholder
- `allowCreate`: Allow creating new tags

### TagManager

- `entityType`: Type of entity to manage tags for
- `className`: Additional CSS classes

## 🔗 Related Components

- See `/components/content` for TagsManager
- See `/components/ui` for Input component
