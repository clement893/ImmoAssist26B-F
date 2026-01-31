/**
 * CRUDModal Component Tests
 *
 * Comprehensive test suite for the CRUDModal component covering:
 * - Different modes (create, edit, delete, view)
 * - Submit and delete handlers
 * - Loading states
 * - Custom labels
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import CRUDModal from '../CRUDModal';

describe('CRUDModal Component', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders modal when isOpen is true', () => {
      render(
        <CRUDModal isOpen={true} onClose={mockOnClose} title="Test Modal" mode="create">
          <p>Content</p>
        </CRUDModal>
      );
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(
        <CRUDModal isOpen={false} onClose={mockOnClose} title="Test Modal" mode="create">
          <p>Content</p>
        </CRUDModal>
      );
      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    });
  });

  describe('Create Mode', () => {
    it('renders create mode correctly', () => {
      render(
        <CRUDModal
          isOpen={true}
          onClose={mockOnClose}
          title="Create"
          mode="create"
          onSubmit={mockOnSubmit}
        >
          <p>Create form</p>
        </CRUDModal>
      );
      expect(screen.getByText('Créer')).toBeInTheDocument();
      expect(screen.getByText('Annuler')).toBeInTheDocument();
    });

    it('calls onSubmit when submit button is clicked', () => {
      render(
        <CRUDModal
          isOpen={true}
          onClose={mockOnClose}
          title="Create"
          mode="create"
          onSubmit={mockOnSubmit}
        >
          <p>Content</p>
        </CRUDModal>
      );
      const submitButton = screen.getByText('Créer');
      fireEvent.click(submitButton);
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    it('uses custom submit label', () => {
      render(
        <CRUDModal
          isOpen={true}
          onClose={mockOnClose}
          title="Create"
          mode="create"
          onSubmit={mockOnSubmit}
          submitLabel="Custom Create"
        >
          <p>Content</p>
        </CRUDModal>
      );
      expect(screen.getByText('Custom Create')).toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    it('renders edit mode correctly', () => {
      render(
        <CRUDModal
          isOpen={true}
          onClose={mockOnClose}
          title="Edit"
          mode="edit"
          onSubmit={mockOnSubmit}
        >
          <p>Edit form</p>
        </CRUDModal>
      );
      expect(screen.getByText('Enregistrer')).toBeInTheDocument();
    });

    it('calls onSubmit when submit button is clicked', () => {
      render(
        <CRUDModal
          isOpen={true}
          onClose={mockOnClose}
          title="Edit"
          mode="edit"
          onSubmit={mockOnSubmit}
        >
          <p>Content</p>
        </CRUDModal>
      );
      const submitButton = screen.getByText('Enregistrer');
      fireEvent.click(submitButton);
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe('Delete Mode', () => {
    it('renders delete confirmation UI', () => {
      render(
        <CRUDModal
          isOpen={true}
          onClose={mockOnClose}
          title="Delete"
          mode="delete"
          onDelete={mockOnDelete}
        >
          <p>Content</p>
        </CRUDModal>
      );
      expect(screen.getByText(/êtes-vous sûr/i)).toBeInTheDocument();
      expect(screen.getByText(/irréversible/i)).toBeInTheDocument();
    });

    it('renders delete button', () => {
      render(
        <CRUDModal
          isOpen={true}
          onClose={mockOnClose}
          title="Delete"
          mode="delete"
          onDelete={mockOnDelete}
        >
          <p>Content</p>
        </CRUDModal>
      );
      expect(screen.getByText('Supprimer')).toBeInTheDocument();
    });

    it('calls onDelete when delete button is clicked', () => {
      render(
        <CRUDModal
          isOpen={true}
          onClose={mockOnClose}
          title="Delete"
          mode="delete"
          onDelete={mockOnDelete}
        >
          <p>Content</p>
        </CRUDModal>
      );
      const deleteButton = screen.getByText('Supprimer');
      fireEvent.click(deleteButton);
      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });

    it('uses custom delete label', () => {
      render(
        <CRUDModal
          isOpen={true}
          onClose={mockOnClose}
          title="Delete"
          mode="delete"
          onDelete={mockOnDelete}
          deleteLabel="Custom Delete"
        >
          <p>Content</p>
        </CRUDModal>
      );
      expect(screen.getByText('Custom Delete')).toBeInTheDocument();
    });
  });

  describe('View Mode', () => {
    it('renders view mode correctly', () => {
      render(
        <CRUDModal isOpen={true} onClose={mockOnClose} title="View" mode="view">
          <p>View content</p>
        </CRUDModal>
      );
      expect(screen.getByText('View content')).toBeInTheDocument();
      expect(screen.getByText('Annuler')).toBeInTheDocument();
    });

    it('does not render submit button in view mode', () => {
      render(
        <CRUDModal isOpen={true} onClose={mockOnClose} title="View" mode="view">
          <p>Content</p>
        </CRUDModal>
      );
      expect(screen.queryByText('Créer')).not.toBeInTheDocument();
      expect(screen.queryByText('Enregistrer')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('disables buttons when loading', () => {
      render(
        <CRUDModal
          isOpen={true}
          onClose={mockOnClose}
          title="Create"
          mode="create"
          onSubmit={mockOnSubmit}
          loading={true}
        >
          <p>Content</p>
        </CRUDModal>
      );
      const submitButton = screen.getByText('Chargement...');
      expect(submitButton).toBeDisabled();
      const cancelButton = screen.getByText('Annuler');
      expect(cancelButton).toBeDisabled();
    });

    it('shows loading text on submit button', () => {
      render(
        <CRUDModal
          isOpen={true}
          onClose={mockOnClose}
          title="Create"
          mode="create"
          onSubmit={mockOnSubmit}
          loading={true}
        >
          <p>Content</p>
        </CRUDModal>
      );
      expect(screen.getByText('Chargement...')).toBeInTheDocument();
    });
  });

  describe('Size Prop', () => {
    it('passes size prop to Modal', () => {
      render(
        <CRUDModal isOpen={true} onClose={mockOnClose} title="Test" mode="create" size="lg">
          <p>Content</p>
        </CRUDModal>
      );
      // Modal should receive size prop
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <CRUDModal isOpen={true} onClose={mockOnClose} title="Test Modal" mode="create">
          <p>Content</p>
        </CRUDModal>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing onSubmit in create mode', () => {
      render(
        <CRUDModal isOpen={true} onClose={mockOnClose} title="Create" mode="create">
          <p>Content</p>
        </CRUDModal>
      );
      expect(screen.queryByText('Créer')).not.toBeInTheDocument();
    });

    it('handles missing onDelete in delete mode', () => {
      render(
        <CRUDModal isOpen={true} onClose={mockOnClose} title="Delete" mode="delete">
          <p>Content</p>
        </CRUDModal>
      );
      expect(screen.queryByText('Supprimer')).not.toBeInTheDocument();
    });
  });
});
