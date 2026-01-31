'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AxiosError } from 'axios';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { transformApiUserToStoreUser } from '@/lib/auth/userTransform';
import { handleApiError } from '@/lib/errors/api';
import { Input, Button, Alert, Card, Container } from '@/components/ui';

interface ApiErrorResponse {
  detail?: string;
  message?: string;
  retry_after?: number;
  error?: {
    retry_after?: number;
  };
}

export default function RegisterPage() {
  const router = useRouter();
  const { login, setError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setLocalError] = useState('');

  const getPasswordStrength = (pwd: string): 'weak' | 'medium' | 'strong' => {
    if (!pwd || pwd.length < 8) return 'weak';

    let score = 0;
    const hasLower = /[a-z]/.test(pwd);
    const hasUpper = /[A-Z]/.test(pwd);
    const hasDigit = /[0-9]/.test(pwd);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(pwd);

    // Length scoring
    if (pwd.length >= 12) score += 2;
    else if (pwd.length >= 8) score += 1;

    // Character type scoring
    if (hasLower) score += 1;
    if (hasUpper) score += 1;
    if (hasDigit) score += 1;
    if (hasSpecial) score += 2;

    // Check for weak patterns
    const weakPatterns = ['123', 'abc', 'qwe', 'password', 'admin', 'letmein'];
    const pwdLower = pwd.toLowerCase();
    if (weakPatterns.some((pattern) => pwdLower.includes(pattern))) {
      score -= 1;
    }

    // Sequential characters penalty
    const sequential = ['12345', 'abcde', 'qwerty'];
    if (sequential.some((seq) => pwdLower.includes(seq))) {
      score -= 2;
    }

    if (score < 4) return 'weak';
    if (score < 6) return 'medium';
    return 'strong';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    // Check password strength
    const strength = getPasswordStrength(password);
    if (strength === 'weak') {
      setLocalError(
        'Password is too weak. Please use a stronger password with at least 12 characters, ' +
          'uppercase, lowercase, numbers, and special characters.'
      );
      return;
    }
    if (strength === 'medium') {
      setLocalError(
        'Password strength is medium. Please use a stronger password with at least 12 characters, ' +
          'uppercase, lowercase, numbers, and special characters for better security.'
      );
      return;
    }

    // Basic validation (backend will also validate)
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }
    if (password.length > 128) {
      setLocalError('Password cannot exceed 128 characters');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setLocalError('Password must contain at least one uppercase letter');
      return;
    }
    if (!/[a-z]/.test(password)) {
      setLocalError('Password must contain at least one lowercase letter');
      return;
    }
    if (!/[0-9]/.test(password)) {
      setLocalError('Password must contain at least one digit');
      return;
    }

    setIsLoading(true);

    try {
      await authAPI.register(email, password, name);
      const loginResponse = await authAPI.login(email, password);
      const { access_token, refresh_token, user } = loginResponse.data;

      // Transform user data to store format
      const userForStore = transformApiUserToStoreUser(user);

      // CRITICAL: Wait for token storage to complete before redirecting
      await login(userForStore, access_token, refresh_token);

      // Small delay to ensure token is available in sessionStorage for ProtectedRoute
      await new Promise((resolve) => setTimeout(resolve, 50));

      router.push('/dashboard');
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      const statusCode = axiosError.response?.status;

      // Handle rate limit error (429) with specific message
      if (statusCode === 429) {
        const responseData = axiosError.response?.data;
        // Try multiple possible locations for retry_after
        const retryAfter =
          responseData?.retry_after ||
          responseData?.error?.retry_after ||
          axiosError.response?.headers?.['retry-after'];

        let errorMessage = 'Too many registration attempts. ';
        if (retryAfter) {
          const seconds = parseInt(String(retryAfter), 10);
          if (!isNaN(seconds) && seconds > 0) {
            const minutes = Math.ceil(seconds / 60);
            if (minutes > 1) {
              errorMessage += `Please wait ${minutes} minutes before trying again.`;
            } else {
              errorMessage += `Please wait ${seconds} seconds before trying again.`;
            }
          } else {
            errorMessage += 'Please wait a minute before trying again.';
          }
        } else {
          errorMessage += 'Please wait a minute before trying again.';
        }
        setLocalError(errorMessage);
        setError(errorMessage);
      } else {
        const appError = handleApiError(err);
        setLocalError(appError.message);
        setError(appError.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-muted dark:to-muted">
      <Container className="w-full max-w-md">
        <Card>
          <h1 className="text-3xl font-bold text-center text-foreground mb-8">Register</h1>

          {error && (
            <Alert variant="error" title="Erreur" className="mb-4">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="text"
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="John Doe"
              fullWidth
            />

            <Input
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              fullWidth
            />

            <Input
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              maxLength={128}
              helperText="Must be at least 8 characters with uppercase, lowercase, and a number"
              fullWidth
            />

            <Input
              type="password"
              label="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••"
              maxLength={128}
              error={
                password !== confirmPassword && confirmPassword
                  ? 'Passwords do not match'
                  : undefined
              }
              fullWidth
            />

            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              loading={isLoading}
              fullWidth
            >
              {isLoading ? 'Registering...' : 'Register'}
            </Button>
          </form>

          <p className="text-center text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="text-primary-600 dark:text-primary-400 hover:underline"
            >
              Login
            </Link>
          </p>
        </Card>
      </Container>
    </main>
  );
}
