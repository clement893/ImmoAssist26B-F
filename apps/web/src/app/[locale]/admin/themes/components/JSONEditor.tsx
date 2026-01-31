'use client';

/**
 * JSONEditor Component
 * JSON editor with validation and formatting
 */

import { useState, useEffect, useCallback } from 'react';
import { Textarea, Alert, Button } from '@/components/ui';
import { Code, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import type { ThemeConfig } from '@modele/types';
import { isValidColor } from '@/lib/theme/color-validation';

interface JSONEditorProps {
  config: ThemeConfig;
  onChange: (config: ThemeConfig) => void;
  onValidationChange?: (isValid: boolean, error: string | null) => void;
}

export function JSONEditor({ config, onChange, onValidationChange }: JSONEditorProps) {
  const [jsonValue, setJsonValue] = useState<string>('');
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Initialize JSON value from config
  useEffect(() => {
    try {
      const formatted = JSON.stringify(config, null, 2);
      setJsonValue(formatted);
      setIsDirty(false);
      setIsValid(true);
      setError(null);
    } catch (err) {
      setError('Erreur lors de la conversion du config en JSON');
      setIsValid(false);
    }
  }, [config]);

  // Validate JSON and notify parent
  const validateJSON = useCallback(
    (value: string): { isValid: boolean; error: string | null; parsed: ThemeConfig | null } => {
      if (!value.trim()) {
        return { isValid: false, error: 'Le JSON ne peut pas être vide', parsed: null };
      }

      try {
        const parsed = JSON.parse(value);

        // Basic validation
        if (typeof parsed !== 'object' || parsed === null) {
          return { isValid: false, error: 'Le JSON doit être un objet', parsed: null };
        }

        // Check if this is a full theme object (with name, display_name, config) or just a config
        // If it's a full theme object, extract the config
        type ParsedTheme = { config?: ThemeConfig } & Record<string, unknown>;
        const parsedTheme = parsed as ParsedTheme;
        let configObj: ThemeConfig & Record<string, unknown>;
        let themeConfig: ThemeConfig;

        if (parsedTheme.config && typeof parsedTheme.config === 'object') {
          // Full theme object: extract config
          configObj = parsedTheme.config as ThemeConfig & Record<string, unknown>;
          themeConfig = configObj as ThemeConfig;
        } else {
          // Just config object
          configObj = parsed;
          themeConfig = parsed as ThemeConfig;
        }

        // Validate required color fields
        // Support both formats: primary_color or primary (short format)
        // Also support nested config structure: config.primary, config.colors.primary, etc.
        const colorMappings = {
          primary: ['primary_color', 'primary'],
          secondary: ['secondary_color', 'secondary'],
          danger: ['danger_color', 'danger'],
          warning: ['warning_color', 'warning'],
          info: ['info_color', 'info'],
          success: ['success_color', 'success'],
        };

        const missingColors: string[] = [];
        const invalidColorFormats: Array<{ field: string; value: string }> = [];

        for (const [colorName, possibleKeys] of Object.entries(colorMappings)) {
          let colorValue: string | undefined;
          let colorField: string | undefined;

          // Check if any of the possible keys exists
          for (const key of possibleKeys) {
            // Check in root level of configObj
            if (configObj[key] && typeof configObj[key] === 'string') {
              colorValue = configObj[key];
              colorField = parsedTheme.config ? `config.${key}` : key;
              break;
            }
            // Check in colors object
            if (
              configObj.colors &&
              configObj.colors[key] &&
              typeof configObj.colors[key] === 'string'
            ) {
              colorValue = configObj.colors[key];
              colorField = parsedTheme.config ? `config.colors.${key}` : `colors.${key}`;
              break;
            }
            // Check in colors object with colorName (e.g., colors.primary)
            if (
              configObj.colors &&
              configObj.colors[colorName] &&
              typeof configObj.colors[colorName] === 'string'
            ) {
              colorValue = configObj.colors[colorName];
              colorField = parsedTheme.config
                ? `config.colors.${colorName}`
                : `colors.${colorName}`;
              break;
            }
          }

          if (!colorValue) {
            missingColors.push(colorName);
          } else if (!isValidColor(colorValue)) {
            invalidColorFormats.push({ field: colorField || colorName, value: colorValue });
          }
        }

        // Check for invalid color formats in other fields (only in configObj, not in full theme object)
        const otherColorFields = ['font_family', 'border_radius'];
        for (const field of otherColorFields) {
          const value = configObj[field];
          if (value && typeof value === 'string' && value.trim() !== '') {
            // These fields are optional, but if provided they should be valid strings
            // (not color validation needed for these)
          }
        }

        // Build error message
        const errors: string[] = [];
        if (missingColors.length > 0) {
          errors.push(
            `Couleurs manquantes: ${missingColors.map((c) => `${c}_color ou ${c}`).join(', ')}`
          );
        }
        if (invalidColorFormats.length > 0) {
          const formatErrors = invalidColorFormats.map(
            ({ field, value }) =>
              `${field}: "${value}" n'est pas un format de couleur valide (hex, rgb, hsl)`
          );
          errors.push(`Formats de couleur invalides:\n  ${formatErrors.join('\n  ')}`);
        }

        if (errors.length > 0) {
          return {
            isValid: false,
            error: errors.join('\n\n'),
            parsed: null,
          };
        }

        // Return the config object (extracted if it was nested in a full theme object)
        return { isValid: true, error: null, parsed: themeConfig };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur de syntaxe JSON';
        return { isValid: false, error: errorMessage, parsed: null };
      }
    },
    []
  );

  const handleChange = (value: string) => {
    setJsonValue(value);
    setIsDirty(true);

    const validation = validateJSON(value);
    setIsValid(validation.isValid);
    setError(validation.error);

    // Notify parent of validation change
    if (onValidationChange) {
      onValidationChange(validation.isValid, validation.error);
    }

    // If valid, update parent config
    if (validation.isValid && validation.parsed) {
      onChange(validation.parsed);

      // If the parsed JSON was a full theme object (with config property),
      // update the textarea to show only the config for better UX
      try {
        const parsed = JSON.parse(value);
        if (parsed.config && typeof parsed.config === 'object' && !parsed.config.name) {
          // It's a full theme object, extract and display only config
          const configOnly = JSON.stringify(parsed.config, null, 2);
          setJsonValue(configOnly);
        }
      } catch {
        // Ignore parsing errors, keep the original value
      }
    }
  };

  const handleFormat = () => {
    const validation = validateJSON(jsonValue);
    if (validation.isValid && validation.parsed) {
      // Format the config object (extracted if it was nested)
      const formatted = JSON.stringify(validation.parsed, null, 2);
      setJsonValue(formatted);
      setIsDirty(true);
    }
  };

  const handleReset = () => {
    try {
      const formatted = JSON.stringify(config, null, 2);
      setJsonValue(formatted);
      setIsDirty(false);
      setIsValid(true);
      setError(null);
      if (onValidationChange) {
        onValidationChange(true, null);
      }
    } catch (err) {
      setError('Erreur lors de la réinitialisation');
      setIsValid(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">Éditeur JSON</h3>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleFormat} variant="outline" size="sm" disabled={!isValid}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Formater
          </Button>
          <Button onClick={handleReset} variant="outline" size="sm">
            Réinitialiser
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="error" title="Erreur de validation">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-error-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">{error}</p>
              {isDirty && (
                <p className="text-sm text-muted-foreground mt-1">
                  Le JSON contient des erreurs. Corrigez-les avant de sauvegarder.
                </p>
              )}
            </div>
          </div>
        </Alert>
      )}

      {isValid && isDirty && (
        <Alert variant="success" title="JSON valide">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-success-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm">Le JSON est valide et sera appliqué lors de la sauvegarde.</p>
          </div>
        </Alert>
      )}

      <div className="relative">
        <Textarea
          value={jsonValue}
          onChange={(e) => handleChange(e.target.value)}
          className={`
            font-mono text-sm
            min-h-[400px]
            ${!isValid ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''}
          `}
          placeholder='{"primary_color": "#2563eb", "secondary_color": "#6366f1", ...}'
        />
        <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
          {jsonValue.split('\n').length} lignes
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        <p className="font-medium mb-1">Conseils :</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Utilisez le bouton "Formater" pour formater automatiquement le JSON</li>
          <li>Les couleurs doivent être au format hexadécimal (ex: #2563eb)</li>
          <li>Tous les champs de couleur sont requis</li>
          <li>Les modifications sont appliquées en temps réel si le JSON est valide</li>
        </ul>
      </div>
    </div>
  );
}
