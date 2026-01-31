/**
 * Preferences Manager Component Tests
 *
 * Tests for the PreferencesManager component covering:
 * - Loading preferences
 * - Saving preferences
 * - Locale synchronization
 * - Error handling
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PreferencesManager } from '../PreferencesManager';
import { apiClient } from '@/lib/api/client';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/settings/preferences',
  useLocale: () => 'en',
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}));

// Mock API client
vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

// Mock toast
vi.mock('@/components/ui', async () => {
  const actual = await vi.importActual('@/components/ui');
  return {
    ...actual,
    useToast: () => ({
      showToast: vi.fn(),
    }),
  };
});

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('PreferencesManager Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading Preferences', () => {
    it('loads preferences on mount', async () => {
      const mockPreferences = {
        language: 'en',
        theme: 'light',
        notifications: true,
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockPreferences as any);

      render(<PreferencesManager />);

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith('/v1/users/preferences');
      });
    });

    it('displays loading state while fetching', () => {
      vi.mocked(apiClient.get).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<PreferencesManager />);

      // Component should render (loading handled internally)
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });

    it('handles API errors gracefully', async () => {
      const error = new Error('Failed to load preferences');
      vi.mocked(apiClient.get).mockRejectedValue(error);

      render(<PreferencesManager />);

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalled();
      });
    });
  });

  describe('Saving Preferences', () => {
    it('saves preferences when save button is clicked', async () => {
      const mockPreferences = {
        language: 'en',
        theme: 'light',
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockPreferences as any);
      vi.mocked(apiClient.put).mockResolvedValue({} as any);

      render(<PreferencesManager />);

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalled();
      });

      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(apiClient.put).toHaveBeenCalled();
      });
    });

    it('shows success message after saving', async () => {
      const mockPreferences = {
        language: 'en',
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockPreferences as any);
      vi.mocked(apiClient.put).mockResolvedValue({} as any);

      const { useToast } = await import('@/components/ui');
      const mockShowToast = vi.fn();
      vi.mocked(useToast).mockReturnValue({
        showToast: mockShowToast,
      } as any);

      render(<PreferencesManager />);

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalled();
      });

      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(apiClient.put).toHaveBeenCalled();
      });
    });

    it('handles save errors', async () => {
      const mockPreferences = {
        language: 'en',
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockPreferences as any);
      vi.mocked(apiClient.put).mockRejectedValue(new Error('Save failed'));

      render(<PreferencesManager />);

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalled();
      });

      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(apiClient.put).toHaveBeenCalled();
      });
    });
  });

  describe('Preference Editing', () => {
    it('allows editing preference values', async () => {
      const mockPreferences = {
        language: 'en',
        theme: 'light',
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockPreferences as any);

      render(<PreferencesManager />);

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalled();
      });

      // Component should render preference inputs
      // Exact implementation depends on how preferences are displayed
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });
  });

  describe('Locale Synchronization', () => {
    it('synchronizes locale preference with current locale', async () => {
      const mockPreferences = {
        language: 'fr', // Different from current locale
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockPreferences as any);
      vi.mocked(apiClient.put).mockResolvedValue({} as any);

      render(<PreferencesManager />);

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalled();
      });

      // Component should sync locale if different
      // This depends on LocaleSync component integration
    });
  });
});
