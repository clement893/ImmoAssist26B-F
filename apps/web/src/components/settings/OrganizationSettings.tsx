/** * Organization Settings Component * Organization-level settings and configuration * Updated: Fixed unused imports */ 'use client';
import { useState, useCallback } from 'react';
import { clsx } from 'clsx';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import type { SelectOption } from '@/components/ui/Select';
import { Save, Building2, Globe, MapPin, Mail } from 'lucide-react';
export interface OrganizationSettingsProps {
  organization?: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    timezone?: string;
    locale?: string;
  };
  onSave?: (data: OrganizationSettingsData) => void | Promise<void>;
  onChange?: (data: OrganizationSettingsData) => void;
  className?: string;
}
export interface OrganizationSettingsData {
  name: string;
  slug: string;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  timezone?: string;
  locale?: string;
}
const timezoneOptions: SelectOption[] = [
  { label: 'UTC', value: 'UTC' },
  { label: 'America/New_York (EST)', value: 'America/New_York' },
  { label: 'America/Chicago (CST)', value: 'America/Chicago' },
  { label: 'America/Denver (MST)', value: 'America/Denver' },
  { label: 'America/Los_Angeles (PST)', value: 'America/Los_Angeles' },
  { label: 'Europe/London (GMT)', value: 'Europe/London' },
  { label: 'Europe/Paris (CET)', value: 'Europe/Paris' },
  { label: 'Asia/Tokyo (JST)', value: 'Asia/Tokyo' },
];
const localeOptions: SelectOption[] = [
  { label: 'English (US)', value: 'en-US' },
  { label: 'English (UK)', value: 'en-GB' },
  { label: 'French (FR)', value: 'fr-FR' },
  { label: 'Spanish (ES)', value: 'es-ES' },
  { label: 'German (DE)', value: 'de-DE' },
];
export default function OrganizationSettings({
  organization,
  onSave,
  onChange,
  className,
}: OrganizationSettingsProps) {
  const [formData, setFormData] = useState<OrganizationSettingsData>({
    name: organization?.name || '',
    slug: organization?.slug || '',
    description: organization?.description || '',
    email: organization?.email || '',
    phone: organization?.phone || '',
    website: organization?.website || '',
    address: organization?.address || {
      line1: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    },
    timezone: organization?.timezone || 'UTC',
    locale: organization?.locale || 'en-US',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const handleChange = useCallback(
    (field: keyof OrganizationSettingsData, value: unknown) => {
      setFormData((prev) => {
        const updated = { ...prev, [field]: value };
        onChange?.(updated);
        return updated;
      });
      setErrors((prev) => {
        if (prev[field]) {
          return { ...prev, [field]: '' };
        }
        return prev;
      });
    },
    [onChange]
  );
  const handleAddressChange = useCallback(
    (field: string, value: string) => {
      setFormData((prev) => {
        const updated = { ...prev, address: { ...prev.address!, [field]: value } };
        onChange?.(updated);
        return updated;
      });
    },
    [onChange]
  );
  const handleSlugChange = useCallback(
    (value: string) => {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      handleChange('slug', slug);
    },
    [handleChange]
  );
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
        await onSave?.(formData);
      } catch (_error) {
        setErrors({ submit: 'Failed to save settings. Please try again.' });
      } finally {
        setLoading(false);
      }
    },
    [formData, onSave]
  );
  return (
    <div className={clsx('space-y-6', className)}>
      {' '}
      <form onSubmit={handleSubmit} className="space-y-6">
        {' '}
        {/* Organization Information */}{' '}
        <Card title="Organization Information" className="bg-background">
          {' '}
          <div className="space-y-4">
            {' '}
            <Input
              label="Organization Name"
              value={formData.name}
              onChange={(e) => {
                handleChange('name', e.target.value);
                if (!formData.slug) {
                  handleSlugChange(e.target.value);
                }
              }}
              placeholder="Acme Inc."
              leftIcon={<Building2 className="w-5 h-5" />}
              error={errors.name}
              required
            />{' '}
            <Input
              label="Organization Slug"
              value={formData.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="acme-inc"
              helperText="Used in URLs. Only lowercase letters, numbers, and hyphens."
              error={errors.slug}
              required
            />{' '}
            <Input
              label="Email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="contact@example.com"
              leftIcon={<Mail className="w-5 h-5" />}
              error={errors.email}
            />{' '}
            <Input
              label="Phone"
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
              error={errors.phone}
            />{' '}
            <Input
              label="Website"
              type="url"
              value={formData.website || ''}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="https://example.com"
              leftIcon={<Globe className="w-5 h-5" />}
              error={errors.website}
            />{' '}
          </div>{' '}
        </Card>{' '}
        {/* Address */}{' '}
        <Card title="Address" className="bg-background">
          {' '}
          <div className="space-y-4">
            {' '}
            <Input
              label="Address Line 1"
              value={formData.address?.line1 || ''}
              onChange={(e) => handleAddressChange('line1', e.target.value)}
              placeholder="123 Main Street"
              leftIcon={<MapPin className="w-5 h-5" />}
              required
            />{' '}
            <Input
              label="Address Line 2 (Optional)"
              value={formData.address?.line2 || ''}
              onChange={(e) => handleAddressChange('line2', e.target.value)}
              placeholder="Suite 100"
            />{' '}
            <div className="grid grid-cols-2 gap-4">
              {' '}
              <Input
                label="City"
                value={formData.address?.city || ''}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                placeholder="New York"
                required
              />{' '}
              <Input
                label="State/Province"
                value={formData.address?.state || ''}
                onChange={(e) => handleAddressChange('state', e.target.value)}
                placeholder="NY"
                required
              />{' '}
            </div>{' '}
            <div className="grid grid-cols-2 gap-4">
              {' '}
              <Input
                label="Postal Code"
                value={formData.address?.postalCode || ''}
                onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                placeholder="10001"
                required
              />{' '}
              <Input
                label="Country"
                value={formData.address?.country || ''}
                onChange={(e) => handleAddressChange('country', e.target.value)}
                placeholder="United States"
                required
              />{' '}
            </div>{' '}
          </div>{' '}
        </Card>{' '}
        {/* Regional Settings */}{' '}
        <Card title="Regional Settings" className="bg-background">
          {' '}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {' '}
            <Select
              label="Timezone"
              options={timezoneOptions}
              value={formData.timezone || 'UTC'}
              onChange={(e) => handleChange('timezone', e.target.value)}
            />{' '}
            <Select
              label="Locale"
              options={localeOptions}
              value={formData.locale || 'en-US'}
              onChange={(e) => handleChange('locale', e.target.value)}
            />{' '}
          </div>{' '}
        </Card>{' '}
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
            <Save className="w-4 h-4 mr-2" /> Save Settings{' '}
          </Button>{' '}
        </div>{' '}
      </form>{' '}
    </div>
  );
}
