/**
 * SEO Manager Component
 *
 * Manages SEO meta tags and settings for pages and content.
 * Provides a comprehensive interface for managing all SEO-related settings.
 *
 * @component
 * @example
 * ```tsx
 * <SEOManager
 *   initialSettings={seoSettings}
 *   onSave={async (settings) => {
 *     await seoAPI.updateSettings(settings);
 *   }}
 * />
 * ```
 *
 * @features
 * - Basic SEO meta tags (title, description, keywords)
 * - Open Graph tags for social media
 * - Twitter Card tags
 * - Schema.org structured data
 * - Canonical URL management
 * - Robots meta tag configuration
 *
 * @see {@link https://github.com/your-repo/docs/components/seo-manager} Component Documentation
 */
'use client';

import { useState } from 'react';
import { Card, Input, Textarea, Button, Alert } from '@/components/ui';
import { Save } from 'lucide-react';

export interface SEOSettings {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonicalUrl?: string;
  robots?: string;
  schema?: string;
}

export interface SEOManagerProps {
  initialSettings?: SEOSettings;
  onSave?: (settings: SEOSettings) => Promise<void>;
  className?: string;
}

/**
 * SEO Manager Component
 *
 * Form for managing SEO meta tags and settings.
 */
export default function SEOManager({ initialSettings = {}, onSave, className }: SEOManagerProps) {
  const [settings, setSettings] = useState<SEOSettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);
    try {
      if (onSave) {
        await onSave(settings);
      }
      setSuccess(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save SEO settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={className}>
      <Card title="SEO Settings">
        {success && (
          <div className="mb-4">
            <Alert variant="success">SEO settings saved successfully!</Alert>
          </div>
        )}

        {error && (
          <div className="mb-4">
            <Alert variant="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </div>
        )}

        <div className="space-y-6">
          {/* Basic SEO */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Basic SEO</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Page Title *
                </label>
                <Input
                  value={settings.title || ''}
                  onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                  placeholder="Page Title"
                  maxLength={60}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {settings.title?.length || 0}/60 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Meta Description *
                </label>
                <Textarea
                  value={settings.description || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      description: e.target.value,
                    })
                  }
                  placeholder="Meta description"
                  rows={3}
                  maxLength={160}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {settings.description?.length || 0}/160 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Keywords</label>
                <Input
                  value={settings.keywords || ''}
                  onChange={(e) => setSettings({ ...settings, keywords: e.target.value })}
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Canonical URL
                </label>
                <Input
                  value={settings.canonicalUrl || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      canonicalUrl: e.target.value,
                    })
                  }
                  placeholder="https://example.com/page"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Robots</label>
                <Input
                  value={settings.robots || 'index, follow'}
                  onChange={(e) => setSettings({ ...settings, robots: e.target.value })}
                  placeholder="index, follow"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  e.g., "index, follow" or "noindex, nofollow"
                </p>
              </div>
            </div>
          </div>

          {/* Open Graph */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Open Graph (Facebook, LinkedIn)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">OG Title</label>
                <Input
                  value={settings.ogTitle || ''}
                  onChange={(e) => setSettings({ ...settings, ogTitle: e.target.value })}
                  placeholder="Open Graph title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  OG Description
                </label>
                <Textarea
                  value={settings.ogDescription || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      ogDescription: e.target.value,
                    })
                  }
                  placeholder="Open Graph description"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  OG Image URL
                </label>
                <Input
                  value={settings.ogImage || ''}
                  onChange={(e) => setSettings({ ...settings, ogImage: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">OG Type</label>
                <Input
                  value={settings.ogType || 'website'}
                  onChange={(e) => setSettings({ ...settings, ogType: e.target.value })}
                  placeholder="website"
                />
              </div>
            </div>
          </div>

          {/* Twitter Card */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Twitter Card</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Card Type</label>
                <Input
                  value={settings.twitterCard || 'summary_large_image'}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      twitterCard: e.target.value,
                    })
                  }
                  placeholder="summary_large_image"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Twitter Title
                </label>
                <Input
                  value={settings.twitterTitle || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      twitterTitle: e.target.value,
                    })
                  }
                  placeholder="Twitter title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Twitter Description
                </label>
                <Textarea
                  value={settings.twitterDescription || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      twitterDescription: e.target.value,
                    })
                  }
                  placeholder="Twitter description"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Twitter Image URL
                </label>
                <Input
                  value={settings.twitterImage || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      twitterImage: e.target.value,
                    })
                  }
                  placeholder="https://example.com/twitter-image.jpg"
                />
              </div>
            </div>
          </div>

          {/* Schema.org */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Schema.org JSON-LD</h3>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Schema Markup (JSON)
              </label>
              <Textarea
                value={settings.schema || ''}
                onChange={(e) => setSettings({ ...settings, schema: e.target.value })}
                placeholder='{"@context":"https://schema.org","@type":"WebPage", ...}'
                rows={8}
                className="font-mono text-sm"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end">
            <Button variant="primary" onClick={handleSave} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save SEO Settings'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
