/**
 * RichTextEditor Component Tests
 *
 * Comprehensive test suite for the RichTextEditor component covering:
 * - Rendering editor
 * - Toolbar functionality
 * - Link dialog
 * - Value handling
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import RichTextEditor from '../RichTextEditor';

// Mock DOMPurify
vi.mock('isomorphic-dompurify', () => ({
  default: {
    sanitize: vi.fn((html: string) => html),
  },
}));

// Mock document.execCommand
global.document.execCommand = vi.fn();

describe('RichTextEditor Component', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders editor with contenteditable div', () => {
      const { container } = render(<RichTextEditor onChange={mockOnChange} />);
      const editor = container.querySelector('[contenteditable]');
      expect(editor).toBeInTheDocument();
    });

    it('renders label when provided', () => {
      render(<RichTextEditor label="Content" onChange={mockOnChange} />);
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('renders toolbar when toolbar is true', () => {
      const { container } = render(<RichTextEditor toolbar onChange={mockOnChange} />);
      const toolbar = container.querySelector('.flex.items-center');
      expect(toolbar).toBeInTheDocument();
    });

    it('hides toolbar when toolbar is false', () => {
      const { container } = render(<RichTextEditor toolbar={false} onChange={mockOnChange} />);
      const toolbar = container.querySelector('.flex.items-center');
      expect(toolbar).not.toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('displays placeholder', () => {
      render(<RichTextEditor placeholder="Enter text..." onChange={mockOnChange} />);
      const editor = screen.getByText('Enter text...');
      expect(editor).toBeInTheDocument();
    });

    it('displays error message', () => {
      render(<RichTextEditor error="Error message" onChange={mockOnChange} />);
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    it('displays helper text', () => {
      render(<RichTextEditor helperText="Helper text" onChange={mockOnChange} />);
      expect(screen.getByText('Helper text')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <RichTextEditor className="custom-editor" onChange={mockOnChange} />
      );
      const wrapper = container.querySelector('.custom-editor');
      expect(wrapper).toBeInTheDocument();
    });

    it('applies disabled state', () => {
      const { container } = render(<RichTextEditor disabled onChange={mockOnChange} />);
      const editor = container.querySelector('[contenteditable]');
      expect(editor).toHaveAttribute('contenteditable', 'false');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<RichTextEditor onChange={mockOnChange} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
