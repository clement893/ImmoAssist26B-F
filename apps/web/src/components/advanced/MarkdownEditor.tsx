/**
 * Markdown Editor Component
 * Markdown editor with preview
 */
'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import DOMPurify from 'dompurify';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { FileText, Save, Download } from 'lucide-react';

export interface MarkdownEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  onSave?: (value: string) => Promise<void>;
  className?: string;
}

const markdownExample = `# Markdown Editor
This is a **markdown** editor with live preview.

## Features
- *Italic* and **bold** text
- Lists and code blocks
- Links and images

\`\`\`javascript
function hello() {
  logger.log("Hello, World!");
}
\`\`\`

[Learn more](https://example.com)
`;

export default function MarkdownEditor({
  value = markdownExample,
  onChange,
  onSave,
  className,
}: MarkdownEditorProps) {
  const [markdown, setMarkdown] = useState(value);
  const [previewMode, setPreviewMode] = useState<'split' | 'preview' | 'edit'>('split');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setMarkdown(newValue);
    onChange?.(newValue);
  };

  const handleSave = async () => {
    if (onSave) {
      await onSave(markdown);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Simple markdown to HTML converter (basic implementation)
  // SECURITY: HTML is sanitized with DOMPurify to prevent XSS attacks
  const markdownToHtml = (md: string) => {
    let html = md;

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

    // Code blocks
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/gim, '<pre><code>$2</code></pre>');
    html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');

    // Links - sanitize URLs to prevent javascript: and data: XSS
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, (_match, text, url) => {
      // Only allow http://, https://, and mailto: protocols
      const safeUrl = /^(https?|mailto):/i.test(url) ? url : '#';
      return `<a href="${safeUrl}">${text}</a>`;
    });

    // Line breaks
    html = html.replace(/\n/gim, '<br>');

    // Sanitize HTML to prevent XSS attacks
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'p', 'br', 'code', 'pre', 'a', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: ['href'],
      ALLOWED_URI_REGEXP: /^(https?|mailto):/i,
    });
  };

  return (
    <Card className={clsx('bg-background', className)}>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h3 className="text-lg font-semibold text-foreground">Markdown Editor</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 border border-border rounded-lg">
              <button
                onClick={() => setPreviewMode('edit')}
                className={clsx(
                  'px-3 py-1 text-sm',
                  previewMode === 'edit'
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'text-muted-foreground hover:bg-muted dark:hover:bg-muted'
                )}
              >
                Edit
              </button>
              <button
                onClick={() => setPreviewMode('split')}
                className={clsx(
                  'px-3 py-1 text-sm',
                  previewMode === 'split'
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'text-muted-foreground hover:bg-muted dark:hover:bg-muted'
                )}
              >
                Split
              </button>
              <button
                onClick={() => setPreviewMode('preview')}
                className={clsx(
                  'px-3 py-1 text-sm',
                  previewMode === 'preview'
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'text-muted-foreground hover:bg-muted dark:hover:bg-muted'
                )}
              >
                Preview
              </button>
            </div>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <span className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download
              </span>
            </Button>
            {onSave && (
              <Button variant="primary" size="sm" onClick={handleSave}>
                <span className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save
                </span>
              </Button>
            )}
          </div>
        </div>

        {/* Editor and Preview */}
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: previewMode === 'split' ? '1fr 1fr' : '1fr' }}
        >
          {(previewMode === 'edit' || previewMode === 'split') && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Markdown</label>
              <textarea
                value={markdown}
                onChange={handleChange}
                placeholder="Write your markdown here..."
                className={clsx(
                  'w-full h-96 p-4 font-mono text-sm border rounded-lg',
                  'bg-background',
                  'text-foreground',
                  'border-border',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400',
                  'resize-none'
                )}
              />
            </div>
          )}
          {(previewMode === 'preview' || previewMode === 'split') && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Preview</label>
              <div
                className={clsx(
                  'w-full h-96 p-4 border rounded-lg overflow-y-auto',
                  'bg-background',
                  'border-border',
                  'prose prose-sm dark:prose-invert max-w-none'
                )}
                dangerouslySetInnerHTML={{ __html: markdownToHtml(markdown) }}
              />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="text-xs text-muted-foreground text-center">
          {markdown.length} characters • {markdown.split('\n').length} lines
        </div>
      </div>
    </Card>
  );
}
