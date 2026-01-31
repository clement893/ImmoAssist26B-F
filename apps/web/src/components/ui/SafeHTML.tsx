/**
 * Safe HTML Renderer Component
 *
 * Safely renders HTML content with DOMPurify sanitization
 * Prevents XSS attacks by sanitizing all HTML before rendering
 *
 * @module SafeHTML
 */
'use client';

import { useMemo } from 'react';
import DOMPurify from 'isomorphic-dompurify';

export interface SafeHTMLProps {
  /**
   * HTML content to render (will be sanitized)
   */
  html: string;
  /**
   * Additional CSS class names
   */
  className?: string;
  /**
   * Allowed HTML tags (default: safe subset)
   */
  allowedTags?: string[];
  /**
   * Allowed HTML attributes (default: safe subset)
   */
  allowedAttributes?: string[];
  /**
   * Custom DOMPurify configuration
   */
  config?: Parameters<typeof DOMPurify.sanitize>[1];
}

/**
 * Safe HTML Renderer Component
 *
 * Renders HTML content safely by sanitizing with DOMPurify
 * before using dangerouslySetInnerHTML.
 *
 * @example
 * ```tsx
 * <SafeHTML html={userContent} />
 * ```
 */
export function SafeHTML({ html, className = '', allowedTags, allowedAttributes, config }: SafeHTMLProps) {
  // Sanitize HTML with DOMPurify
  const sanitizedHtml = useMemo(() => {
    if (!html) return '';

    // Default safe configuration
    const defaultConfig: Parameters<typeof DOMPurify.sanitize>[1] = {
      ALLOWED_TAGS: allowedTags || [
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'p',
        'br',
        'strong',
        'em',
        'u',
        's',
        'b',
        'i',
        'ul',
        'ol',
        'li',
        'blockquote',
        'pre',
        'code',
        'a',
        'img',
        'table',
        'thead',
        'tbody',
        'tr',
        'th',
        'td',
        'div',
        'span',
        'hr',
      ],
      ALLOWED_ATTR: allowedAttributes || ['href', 'title', 'alt', 'src', 'width', 'height', 'class', 'id', 'style', 'target', 'rel'],
      ALLOWED_URI_REGEXP: /^(https?|mailto|tel|#):/i,
      // Remove script tags and event handlers
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
      // Keep relative URLs safe
      ALLOW_DATA_ATTR: false,
      // Sanitize style attributes
      ALLOW_UNKNOWN_PROTOCOLS: false,
    };

    // Merge with custom config
    const finalConfig = config ? { ...defaultConfig, ...config } : defaultConfig;

    return DOMPurify.sanitize(html, finalConfig);
  }, [html, allowedTags, allowedAttributes, config]);

  return <div className={className} dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
}
