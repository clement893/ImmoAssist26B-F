'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { apiClient } from '@/lib/api/client';
import { User, Mail, Phone, MessageSquare, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { getErrorMessage } from '@/lib/errors';

interface LeadCaptureFormProps {
  title?: string;
  description?: string;
  fields?: Array<'name' | 'email' | 'phone' | 'company' | 'message'>;
  source?: string;
  onSubmit?: (data: Record<string, string>) => void;
  className?: string;
}

export function LeadCaptureForm({
  title = 'Get Started',
  description = "Fill out the form below and we'll get back to you soon.",
  fields = ['name', 'email', 'phone', 'message'],
  source,
  onSubmit,
  className = '',
}: LeadCaptureFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.email?.trim()) {
      setStatus('error');
      setMessage('Email is required');
      return;
    }

    setIsLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      interface LeadCaptureResponse {
        success: boolean;
        message?: string;
        email?: string;
      }

      // Submit lead capture (you can create a dedicated endpoint or use newsletter)
      const response = await apiClient.post<LeadCaptureResponse>('/api/v1/newsletter/subscribe', {
        email: formData.email,
        first_name: formData.name?.split(' ')[0] || formData.name,
        last_name: formData.name?.split(' ').slice(1).join(' ') || '',
        source: source || 'lead_capture',
        custom_fields: {
          ...(formData.phone && { phone: formData.phone }),
          ...(formData.company && { company: formData.company }),
          ...(formData.message && { message: formData.message }),
        },
      });

      if (response.data?.success) {
        setStatus('success');
        setMessage("Thank you! We'll be in touch soon.");
        setFormData({});
        onSubmit?.(formData);
      } else {
        throw new Error(response.data?.message || 'Submission failed');
      }
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err) || 'Failed to submit form';
      setStatus('error');
      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={className}>
      {title && <h3 className="text-xl font-semibold mb-2">{title}</h3>}
      {description && <p className="text-muted-foreground mb-6">{description}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.includes('name') && (
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Full Name"
              value={formData.name || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('name', e.target.value)}
              disabled={isLoading}
              className="pl-10"
              required={fields.includes('name')}
            />
          </div>
        )}

        {fields.includes('email') && (
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Email Address"
              value={formData.email || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('email', e.target.value)}
              disabled={isLoading}
              className="pl-10"
              required
            />
          </div>
        )}

        {fields.includes('phone') && (
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="tel"
              placeholder="Phone Number"
              value={formData.phone || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('phone', e.target.value)}
              disabled={isLoading}
              className="pl-10"
            />
          </div>
        )}

        {fields.includes('company') && (
          <Input
            type="text"
            placeholder="Company Name"
            value={formData.company || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('company', e.target.value)}
            disabled={isLoading}
          />
        )}

        {fields.includes('message') && (
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <textarea
              placeholder="Message"
              value={formData.message || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('message', e.target.value)}
              disabled={isLoading}
              className="w-full px-10 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={4}
            />
          </div>
        )}

        <Button type="submit" disabled={isLoading || !formData.email?.trim()} variant="primary" fullWidth>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Submitting...
            </>
          ) : (
            'Submit'
          )}
        </Button>

        {status === 'success' && (
          <div className="flex items-center gap-2 text-sm text-success-600 dark:text-success-400 p-3 bg-success-50 dark:bg-success-900/20 rounded-lg">
            <CheckCircle className="h-4 w-4" />
            <span>{message}</span>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center gap-2 text-sm text-error-600 dark:text-error-400 p-3 bg-error-50 dark:bg-error-900/20 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <span>{message}</span>
          </div>
        )}
      </form>
    </div>
  );
}
