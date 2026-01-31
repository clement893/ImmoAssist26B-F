'use client';

/**
 * ThemePreview Component
 * Preview of theme with demo components
 */

import { useEffect } from 'react';
import { Card, Button, Alert, Badge } from '@/components/ui';
import { applyThemeConfigDirectly } from '@/lib/theme/apply-theme-config';
import type { ThemeConfig } from '@modele/types';

interface ThemePreviewProps {
  config: ThemeConfig;
}

export function ThemePreview({ config }: ThemePreviewProps) {
  // Apply theme config directly for preview
  useEffect(() => {
    applyThemeConfigDirectly(config, {
      bypassDarkModeProtection: true,
      validateContrast: false,
      logWarnings: false,
    });

    // Cleanup: restore original theme when component unmounts
    return () => {
      // The GlobalThemeProvider will restore the active theme
      // We just remove the manual flag
      if (typeof document !== 'undefined') {
        document.documentElement.removeAttribute('data-manual-theme');
      }
    };
  }, [config]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Prévisualisation du thème</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Aperçu en temps réel des composants avec ce thème
          </p>
        </div>
      </div>

      {/* Colors Preview */}
      <Card>
        <div className="p-6">
          <h4 className="text-md font-semibold text-foreground mb-4">Couleurs</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <div
                className="w-full h-20 rounded-lg mb-2 border border-border"
                style={{ backgroundColor: config.primary_color }}
              />
              <p className="text-xs text-muted-foreground">Primaire</p>
              <p className="text-xs font-mono text-foreground">{config.primary_color}</p>
            </div>
            <div>
              <div
                className="w-full h-20 rounded-lg mb-2 border border-border"
                style={{ backgroundColor: config.secondary_color }}
              />
              <p className="text-xs text-muted-foreground">Secondaire</p>
              <p className="text-xs font-mono text-foreground">{config.secondary_color}</p>
            </div>
            <div>
              <div
                className="w-full h-20 rounded-lg mb-2 border border-border"
                style={{ backgroundColor: config.danger_color }}
              />
              <p className="text-xs text-muted-foreground">Danger</p>
              <p className="text-xs font-mono text-foreground">{config.danger_color}</p>
            </div>
            <div>
              <div
                className="w-full h-20 rounded-lg mb-2 border border-border"
                style={{ backgroundColor: config.warning_color }}
              />
              <p className="text-xs text-muted-foreground">Avertissement</p>
              <p className="text-xs font-mono text-foreground">{config.warning_color}</p>
            </div>
            <div>
              <div
                className="w-full h-20 rounded-lg mb-2 border border-border"
                style={{ backgroundColor: config.info_color }}
              />
              <p className="text-xs text-muted-foreground">Info</p>
              <p className="text-xs font-mono text-foreground">{config.info_color}</p>
            </div>
            <div>
              <div
                className="w-full h-20 rounded-lg mb-2 border border-border"
                style={{ backgroundColor: config.success_color }}
              />
              <p className="text-xs text-muted-foreground">Succès</p>
              <p className="text-xs font-mono text-foreground">{config.success_color}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Buttons Preview */}
      <Card>
        <div className="p-6">
          <h4 className="text-md font-semibold text-foreground mb-4">Boutons</h4>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Bouton Primaire</Button>
            <Button variant="secondary">Bouton Secondaire</Button>
            <Button variant="outline">Bouton Outline</Button>
            <Button variant="ghost">Bouton Ghost</Button>
            <Button variant="danger">Bouton Danger</Button>
          </div>
        </div>
      </Card>

      {/* Alerts Preview */}
      <Card>
        <div className="p-6 space-y-4">
          <h4 className="text-md font-semibold text-foreground mb-4">Alertes</h4>
          <Alert variant="success" title="Succès">
            Cette alerte indique une opération réussie.
          </Alert>
          <Alert variant="error" title="Erreur">
            Cette alerte indique une erreur.
          </Alert>
          <Alert variant="warning" title="Avertissement">
            Cette alerte indique un avertissement.
          </Alert>
          <Alert variant="info" title="Information">
            Cette alerte fournit des informations.
          </Alert>
        </div>
      </Card>

      {/* Badges Preview */}
      <Card>
        <div className="p-6">
          <h4 className="text-md font-semibold text-foreground mb-4">Badges</h4>
          <div className="flex flex-wrap gap-3">
            <Badge variant="default">Par défaut</Badge>
            <Badge variant="success">Succès</Badge>
            <Badge variant="warning">Avertissement</Badge>
            <Badge variant="error">Erreur</Badge>
            <Badge variant="info">Info</Badge>
          </div>
        </div>
      </Card>

      {/* Typography Preview */}
      <Card>
        <div className="p-6">
          <h4 className="text-md font-semibold text-foreground mb-4">Typographie</h4>
          <div className="space-y-3">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Titre H1</h1>
              <p className="text-sm text-muted-foreground">Titre principal</p>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground">Titre H2</h2>
              <p className="text-sm text-muted-foreground">Sous-titre</p>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-foreground">Titre H3</h3>
              <p className="text-sm text-muted-foreground">Section</p>
            </div>
            <div>
              <p className="text-base text-foreground">
                Paragraphe de texte normal avec une police{' '}
                <span className="font-mono">{config.font_family || 'par défaut'}</span>.
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Texte secondaire avec couleur muted.</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Form Elements Preview */}
      <Card>
        <div className="p-6">
          <h4 className="text-md font-semibold text-foreground mb-4">Éléments de formulaire</h4>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Champ de texte
              </label>
              <input
                type="text"
                placeholder="Saisissez du texte..."
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                style={{
                  borderRadius: config.border_radius || '8px',
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Zone de texte
              </label>
              <textarea
                placeholder="Saisissez plusieurs lignes..."
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                style={{
                  borderRadius: config.border_radius || '8px',
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Sélection</label>
              <select
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                style={{
                  borderRadius: config.border_radius || '8px',
                }}
              >
                <option>Option 1</option>
                <option>Option 2</option>
                <option>Option 3</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Border Radius Preview */}
      {config.border_radius && (
        <Card>
          <div className="p-6">
            <h4 className="text-md font-semibold text-foreground mb-4">Rayon des bordures</h4>
            <div className="flex gap-4 items-center">
              <div
                className="w-20 h-20 bg-primary flex items-center justify-center text-primary-foreground font-semibold"
                style={{
                  borderRadius: config.border_radius,
                }}
              >
                Box
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valeur appliquée:</p>
                <p className="text-sm font-mono text-foreground">{config.border_radius}</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
