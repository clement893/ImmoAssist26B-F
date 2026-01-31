'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { logger } from '@/lib/logger';
import { Settings, Save, X, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select, { type SelectOption } from '@/components/ui/Select';
import Switch from '@/components/ui/Switch';
import { apiClient } from '@/lib/api/client';
import { extractApiData } from '@/lib/api/utils';
import { useToast } from '@/components/ui';
import { getErrorMessage } from '@/lib/errors';
import type { Locale } from '@/i18n/routing';
import { Alert } from '@/components/ui';

interface PreferencesManagerProps {
  className?: string;
}

// User preferences can have various value types (string, number, boolean, object, etc.)
export type UserPreferenceValue = string | number | boolean | object | null | undefined | unknown;

export type UserPreferences = Record<string, UserPreferenceValue>;

// Standard preference keys
const STANDARD_PREFERENCES = {
  theme: 'theme',
  language: 'language',
  email_notifications: 'email_notifications',
  timezone: 'timezone',
  date_format: 'date_format',
  time_format: 'time_format',
} as const;

// Theme options
const THEME_OPTIONS: SelectOption[] = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'System', value: 'system' },
];

// Language options
const LANGUAGE_OPTIONS: SelectOption[] = [
  { label: 'English', value: 'en' },
  { label: 'Français', value: 'fr' },
  { label: 'العربية', value: 'ar' },
  { label: 'עברית', value: 'he' },
];

// Timezone options (common ones)
const TIMEZONE_OPTIONS: SelectOption[] = [
  { label: 'UTC', value: 'UTC' },
  { label: 'Europe/Paris', value: 'Europe/Paris' },
  { label: 'America/New_York', value: 'America/New_York' },
  { label: 'America/Los_Angeles', value: 'America/Los_Angeles' },
  { label: 'Asia/Tokyo', value: 'Asia/Tokyo' },
  { label: 'Asia/Dubai', value: 'Asia/Dubai' },
];

