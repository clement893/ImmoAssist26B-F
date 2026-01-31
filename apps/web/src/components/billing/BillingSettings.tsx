/** * Billing Settings Component * Configuration for billing preferences and settings */ 'use client';
import { useState } from 'react';
import { clsx } from 'clsx';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Switch from '@/components/ui/Switch';
import Select from '@/components/ui/Select';
import type { SelectOption } from '@/components/ui/Select';
import { Save, Bell, FileText } from 'lucide-react';
export interface BillingSettingsProps {
  settings?: {
    autoRenewal: boolean;
    emailNotifications: boolean;
    invoiceEmail: string;
    taxId?: string;
    billingAddress?: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    currency: string;
    language: string;
  };
  onSave?: (settings: BillingSettingsData) => void | Promise<void>;
  className?: string;
}
export interface BillingSettingsData {
  autoRenewal: boolean;
  emailNotifications: boolean;
  invoiceEmail: string;
  taxId?: string;
  billingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  currency: string;
  language: string;
}
const currencyOptions: SelectOption[] = [
  { label: 'USD ($)', value: 'USD' },
  { label: 'EUR (€)', value: 'EUR' },
  { label: 'GBP (£)', value: 'GBP' },
  { label: 'CAD ($)', value: 'CAD' },
];
const languageOptions: SelectOption[] = [
  { label: 'English', value: 'en' },
  { label: 'French', value: 'fr' },
  { label: 'Spanish', value: 'es' },
  { label: 'German', value: 'de' },
];
export default function BillingSettings({ settings, onSave, className }: BillingSettingsProps) {
  const [formData, setFormData] = useState<BillingSettingsData>({
    autoRenewal: settings?.autoRenewal ?? true,
    emailNotifications: settings?.emailNotifications ?? true,
    invoiceEmail: settings?.invoiceEmail || '',
    taxId: settings?.taxId || '',
    billingAddress: settings?.billingAddress || {
      line1: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    },
    currency: settings?.currency || 'USD',
    language: settings?.language || 'en',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const handleChange = (field: keyof BillingSettingsData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };
  const handleAddressChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      billingAddress: { ...prev.billingAddress!, [field]: value },
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
  return (
    <div className={clsx('space-y-6', className)}>
      {' '}
      <form onSubmit={handleSubmit} className="space-y-6">
        {' '}
        {/* Subscription Settings */}{' '}
        <Card title="Subscription Settings" className="bg-background">
          {' '}
          <div className="space-y-4">
            {' '}
            <div className="flex items-center justify-between">
              {' '}
              <div>
                {' '}
                <div className="text-sm font-medium text-foreground"> Auto-Renewal </div>{' '}
                <div className="text-xs text-muted-foreground mt-1">
                  {' '}
                  Automatically renew your subscription at the end of each billing period{' '}
                </div>{' '}
              </div>{' '}
              <Switch
                checked={formData.autoRenewal}
                onChange={(e) => handleChange('autoRenewal', e.target.checked)}
              />{' '}
            </div>{' '}
          </div>{' '}
        </Card>{' '}
        {/* Notification Settings */}{' '}
        <Card title="Notifications" className="bg-background">
          {' '}
          <div className="space-y-4">
            {' '}
            <div className="flex items-center justify-between">
              {' '}
              <div>
                {' '}
                <div className="text-sm font-medium text-foreground flex items-center gap-2">
                  {' '}
                  <Bell className="w-4 h-4" /> Email Notifications{' '}
                </div>{' '}
                <div className="text-xs text-muted-foreground mt-1">
                  {' '}
                  Receive email notifications about billing and invoices{' '}
                </div>{' '}
              </div>{' '}
              <Switch
                checked={formData.emailNotifications}
                onChange={(e) => handleChange('emailNotifications', e.target.checked)}
              />{' '}
            </div>{' '}
            <Input
              label="Invoice Email"
              type="email"
              value={formData.invoiceEmail}
              onChange={(e) => handleChange('invoiceEmail', e.target.value)}
              placeholder="billing@example.com"
              leftIcon={<FileText className="w-5 h-5" />}
              error={errors.invoiceEmail}
              required
            />{' '}
          </div>{' '}
        </Card>{' '}
        {/* Billing Address */}{' '}
        <Card title="Billing Address" className="bg-background">
          {' '}
          <div className="space-y-4">
            {' '}
            <Input
              label="Address Line 1"
              value={formData.billingAddress?.line1 || ''}
              onChange={(e) => handleAddressChange('line1', e.target.value)}
              placeholder="123 Main Street"
              required
            />{' '}
            <Input
              label="Address Line 2 (Optional)"
              value={formData.billingAddress?.line2 || ''}
              onChange={(e) => handleAddressChange('line2', e.target.value)}
              placeholder="Suite 100"
            />{' '}
            <div className="grid grid-cols-2 gap-4">
              {' '}
              <Input
                label="City"
                value={formData.billingAddress?.city || ''}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                placeholder="New York"
                required
              />{' '}
              <Input
                label="State/Province"
                value={formData.billingAddress?.state || ''}
                onChange={(e) => handleAddressChange('state', e.target.value)}
                placeholder="NY"
                required
              />{' '}
            </div>{' '}
            <div className="grid grid-cols-2 gap-4">
              {' '}
              <Input
                label="Postal Code"
                value={formData.billingAddress?.postalCode || ''}
                onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                placeholder="10001"
                required
              />{' '}
              <Input
                label="Country"
                value={formData.billingAddress?.country || ''}
                onChange={(e) => handleAddressChange('country', e.target.value)}
                placeholder="United States"
                required
              />{' '}
            </div>{' '}
          </div>{' '}
        </Card>{' '}
        {/* Tax Information */}{' '}
        <Card title="Tax Information" className="bg-background">
          {' '}
          <Input
            label="Tax ID / VAT Number (Optional)"
            value={formData.taxId || ''}
            onChange={(e) => handleChange('taxId', e.target.value)}
            placeholder="TAX123456789"
            helperText="Required for business accounts in some regions"
          />{' '}
        </Card>{' '}
        {/* Regional Settings */}{' '}
        <Card title="Regional Settings" className="bg-background">
          {' '}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {' '}
            <Select
              label="Currency"
              options={currencyOptions}
              value={formData.currency}
              onChange={(e) => handleChange('currency', e.target.value)}
            />{' '}
            <Select
              label="Language"
              options={languageOptions}
              value={formData.language}
              onChange={(e) => handleChange('language', e.target.value)}
            />{' '}
          </div>{' '}
        </Card>{' '}
        {/* Error Message */}{' '}
        {errors.submit && (
          <div className="p-3 bg-error-50 dark:bg-error-900/20 rounded-lg border border-error-200 dark:border-error-800 text-sm text-error-800 dark:text-error-200">
            {' '}
            {errors.submit}{' '}
          </div>
        )}{' '}
        {/* Save Button */}{' '}
        <div className="flex justify-end">
          {' '}
          <Button type="submit" variant="primary" loading={loading}>
            {' '}
            <span className="flex items-center gap-2">
              {' '}
              <Save className="w-4 h-4" /> Save Settings{' '}
            </span>{' '}
          </Button>{' '}
        </div>{' '}
      </form>{' '}
    </div>
  );
}
