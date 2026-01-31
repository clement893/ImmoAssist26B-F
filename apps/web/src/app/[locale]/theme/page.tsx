'use client';

import { useGlobalTheme } from '@/lib/theme/global-theme-provider';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Text from '@/components/ui/Text';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Link from 'next/link';

export default function ThemePreviewPage() {
  const { theme, isLoading } = useGlobalTheme();

  if (isLoading) {
    return (
      <Container className="py-8">
        <Text>Chargement du thème...</Text>
      </Container>
    );
  }

  if (!theme?.config) {
    return (
      <Container className="py-8">
        <Card className="p-8">
          <Heading level={2}>Aucun thème actif</Heading>
          <Text className="text-muted-foreground mb-4">
            Aucun thème n'est actuellement actif. Configurez un thème dans les paramètres
            d'administration.
          </Text>
          <Link href="/admin/themes">
            <Button variant="primary">Gérer les thèmes</Button>
          </Link>
        </Card>
      </Container>
    );
  }

  const config = theme.config;

  return (
    <Container className="py-8">
      <div className="mb-8">
        <Link href="/components">
          <Button variant="secondary" size="sm" className="mb-4">
            ← Retour aux composants
          </Button>
        </Link>
        <Heading level={1} className="mb-4">
          Thème Actif
        </Heading>
        <Text className="text-muted-foreground">
          Visualisation complète du thème actuellement appliqué. Toutes les valeurs sont liées
          dynamiquement au thème.
        </Text>
        {theme.name && (
          <Badge variant="info" className="mt-4">
            {theme.name}
          </Badge>
        )}
      </div>

      {/* Couleurs Principales */}
      <Card className="mb-6 p-6">
        <Heading level={2} className="mb-4">
          Couleurs Principales
        </Heading>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {config.primary_color && (
            <div>
              <div
                className="w-full h-24 rounded-lg mb-2 border"
                style={{ backgroundColor: config.primary_color }}
              />
              <Text className="text-xs font-medium">Primary</Text>
              <Text className="text-xs text-muted-foreground font-mono">
                {config.primary_color}
              </Text>
            </div>
          )}
          {config.secondary_color && (
            <div>
              <div
                className="w-full h-24 rounded-lg mb-2 border"
                style={{ backgroundColor: config.secondary_color }}
              />
              <Text className="text-xs font-medium">Secondary</Text>
              <Text className="text-xs text-muted-foreground font-mono">
                {config.secondary_color}
              </Text>
            </div>
          )}
          {config.danger_color && (
            <div>
              <div
                className="w-full h-24 rounded-lg mb-2 border"
                style={{ backgroundColor: config.danger_color }}
              />
              <Text className="text-xs font-medium">Danger</Text>
              <Text className="text-xs text-muted-foreground font-mono">
                {config.danger_color}
              </Text>
            </div>
          )}
          {config.warning_color && (
            <div>
              <div
                className="w-full h-24 rounded-lg mb-2 border"
                style={{ backgroundColor: config.warning_color }}
              />
              <Text className="text-xs font-medium">Warning</Text>
              <Text className="text-xs text-muted-foreground font-mono">
                {config.warning_color}
              </Text>
            </div>
          )}
          {config.info_color && (
            <div>
              <div
                className="w-full h-24 rounded-lg mb-2 border"
                style={{ backgroundColor: config.info_color }}
              />
              <Text className="text-xs font-medium">Info</Text>
              <Text className="text-xs text-muted-foreground font-mono">
                {config.info_color}
              </Text>
            </div>
          )}
          {config.success_color && (
            <div>
              <div
                className="w-full h-24 rounded-lg mb-2 border"
                style={{ backgroundColor: config.success_color }}
              />
              <Text className="text-xs font-medium">Success</Text>
              <Text className="text-xs text-muted-foreground font-mono">
                {config.success_color}
              </Text>
            </div>
          )}
        </div>
      </Card>

      {/* Couleurs Complètes */}
      {config.colors && typeof config.colors === 'object' && (
        <Card className="mb-6 p-6">
          <Heading level={2} className="mb-4">
            Palette de Couleurs Complète
          </Heading>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(config.colors).map(([key, value]) => {
              if (typeof value === 'string' && value.startsWith('#')) {
                return (
                  <div key={key}>
                    <div
                      className="w-full h-20 rounded-lg mb-2 border"
                      style={{ backgroundColor: value }}
                    />
                    <Text className="text-xs font-medium capitalize">{key}</Text>
                    <Text className="text-xs text-muted-foreground font-mono">{value}</Text>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </Card>
      )}

      {/* Typographie */}
      {config.typography && typeof config.typography === 'object' && (
        <Card className="mb-6 p-6">
          <Heading level={2} className="mb-4">
            Typographie
          </Heading>
          <div className="space-y-4">
            {config.font_family && (
              <div>
                <Text className="text-sm font-medium mb-1">Famille de Police</Text>
                <Text className="text-muted-foreground font-mono">{config.font_family}</Text>
              </div>
            )}
            {config.typography.fontFamily && (
              <div>
                <Text className="text-sm font-medium mb-1">Police Principale</Text>
                <Text className="text-muted-foreground font-mono">
                  {String(config.typography.fontFamily)}
                </Text>
              </div>
            )}
            {config.typography.fontSize && (
              <div>
                <Text className="text-sm font-medium mb-2">Tailles de Police</Text>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(config.typography.fontSize).map(([key, value]) => (
                    <div key={key} className="p-3 bg-muted rounded">
                      <Text className="text-xs font-medium mb-1 capitalize">{key}</Text>
                      <Text
                        className="font-mono"
                        style={{ fontSize: String(value) }}
                      >
                        Aa
                      </Text>
                      <Text className="text-xs text-muted-foreground font-mono">
                        {String(value)}
                      </Text>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(() => {
              const fontWeight = config.typography.fontWeight;
              if (fontWeight && typeof fontWeight === 'object' && fontWeight !== null) {
                return (
                  <div>
                    <Text className="text-sm font-medium mb-2">Poids de Police</Text>
                    <div className="flex flex-wrap gap-4">
                      {Object.entries(fontWeight).map(([key, value]) => (
                        <div key={key} className="p-3 bg-muted rounded">
                          <Text className="text-xs font-medium mb-1 capitalize">{key}</Text>
                          <Text className="font-mono" style={{ fontWeight: String(value) }}>
                            {String(value)}
                          </Text>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </Card>
      )}

      {/* Espacement */}
      {config.spacing && typeof config.spacing === 'object' && (
        <Card className="mb-6 p-6">
          <Heading level={2} className="mb-4">
            Espacement
          </Heading>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(config.spacing).map(([key, value]) => (
              <div key={key} className="p-3 bg-muted rounded">
                <Text className="text-xs font-medium mb-1 capitalize">{key}</Text>
                <div
                  className="bg-primary rounded"
                  style={{ width: String(value), height: '20px' }}
                />
                <Text className="text-xs text-muted-foreground font-mono mt-1">
                  {String(value)}
                </Text>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Border Radius */}
      {(config.border_radius || (config.borderRadius && typeof config.borderRadius === 'object')) && (
        <Card className="mb-6 p-6">
          <Heading level={2} className="mb-4">
            Border Radius
          </Heading>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {config.border_radius && (
              <div className="p-3 bg-muted rounded">
                <Text className="text-xs font-medium mb-1">Base</Text>
                <div
                  className="bg-primary w-16 h-16"
                  style={{ borderRadius: config.border_radius }}
                />
                <Text className="text-xs text-muted-foreground font-mono mt-1">
                  {config.border_radius}
                </Text>
              </div>
            )}
            {config.borderRadius &&
              typeof config.borderRadius === 'object' &&
              Object.entries(config.borderRadius).map(([key, value]) => (
                <div key={key} className="p-3 bg-muted rounded">
                  <Text className="text-xs font-medium mb-1 capitalize">{key}</Text>
                  <div
                    className="bg-primary w-16 h-16"
                    style={{ borderRadius: String(value) }}
                  />
                  <Text className="text-xs text-muted-foreground font-mono mt-1">
                    {String(value)}
                  </Text>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Configuration JSON */}
      <Card className="p-6">
        <Heading level={2} className="mb-4">
          Configuration Complète (JSON)
        </Heading>
        <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
          <code>{JSON.stringify(config, null, 2)}</code>
        </pre>
      </Card>
    </Container>
  );
}
