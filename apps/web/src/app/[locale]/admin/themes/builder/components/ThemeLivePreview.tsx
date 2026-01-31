'use client';

/**
 * Theme Live Preview Component
 * Live preview of theme applied to sample components
 */

import { useEffect } from 'react';
import { Card, Button, Badge, Alert, Input } from '@/components/ui';
import { Stack } from '@/components/ui';
import type { ThemeConfig } from '@modele/types';
import { applyThemeConfigDirectly } from '@/lib/theme/apply-theme-config';

interface ThemeLivePreviewProps {
  config: ThemeConfig;
}

export function ThemeLivePreview({ config }: ThemeLivePreviewProps) {
  useEffect(() => {
    // Apply the preview config temporarily
    if (typeof window !== 'undefined') {
      applyThemeConfigDirectly(config, { bypassDarkModeProtection: true });
    }
  }, [config]);

  return (
    <div className="mt-6 space-y-6">
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Live Preview</h3>
          <p className="text-sm text-muted-foreground mb-6">
            See how your theme looks applied to real components
          </p>

          <Stack gapValue="1.5rem">
            {/* Buttons */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">Buttons</h4>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
            </div>

            {/* Badges */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">Badges</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">Default</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="error">Danger</Badge>
                <Badge variant="info">Info</Badge>
              </div>
            </div>

            {/* Alerts */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">Alerts</h4>
              <Stack gapValue="0.5rem">
                <Alert variant="success" title="Success">
                  This is a success message
                </Alert>
                <Alert variant="warning" title="Warning">
                  This is a warning message
                </Alert>
                <Alert variant="error" title="Error">
                  This is an error message
                </Alert>
              </Stack>
            </div>

            {/* Form Elements */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">Form Elements</h4>
              <Stack gapValue="0.5rem">
                <Input label="Email" placeholder="you@example.com" type="email" />
                <Input label="Password" placeholder="Enter password" type="password" />
              </Stack>
            </div>

            {/* Cards */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">Cards</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <div className="p-4">
                    <h5 className="font-semibold text-foreground mb-2">Card Title</h5>
                    <p className="text-sm text-muted-foreground">
                      This is a sample card with your theme applied.
                    </p>
                  </div>
                </Card>
                <Card>
                  <div className="p-4">
                    <h5 className="font-semibold text-foreground mb-2">Another Card</h5>
                    <p className="text-sm text-muted-foreground">
                      Cards use your theme's background and border colors.
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </Stack>
        </div>
      </Card>
    </div>
  );
}
