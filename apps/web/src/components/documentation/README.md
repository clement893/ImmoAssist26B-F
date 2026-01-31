# Documentation Components

Components for displaying documentation articles and knowledge base content.

## 📦 Components

- **ArticleList** - List of documentation articles
- **ArticleViewer** - View individual documentation articles

## 📖 Usage Examples

### Article List

```tsx
import { ArticleList } from '@/components/documentation';

<ArticleList articles={articlesList} onArticleClick={(article) => handleArticleClick(article)} />;
```

### Article Viewer

```tsx
import { ArticleViewer } from '@/components/documentation';

<ArticleViewer article={articleData} onBack={() => handleBack()} />;
```

## 🎨 Features

- **Article Navigation**: Browse and navigate documentation
- **Search**: Search within documentation
- **Categories**: Organize articles by category
- **Reading Progress**: Track reading progress
- **Related Articles**: Show related content
- **Print Support**: Print-friendly formatting

## 🔧 Configuration

### ArticleList

- `articles`: Array of article objects
- `onArticleClick`: Click callback
- `category`: Filter by category (optional)

### ArticleViewer

- `article`: Article object with content
- `onBack`: Back navigation callback

## 🔗 Related Components

- See `/components/help` for help center components
- See `/components/ui` for base UI components
