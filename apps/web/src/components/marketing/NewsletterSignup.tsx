'use client';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { apiClient } from '@/lib/api/client';
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { getErrorMessage } from '@/lib/errors';
interface NewsletterSignupProps {
  placeholder?: string;
  buttonText?: string;
  showNameFields?: boolean;
  source?: string;
  className?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}
export function NewsletterSignup({
  placeholder = 'Enter your email',
  buttonText = 'Subscribe',
  showNameFields = false,
  source,
  className = '',
  onSuccess,
  onError,
}: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) {
      setStatus('error');
      setMessage('Please enter your email address');
      return;
    }
    setIsLoading(true);
    setStatus('idle');
    setMessage('');
    try {
      interface NewsletterResponse {
        success: boolean;
        message?: string;
        email?: string;
      }
      const response = await apiClient.post<NewsletterResponse>('/api/v1/newsletter/subscribe', {
        email: email.trim(),
        ...(showNameFields && firstName && { first_name: firstName }),
        ...(showNameFields && lastName && { last_name: lastName }),
        ...(source && { source }),
      });
      if (response.data?.success) {
        setStatus('success');
        setMessage('Successfully subscribed! Check your email for confirmation.');
        setEmail('');
        setFirstName('');
        setLastName('');
        onSuccess?.();
      } else {
        throw new Error(response.data?.message || 'Subscription failed');
      }
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err) || 'Failed to subscribe';
      setStatus('error');
      setMessage(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className={className}>
      {' '}
      <form onSubmit={handleSubmit} className="space-y-3">
        {' '}
        {showNameFields && (
          <div className="grid grid-cols-2 gap-2">
            {' '}
            <Input
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
              disabled={isLoading}
            />{' '}
            <Input
              type="text"
              placeholder="Last name"
              value={lastName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
              disabled={isLoading}
            />{' '}
          </div>
        )}{' '}
        <div className="flex gap-2">
          {' '}
          <div className="flex-1 relative">
            {' '}
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />{' '}
            <Input
              type="email"
              placeholder={placeholder}
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              disabled={isLoading}
              className="pl-10"
              required
            />{' '}
          </div>{' '}
          <Button type="submit" disabled={isLoading || !email.trim()} variant="primary">
            {' '}
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : buttonText}{' '}
          </Button>{' '}
        </div>{' '}
        {status === 'success' && (
          <div className="flex items-center gap-2 text-sm text-success-600 dark:text-success-400">
            {' '}
            <CheckCircle className="h-4 w-4" /> <span>{message}</span>{' '}
          </div>
        )}{' '}
        {status === 'error' && (
          <div className="flex items-center gap-2 text-sm text-error-600 dark:text-error-400">
            {' '}
            <AlertCircle className="h-4 w-4" /> <span>{message}</span>{' '}
          </div>
        )}{' '}
      </form>{' '}
    </div>
  );
}
