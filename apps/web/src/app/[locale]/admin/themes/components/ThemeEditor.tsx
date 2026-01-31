'use client';

/**
 * ThemeEditor Component
 * Main editor component with tabs for Form, JSON, and Preview
 */

import { useState, useEffect } from 'react';
import { useThemeEditor } from '../hooks/useThemeEditor';
import { ThemeTabs } from './ThemeTabs';
import { ThemeForm } from './ThemeForm';
import { JSONEditor } from './JSONEditor';
import { ThemePreview } from './ThemePreview';
import { FontUploader } from '@/components/theme/FontUploader';
import { Card, Button, Alert } from '@/components/ui';
import type { Theme, ThemeConfig, ThemeConfigAccessor, TypographyConfig } from '@modele/types';
import type { ThemeFormData } from '../types';
import { X, Save, RotateCcw } from 'lucide-react';
import { logger } from '@/lib/logger';
import { DEFAULT_THEME_CONFIG } from '@/lib/theme/default-theme-config';

interface ThemeEditorProps {
  theme: Theme | null;
  onSave: (config: ThemeConfig, formData: ThemeFormData) => Promise<void>;
  onCancel: () => void;
}

// Check if theme is TemplateTheme (ID 32) or TemplateTheme2 (ID 33)
function isTemplateTheme(theme: Theme | null): boolean {
  if (!theme) return false;
  return (
    theme.id === 32 ||
    theme.id === 33 ||
    theme.name === 'template-theme' ||
    theme.name === 'TemplateTheme' ||
    theme.name === 'template-theme2' ||
    theme.name === 'TemplateTheme2'
  );
}

