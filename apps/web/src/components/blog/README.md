# Blog Components

Public-facing blog components for displaying blog posts and listings.

## 📦 Components

- **BlogListing** - Display list of blog posts with pagination
- **BlogPost** - Display individual blog post with full content

## 📖 Usage Examples

### Blog Listing

```tsx
import { BlogListing } from '@/components/blog';

<BlogListing
  posts={blogPosts}
  currentPage={1}
  totalPages={10}
  onPageChange={(page) => handlePageChange(page)}
/>;
```

### Blog Post

```tsx
import { BlogPost } from '@/components/blog';
import type { BlogPost as BlogPostType } from '@/components/content';

<BlogPost post={postData} />;
```

## 🎨 Features

- **Responsive Design**: Mobile-first responsive layout
- **Pagination**: Built-in pagination support
- **Categories & Tags**: Display categories and tags
- **Author Information**: Show author details
- **Reading Time**: Calculate and display reading time
- **Social Sharing**: Share buttons for social media

## 🔧 Configuration

### BlogListing Props

- `posts`: Array of blog post objects
- `currentPage`: Current page number
- `totalPages`: Total number of pages
- `onPageChange`: Callback when page changes
- `isLoading`: Loading state

### BlogPost Props

- `post`: Blog post object with content
- `className`: Additional CSS classes

## 🔗 Related Components

- See `/components/content` for PostsManager
- See `/components/ui` for Card and Badge components
