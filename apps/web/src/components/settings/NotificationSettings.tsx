/** * Notification Settings Component * User notification preferences */ 'use client';
import { useState } from 'react';
import { clsx } from 'clsx';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Switch from '@/components/ui/Switch';
import Select from '@/components/ui/Select';
import type { SelectOption } from '@/components/ui/Select';
import { Save, Mail, Smartphone, Inbox } from 'lucide-react';
export interface NotificationSettingsProps {
  settings?: {
    email: {
      enabled: boolean;
      frequency: 'instant' | 'daily' | 'weekly';
      types: {
        marketing: boolean;
        product: boolean;
        security: boolean;
        billing: boolean;
        system: boolean;
      };
    };
    push: {
      enabled: boolean;
      types: {
        marketing: boolean;
        product: boolean;
        security: boolean;
        billing: boolean;
        system: boolean;
      };
    };
    inApp: {
      enabled: boolean;
      types: {
        marketing: boolean;
        product: boolean;
        security: boolean;
        billing: boolean;
        system: boolean;
      };
    };
  };
  onSave?: (data: NotificationSettingsData) => void | Promise<void>;
  className?: string;
}
export interface NotificationSettingsData {
  email: {
    enabled: boolean;
    frequency: 'instant' | 'daily' | 'weekly';
    types: {
      marketing: boolean;
      product: boolean;
      security: boolean;
      billing: boolean;
      system: boolean;
    };
  };
  push: {
    enabled: boolean;
    types: {
      marketing: boolean;
      product: boolean;
      security: boolean;
      billing: boolean;
      system: boolean;
    };
  };
  inApp: {
    enabled: boolean;
    types: {
      marketing: boolean;
      product: boolean;
      security: boolean;
      billing: boolean;
      system: boolean;
    };
  };
}
const frequencyOptions: SelectOption[] = [
  { label: 'Instant', value: 'instant' },
  { label: 'Daily Digest', value: 'daily' },
  { label: 'Weekly Digest', value: 'weekly' },
];
const notificationTypes = [
  { key: 'marketing', label: 'Marketing', description: 'Product updates and promotional content' },
  { key: 'product', label: 'Product', description: 'Feature announcements and tips' },
  { key: 'security', label: 'Security', description: 'Security alerts and account activity' },
  { key: 'billing', label: 'Billing', description: 'Invoices and payment reminders' },
  { key: 'system', label: 'System', description: 'System maintenance and updates' },
] as const;
export default function NotificationSettings({
  settings,
  onSave,
  className,
}: NotificationSettingsProps) {
  const [formData, setFormData] = useState<NotificationSettingsData>({
    email: {
      enabled: settings?.email?.enabled ?? true,
      frequency: settings?.email?.frequency || 'instant',
      types: {
        marketing: settings?.email?.types?.marketing ?? false,
        product: settings?.email?.types?.product ?? true,
        security: settings?.email?.types?.security ?? true,
        billing: settings?.email?.types?.billing ?? true,
        system: settings?.email?.types?.system ?? true,
      },
    },
    push: {
      enabled: settings?.push?.enabled ?? false,
      types: {
        marketing: settings?.push?.types?.marketing ?? false,
        product: settings?.push?.types?.product ?? true,
        security: settings?.push?.types?.security ?? true,
        billing: settings?.push?.types?.billing ?? false,
        system: settings?.push?.types?.system ?? false,
      },
    },
    inApp: {
      enabled: settings?.inApp?.enabled ?? true,
      types: {
        marketing: settings?.inApp?.types?.marketing ?? false,
        product: settings?.inApp?.types?.product ?? true,
        security: settings?.inApp?.types?.security ?? true,
        billing: settings?.inApp?.types?.billing ?? true,
        system: settings?.inApp?.types?.system ?? true,
      },
    },
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const handleChange = (
    channel: 'email' | 'push' | 'inApp',
    field: 'enabled' | 'frequency',
    value: unknown
  ) => {
    setFormData((prev) => ({ ...prev, [channel]: { ...prev[channel], [field]: value } }));
  };
  const handleTypeChange = (
    channel: 'email' | 'push' | 'inApp',
    type: keyof NotificationSettingsData['email']['types'],
    value: boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [channel]: { ...prev[channel], types: { ...prev[channel].types, [type]: value } },
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave?.(formData);
    } catch (_error) {
      setErrors({ submit: 'Failed to save settings. Please try again.' });
    } finally {
      setLoading(false);
    }
  };
  const renderChannelSettings = (
    channel: 'email' | 'push' | 'inApp',
    icon: React.ReactNode,
    title: string
  ) => {
    const channelData = formData[channel];
    const isEnabled = channelData.enabled;
    return (
      <Card title={title} className="bg-background">
        {' '}
        <div className="space-y-4">
          {' '}
          <div className="flex items-center justify-between">
            {' '}
            <div className="flex items-center gap-2">
              {' '}
              {icon}{' '}
              <span className="text-sm font-medium text-foreground"> Enable {title} </span>{' '}
            </div>{' '}
            <Switch
              checked={isEnabled}
              onChange={(e) => handleChange(channel, 'enabled', e.target.checked)}
            />{' '}
          </div>{' '}
          {isEnabled && (
            <>
              {' '}
              {channel === 'email' && (
                <Select
                  label="Email Frequency"
                  options={frequencyOptions}
                  value={(channelData as NotificationSettingsData['email']).frequency}
                  onChange={(e) => handleChange(channel, 'frequency', e.target.value)}
                />
              )}{' '}
              <div className="pt-4 border-t border-border">
                {' '}
                <div className="text-sm font-medium text-foreground mb-3">
                  {' '}
                  Notification Types{' '}
                </div>{' '}
                <div className="space-y-3">
                  {' '}
                  {notificationTypes.map((type) => (
                    <div key={type.key} className="flex items-center justify-between py-2">
                      {' '}
                      <div className="flex-1">
                        {' '}
                        <div className="text-sm font-medium text-foreground">
                          {' '}
                          {type.label}{' '}
                        </div>{' '}
                        <div className="text-xs text-muted-foreground">
                          {' '}
                          {type.description}{' '}
                        </div>{' '}
                      </div>{' '}
                      <Switch
                        checked={channelData.types[type.key]}
                        onChange={(e) => handleTypeChange(channel, type.key, e.target.checked)}
                        disabled={!isEnabled}
                      />{' '}
                    </div>
                  ))}{' '}
                </div>{' '}
              </div>{' '}
            </>
          )}{' '}
        </div>{' '}
      </Card>
    );
  };
  return (
    <div className={clsx('space-y-6', className)}>
      {' '}
      <form onSubmit={handleSubmit} className="space-y-6">
        {' '}
        {renderChannelSettings('email', <Mail className="w-5 h-5" />, 'Email Notifications')}{' '}
        {renderChannelSettings('push', <Smartphone className="w-5 h-5" />, 'Push Notifications')}{' '}
        {renderChannelSettings('inApp', <Inbox className="w-5 h-5" />, 'In-App Notifications')}{' '}
        {/* Error Message */}{' '}
        {errors.submit && (
          <div className="p-3 bg-danger-50 dark:bg-danger-900/20 rounded-lg border border-danger-200 dark:border-danger-800 text-sm text-danger-800 dark:text-danger-200">
            {' '}
            {errors.submit}{' '}
          </div>
        )}{' '}
        {/* Save Button */}{' '}
        <div className="flex justify-end">
          {' '}
          <Button type="submit" variant="primary" loading={loading}>
            {' '}
            <Save className="w-4 h-4 mr-2" /> Save Notification Settings{' '}
          </Button>{' '}
        </div>{' '}
      </form>{' '}
    </div>
  );
}
