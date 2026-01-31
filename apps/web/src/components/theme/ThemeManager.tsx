/**
 * Theme Manager Component
 * Permet de modifier dynamiquement le thème (couleurs, polices, etc.)
 */
'use client';
import { useState } from 'react';
import { clsx } from 'clsx';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useToast } from '@/components/ui';
import { useThemeManager } from './hooks';
import { themePresets, type ThemePresetName } from './presets';
import { FONT_OPTIONS, BORDER_RADIUS_OPTIONS } from './constants';
import type { ThemeConfig } from './types';

export type { ThemeConfig, ThemePresetName };

// Color input component helper function
function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs text-muted-foreground mb-1">{label}</label>
      <div className="flex gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-20 rounded border border-border cursor-pointer"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="flex-1" />
      </div>
    </div>
  );
}

export function ThemeManager() {
  const { theme, updateColor, resetTheme, mounted } = useThemeManager();
  const { showToast } = useToast();
  const [selectedPreset, setSelectedPreset] = useState<ThemePresetName>('default');

  const applyPreset = (presetName: ThemePresetName) => {
    const preset = themePresets[presetName];
    // Update theme through the hook
    Object.entries(preset).forEach(([key, value]) => {
      updateColor(key as keyof ThemeConfig, value as string);
    });
    setSelectedPreset(presetName);
  };

  const exportTheme = async () => {
    try {
      const themeJson = JSON.stringify(theme, null, 2);
      await navigator.clipboard.writeText(themeJson);
      showToast({
        message: 'Thème copié dans le presse-papiers !',
        type: 'success',
      });
    } catch (error) {
      showToast({
        message: 'Erreur lors de la copie du thème',
        type: 'error',
      });
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <Card title="Gestionnaire de Thème Avancé" className="space-y-6">
      {/* Presets */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Presets de Thème</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(themePresets).map(([name]) => (
            <button
              key={name}
              onClick={() => applyPreset(name as ThemePresetName)}
              className={clsx(
                'px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all',
                selectedPreset === name
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-900 dark:text-primary-100'
                  : 'border-border bg-background text-foreground hover:border-border dark:hover:border-border'
              )}
            >
              {name.charAt(0).toUpperCase() + name.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Couleurs</h3>
        <ColorInput label="Primary" value={theme.primary} onChange={(v) => updateColor('primary', v)} />
        <ColorInput
          label="Secondary"
          value={theme.secondary}
          onChange={(v) => updateColor('secondary', v)}
        />
        <ColorInput label="Danger" value={theme.danger} onChange={(v) => updateColor('danger', v)} />
        <ColorInput label="Warning" value={theme.warning} onChange={(v) => updateColor('warning', v)} />
        <ColorInput label="Info" value={theme.info} onChange={(v) => updateColor('info', v)} />
      </div>

      {/* Typography - Fonts */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Typographie - Polices</h3>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">
            Police principale (corps de texte)
          </label>
          <Select
            options={FONT_OPTIONS}
            value={theme.fontFamily}
            onChange={(e) => updateColor('fontFamily', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Police des titres</label>
          <Select
            options={FONT_OPTIONS}
            value={theme.fontFamilyHeading}
            onChange={(e) => updateColor('fontFamilyHeading', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Police des sous-titres</label>
          <Select
            options={FONT_OPTIONS}
            value={theme.fontFamilySubheading}
            onChange={(e) => updateColor('fontFamilySubheading', e.target.value)}
          />
        </div>
      </div>

      {/* Typography - Text Colors */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Typographie - Couleurs de texte</h3>
        <ColorInput
          label="Couleur des titres"
          value={theme.textHeading}
          onChange={(v) => updateColor('textHeading', v)}
        />
        <ColorInput
          label="Couleur des sous-titres"
          value={theme.textSubheading}
          onChange={(v) => updateColor('textSubheading', v)}
        />
        <ColorInput
          label="Couleur du texte principal"
          value={theme.textBody}
          onChange={(v) => updateColor('textBody', v)}
        />
        <ColorInput
          label="Couleur du texte secondaire"
          value={theme.textSecondary}
          onChange={(v) => updateColor('textSecondary', v)}
        />
        <ColorInput
          label="Couleur des liens"
          value={theme.textLink}
          onChange={(v) => updateColor('textLink', v)}
        />
      </div>

      {/* Error & Validation Colors */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Couleurs d'erreur et validation</h3>
        <ColorInput
          label="Couleur d'erreur"
          value={theme.errorColor}
          onChange={(v) => updateColor('errorColor', v)}
        />
        <ColorInput label="Fond d'erreur" value={theme.errorBg} onChange={(v) => updateColor('errorBg', v)} />
        <ColorInput
          label="Couleur de succès"
          value={theme.successColor}
          onChange={(v) => updateColor('successColor', v)}
        />
        <ColorInput
          label="Fond de succès"
          value={theme.successBg}
          onChange={(v) => updateColor('successBg', v)}
        />
      </div>

      {/* Border Radius */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Style</h3>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Border Radius</label>
          <Select
            options={BORDER_RADIUS_OPTIONS}
            value={theme.borderRadius}
            onChange={(e) => updateColor('borderRadius', e.target.value)}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-border">
        <Button onClick={resetTheme} variant="outline" className="flex-1">
          Réinitialiser
        </Button>
        <Button onClick={exportTheme} variant="primary" className="flex-1">
          Exporter
        </Button>
      </div>
    </Card>
  );
}
