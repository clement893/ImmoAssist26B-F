# Favorites Components

Components for managing user favorites and bookmarks.

## 📦 Components

- **FavoriteButton** - Toggle favorite status for entities
- **FavoritesList** - Display list of user favorites

## 📖 Usage Examples

### Favorite Button

```tsx
import { FavoriteButton } from '@/components/favorites';

<FavoriteButton entityType="post" entityId={123} showCount={true} size="md" />;
```

### Favorites List

```tsx
import { FavoritesList } from '@/components/favorites';

<FavoritesList entityType="post" onFavoriteClick={(favorite) => handleClick(favorite)} />;
```

## 🎨 Features

- **Toggle Favorites**: Add/remove favorites with one click
- **Favorite Count**: Display number of favorites
- **Entity Support**: Support for any entity type
- **Notes**: Add notes to favorites
- **Tags**: Tag favorites for organization
- **Quick Access**: Quick access to favorited items

## 🔧 Configuration

### FavoriteButton

- `entityType`: Type of entity (e.g., 'post', 'project')
- `entityId`: ID of the entity
- `showCount`: Show favorite count
- `size`: Button size ('sm' | 'md' | 'lg')

### FavoritesList

- `entityType`: Filter by entity type (optional)
- `onFavoriteClick`: Click callback

## 🔗 Related Components

- See `/components/ui` for Button component
- See `/components/sharing` for sharing components
