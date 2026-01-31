/**
 * ProfileForm Component
 *
 * Form for editing user profile information (name, email, avatar).
 * Fully theme-aware and accessible with validation.
 *
 * @example
 * ```tsx
 * <ProfileForm
 *   user={user}
 *   onSubmit={handleSubmit}
 *   isLoading={isLoading}
 * />
 * ```
 */
'use client';

import { useState, useRef, type FormEvent } from 'react';
import { clsx } from 'clsx';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import { useToast } from '@/components/ui';
import { Upload, User, Mail } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { usersAPI } from '@/lib/api';

export interface ProfileFormData {
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar?: string;
}

export interface ProfileFormProps {
  /** Initial user data */
  user: {
    email: string;
    first_name?: string;
    last_name?: string;
    avatar?: string;
  };
  /** Form submission handler */
  onSubmit: (data: ProfileFormData) => Promise<void>;
  /** Loading state */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ProfileForm - Form for editing user profile
 */
export function ProfileForm({
  user,
  onSubmit,
  isLoading = false,
  className,
}: ProfileFormProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email: user.email || '',
    avatar: user.avatar || '',
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof ProfileFormData, string>>
  >({});
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const displayName =
    [formData.first_name, formData.last_name].filter(Boolean).join(' ') ||
    formData.email?.split('@')[0] ||
    '';

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ProfileFormData, string>> = {};
    if (
      formData.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      newErrors.email = 'Please enter a valid email address';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) {
      showToast({
        message: 'Please fix the errors in the form',
        type: 'error',
      });
      return;
    }

    try {
      await onSubmit(formData);
      showToast({
        message: 'Profile updated successfully',
        type: 'success',
      });
    } catch (error) {
      showToast({
        message:
          error instanceof Error ? error.message : 'Failed to update profile',
        type: 'error',
      });
    }
  };

  const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast({
        message: 'Please upload an image file',
        type: 'error',
      });
      return;
    }

    // No size limit for images (removed 5MB restriction)

    // Create local preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        avatar: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);

    // Upload to backend
    try {
      setIsUploadingAvatar(true);
      const avatarUrl = await usersAPI.uploadAvatar(file);
      setFormData((prev) => ({
        ...prev,
        avatar: avatarUrl,
      }));
      showToast({
        message: 'Avatar uploaded successfully',
        type: 'success',
      });
    } catch (error) {
      showToast({
        message:
          error instanceof Error ? error.message : 'Failed to upload avatar',
        type: 'error',
      });
      // Revert to previous avatar on error
      setFormData((prev) => ({
        ...prev,
        avatar: user.avatar || '',
      }));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <Card className={clsx('p-6', className)}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Upload */}
        <div className="flex flex-col items-center gap-4">
          <Avatar
            src={formData.avatar}
            alt={displayName}
            name={displayName}
            fallback={initials}
            size="xl"
            className="border-4 border-primary-200 dark:border-primary-800"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            disabled={isUploadingAvatar}
            onClick={() => {
              fileInputRef.current?.click();
            }}
          >
            <Upload className="w-4 h-4" />
            {isUploadingAvatar ? 'Uploading...' : 'Upload Avatar'}
          </Button>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="First Name"
            value={formData.first_name || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev) => ({
                ...prev,
                first_name: e.target.value,
              }))
            }
            leftIcon={<User className="w-4 h-4" />}
            error={errors.first_name}
          />
          <Input
            label="Last Name"
            value={formData.last_name || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev) => ({
                ...prev,
                last_name: e.target.value,
              }))
            }
            leftIcon={<User className="w-4 h-4" />}
            error={errors.last_name}
          />
          <Input
            label="Email"
            type="email"
            value={formData.email || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev) => ({
                ...prev,
                email: e.target.value,
              }))
            }
            leftIcon={<Mail className="w-4 h-4" />}
            error={errors.email}
            required
            className="md:col-span-2"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            className="min-w-[120px]"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
