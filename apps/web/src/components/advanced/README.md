# Advanced Components

Advanced editor and file management components for enhanced content creation.

## 📦 Components

- **FileManager** - File browser and management interface
- **ImageEditor** - Image editing and manipulation tool
- **CodeEditor** - Syntax-highlighted code editor
- **MarkdownEditor** - Markdown editor with preview

## 📖 Usage Examples

### File Manager

```tsx
import { FileManager } from '@/components/advanced';

<FileManager
  files={fileList}
  onFileSelect={(file) => handleFileSelect(file)}
  onFileUpload={(file) => handleFileUpload(file)}
/>;
```

### Image Editor

```tsx
import { ImageEditor } from '@/components/advanced';

<ImageEditor imageUrl="/path/to/image.jpg" onSave={(editedImage) => handleSave(editedImage)} />;
```

### Code Editor

```tsx
import { CodeEditor } from '@/components/advanced';

<CodeEditor language="typescript" value={code} onChange={(newCode) => setCode(newCode)} />;
```

### Markdown Editor

```tsx
import { MarkdownEditor } from '@/components/advanced';

<MarkdownEditor value={markdown} onChange={(newMarkdown) => setMarkdown(newMarkdown)} />;
```

## 🎨 Features

- **File Management**: Browse, upload, and manage files
- **Image Editing**: Crop, resize, and apply filters to images
- **Code Editing**: Syntax highlighting for multiple languages
- **Markdown Support**: Live preview and formatting tools

## 🔗 Related Components

- See `/components/content` for content management
- See `/components/ui` for base UI components
