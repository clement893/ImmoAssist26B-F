/**
 * User Settings Component
 * User profile and account settings
 */
'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';
import { Save, User, Mail, Phone, MapPin, Camera } from 'lucide-react';

export interface UserSettingsProps {
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    bio?: string;
    location?: string;
    website?: string;
  };
  onSave?: (data: UserSettingsData) => void | Promise<void>;
  onAvatarChange?: (file: File) => void | Promise<void>;
  className?: string;
}

export interface UserSettingsData {
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  location?: string;
  website?: string;
}

export default function UserSettings({
  user,
  onSave,
  onAvatarChange,
  className,
}: UserSettingsProps) {
  const [formData, setFormData] = useState<UserSettingsData>({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(
    user?.avatar
  );

  const handleChange = (field: keyof UserSettingsData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors({ avatar: 'Please select an image file' });
      return;
    }

    // No size limit for images (removed 5MB restriction)

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      await onAvatarChange?.(file);
    } catch (_error) {
      setErrors({ avatar: 'Failed to upload avatar' });
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
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Picture */}
        <Card title="Profile Picture" className="bg-background">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar src={avatarPreview} name={formData.name} size="xl" />
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 p-2 bg-primary-600 dark:bg-primary-500 rounded-full cursor-pointer hover:bg-primary-700 dark:hover:bg-primary-600 transition-modern" // UI Revamp - Transition moderne
              >
                <Camera className="w-4 h-4 text-background" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">
                Upload a new profile picture. JPG, PNG or GIF. No size limit.
              </p>
              {errors.avatar && (
                <p className="text-sm text-danger-600 dark:text-danger-400">
                  {errors.avatar}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Personal Information */}
        <Card title="Personal Information" className="bg-background">
          <div className="space-y-4">
            <Input
              label="Full Name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="John Doe"
              leftIcon={<User className="w-5 h-5" />}
              error={errors.name}
              required
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="john@example.com"
              leftIcon={<Mail className="w-5 h-5" />}
              error={errors.email}
              required
            />
            <Input
              label="Phone Number"
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
              leftIcon={<Phone className="w-5 h-5" />}
              error={errors.phone}
            />
            <Input
              label="Location"
              value={formData.location || ''}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="New York, NY"
              leftIcon={<MapPin className="w-5 h-5" />}
              error={errors.location}
            />
            <Input
              label="Website"
              type="url"
              value={formData.website || ''}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="https://example.com"
              error={errors.website}
            />
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Bio
              </label>
              <textarea
                value={formData.bio || ''}
                onChange={(e) => handleChange('bio', e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
                className={clsx(
                  'w-full px-4 py-2 border rounded-lg',
                  'bg-background',
                  'text-foreground',
                  'border-border',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400',
                  errors.bio && 'border-danger-500 dark:border-danger-400'
                )}
              />
            </div>
          </div>
        </Card>

        {/* Error Message */}
        {errors.submit && (
          <div className="p-3 bg-danger-50 dark:bg-danger-900/20 rounded-lg border border-danger-200 dark:border-danger-800 text-sm text-danger-800 dark:text-danger-200">
            {errors.submit}
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" variant="primary" loading={loading}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
