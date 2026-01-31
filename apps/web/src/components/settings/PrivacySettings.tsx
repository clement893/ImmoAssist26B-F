/** * Privacy Settings Component * Privacy preferences and data control */ 'use client';
import { useState } from 'react';
import { clsx } from 'clsx';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Switch from '@/components/ui/Switch';
import { Save, Eye, Database, Trash2, Download, Shield } from 'lucide-react';
import Modal from '@/components/ui/Modal';
export interface PrivacySettingsProps {
  settings?: {
    profileVisibility: 'public' | 'private' | 'contacts';
    showEmail: boolean;
    showPhone: boolean;
    allowDataCollection: boolean;
    allowAnalytics: boolean;
    allowMarketing: boolean;
  };
  onSave?: (data: PrivacySettingsData) => void | Promise<void>;
  onExportData?: () => void | Promise<void>;
  onDeleteAccount?: () => void | Promise<void>;
  className?: string;
}
export interface PrivacySettingsData {
  profileVisibility: 'public' | 'private' | 'contacts';
  showEmail: boolean;
  showPhone: boolean;
  allowDataCollection: boolean;
  allowAnalytics: boolean;
  allowMarketing: boolean;
}
export default function PrivacySettings({
  settings,
  onSave,
  onExportData,
  onDeleteAccount,
  className,
}: PrivacySettingsProps) {
  const [formData, setFormData] = useState<PrivacySettingsData>({
    profileVisibility: settings?.profileVisibility || 'private',
    showEmail: settings?.showEmail ?? false,
    showPhone: settings?.showPhone ?? false,
    allowDataCollection: settings?.allowDataCollection ?? true,
    allowAnalytics: settings?.allowAnalytics ?? true,
    allowMarketing: settings?.allowMarketing ?? false,
  });
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const handleChange = (field: keyof PrivacySettingsData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
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
  const handleDeleteAccount = async () => {
    try {
      await onDeleteAccount?.();
      setShowDeleteModal(false);
    } catch (_error) {
      setErrors({ delete: 'Failed to delete account. Please try again.' });
    }
  };
  return (
    <div className={clsx('space-y-6', className)}>
      {' '}
      <form onSubmit={handleSubmit} className="space-y-6">
        {' '}
        {/* Profile Visibility */}{' '}
        <Card title="Profile Visibility" className="bg-background">
          {' '}
          <div className="space-y-4">
            {' '}
            <div>
              {' '}
              <label className="block text-sm font-medium text-foreground mb-2">
                {' '}
                Who can see your profile?{' '}
              </label>{' '}
              <select
                value={formData.profileVisibility}
                onChange={(e) =>
                  handleChange(
                    'profileVisibility',
                    e.target.value as 'public' | 'private' | 'contacts'
                  )
                }
                className={clsx(
                  'w-full px-4 py-2 border rounded-lg',
                  'bg-background',
                  'text-foreground',
                  'border-border',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400'
                )}
              >
                {' '}
                <option value="public">Public - Everyone</option>{' '}
                <option value="contacts">Contacts Only</option>{' '}
                <option value="private">Private - Only Me</option>{' '}
              </select>{' '}
            </div>{' '}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              {' '}
              <div>
                {' '}
                <div className="text-sm font-medium text-foreground flex items-center gap-2">
                  {' '}
                  <Eye className="w-4 h-4" /> Show Email{' '}
                </div>{' '}
                <div className="text-xs text-muted-foreground mt-1">
                  {' '}
                  Display your email address on your profile{' '}
                </div>{' '}
              </div>{' '}
              <Switch
                checked={formData.showEmail}
                onChange={(e) => handleChange('showEmail', e.target.checked)}
              />{' '}
            </div>{' '}
            <div className="flex items-center justify-between">
              {' '}
              <div>
                {' '}
                <div className="text-sm font-medium text-foreground flex items-center gap-2">
                  {' '}
                  <Eye className="w-4 h-4" /> Show Phone{' '}
                </div>{' '}
                <div className="text-xs text-muted-foreground mt-1">
                  {' '}
                  Display your phone number on your profile{' '}
                </div>{' '}
              </div>{' '}
              <Switch
                checked={formData.showPhone}
                onChange={(e) => handleChange('showPhone', e.target.checked)}
              />{' '}
            </div>{' '}
          </div>{' '}
        </Card>{' '}
        {/* Data & Analytics */}{' '}
        <Card title="Data & Analytics" className="bg-background">
          {' '}
          <div className="space-y-4">
            {' '}
            <div className="flex items-center justify-between">
              {' '}
              <div>
                {' '}
                <div className="text-sm font-medium text-foreground flex items-center gap-2">
                  {' '}
                  <Database className="w-4 h-4" /> Data Collection{' '}
                </div>{' '}
                <div className="text-xs text-muted-foreground mt-1">
                  {' '}
                  Allow us to collect usage data to improve our services{' '}
                </div>{' '}
              </div>{' '}
              <Switch
                checked={formData.allowDataCollection}
                onChange={(e) => handleChange('allowDataCollection', e.target.checked)}
              />{' '}
            </div>{' '}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              {' '}
              <div>
                {' '}
                <div className="text-sm font-medium text-foreground flex items-center gap-2">
                  {' '}
                  <Shield className="w-4 h-4" /> Analytics{' '}
                </div>{' '}
                <div className="text-xs text-muted-foreground mt-1">
                  {' '}
                  Help us understand how you use our platform{' '}
                </div>{' '}
              </div>{' '}
              <Switch
                checked={formData.allowAnalytics}
                onChange={(e) => handleChange('allowAnalytics', e.target.checked)}
                disabled={!formData.allowDataCollection}
              />{' '}
            </div>{' '}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              {' '}
              <div>
                {' '}
                <div className="text-sm font-medium text-foreground">
                  {' '}
                  Marketing Communications{' '}
                </div>{' '}
                <div className="text-xs text-muted-foreground mt-1">
                  {' '}
                  Receive marketing emails and promotional content{' '}
                </div>{' '}
              </div>{' '}
              <Switch
                checked={formData.allowMarketing}
                onChange={(e) => handleChange('allowMarketing', e.target.checked)}
              />{' '}
            </div>{' '}
          </div>{' '}
        </Card>{' '}
        {/* Data Management */}{' '}
        <Card title="Data Management" className="bg-background">
          {' '}
          <div className="space-y-4">
            {' '}
            <div className="flex items-center justify-between">
              {' '}
              <div>
                {' '}
                <div className="text-sm font-medium text-foreground flex items-center gap-2">
                  {' '}
                  <Download className="w-4 h-4" /> Export Your Data{' '}
                </div>{' '}
                <div className="text-xs text-muted-foreground mt-1">
                  {' '}
                  Download a copy of all your data{' '}
                </div>{' '}
              </div>{' '}
              <Button variant="outline" onClick={onExportData}>
                {' '}
                <Download className="w-4 h-4 mr-2" /> Export Data{' '}
              </Button>{' '}
            </div>{' '}
            <div className="pt-4 border-t border-border">
              {' '}
              <div className="flex items-center justify-between">
                {' '}
                <div>
                  {' '}
                  <div className="text-sm font-medium text-danger-600 dark:text-danger-400 flex items-center gap-2">
                    {' '}
                    <Trash2 className="w-4 h-4" /> Delete Account{' '}
                  </div>{' '}
                  <div className="text-xs text-muted-foreground mt-1">
                    {' '}
                    Permanently delete your account and all associated data{' '}
                  </div>{' '}
                </div>{' '}
                <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
                  {' '}
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Account{' '}
                </Button>{' '}
              </div>{' '}
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
            <Save className="w-4 h-4 mr-2" /> Save Privacy Settings{' '}
          </Button>{' '}
        </div>{' '}
      </form>{' '}
      {/* Delete Account Modal */}{' '}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Account"
        size="md"
      >
        {' '}
        <div className="space-y-4">
          {' '}
          <div className="p-4 bg-danger-50 dark:bg-danger-900/20 rounded-lg border border-danger-200 dark:border-danger-800">
            {' '}
            <div className="flex items-start gap-3">
              {' '}
              <Trash2 className="w-5 h-5 text-danger-600 dark:text-danger-400 flex-shrink-0 mt-0.5" />{' '}
              <div className="text-sm text-danger-800 dark:text-danger-200">
                {' '}
                <div className="font-medium mb-1">Warning: This action cannot be undone</div>{' '}
                <div>
                  {' '}
                  Deleting your account will permanently remove all your data, including:{' '}
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {' '}
                    <li>Your profile and account information</li>{' '}
                    <li>All your projects and data</li>{' '}
                    <li>Your subscription and billing history</li>{' '}
                    <li>All associated files and content</li>{' '}
                  </ul>{' '}
                </div>{' '}
              </div>{' '}
            </div>{' '}
          </div>{' '}
          <div className="flex items-center justify-end gap-3">
            {' '}
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
              {' '}
              Cancel{' '}
            </Button>{' '}
            <Button variant="danger" onClick={handleDeleteAccount}>
              {' '}
              Delete Account Permanently{' '}
            </Button>{' '}
          </div>{' '}
        </div>{' '}
      </Modal>{' '}
    </div>
  );
}
