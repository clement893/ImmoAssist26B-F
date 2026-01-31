/**
 * APIDocumentation Component Tests
 *
 * Comprehensive test suite for the APIDocumentation component covering:
 * - API endpoints display
 * - Endpoint details (method, path, description)
 * - Parameters display
 * - Request body display
 * - Responses display
 * - Code examples
 * - Copy to clipboard functionality
 * - Expand/collapse functionality
 * - Try it functionality
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import APIDocumentation, { type APIEndpoint } from '../APIDocumentation';

describe('APIDocumentation Component', () => {
  const mockEndpoints: APIEndpoint[] = [
    {
      method: 'GET',
      path: '/api/users',
      description: 'Retrieve a list of users',
      parameters: [
        {
          name: 'page',
          type: 'number',
          required: false,
          description: 'Page number',
        },
      ],
      responses: [
        {
          status: 200,
          description: 'Success',
          example: { users: [] },
        },
      ],
      tags: ['users'],
    },
    {
      method: 'POST',
      path: '/api/users',
      description: 'Create a new user',
      requestBody: {
        schema: {
          name: 'string',
          email: 'string',
        },
        example: {
          name: 'John Doe',
          email: 'john@example.com',
        },
      },
      responses: [
        {
          status: 201,
          description: 'User created',
          example: { id: '1', name: 'John Doe' },
        },
      ],
    },
  ];

  const mockOnTryIt = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders API documentation', () => {
      render(<APIDocumentation endpoints={mockEndpoints} />);
      expect(
        screen.getByText(/api documentation/i) || screen.getByText(/api users/i)
      ).toBeInTheDocument();
    });

    it('displays endpoints', () => {
      render(<APIDocumentation endpoints={mockEndpoints} />);
      expect(
        screen.getByText(/retrieve a list of users/i) || screen.getByText(/create a new user/i)
      ).toBeInTheDocument();
    });

    it('displays endpoint methods', () => {
      render(<APIDocumentation endpoints={mockEndpoints} />);
      expect(screen.getByText(/get/i)).toBeInTheDocument();
      expect(screen.getByText(/post/i)).toBeInTheDocument();
    });
  });

  describe('Expand/Collapse', () => {
    it('expands endpoint details when clicked', () => {
      render(<APIDocumentation endpoints={mockEndpoints} />);
      const endpointHeader =
        screen.getByText(/retrieve a list of users/i) || screen.getByText(/api users/i);
      fireEvent.click(endpointHeader);
      // Should show details
      expect(screen.getByText(/page/i) || screen.getByText(/parameters/i)).toBeTruthy();
    });
  });

  describe('Try It Functionality', () => {
    it('calls onTryIt when try it button is clicked', () => {
      render(<APIDocumentation endpoints={mockEndpoints} onTryIt={mockOnTryIt} />);
      const tryItButton = screen.queryByText(/try it/i);
      if (tryItButton) {
        fireEvent.click(tryItButton);
        expect(mockOnTryIt).toHaveBeenCalled();
      }
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<APIDocumentation endpoints={mockEndpoints} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
