/**
 * Types for Theme Management System
 * These types extend the base types from @modele/types
 */

import type { ThemeConfig, Theme } from '@modele/types';

/**
 * Extended theme type with UI-specific properties
 */
export interface ThemeListItem extends Theme {
  isActive: boolean;
  canDelete: boolean;
  canEdit: boolean;
}

/**
 * Theme editor state
 */
export interface ThemeEditorState {
  theme: Theme | null;
  config: ThemeConfig;
  isEditing: boolean;
  isDirty: boolean;
  activeTab: 'form' | 'json' | 'preview' | 'fonts';
  errors: {
    json?: string;
    validation?: string[];
  };
}

/**
 * Theme form data (simplified for form editing)
 */
export interface ThemeFormData {
  name: string;
  display_name: string;
  description?: string;
  primary_color: string;
  secondary_color: string;
  danger_color: string;
  warning_color: string;
  info_color: string;
  success_color: string;
  font_family?: string;
  border_radius?: string;
  mode?: 'light' | 'dark' | 'system';
}

/**
 * JSON editor state
 */
export interface JSONEditorState {
  value: string;
  isValid: boolean;
  error: string | null;
  isDirty: boolean;
}

/**
 * Preview state
 */
export interface PreviewState {
  isActive: boolean;
  appliedConfig: ThemeConfig | null;
}
