# Content Components

Content management components for CMS functionality including pages, posts, media, and more.

## 📦 Components

- **ContentDashboard** - Overview dashboard for content management
- **PagesManager** - CRUD interface for managing pages
- **PostsManager** - CRUD interface for managing blog posts
- **MediaLibrary** - Media file management with gallery/grid/list views
- **CategoriesManager** - Category management interface
- **TagsManager** - Tag management interface
- **TemplatesManager** - Content template management
- **ScheduledContentManager** - Content scheduling interface
- **ContentPreview** - Preview content in modal

## 📖 Usage Examples

### Content Dashboard

```tsx
import { ContentDashboard } from '@/components/content';

<ContentDashboard
  stats={{
    totalPages: 12,
    totalPosts: 45,
    totalMedia: 128,
    totalCategories: 8,
    totalTags: 32,
    scheduledContent: 5,
  }}
/>;
```

### Pages Manager

```tsx
import { PagesManager } from '@/components/content';

<PagesManager
  pages={pagesList}
  onPageCreate={async (page) => await createPage(page)}
  onPageUpdate={async (id, page) => await updatePage(id, page)}
/>;
```

### Media Library

```tsx
import { MediaLibrary } from '@/components/content';

<MediaLibrary media={mediaItems} viewMode="grid" onMediaSelect={(item) => handleSelect(item)} />;
```

## 🎨 Features

- **Full CRUD**: Create, read, update, delete operations
- **Media Management**: Upload, organize, and manage media files
- **Content Scheduling**: Schedule content for future publication
- **Category & Tags**: Organize content with categories and tags
- **Templates**: Reusable content templates
- **Preview**: Preview content before publishing

## 🔧 Configuration

### ContentDashboard

- `stats`: Content statistics object
- `className`: Additional CSS classes

### PagesManager

- `pages`: Array of page objects
- `onPageCreate`: Create callback
- `onPageUpdate`: Update callback
- `onPageDelete`: Delete callback

### MediaLibrary

- `media`: Array of media items
- `viewMode`: 'grid' | 'list' | 'gallery'
- `onMediaSelect`: Select callback

## 🔗 Related Components

- See `/components/cms` for form and menu builders
- See `/components/blog` for public blog components
- See `/components/ui` for DataTable and other UI components
