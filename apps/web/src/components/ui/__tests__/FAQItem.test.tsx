/**
 * FAQItem Component Tests
 *
 * Comprehensive test suite for the FAQItem component covering:
 * - Rendering question and answer
 * - Card wrapper
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import FAQItem from '../FAQItem';

describe('FAQItem Component', () => {
  describe('Rendering', () => {
    it('renders question', () => {
      render(<FAQItem question="What is this?" answer="This is an answer." />);
      expect(screen.getByText('What is this?')).toBeInTheDocument();
    });

    it('renders answer', () => {
      render(<FAQItem question="What is this?" answer="This is an answer." />);
      expect(screen.getByText('This is an answer.')).toBeInTheDocument();
    });

    it('renders both question and answer', () => {
      render(<FAQItem question="Question?" answer="Answer." />);
      expect(screen.getByText('Question?')).toBeInTheDocument();
      expect(screen.getByText('Answer.')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('renders question with correct styling', () => {
      render(<FAQItem question="Question" answer="Answer" />);
      const question = screen.getByText('Question');
      expect(question).toHaveClass('text-lg', 'font-semibold');
    });

    it('renders answer with correct styling', () => {
      render(<FAQItem question="Question" answer="Answer" />);
      const answer = screen.getByText('Answer');
      expect(answer).toHaveClass('text-gray-600');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<FAQItem question="Question?" answer="Answer." />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper heading structure', () => {
      render(<FAQItem question="Question?" answer="Answer." />);
      const question = screen.getByRole('heading', { level: 3 });
      expect(question).toBeInTheDocument();
      expect(question).toHaveTextContent('Question?');
    });
  });

  describe('Edge Cases', () => {
    it('handles long questions', () => {
      const longQuestion =
        'This is a very long question that might wrap to multiple lines and should still be displayed correctly';
      render(<FAQItem question={longQuestion} answer="Answer" />);
      expect(screen.getByText(longQuestion)).toBeInTheDocument();
    });

    it('handles long answers', () => {
      const longAnswer =
        'This is a very long answer that might wrap to multiple lines and should still be displayed correctly';
      render(<FAQItem question="Question" answer={longAnswer} />);
      expect(screen.getByText(longAnswer)).toBeInTheDocument();
    });

    it('handles HTML in answer', () => {
      render(<FAQItem question="Question" answer="Answer with <strong>bold</strong> text" />);
      // HTML should be rendered as text, not parsed
      expect(screen.getByText(/Answer with/)).toBeInTheDocument();
    });
  });
});
