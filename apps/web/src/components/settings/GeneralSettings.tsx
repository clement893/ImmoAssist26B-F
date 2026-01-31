/** * General Settings Component * * General application settings and preferences. * Includes basic settings like language, timezone, theme, etc. * * @component * @example * ```tsx * <GeneralSettings * settings={generalSettings} * onSave={(data) => handleSaveSettings(data)} * /> * ``` */ 'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { logger } from '@/lib/logger';
import { clsx } from 'clsx';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Switch from '@/components/ui/Switch';
import type { SelectOption } from '@/components/ui/Select';
import { Save } from 'lucide-react';
export interface GeneralSettingsProps {
  settings?: {
    language?: string;
    timezone?: string;
    theme?: 'light' | 'dark' | 'system';
    dateFormat?: string;
    timeFormat?: '12h' | '24h';
    weekStartsOn?: 'monday' | 'sunday';
    enableNotifications?: boolean;
    enableEmailNotifications?: boolean;
  };
  onSave?: (data: GeneralSettingsData) => void | Promise<void>;
  className?: string;
}
export interface GeneralSettingsData {
  language: string;
  timezone: string;
  theme: 'light' | 'dark' | 'system';
  dateFormat: string;
  timeFormat: '12h' | '24h';
  weekStartsOn: 'monday' | 'sunday';
  enableNotifications: boolean;
  enableEmailNotifications: boolean;
}
/** * General Settings Component * * Displays form for general application settings including language, timezone, theme, etc. */ export default function GeneralSettings({
  settings,
  onSave,
  className,
}: GeneralSettingsProps) {
  const [formData, setFormData] = useState<GeneralSettingsData>({
    language: settings?.language || 'en',
    timezone: settings?.timezone || 'UTC',
    theme: settings?.theme || 'system',
    dateFormat: settings?.dateFormat || 'YYYY-MM-DD',
    timeFormat: settings?.timeFormat || '24h',
    weekStartsOn: settings?.weekStartsOn || 'monday',
    enableNotifications: settings?.enableNotifications ?? true,
    enableEmailNotifications: settings?.enableEmailNotifications ?? true,
  });
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => {
    if (settings) {
      setFormData({
        language: settings.language || 'en',
        timezone: settings.timezone || 'UTC',
        theme: settings.theme || 'system',
        dateFormat: settings.dateFormat || 'YYYY-MM-DD',
        timeFormat: settings.timeFormat || '24h',
        weekStartsOn: settings.weekStartsOn || 'monday',
        enableNotifications: settings.enableNotifications ?? true,
        enableEmailNotifications: settings.enableEmailNotifications ?? true,
      });
    }
  }, [settings]);
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!onSave) return;
      try {
        setIsSaving(true);
        await onSave(formData);
      } catch (error) {
        logger.error('', 'Failed to save general settings:', error);
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [formData, onSave]
  );
  const languageOptions: SelectOption[] = useMemo(
    () => [
      { value: 'en', label: 'English' },
      { value: 'fr', label: 'Français' },
      { value: 'es', label: 'Español' },
      { value: 'de', label: 'Deutsch' },
      { value: 'it', label: 'Italiano' },
      { value: 'pt', label: 'Português' },
      { value: 'ja', label: '日本語' },
      { value: 'zh', label: '中文' },
    ],
    []
  );
  const timezoneOptions: SelectOption[] = useMemo(
    () => [
      { value: 'UTC', label: 'UTC' },
      { value: 'America/New_York', label: 'Eastern Time (ET)' },
      { value: 'America/Chicago', label: 'Central Time (CT)' },
      { value: 'America/Denver', label: 'Mountain Time (MT)' },
      { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
      { value: 'Europe/London', label: 'London (GMT)' },
      { value: 'Europe/Paris', label: 'Paris (CET)' },
      { value: 'Europe/Berlin', label: 'Berlin (CET)' },
      { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
      { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
      { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
    ],
    []
  );
  const themeOptions: SelectOption[] = useMemo(
    () => [
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' },
      { value: 'system', label: 'System' },
    ],
    []
  );
  const dateFormatOptions: SelectOption[] = useMemo(
    () => [
      { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-01-25)' },
      { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (01/25/2024)' },
      { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (25/01/2024)' },
      { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY (25.01.2024)' },
    ],
    []
  );
  const timeFormatOptions: SelectOption[] = useMemo(
    () => [
      { value: '12h', label: '12-hour (3:45 PM)' },
      { value: '24h', label: '24-hour (15:45)' },
    ],
    []
  );
  const weekStartsOnOptions: SelectOption[] = useMemo(
    () => [
      { value: 'monday', label: 'Monday' },
      { value: 'sunday', label: 'Sunday' },
    ],
    []
  );
  return (
    <form onSubmit={handleSubmit} className={clsx('space-y-6', className)}>
      {' '}
      {/* Language & Localization */}{' '}
      <Card title="Language & Localization">
        {' '}
        <div className="space-y-4">
          {' '}
          <div>
            {' '}
            <label className="block text-sm font-medium text-foreground mb-2">
              {' '}
              Language{' '}
            </label>{' '}
            <Select
              value={formData.language}
              onChange={(value) => setFormData({ ...formData, language: String(value) })}
              options={languageOptions}
              placeholder="Select language"
            />{' '}
          </div>{' '}
          <div>
            {' '}
            <label className="block text-sm font-medium text-foreground mb-2">
              {' '}
              Timezone{' '}
            </label>{' '}
            <Select
              value={formData.timezone}
              onChange={(value) => setFormData({ ...formData, timezone: String(value) })}
              options={timezoneOptions}
              placeholder="Select timezone"
            />{' '}
          </div>{' '}
          <div>
            {' '}
            <label className="block text-sm font-medium text-foreground mb-2">
              {' '}
              Date Format{' '}
            </label>{' '}
            <Select
              value={formData.dateFormat}
              onChange={(value) => setFormData({ ...formData, dateFormat: String(value) })}
              options={dateFormatOptions}
              placeholder="Select date format"
            />{' '}
          </div>{' '}
          <div>
            {' '}
            <label className="block text-sm font-medium text-foreground mb-2">
              {' '}
              Time Format{' '}
            </label>{' '}
            <Select
              value={formData.timeFormat}
              onChange={(value) =>
                setFormData({ ...formData, timeFormat: String(value) as '12h' | '24h' })
              }
              options={timeFormatOptions}
              placeholder="Select time format"
            />{' '}
          </div>{' '}
          <div>
            {' '}
            <label className="block text-sm font-medium text-foreground mb-2">
              {' '}
              Week Starts On{' '}
            </label>{' '}
            <Select
              value={formData.weekStartsOn}
              onChange={(value) =>
                setFormData({ ...formData, weekStartsOn: String(value) as 'monday' | 'sunday' })
              }
              options={weekStartsOnOptions}
              placeholder="Select day"
            />{' '}
          </div>{' '}
        </div>{' '}
      </Card>{' '}
      {/* Appearance */}{' '}
      <Card title="Appearance">
        {' '}
        <div className="space-y-4">
          {' '}
          <div>
            {' '}
            <label className="block text-sm font-medium text-foreground mb-2"> Theme </label>{' '}
            <Select
              value={formData.theme}
              onChange={(value) =>
                setFormData({ ...formData, theme: String(value) as 'light' | 'dark' | 'system' })
              }
              options={themeOptions}
              placeholder="Select theme"
            />{' '}
          </div>{' '}
        </div>{' '}
      </Card>{' '}
      {/* Notifications */}{' '}
      <Card title="Notifications">
        {' '}
        <div className="space-y-4">
          {' '}
          <div className="flex items-center justify-between">
            {' '}
            <div>
              {' '}
              <label className="block text-sm font-medium text-foreground">
                {' '}
                Enable Notifications{' '}
              </label>{' '}
              <p className="text-sm text-muted-foreground"> Receive in-app notifications </p>{' '}
            </div>{' '}
            <Switch
              checked={formData.enableNotifications}
              onChange={(checked) =>
                setFormData({ ...formData, enableNotifications: Boolean(checked) })
              }
            />{' '}
          </div>{' '}
          <div className="flex items-center justify-between">
            {' '}
            <div>
              {' '}
              <label className="block text-sm font-medium text-foreground">
                {' '}
                Email Notifications{' '}
              </label>{' '}
              <p className="text-sm text-muted-foreground">
                {' '}
                Receive notifications via email{' '}
              </p>{' '}
            </div>{' '}
            <Switch
              checked={formData.enableEmailNotifications}
              onChange={(checked) =>
                setFormData({ ...formData, enableEmailNotifications: Boolean(checked) })
              }
            />{' '}
          </div>{' '}
        </div>{' '}
      </Card>{' '}
      {/* Actions */}{' '}
      <div className="flex justify-end">
        {' '}
        <Button type="submit" variant="primary" loading={isSaving}>
          {' '}
          <Save className="w-4 h-4 mr-2 inline" /> Save Settings{' '}
        </Button>{' '}
      </div>{' '}
    </form>
  );
}
