/** * Security Settings Component * Security preferences and authentication settings */ 'use client';
import { useState } from 'react';
import { clsx } from 'clsx';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Switch from '@/components/ui/Switch';
import Badge from '@/components/ui/Badge';
import { Save, Lock, Shield, Key, Smartphone, AlertTriangle } from 'lucide-react';
export interface SecuritySettingsProps {
  settings?: {
    twoFactorEnabled: boolean;
    sessionTimeout?: number;
    passwordExpiry?: number;
    requireStrongPassword: boolean;
    loginNotifications: boolean;
    suspiciousActivityAlerts: boolean;
  };
  onSave?: (data: SecuritySettingsData) => void | Promise<void>;
  onEnable2FA?: () => void | Promise<void>;
  onDisable2FA?: () => void | Promise<void>;
  onChangePassword?: () => void;
  className?: string;
}
export interface SecuritySettingsData {
  twoFactorEnabled: boolean;
  sessionTimeout?: number;
  passwordExpiry?: number;
  requireStrongPassword: boolean;
  loginNotifications: boolean;
  suspiciousActivityAlerts: boolean;
}
export default function SecuritySettings({
  settings,
  onSave,
  onEnable2FA,
  onDisable2FA,
  onChangePassword,
  className,
}: SecuritySettingsProps) {
  const [formData, setFormData] = useState<SecuritySettingsData>({
    twoFactorEnabled: settings?.twoFactorEnabled ?? false,
    sessionTimeout: settings?.sessionTimeout ?? 30,
    passwordExpiry: settings?.passwordExpiry ?? 90,
    requireStrongPassword: settings?.requireStrongPassword ?? true,
    loginNotifications: settings?.loginNotifications ?? true,
    suspiciousActivityAlerts: settings?.suspiciousActivityAlerts ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const handleChange = (field: keyof SecuritySettingsData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };
  const handleToggle2FA = async () => {
    if (formData.twoFactorEnabled) {
      await onDisable2FA?.();
      handleChange('twoFactorEnabled', false);
    } else {
      await onEnable2FA?.();
      handleChange('twoFactorEnabled', true);
    }
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
        {/* Password */}{' '}
        <Card title="Password" className="bg-background">
          {' '}
          <div className="space-y-4">
            {' '}
            <div className="flex items-center justify-between">
              {' '}
              <div>
                {' '}
                <div className="text-sm font-medium text-foreground flex items-center gap-2">
                  {' '}
                  <Key className="w-4 h-4" /> Password{' '}
                </div>{' '}
                <div className="text-xs text-muted-foreground mt-1">
                  {' '}
                  Last changed 30 days ago{' '}
                </div>{' '}
              </div>{' '}
              {onChangePassword && (
                <Button variant="outline" onClick={onChangePassword}>
                  {' '}
                  Change Password{' '}
                </Button>
              )}{' '}
            </div>{' '}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              {' '}
              <div>
                {' '}
                <div className="text-sm font-medium text-foreground">
                  {' '}
                  Require Strong Password{' '}
                </div>{' '}
                <div className="text-xs text-muted-foreground mt-1">
                  {' '}
                  Enforce password complexity requirements{' '}
                </div>{' '}
              </div>{' '}
              <Switch
                checked={formData.requireStrongPassword}
                onChange={(e) => handleChange('requireStrongPassword', e.target.checked)}
              />{' '}
            </div>{' '}
          </div>{' '}
        </Card>{' '}
        {/* Two-Factor Authentication */}{' '}
        <Card title="Two-Factor Authentication" className="bg-background">
          {' '}
          <div className="space-y-4">
            {' '}
            <div className="flex items-center justify-between">
              {' '}
              <div className="flex-1">
                {' '}
                <div className="flex items-center gap-2 mb-1">
                  {' '}
                  <Shield className="w-5 h-5 text-primary-600 dark:text-primary-400" />{' '}
                  <span className="text-sm font-medium text-foreground">
                    {' '}
                    Two-Factor Authentication{' '}
                  </span>{' '}
                  {formData.twoFactorEnabled && <Badge variant="success">Enabled</Badge>}{' '}
                </div>{' '}
                <div className="text-xs text-muted-foreground">
                  {' '}
                  Add an extra layer of security to your account{' '}
                </div>{' '}
              </div>{' '}
              <Button
                variant={formData.twoFactorEnabled ? 'danger' : 'primary'}
                onClick={handleToggle2FA}
              >
                {' '}
                <Smartphone className="w-4 h-4 mr-2" />{' '}
                {formData.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}{' '}
              </Button>{' '}
            </div>{' '}
            {!formData.twoFactorEnabled && (
              <div className="flex items-start gap-2 p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning-200 dark:border-warning-800">
                {' '}
                <AlertTriangle className="w-5 h-5 text-warning-600 dark:text-warning-400 flex-shrink-0 mt-0.5" />{' '}
                <div className="text-sm text-warning-800 dark:text-warning-200">
                  {' '}
                  <div className="font-medium mb-1">Security Recommendation</div>{' '}
                  <div>
                    Enable two-factor authentication to protect your account from unauthorized
                    access.
                  </div>{' '}
                </div>{' '}
              </div>
            )}{' '}
          </div>{' '}
        </Card>{' '}
        {/* Session Management */}{' '}
        <Card title="Session Management" className="bg-background">
          {' '}
          <div className="space-y-4">
            {' '}
            <div>
              {' '}
              <label className="block text-sm font-medium text-foreground mb-2">
                {' '}
                Session Timeout (minutes){' '}
              </label>{' '}
              <Input
                type="number"
                value={formData.sessionTimeout || 30}
                onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value) || 30)}
                min={5}
                max={1440}
                helperText="Automatically log out after inactivity"
                leftIcon={<Lock className="w-5 h-5" />}
              />{' '}
            </div>{' '}
            <div>
              {' '}
              <label className="block text-sm font-medium text-foreground mb-2">
                {' '}
                Password Expiry (days){' '}
              </label>{' '}
              <Input
                type="number"
                value={formData.passwordExpiry || 90}
                onChange={(e) => handleChange('passwordExpiry', parseInt(e.target.value) || 90)}
                min={30}
                max={365}
                helperText="Require password change after this many days"
                leftIcon={<Key className="w-5 h-5" />}
              />{' '}
            </div>{' '}
          </div>{' '}
        </Card>{' '}
        {/* Security Notifications */}{' '}
        <Card title="Security Notifications" className="bg-background">
          {' '}
          <div className="space-y-4">
            {' '}
            <div className="flex items-center justify-between">
              {' '}
              <div>
                {' '}
                <div className="text-sm font-medium text-foreground">
                  {' '}
                  Login Notifications{' '}
                </div>{' '}
                <div className="text-xs text-muted-foreground mt-1">
                  {' '}
                  Get notified when someone logs into your account{' '}
                </div>{' '}
              </div>{' '}
              <Switch
                checked={formData.loginNotifications}
                onChange={(e) => handleChange('loginNotifications', e.target.checked)}
              />{' '}
            </div>{' '}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              {' '}
              <div>
                {' '}
                <div className="text-sm font-medium text-foreground">
                  {' '}
                  Suspicious Activity Alerts{' '}
                </div>{' '}
                <div className="text-xs text-muted-foreground mt-1">
                  {' '}
                  Receive alerts for unusual account activity{' '}
                </div>{' '}
              </div>{' '}
              <Switch
                checked={formData.suspiciousActivityAlerts}
                onChange={(e) => handleChange('suspiciousActivityAlerts', e.target.checked)}
              />{' '}
            </div>{' '}
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
            <Save className="w-4 h-4 mr-2" /> Save Security Settings{' '}
          </Button>{' '}
        </div>{' '}
      </form>{' '}
    </div>
  );
}
