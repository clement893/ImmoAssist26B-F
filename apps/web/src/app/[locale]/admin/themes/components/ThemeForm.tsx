'use client';

/**
 * ThemeForm Component
 * Form for editing theme basic properties
 */

import { Input, Textarea, Badge } from '@/components/ui';
import type { ThemeFormData } from '../types';
import type { ThemeConfig } from '@modele/types';
import { Type, Info } from 'lucide-react';

interface ThemeFormProps {
  formData: ThemeFormData;
  onChange: (field: keyof ThemeFormData, value: string) => void;
  config?: ThemeConfig; // Optional config to show selected fonts
}

export function ThemeForm({ formData, onChange, config }: ThemeFormProps) {
  // Extract font IDs from config if present
  const fontFiles =
    config?.typography && 'fontFiles' in config.typography
      ? (config.typography as { fontFiles?: number[] }).fontFiles
      : undefined;
  const hasSelectedFonts = Array.isArray(fontFiles) && fontFiles.length > 0;
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
          Nom technique <span className="text-danger">*</span>
        </label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="mon-theme"
          required
          disabled={
            formData.name === 'template-theme' ||
            formData.name === 'TemplateTheme' ||
            formData.name === 'template-theme2' ||
            formData.name === 'TemplateTheme2'
          }
        />
        <p className="text-xs text-muted-foreground mt-1">
          Nom unique utilisé pour identifier le thème (sans espaces, en minuscules)
          {(formData.name === 'template-theme' ||
            formData.name === 'TemplateTheme' ||
            formData.name === 'template-theme2' ||
            formData.name === 'TemplateTheme2') && (
            <span className="block mt-1 text-warning-600 dark:text-warning-400">
              ⚠ Le TemplateTheme ne peut pas avoir son nom modifié
            </span>
          )}
        </p>
      </div>

      <div>
        <label htmlFor="display_name" className="block text-sm font-medium text-foreground mb-2">
          Nom d'affichage <span className="text-danger">*</span>
        </label>
        <Input
          id="display_name"
          value={formData.display_name}
          onChange={(e) => onChange('display_name', e.target.value)}
          placeholder="Mon Thème"
          required
          disabled={
            formData.name === 'template-theme' ||
            formData.name === 'TemplateTheme' ||
            formData.name === 'template-theme2' ||
            formData.name === 'TemplateTheme2'
          }
        />
        <p className="text-xs text-muted-foreground mt-1">
          Nom affiché dans l'interface d'administration
          {(formData.name === 'template-theme' ||
            formData.name === 'TemplateTheme' ||
            formData.name === 'template-theme2' ||
            formData.name === 'TemplateTheme2') && (
            <span className="block mt-1 text-warning-600 dark:text-warning-400">
              ⚠ Le TemplateTheme ne peut pas avoir son nom modifié
            </span>
          )}
        </p>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
          Description
        </label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Description du thème..."
          rows={3}
          disabled={
            formData.name === 'template-theme' ||
            formData.name === 'TemplateTheme' ||
            formData.name === 'template-theme2' ||
            formData.name === 'TemplateTheme2'
          }
        />
        <p className="text-xs text-muted-foreground mt-1">
          Description optionnelle du thème
          {(formData.name === 'template-theme' ||
            formData.name === 'TemplateTheme' ||
            formData.name === 'template-theme2' ||
            formData.name === 'TemplateTheme2') && (
            <span className="block mt-1 text-warning-600 dark:text-warning-400">
              ⚠ Le TemplateTheme ne peut pas avoir sa description modifiée
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="primary_color" className="block text-sm font-medium text-foreground mb-2">
            Couleur primaire <span className="text-danger">*</span>
          </label>
          <Input
            id="primary_color"
            type="color"
            value={formData.primary_color}
            onChange={(e) => onChange('primary_color', e.target.value)}
            className="h-10"
          />
          <Input
            value={formData.primary_color}
            onChange={(e) => onChange('primary_color', e.target.value)}
            placeholder="#2563eb"
            className="mt-2"
          />
        </div>

        <div>
          <label
            htmlFor="secondary_color"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Couleur secondaire <span className="text-danger">*</span>
          </label>
          <Input
            id="secondary_color"
            type="color"
            value={formData.secondary_color}
            onChange={(e) => onChange('secondary_color', e.target.value)}
            className="h-10"
          />
          <Input
            value={formData.secondary_color}
            onChange={(e) => onChange('secondary_color', e.target.value)}
            placeholder="#6366f1"
            className="mt-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="danger_color" className="block text-sm font-medium text-foreground mb-2">
            Couleur danger <span className="text-danger">*</span>
          </label>
          <Input
            id="danger_color"
            type="color"
            value={formData.danger_color}
            onChange={(e) => onChange('danger_color', e.target.value)}
            className="h-10"
          />
          <Input
            value={formData.danger_color}
            onChange={(e) => onChange('danger_color', e.target.value)}
            placeholder="#dc2626"
            className="mt-2"
          />
        </div>

        <div>
          <label htmlFor="warning_color" className="block text-sm font-medium text-foreground mb-2">
            Couleur avertissement <span className="text-danger">*</span>
          </label>
          <Input
            id="warning_color"
            type="color"
            value={formData.warning_color}
            onChange={(e) => onChange('warning_color', e.target.value)}
            className="h-10"
          />
          <Input
            value={formData.warning_color}
            onChange={(e) => onChange('warning_color', e.target.value)}
            placeholder="#d97706"
            className="mt-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="info_color" className="block text-sm font-medium text-foreground mb-2">
            Couleur info <span className="text-danger">*</span>
          </label>
          <Input
            id="info_color"
            type="color"
            value={formData.info_color}
            onChange={(e) => onChange('info_color', e.target.value)}
            className="h-10"
          />
          <Input
            value={formData.info_color}
            onChange={(e) => onChange('info_color', e.target.value)}
            placeholder="#0891b2"
            className="mt-2"
          />
        </div>

        <div>
          <label htmlFor="success_color" className="block text-sm font-medium text-foreground mb-2">
            Couleur succès <span className="text-danger">*</span>
          </label>
          <Input
            id="success_color"
            type="color"
            value={formData.success_color}
            onChange={(e) => onChange('success_color', e.target.value)}
            className="h-10"
          />
          <Input
            value={formData.success_color}
            onChange={(e) => onChange('success_color', e.target.value)}
            placeholder="#059669"
            className="mt-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="font_family" className="block text-sm font-medium text-foreground mb-2">
            Police de caractères
          </label>
          <Input
            id="font_family"
            value={formData.font_family || ''}
            onChange={(e) => onChange('font_family', e.target.value)}
            placeholder="Inter, sans-serif"
          />
          {hasSelectedFonts && (
            <div className="mt-2 p-3 bg-muted rounded-md border border-border">
              <div className="flex items-start gap-2">
                <Type className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground mb-1">
                    Polices personnalisées sélectionnées
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {fontFiles.map((fontId: number) => (
                      <Badge key={fontId} variant="default" className="text-xs">
                        ID: {fontId}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Gérer les polices dans l'onglet "Polices"
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="border_radius" className="block text-sm font-medium text-foreground mb-2">
            Rayon des bordures
          </label>
          <Input
            id="border_radius"
            value={formData.border_radius || ''}
            onChange={(e) => onChange('border_radius', e.target.value)}
            placeholder="8px"
          />
        </div>
      </div>
    </div>
  );
}
