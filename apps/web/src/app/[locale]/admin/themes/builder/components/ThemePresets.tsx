'use client';

/**
 * Theme Presets Component
 * Display and select from available theme presets
 */

import { Card, Button, Grid } from '@/components/ui';
import type { ThemePreset } from '@/lib/theme/presets';

interface ThemePresetsProps {
  presets: ThemePreset[];
  onSelect: (preset: ThemePreset) => void;
}

export function ThemePresets({ presets, onSelect }: ThemePresetsProps) {
  return (
    <div className="mt-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground mb-2">Choose a Preset</h3>
        <p className="text-sm text-muted-foreground">
          Start with a pre-configured theme and customize it to your needs
        </p>
      </div>

      <Grid columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap="normal">
        {presets.map((preset) => (
          <Card
            key={preset.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onSelect(preset)}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-lg font-semibold text-foreground">{preset.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{preset.description}</p>
                </div>
              </div>

              {/* Color Preview */}
              <div className="flex gap-2 mb-4">
                <div
                  className="w-8 h-8 rounded-full border-2 border-border"
                  style={{ backgroundColor: preset.config.primary_color }}
                  title="Primary"
                />
                <div
                  className="w-8 h-8 rounded-full border-2 border-border"
                  style={{ backgroundColor: preset.config.secondary_color }}
                  title="Secondary"
                />
                <div
                  className="w-8 h-8 rounded-full border-2 border-border"
                  style={{ backgroundColor: preset.config.success_color }}
                  title="Success"
                />
                <div
                  className="w-8 h-8 rounded-full border-2 border-border"
                  style={{ backgroundColor: preset.config.danger_color }}
                  title="Danger"
                />
              </div>

              <Button variant="primary" className="w-full">
                Use This Preset
              </Button>
            </div>
          </Card>
        ))}
      </Grid>
    </div>
  );
}
