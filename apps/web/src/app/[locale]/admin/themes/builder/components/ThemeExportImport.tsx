'use client';

/**
 * Theme Export/Import Component
 * Export theme config as JSON or import from file
 */

import { useState, useRef } from 'react';
import { Card, Button, Textarea, Alert } from '@/components/ui';
import type { ThemeConfig } from '@modele/types';
import { Download, Upload, Copy, Check } from 'lucide-react';

interface ThemeExportImportProps {
  config: ThemeConfig;
  onImport: (config: ThemeConfig) => void;
  onExport: () => void;
}

export function ThemeExportImport({ config, onImport, onExport }: ThemeExportImportProps) {
  const [jsonText, setJsonText] = useState(JSON.stringify(config, null, 2));
  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(jsonText) as ThemeConfig;
      setImportError(null);
      onImport(parsed);
    } catch (error: unknown) {
      setImportError('Invalid JSON format. Please check your theme configuration.');
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content) as ThemeConfig;
        setImportError(null);
        setJsonText(content);
        onImport(parsed);
      } catch (error: unknown) {
        setImportError('Failed to parse file. Please ensure it is valid JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="mt-6 space-y-6">
      {/* Export Section */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Export Theme</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Export your theme configuration as JSON to share or backup
          </p>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button variant="primary" onClick={onExport}>
                <Download className="w-4 h-4 mr-2" />
                Download JSON
              </Button>
              <Button variant="secondary" onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy to Clipboard
                  </>
                )}
              </Button>
            </div>
            <Textarea
              label="Theme JSON"
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={15}
              className="font-mono text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Import Section */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Import Theme</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Import a theme configuration from JSON file or paste JSON below
          </p>
          <div className="space-y-4">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
              <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Import from File
              </Button>
            </div>

            {importError && (
              <Alert variant="error" title="Import Error">
                {importError}
              </Alert>
            )}

            <div>
              <Button variant="primary" onClick={handleImport}>
                Import from JSON
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
