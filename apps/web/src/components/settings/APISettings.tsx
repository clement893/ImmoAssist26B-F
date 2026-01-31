/** * API Settings Component * * API configuration and settings management. * * @component */ 'use client';
import { useState } from 'react';
import Link from 'next/link';
import { logger } from '@/lib/logger';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Switch from '@/components/ui/Switch';
import { Save, Copy, Eye, EyeOff, ExternalLink } from 'lucide-react';
export interface APISettingsData {
  apiKey?: string;
  apiSecret?: string;
  baseUrl: string;
  rateLimit: number;
  enableWebhooks: boolean;
  webhookUrl?: string;
  enableLogging: boolean;
}
export interface APISettingsProps {
  settings?: APISettingsData;
  onSave?: (data: APISettingsData) => void | Promise<void>;
  className?: string;
}
/** * API Settings Component * * Displays form for API configuration and settings. */ export default function APISettings({
  settings,
  onSave,
  className,
}: APISettingsProps) {
  const [formData, setFormData] = useState<APISettingsData>({
    baseUrl: settings?.baseUrl || '',
    rateLimit: settings?.rateLimit || 1000,
    enableWebhooks: settings?.enableWebhooks ?? false,
    webhookUrl: settings?.webhookUrl || '',
    enableLogging: settings?.enableLogging ?? true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSave) return;
    try {
      setIsSaving(true);
      await onSave(formData);
    } catch (error) {
      logger.error('', 'Failed to save API settings:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };
  return (
    <form onSubmit={handleSubmit} className={className}>
      {' '}
      <div className="space-y-6">
        {' '}
        {/* API Credentials */}{' '}
        <Card title="API Credentials">
          {' '}
          <div className="space-y-4">
            {' '}
            <div>
              {' '}
              <label className="block text-sm font-medium text-foreground mb-2">
                {' '}
                API Key{' '}
              </label>{' '}
              <div className="flex gap-2">
                {' '}
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  value={settings?.apiKey || '••••••••••••••••'}
                  readOnly
                  className="flex-1"
                />{' '}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {' '}
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}{' '}
                </Button>{' '}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => settings?.apiKey && handleCopy(settings.apiKey)}
                >
                  {' '}
                  <Copy className="w-4 h-4" />{' '}
                </Button>{' '}
              </div>{' '}
              <p className="mt-1 text-sm text-muted-foreground">
                {' '}
                Your API key for authenticating requests{' '}
              </p>{' '}
            </div>{' '}
            <div>
              {' '}
              <label className="block text-sm font-medium text-foreground mb-2">
                {' '}
                API Secret{' '}
              </label>{' '}
              <div className="flex gap-2">
                {' '}
                <Input
                  type={showApiSecret ? 'text' : 'password'}
                  value={settings?.apiSecret || '••••••••••••••••'}
                  readOnly
                  className="flex-1"
                />{' '}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowApiSecret(!showApiSecret)}
                >
                  {' '}
                  {showApiSecret ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}{' '}
                </Button>{' '}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => settings?.apiSecret && handleCopy(settings.apiSecret)}
                >
                  {' '}
                  <Copy className="w-4 h-4" />{' '}
                </Button>{' '}
              </div>{' '}
              <p className="mt-1 text-sm text-muted-foreground">
                {' '}
                Keep your API secret secure and never share it publicly{' '}
              </p>{' '}
            </div>{' '}
          </div>{' '}
        </Card>{' '}
        {/* API Configuration */}{' '}
        <Card title="API Configuration">
          {' '}
          <div className="space-y-4">
            {' '}
            <div>
              {' '}
              <label className="block text-sm font-medium text-foreground mb-2">
                {' '}
                Base URL{' '}
              </label>{' '}
              <Input
                value={formData.baseUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, baseUrl: e.target.value })
                }
                placeholder="https://api.example.com"
              />{' '}
            </div>{' '}
            <div>
              {' '}
              <label className="block text-sm font-medium text-foreground mb-2">
                {' '}
                Rate Limit (requests per minute){' '}
              </label>{' '}
              <Input
                type="number"
                value={formData.rateLimit}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, rateLimit: parseInt(e.target.value) || 1000 })
                }
                min={1}
                max={10000}
              />{' '}
            </div>{' '}
            <div className="flex items-center justify-between">
              {' '}
              <div>
                {' '}
                <label className="block text-sm font-medium text-foreground">
                  {' '}
                  Enable Webhooks{' '}
                </label>{' '}
                <p className="text-sm text-muted-foreground">
                  {' '}
                  Receive webhook notifications for events{' '}
                </p>{' '}
              </div>{' '}
              <Switch
                checked={formData.enableWebhooks}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, enableWebhooks: e.target.checked })
                }
              />{' '}
            </div>{' '}
            {formData.enableWebhooks && (
              <div>
                {' '}
                <label className="block text-sm font-medium text-foreground mb-2">
                  {' '}
                  Webhook URL{' '}
                </label>{' '}
                <Input
                  value={formData.webhookUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, webhookUrl: e.target.value })
                  }
                  placeholder="https://your-app.com/webhooks"
                />{' '}
              </div>
            )}{' '}
            <div className="flex items-center justify-between">
              {' '}
              <div>
                {' '}
                <label className="block text-sm font-medium text-foreground">
                  {' '}
                  Enable API Logging{' '}
                </label>{' '}
                <p className="text-sm text-muted-foreground">
                  {' '}
                  Log all API requests for debugging{' '}
                </p>{' '}
              </div>{' '}
              <Switch
                checked={formData.enableLogging}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, enableLogging: e.target.checked })
                }
              />{' '}
            </div>{' '}
          </div>{' '}
        </Card>{' '}
        {/* Actions */}{' '}
        <div className="flex justify-between items-center">
          {' '}
          <Link href="/api-connections/testing">
            {' '}
            <Button type="button" variant="outline">
              {' '}
              <ExternalLink className="w-4 h-4 mr-2 inline" /> Test API Connections{' '}
            </Button>{' '}
          </Link>{' '}
          <Button type="submit" variant="primary" loading={isSaving}>
            {' '}
            <Save className="w-4 h-4 mr-2 inline" /> Save API Settings{' '}
          </Button>{' '}
        </div>{' '}
      </div>{' '}
    </form>
  );
}