// Date format options
const DATE_FORMAT_OPTIONS: SelectOption[] = [
  { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
  { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
  { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
];

// Time format options
const TIME_FORMAT_OPTIONS: SelectOption[] = [
  { label: '24 hours', value: '24h' },
  { label: '12 hours', value: '12h' },
];

export function PreferencesManager({ className = '' }: PreferencesManagerProps) {
  const pathname = usePathname();
  const currentLocale = useLocale() as Locale;
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [editedPreferences, setEditedPreferences] = useState<UserPreferences>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<UserPreferences>('/v1/users/preferences');
      const data = extractApiData<UserPreferences>(
        response as unknown as UserPreferences | import('@modele/types').ApiResponse<UserPreferences>
      );

      if (data && typeof data === 'object') {
        // Normalize language preference key (could be 'language' or 'locale')
        const normalizedData = { ...data };
        if (data.locale && !data.language) {
          normalizedData.language = data.locale;
        }

        // Set defaults for missing standard preferences
        const defaults: UserPreferences = {
          theme: 'system',
          language: currentLocale || 'en',
          email_notifications: true,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          date_format: 'DD/MM/YYYY',
          time_format: '24h',
        };

        const mergedData = { ...defaults, ...normalizedData };
        setPreferences(mergedData);
        setEditedPreferences(mergedData);
      } else {
        // No preferences found, use defaults
        const defaults: UserPreferences = {
          theme: 'system',
          language: currentLocale || 'en',
          email_notifications: true,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          date_format: 'DD/MM/YYYY',
          time_format: '24h',
        };
        setPreferences(defaults);
        setEditedPreferences(defaults);
      }
    } catch (error) {
      logger.error('', 'Failed to fetch preferences:', error);
      setError(getErrorMessage(error) || 'Failed to load preferences');

      // Set defaults on error
      const defaults: UserPreferences = {
        theme: 'system',
        language: currentLocale || 'en',
        email_notifications: true,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        date_format: 'DD/MM/YYYY',
        time_format: '24h',
      };
      setPreferences(defaults);
      setEditedPreferences(defaults);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (key: string, value: unknown) => {
    setEditedPreferences({
      ...editedPreferences,
      [key]: value,
    });
    setError(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Save preferences using PUT /v1/users/preferences
      await apiClient.put('/v1/users/preferences', editedPreferences);
      setPreferences(editedPreferences);

      // Check if language changed and redirect to new locale
      const newLanguage = editedPreferences.language as string;
      const oldLanguage = preferences.language as string;

      if (newLanguage && newLanguage !== oldLanguage && newLanguage !== currentLocale) {
        // Get the actual URL pathname (includes locale prefix if present)
        const actualPathname = typeof window !== 'undefined' ? window.location.pathname : pathname;

        // Get path without locale prefix from actual URL
        // Remove any locale prefix (en, fr, ar, he) from the beginning
        const pathWithoutLocale = actualPathname.replace(/^\/(en|fr|ar|he)(\/|$)/, '/') || '/';

        // Ensure it starts with / and doesn't end with / unless it's root
        const cleanPath = pathWithoutLocale === '/' ? '/' : pathWithoutLocale.replace(/\/$/, '') || '/';

        // Build new path with new locale
        // English has no prefix, other locales have /{locale} prefix
        const newPath = newLanguage === 'en' ? cleanPath : `/${newLanguage}${cleanPath === '/' ? '' : cleanPath}`;

        // Show success message and redirect
        showToast({
          message: 'Preferences saved successfully. Redirecting...',
          type: 'success',
        });

        // Small delay to show toast, then redirect
        setTimeout(() => {
          window.location.href = newPath;
        }, 500);
      } else {
        showToast({
          message: 'Preferences saved successfully',
          type: 'success',
        });
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error) || 'Failed to save preferences';
      setError(errorMessage);
      showToast({
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setEditedPreferences(preferences);
    setError(null);
  };

  const hasChanges = JSON.stringify(preferences) !== JSON.stringify(editedPreferences);

  if (isLoading) {
    return (
      <Card className={className}>
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-primary-500" />
            <p className="text-sm text-muted-foreground">Loading preferences...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Settings className="h-5 w-5" /> Preferences
        </h3>
        {hasChanges && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset} disabled={isSaving}>
              <X className="h-4 w-4 mr-2" /> Reset
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" /> {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      <div className="space-y-6">
        {/* Appearance Section */}
        <div>
          <h4 className="text-sm font-semibold mb-4 text-foreground">Appearance</h4>
          <div className="space-y-4">
            {/* Theme Preference */}
            <div>
              <Select
                label="Theme"
                options={THEME_OPTIONS}
                value={(editedPreferences.theme as string) || 'system'}
                onChange={(e) => handleChange('theme', e.target.value)}
                helperText="Choose your preferred color theme"
                fullWidth
              />
            </div>
            {/* Language Preference */}
            <div>
              <Select
                label="Language"
                options={LANGUAGE_OPTIONS}
                value={(editedPreferences.language as string) || currentLocale || 'en'}
                onChange={(e) => handleChange('language', e.target.value)}
                helperText="Select your preferred language"
                fullWidth
              />
            </div>
          </div>
        </div>

        {/* Date & Time Section */}
        <div>
          <h4 className="text-sm font-semibold mb-4 text-foreground">Date & Time</h4>
          <div className="space-y-4">
            {/* Timezone */}
            <div>
              <Select
                label="Timezone"
                options={TIMEZONE_OPTIONS}
                value={(editedPreferences.timezone as string) || 'UTC'}
                onChange={(e) => handleChange('timezone', e.target.value)}
                helperText="Select your timezone"
                fullWidth
              />
            </div>
            {/* Date Format */}
            <div>
              <Select
                label="Date Format"
                options={DATE_FORMAT_OPTIONS}
                value={(editedPreferences.date_format as string) || 'DD/MM/YYYY'}
                onChange={(e) => handleChange('date_format', e.target.value)}
                helperText="Choose your preferred date format"
                fullWidth
              />
            </div>
            {/* Time Format */}
            <div>
              <Select
                label="Time Format"
                options={TIME_FORMAT_OPTIONS}
                value={(editedPreferences.time_format as string) || '24h'}
                onChange={(e) => handleChange('time_format', e.target.value)}
                helperText="Choose 12-hour or 24-hour time format"
                fullWidth
              />
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div>
          <h4 className="text-sm font-semibold mb-4 text-foreground">Notifications</h4>
          <div className="space-y-4">
            <Switch
              label="Email Notifications"
              checked={editedPreferences.email_notifications !== false}
              onChange={(e) => handleChange('email_notifications', e.target.checked)}
            />
            <p className="text-sm text-muted-foreground ml-0">
              Receive email notifications about important updates and activities
            </p>
          </div>
        </div>

        {/* Custom Preferences */}
        {Object.entries(editedPreferences).map(([key, value]) => {
          // Skip standard preferences that are already displayed
          if (Object.values(STANDARD_PREFERENCES).includes(key as any)) {
            return null;
          }

          return (
            <div key={key}>
              <h4 className="text-sm font-semibold mb-4 text-foreground capitalize">
                {key.replace(/_/g, '')}
              </h4>
              <div className="space-y-4">
                {typeof value === 'boolean' ? (
                  <Switch
                    label={`Enable ${key.replace(/_/g, '')}`}
                    checked={value}
                    onChange={(e) => handleChange(key, e.target.checked)}
                  />
                ) : typeof value === 'number' ? (
                  <Input
                    type="number"
                    label={key.replace(/_/g, '')}
                    value={value}
                    onChange={(e) => handleChange(key, Number(e.target.value))}
                    fullWidth
                  />
                ) : typeof value === 'object' && value !== null ? (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">{key.replace(/_/g, '')} (JSON object)</p>
                    <pre className="text-xs overflow-auto">{JSON.stringify(value, null, 2)}</pre>
                  </div>
                ) : (
                  <Input
                    label={key.replace(/_/g, '')}
                    value={String(value || '')}
                    onChange={(e) => handleChange(key, e.target.value)}
                    fullWidth
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
