/**
 * SafeHTML Component Tests
 *
 * Comprehensive test suite for the SafeHTML component covering:
 * - HTML sanitization
 * - XSS prevention
 * - Custom configuration
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { SafeHTML } from '../SafeHTML';

// Mock DOMPurify
const mockSanitize = vi.fn((html: string) => html);
vi.mock('isomorphic-dompurify', () => ({
  default: {
    sanitize: mockSanitize,
  },
}));

describe('SafeHTML Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSanitize.mockImplementation((html: string) => html);
  });

  describe('Rendering', () => {
    it('renders sanitized HTML', () => {
      const { container } = render(<SafeHTML html="<p>Test content</p>" />);
      expect(container.innerHTML).toContain('Test content');
    });

    it('renders empty string when html is empty', () => {
      const { container } = render(<SafeHTML html="" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('calls DOMPurify.sanitize', () => {
      render(<SafeHTML html="<p>Test</p>" />);
      expect(mockSanitize).toHaveBeenCalled();
    });
  });

  describe('XSS Prevention', () => {
    it('sanitizes script tags', () => {
      const maliciousHtml = '<script>alert("XSS")</script><p>Safe</p>';
      render(<SafeHTML html={maliciousHtml} />);
      expect(mockSanitize).toHaveBeenCalledWith(
        maliciousHtml,
        expect.objectContaining({
          FORBID_TAGS: expect.arrayContaining(['script']),
        })
      );
    });

    it('sanitizes event handlers', () => {
      const maliciousHtml = '<div onclick="alert(\'XSS\')">Click</div>';
      render(<SafeHTML html={maliciousHtml} />);
      expect(mockSanitize).toHaveBeenCalledWith(
        maliciousHtml,
        expect.objectContaining({
          FORBID_ATTR: expect.arrayContaining(['onclick']),
        })
      );
    });

    it('sanitizes iframe tags', () => {
      const maliciousHtml = '<iframe src="evil.com"></iframe>';
      render(<SafeHTML html={maliciousHtml} />);
      expect(mockSanitize).toHaveBeenCalledWith(
        maliciousHtml,
        expect.objectContaining({
          FORBID_TAGS: expect.arrayContaining(['iframe']),
        })
      );
    });
  });

  describe('Custom Configuration', () => {
    it('uses custom allowedTags', () => {
      render(<SafeHTML html="<p>Test</p>" allowedTags={['p', 'div']} />);
      expect(mockSanitize).toHaveBeenCalledWith(
        '<p>Test</p>',
        expect.objectContaining({
          ALLOWED_TAGS: ['p', 'div'],
        })
      );
    });

    it('uses custom allowedAttributes', () => {
      render(<SafeHTML html="<a href='#'>Link</a>" allowedAttributes={['href']} />);
      expect(mockSanitize).toHaveBeenCalledWith(
        "<a href='#'>Link</a>",
        expect.objectContaining({
          ALLOWED_ATTR: ['href'],
        })
      );
    });

    it('uses custom config', () => {
      const customConfig = { KEEP_CONTENT: true };
      render(<SafeHTML html="<p>Test</p>" config={customConfig} />);
      expect(mockSanitize).toHaveBeenCalledWith(
        '<p>Test</p>',
        expect.objectContaining({
          KEEP_CONTENT: true,
        })
      );
    });
  });

  describe('Props Handling', () => {
    it('applies custom className', () => {
      const { container } = render(<SafeHTML html="<p>Test</p>" className="custom-class" />);
      const wrapper = container.querySelector('.custom-class');
      expect(wrapper).toBeInTheDocument();
    });

    it('uses default className when not provided', () => {
      const { container } = render(<SafeHTML html="<p>Test</p>" />);
      const wrapper = container.firstChild;
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<SafeHTML html="<p>Test content</p>" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Edge Cases', () => {
    it('handles null html', () => {
      const { container } = render(<SafeHTML html={null as unknown as string} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles complex HTML', () => {
      const complexHtml = `
        <div>
          <h1>Title</h1>
          <p>Paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </div>
      `;
      render(<SafeHTML html={complexHtml} />);
      expect(mockSanitize).toHaveBeenCalled();
    });

    it('handles HTML with links', () => {
      const htmlWithLinks = '<a href="https://example.com">Link</a>';
      render(<SafeHTML html={htmlWithLinks} />);
      expect(mockSanitize).toHaveBeenCalledWith(
        htmlWithLinks,
        expect.objectContaining({
          ALLOWED_ATTR: expect.arrayContaining(['href']),
        })
      );
    });
  });
});