export function ThemeEditor({ theme, onSave, onCancel }: ThemeEditorProps) {
  const { state, updateConfig, setActiveTab } = useThemeEditor(theme);
  const isTemplate = isTemplateTheme(theme);
  const [formData, setFormData] = useState<ThemeFormData>({
    name: theme?.name || '',
    display_name: theme?.display_name || '',
    description: theme?.description || '',
    primary_color: theme?.config?.primary_color || '#2563eb',
    secondary_color: theme?.config?.secondary_color || '#6366f1',
    danger_color: theme?.config?.danger_color || '#dc2626',
    warning_color: theme?.config?.warning_color || '#d97706',
    info_color: theme?.config?.info_color || '#0891b2',
    success_color: theme?.config?.success_color || '#059669',
    font_family: theme?.config?.font_family || '',
    border_radius: theme?.config?.border_radius || '',
    mode: theme?.config?.mode || 'system',
  });

  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jsonValidationError, setJsonValidationError] = useState<string | null>(null);
  const [isJSONValid, setIsJSONValid] = useState(true);
  const [selectedFontIds, setSelectedFontIds] = useState<number[]>([]);

  useEffect(() => {
    if (theme) {
      // Update form data when theme changes
      setFormData({
        name: theme.name,
        display_name: theme.display_name,
        description: theme.description || '',
        primary_color: theme.config?.primary_color || '#2563eb',
        secondary_color: theme.config?.secondary_color || '#6366f1',
        danger_color: theme.config?.danger_color || '#dc2626',
        warning_color: theme.config?.warning_color || '#d97706',
        info_color: theme.config?.info_color || '#0891b2',
        success_color: theme.config?.success_color || '#059669',
        font_family: theme.config?.font_family || '',
        border_radius: theme.config?.border_radius || '',
        mode: theme.config?.mode || 'system',
      });

      // Extract font IDs from config if present
      const fontFiles =
        theme.config?.typography && 'fontFiles' in theme.config.typography
          ? (theme.config.typography as { fontFiles?: number[] }).fontFiles
          : undefined;
      if (Array.isArray(fontFiles)) {
        setSelectedFontIds(fontFiles);
      }
    } else {
      // Reset form data for new theme
      setFormData({
        name: '',
        display_name: '',
        description: '',
        primary_color: '#2563eb',
        secondary_color: '#6366f1',
        danger_color: '#dc2626',
        warning_color: '#d97706',
        info_color: '#0891b2',
        success_color: '#059669',
        font_family: '',
        border_radius: '',
        mode: 'system',
      });
      setSelectedFontIds([]);
    }
  }, [theme]);

  const handleFormChange = (field: keyof ThemeFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Update config when colors change
    if (field.includes('_color') || field === 'font_family' || field === 'border_radius') {
      const updatedConfig = {
        ...state.config,
        [field]: value,
      } as ThemeConfig;
      updateConfig(updatedConfig);
    }
  };

  const handleJSONChange = (newConfig: ThemeConfig) => {
    // Update config from JSON
    updateConfig(newConfig);

    // Sync form data with new config
    setFormData((prev) => ({
      ...prev,
      primary_color: newConfig.primary_color || prev.primary_color,
      secondary_color: newConfig.secondary_color || prev.secondary_color,
      danger_color: newConfig.danger_color || prev.danger_color,
      warning_color: newConfig.warning_color || prev.warning_color,
      info_color: newConfig.info_color || prev.info_color,
      success_color: newConfig.success_color || prev.success_color,
      font_family: newConfig.font_family || prev.font_family,
      border_radius: newConfig.border_radius || prev.border_radius,
    }));

    // Sync fontFiles from JSON to selectedFontIds
    const fontFiles =
      newConfig.typography && 'fontFiles' in newConfig.typography
        ? (newConfig.typography as { fontFiles?: number[] }).fontFiles
        : undefined;
    if (Array.isArray(fontFiles)) {
      setSelectedFontIds(fontFiles);
    } else if (fontFiles === undefined || fontFiles === null) {
      // Only clear if explicitly removed, not if just missing
      // This preserves selection when editing other parts of JSON
    }
  };

  const handleJSONValidationChange = (isValid: boolean, error: string | null) => {
    setIsJSONValid(isValid);
    setJsonValidationError(error);
  };

  const handleResetToDefault = async () => {
    if (!theme || !isTemplate) {
      return;
    }

    try {
      setResetting(true);
      setError(null);

      // Use DEFAULT_THEME_CONFIG as the new config
      const defaultConfig = { ...DEFAULT_THEME_CONFIG } as ThemeConfig;

      // Update the config in state immediately for preview
      updateConfig(defaultConfig);

      // Prepare updated form data with default values
      const updatedFormData: ThemeFormData = {
        ...formData,
        primary_color: defaultConfig.primary_color || '#2563eb',
        secondary_color: defaultConfig.secondary_color || '#6366f1',
        danger_color: defaultConfig.danger_color || '#dc2626',
        warning_color: defaultConfig.warning_color || '#b45309',
        info_color: defaultConfig.info_color || '#0891b2',
        success_color: defaultConfig.success_color || '#047857',
        font_family: defaultConfig.font_family || 'Inter',
        border_radius: defaultConfig.border_radius || '8px',
        mode: (defaultConfig.mode || 'system') as 'light' | 'dark' | 'system',
      };

      // Update form data state
      setFormData(updatedFormData);

      // Clear selected fonts (default config doesn't have custom fonts)
      setSelectedFontIds([]);

      // Save the default config with updated form data
      await onSave(defaultConfig, updatedFormData);
    } catch (err: unknown) {
      let errorMessage = 'Erreur lors de la réinitialisation aux valeurs par défaut';

      logger.error(
        '[ThemeEditor] Reset to default error',
        err instanceof Error ? err : new Error(String(err)),
        {
          context: 'ThemeEditor.resetToDefault',
        }
      );

      if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setResetting(false);
    }
  };

  const handleSave = async () => {
    // Check if JSON is valid when on JSON tab
    if (state.activeTab === 'json' && !isJSONValid) {
      setError('Le JSON contient des erreurs. Veuillez les corriger avant de sauvegarder.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Use current config from state (which may have been updated from JSON or form)
      // Spread state.config FIRST to preserve all complex structures (colors, typography, effects, spacing, etc.)
      // Then add fallbacks for required color fields to ensure compatibility with form tab and old format
      const config: ThemeConfig = {
        ...state.config, // Preserve ALL complex structures (glassmorphism, nested objects, etc.)
        // Ensure required color fields exist (support both formats: primary_color and primary)
        primary_color:
          state.config.primary_color ||
          (state.config as ThemeConfigAccessor).primary ||
          formData.primary_color,
        secondary_color:
          state.config.secondary_color ||
          (state.config as ThemeConfigAccessor).secondary ||
          formData.secondary_color,
        danger_color:
          state.config.danger_color ||
          (state.config as ThemeConfigAccessor).danger ||
          formData.danger_color,
        warning_color:
          state.config.warning_color ||
          (state.config as ThemeConfigAccessor).warning ||
          formData.warning_color,
        info_color:
          state.config.info_color ||
          (state.config as ThemeConfigAccessor).info ||
          formData.info_color,
        success_color:
          state.config.success_color ||
          (state.config as ThemeConfigAccessor).success ||
          formData.success_color,
        // Optional fields with fallbacks
        font_family:
          state.config.font_family ||
          (state.config.typography as TypographyConfig | undefined)?.fontFamily ||
          formData.font_family ||
          undefined,
        border_radius:
          state.config.border_radius ||
          state.config.borderRadius ||
          formData.border_radius ||
          undefined,
        // Add typography with fontFiles
        // Prefer fontFiles from config (if edited in JSON), otherwise use selectedFontIds (from fonts tab)
        typography: {
          ...((state.config.typography as TypographyConfig | undefined) || {}),
          fontFiles:
            (state.config.typography as TypographyConfig | undefined)?.fontFiles ??
            (selectedFontIds.length > 0 ? selectedFontIds : undefined),
        },
      } as ThemeConfig;

      await onSave(config, formData);
    } catch (err: unknown) {
      let errorMessage = 'Erreur lors de la sauvegarde';

      // Log error for debugging
      logger.error(
        '[ThemeEditor] Save error',
        err instanceof Error ? err : new Error(String(err)),
        {
          context: 'ThemeEditor.save',
        }
      );

      if (err instanceof Error) {
        errorMessage = err.message;

        // If it's a ThemeValidationError, it already has formatted messages
        // Otherwise, try to extract more details
        if (
          err.name === 'ThemeValidationError' ||
          err.constructor.name === 'ThemeValidationError'
        ) {
          // The error message should already contain formatted validation errors
          errorMessage = err.message;
          logger.debug('[ThemeEditor] ThemeValidationError message', { message: errorMessage });
        } else if (
          err.message.includes('Validation failed') ||
          err.message.includes('422') ||
          err.message.includes('Color format') ||
          err.message.includes('contrast')
        ) {
          // Try to extract more details from the error
          errorMessage =
            err.message ||
            'Erreur de validation. Vérifiez les formats de couleur et les ratios de contraste.';
          logger.debug('[ThemeEditor] Validation error message', { message: errorMessage });
        } else {
          // For other errors, try to extract more info
          logger.debug('[ThemeEditor] Other error', {
            message: err.message,
            name: err.name,
            constructor: err.constructor.name,
            stack: err.stack,
          });
        }
      } else {
        logger.error('[ThemeEditor] Unknown error type', new Error(String(err)), { err });
      }

      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {theme ? `Éditer "${theme.display_name}"` : 'Créer un nouveau thème'}
            </h2>
            <p className="text-muted-foreground mt-1">
              {theme
                ? 'Modifiez les propriétés du thème'
                : 'Remplissez le formulaire pour créer un nouveau thème'}
            </p>
          </div>
          <Button onClick={onCancel} variant="outline" size="sm">
            <X className="w-4 h-4 mr-2" />
            Annuler
          </Button>
        </div>

        {error && (
          <Alert variant="error" title="Erreur" className="mb-4">
            <div className="whitespace-pre-wrap text-sm">{error}</div>
          </Alert>
        )}

        {jsonValidationError && state.activeTab === 'json' && (
          <Alert variant="error" title="Erreur JSON" className="mb-4">
            {jsonValidationError}
          </Alert>
        )}

        <ThemeTabs activeTab={state.activeTab} onTabChange={setActiveTab} />

        {isTemplate && (
          <Alert variant="warning" title="Thème Template" className="mb-4">
            <div className="space-y-2">
              <p>
                Ce thème est un TemplateTheme (TemplateTheme ou TemplateTheme2). Seule la
                configuration (couleurs, polices, etc.) peut être modifiée. Le nom et la description
                ne peuvent pas être changés.
              </p>
              <Button
                onClick={handleResetToDefault}
                variant="outline"
                size="sm"
                disabled={resetting || saving}
                className="mt-2"
              >
                <RotateCcw className={`w-4 h-4 mr-2 ${resetting ? 'animate-spin' : ''}`} />
                {resetting ? 'Réinitialisation...' : 'Réinitialiser aux valeurs par défaut'}
              </Button>
            </div>
          </Alert>
        )}

        <div className="mt-6">
          {state.activeTab === 'form' && (
            <ThemeForm formData={formData} onChange={handleFormChange} config={state.config} />
          )}

          {state.activeTab === 'json' && (
            <JSONEditor
              config={state.config}
              onChange={handleJSONChange}
              onValidationChange={handleJSONValidationChange}
            />
          )}

          {state.activeTab === 'fonts' && (
            <FontUploader
              selectedFontIds={selectedFontIds}
              onFontSelectionChange={setSelectedFontIds}
              showSelection={true}
            />
          )}

          {state.activeTab === 'preview' && <ThemePreview config={state.config} />}
        </div>

        <div className="flex justify-between items-center gap-3 mt-6 pt-6 border-t border-border">
          {isTemplate && (
            <Button onClick={handleResetToDefault} variant="outline" disabled={resetting || saving}>
              <RotateCcw className={`w-4 h-4 mr-2 ${resetting ? 'animate-spin' : ''}`} />
              {resetting ? 'Réinitialisation...' : 'Réinitialiser aux valeurs par défaut'}
            </Button>
          )}
          <div className="flex gap-3 ml-auto">
            <Button onClick={onCancel} variant="outline" disabled={saving || resetting}>
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              variant="primary"
              disabled={saving || resetting || (state.activeTab === 'json' && !isJSONValid)}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
