'use client';

/**
 * Theme Builder Component
 * Visual theme editor with live preview
 */

import { useState, useCallback } from 'react';
import { Card, Button, Alert, Tabs } from '@/components/ui';
import { ThemePresets } from './ThemePresets';
import { ThemeVisualEditor } from './ThemeVisualEditor';
import { ThemeLivePreview } from './ThemeLivePreview';
import { ThemeExportImport } from './ThemeExportImport';
import type { ThemeConfig } from '@modele/types';
import { DEFAULT_THEME_CONFIG } from '@/lib/theme/default-theme-config';
import { themePresets, type ThemePreset } from '@/lib/theme/presets';
import { Save, Download } from 'lucide-react';

export function ThemeBuilder() {
  const [config, setConfig] = useState<ThemeConfig>(DEFAULT_THEME_CONFIG);
  const [activeTab, setActiveTab] = useState<'presets' | 'editor' | 'preview' | 'export'>(
    'presets'
  );
  const [savedConfig, setSavedConfig] = useState<ThemeConfig | null>(null);

  const handlePresetSelect = useCallback((preset: ThemePreset) => {
    setConfig(preset.config);
    setActiveTab('editor');
  }, []);

  const handleConfigUpdate = useCallback((updatedConfig: ThemeConfig) => {
    setConfig(updatedConfig);
  }, []);

  const handleSave = useCallback(() => {
    setSavedConfig(config);
    // In a real implementation, this would save to the backend
    // For now, we just store it locally
    localStorage.setItem('theme-builder-config', JSON.stringify(config));
  }, [config]);

  const handleExport = useCallback(() => {
    const json = JSON.stringify(config, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'theme-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [config]);

  const handleImport = useCallback((importedConfig: ThemeConfig) => {
    setConfig(importedConfig);
    setActiveTab('editor');
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Theme Builder</h2>
              <p className="text-muted-foreground mt-1">
                Create and customize themes with visual controls and live preview
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
              <Button variant="primary" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {savedConfig && (
            <Alert variant="success" className="mb-4">
              Theme configuration saved successfully!
            </Alert>
          )}

          <Tabs
            tabs={[
              {
                id: 'presets',
                label: 'Presets',
                content: <ThemePresets presets={themePresets} onSelect={handlePresetSelect} />,
              },
              {
                id: 'editor',
                label: 'Visual Editor',
                content: <ThemeVisualEditor config={config} onUpdate={handleConfigUpdate} />,
              },
              {
                id: 'preview',
                label: 'Live Preview',
                content: <ThemeLivePreview config={config} />,
              },
              {
                id: 'export',
                label: 'Export/Import',
                content: (
                  <ThemeExportImport
                    config={config}
                    onImport={handleImport}
                    onExport={handleExport}
                  />
                ),
              },
            ]}
            defaultTab="presets"
            onChange={(tabId) => setActiveTab(tabId as typeof activeTab)}
          />
        </div>
      </Card>
    </div>
  );
}
