/**
 * Rich Text Editor Component
 * Enhanced rich text editor for SaaS applications with link dialog and advanced formatting
 */
'use client';

import { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import DOMPurify from 'isomorphic-dompurify';
import Modal from './Modal';
import Input from './Input';
import Button from './Button';

export interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  minHeight?: string;
  className?: string;
  toolbar?: boolean;
}

export default function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Tapez votre texte...',
  label,
  error,
  helperText,
  disabled = false,
  minHeight = '200px',
  className,
  toolbar = true,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  // Enhanced XSS protection configuration
  const sanitizeConfig = {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      'b',
      'i',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'a',
      'blockquote',
      'code',
      'pre',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    // Additional security options
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_TRUSTED_TYPE: false,
    // Prevent dangerous protocols
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    // Sanitize URLs in href attributes
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  };

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      // Enhanced sanitization with stricter XSS protection
      const sanitized = DOMPurify.sanitize(value, sanitizeConfig);
      editorRef.current.innerHTML = sanitized;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current && onChange) {
      // Enhanced sanitization with stricter XSS protection
      const sanitized = DOMPurify.sanitize(editorRef.current.innerHTML, sanitizeConfig);
      onChange(sanitized);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const handleLinkClick = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();

      // Check if a link is already selected
      const linkElement =
        range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
          ? (range.commonAncestorContainer as Element).closest('a')
          : range.commonAncestorContainer.parentElement?.closest('a');

      if (linkElement) {
        setLinkUrl((linkElement as HTMLAnchorElement).href);
        setLinkText(linkElement.textContent || '');
      } else {
        setLinkUrl('');
        setLinkText(selectedText);
      }
    } else {
      setLinkUrl('');
      setLinkText('');
    }
    setShowLinkDialog(true);
  };

  const handleInsertLink = () => {
    if (!linkUrl.trim()) {
      return;
    }

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);

      // If text is selected, create link with selected text
      if (range.toString()) {
        execCommand('createLink', linkUrl);
      } else {
        // Insert link with provided text
        const link = document.createElement('a');
        link.href = linkUrl;
        link.textContent = linkText || linkUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        range.insertNode(link);
        handleInput();
      }
    } else {
      // Fallback: insert at cursor
      execCommand('createLink', linkUrl);
    }

    setShowLinkDialog(false);
    setLinkUrl('');
    setLinkText('');
    editorRef.current?.focus();
  };

  const handleRemoveLink = () => {
    execCommand('unlink');
    setShowLinkDialog(false);
    setLinkUrl('');
    setLinkText('');
  };

  const ToolbarButton = ({
    command,
    value,
    icon,
    label,
  }: {
    command: string;
    value?: string;
    icon: React.ReactNode;
    label: string;
  }) => (
    <button
      type="button"
      onClick={() => execCommand(command, value)}
      className="p-2 hover:bg-muted dark:hover:bg-muted rounded transition-colors"
      aria-label={label}
      disabled={disabled}
    >
      {icon}
    </button>
  );

  return (
    <div className={clsx('flex flex-col', className)}>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
      )}

      <div
        className={clsx(
          'border rounded-lg overflow-hidden',
          'bg-background',
          error
            ? 'border-error-500 dark:border-error-400'
            : isFocused
              ? 'border-primary-500 dark:border-primary-400 ring-2 ring-primary-500 dark:ring-primary-400'
              : 'border-border',
          disabled && 'opacity-60 cursor-not-allowed'
        )}
      >
        {toolbar && (
          <div className="flex items-center gap-1 p-2 border-b border-border bg-muted">
            <ToolbarButton
              command="bold"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"
                  />
                </svg>
              }
              label="Gras"
            />

            <ToolbarButton
              command="italic"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 20l4-16m4 4l4 16M6 20l-4-16"
                  />
                </svg>
              }
              label="Italique"
            />

            <ToolbarButton
              command="underline"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              }
              label="Souligné"
            />

            <div className="w-px h-6 bg-muted mx-1" />

            <ToolbarButton
              command="formatBlock"
              value="h2"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h7"
                  />
                </svg>
              }
              label="Titre"
            />

            <ToolbarButton
              command="insertUnorderedList"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              }
              label="Liste à puces"
            />

            <ToolbarButton
              command="insertOrderedList"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                  />
                </svg>
              }
              label="Liste numérotée"
            />

            <div className="w-px h-6 bg-muted mx-1" />

            <ToolbarButton
              command="justifyLeft"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M3 14h18M3 18h18M3 6h18"
                  />
                </svg>
              }
              label="Aligner à gauche"
            />

            <ToolbarButton
              command="justifyCenter"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M6 14h12M3 18h18M3 6h18"
                  />
                </svg>
              }
              label="Centrer"
            />

            <ToolbarButton
              command="justifyRight"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M9 14h12M3 18h18M3 6h18"
                  />
                </svg>
              }
              label="Aligner à droite"
            />

            <div className="w-px h-6 bg-muted mx-1" />

            <button
              type="button"
              onClick={handleLinkClick}
              className="p-2 hover:bg-muted dark:hover:bg-muted rounded transition-colors"
              aria-label="Insérer un lien"
              disabled={disabled}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
            </button>

            <ToolbarButton
              command="removeFormat"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              }
              label="Supprimer le formatage"
            />
          </div>
        )}

        <div
          ref={editorRef}
          contentEditable={!disabled}
          onInput={handleInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={clsx(
            'p-4 outline-none',
            'text-foreground',
            'min-h-[200px]',
            disabled && 'cursor-not-allowed'
          )}
          style={{ minHeight }}
          data-placeholder={placeholder}
          suppressContentEditableWarning
          aria-label={label || 'Rich text editor'}
          role="textbox"
          aria-multiline="true"
        />
      </div>

      <style jsx>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: var(--color-text-secondary, #9ca3af);
          pointer-events: none;
        }
      `}</style>

      {error && (
        <p className="mt-1 text-sm text-error-600 dark:text-error-400" role="alert">
          {error}
        </p>
      )}

      {helperText && !error && (
        <p className="mt-1 text-sm text-muted-foreground">{helperText}</p>
      )}

      {/* Link Dialog */}
      <Modal
        isOpen={showLinkDialog}
        onClose={() => {
          setShowLinkDialog(false);
          setLinkUrl('');
          setLinkText('');
        }}
        title="Insérer un lien"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="URL du lien"
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://exemple.com"
            required
          />

          <Input
            label="Texte du lien (optionnel)"
            type="text"
            value={linkText}
            onChange={(e) => setLinkText(e.target.value)}
            placeholder="Texte à afficher"
            helperText="Si vide, l'URL sera utilisée comme texte"
          />

          <div className="flex gap-2 justify-end pt-4">
            {linkUrl && (
              <Button variant="error" size="sm" onClick={handleRemoveLink}>
                Supprimer le lien
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowLinkDialog(false);
                setLinkUrl('');
                setLinkText('');
              }}
            >
              Annuler
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleInsertLink}
              disabled={!linkUrl.trim()}
            >
              Insérer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
