'use client';

/**
 * Theme Visual Editor Component
 * Visual controls for editing theme properties
 */

import { useState } from 'react';
import { Card, Input, Stack, Grid } from '@/components/ui';
import type { ThemeConfig } from '@modele/types';

interface ThemeVisualEditorProps {
  config: ThemeConfig;
  onUpdate: (config: ThemeConfig) => void;
}

export function ThemeVisualEditor({ config, onUpdate }: ThemeVisualEditorProps) {
  const [localConfig, setLocalConfig] = useState<ThemeConfig>(config);

  const updateField = (key: keyof ThemeConfig, value: string) => {
    const updated = { ...localConfig, [key]: value };
    setLocalConfig(updated);
    onUpdate(updated);
  };

  const updateNested = (path: string[], value: unknown) => {
    const updated = { ...localConfig };
    let current: Record<string, unknown> = updated as Record<string, unknown>;
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (key === undefined) continue;
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
    }
    const lastKey = path[path.length - 1];
    if (lastKey !== undefined) {
      current[lastKey] = value;
    }
    setLocalConfig(updated);
    onUpdate(updated);
  };

  return (
    <div className="mt-6 space-y-6">
      {/* Colors Section */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Colors</h3>
          <Grid columns={{ mobile: 1, tablet: 2 }} gap="normal">
            <div>
              <label
                htmlFor="primary_color"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Primary Color
              </label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="primary_color"
                  type="color"
                  value={localConfig.primary_color || '#2563eb'}
                  onChange={(e) => updateField('primary_color', e.target.value)}
                  className="w-16 h-10"
                />
                <Input
                  type="text"
                  value={localConfig.primary_color || '#2563eb'}
                  onChange={(e) => updateField('primary_color', e.target.value)}
                  placeholder="#2563eb"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="secondary_color"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Secondary Color
              </label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="secondary_color"
                  type="color"
                  value={localConfig.secondary_color || '#6366f1'}
                  onChange={(e) => updateField('secondary_color', e.target.value)}
                  className="w-16 h-10"
                />
                <Input
                  type="text"
                  value={localConfig.secondary_color || '#6366f1'}
                  onChange={(e) => updateField('secondary_color', e.target.value)}
                  placeholder="#6366f1"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="success_color"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Success Color
              </label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="success_color"
                  type="color"
                  value={localConfig.success_color || '#059669'}
                  onChange={(e) => updateField('success_color', e.target.value)}
                  className="w-16 h-10"
                />
                <Input
                  type="text"
                  value={localConfig.success_color || '#059669'}
                  onChange={(e) => updateField('success_color', e.target.value)}
                  placeholder="#059669"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="danger_color"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Danger Color
              </label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="danger_color"
                  type="color"
                  value={localConfig.danger_color || '#dc2626'}
                  onChange={(e) => updateField('danger_color', e.target.value)}
                  className="w-16 h-10"
                />
                <Input
                  type="text"
                  value={localConfig.danger_color || '#dc2626'}
                  onChange={(e) => updateField('danger_color', e.target.value)}
                  placeholder="#dc2626"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="warning_color"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Warning Color
              </label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="warning_color"
                  type="color"
                  value={localConfig.warning_color || '#d97706'}
                  onChange={(e) => updateField('warning_color', e.target.value)}
                  className="w-16 h-10"
                />
                <Input
                  type="text"
                  value={localConfig.warning_color || '#d97706'}
                  onChange={(e) => updateField('warning_color', e.target.value)}
                  placeholder="#d97706"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="info_color"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Info Color
              </label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="info_color"
                  type="color"
                  value={localConfig.info_color || '#0891b2'}
                  onChange={(e) => updateField('info_color', e.target.value)}
                  className="w-16 h-10"
                />
                <Input
                  type="text"
                  value={localConfig.info_color || '#0891b2'}
                  onChange={(e) => updateField('info_color', e.target.value)}
                  placeholder="#0891b2"
                />
              </div>
            </div>
          </Grid>
        </div>
      </Card>

      {/* Typography Section */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Typography</h3>
          <Stack gapValue="1rem">
            <div>
              <label
                htmlFor="font_family"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Font Family
              </label>
              <Input
                id="font_family"
                type="text"
                value={localConfig.font_family || ''}
                onChange={(e) => updateField('font_family', e.target.value)}
                placeholder="Inter, sans-serif"
                className="mt-1"
              />
            </div>

            <div>
              <label
                htmlFor="border_radius"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Border Radius
              </label>
              <Input
                id="border_radius"
                type="text"
                value={localConfig.border_radius || ''}
                onChange={(e) => updateField('border_radius', e.target.value)}
                placeholder="0.375rem"
                className="mt-1"
              />
            </div>
          </Stack>
        </div>
      </Card>

      {/* Layout Section */}
      {localConfig.layout && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Layout</h3>
            <Stack gapValue="1rem">
              {localConfig.layout.spacing && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Spacing Unit
                  </label>
                  <Input
                    type="text"
                    value={localConfig.layout.spacing.unit || '0.25rem'}
                    onChange={(e) => updateNested(['layout', 'spacing', 'unit'], e.target.value)}
                    placeholder="0.25rem"
                    className="mt-1"
                  />
                </div>
              )}
            </Stack>
          </div>
        </Card>
      )}
    </div>
  );
}
