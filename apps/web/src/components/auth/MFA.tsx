/**
 * Multi-Factor Authentication (MFA) Component
 *
 * Supports TOTP (Time-based One-Time Password) authentication.
 * Handles both setup (QR code display) and verification flows.
 *
 * @example
 * ```tsx
 * // Verification flow
 * <MFA
 *   onVerify={async (code) => {
 *     await verifyMFA(code);
 *   }}
 *   onCancel={() => router.back()}
 * />
 *
 * // Setup flow
 * <MFA
 *   qrCodeUrl={qrCodeUrl}
 *   secret={secret}
 *   email={user.email}
 *   onVerify={async (code) => {
 *     await setupMFA(code);
 *   }}
 * />
 * ```
 */
'use client';

import { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import Loading from '@/components/ui/Loading';

export interface MFAProps {
  /** Verify callback - called when user submits 6-digit code */
  onVerify: (code: string) => Promise<void>;
  /** Cancel callback */
  onCancel?: () => void;
  /** QR code URL for MFA setup */
  qrCodeUrl?: string;
  /** Secret key for manual entry */
  secret?: string;
  /** User email for display */
  email?: string;
  /** Additional CSS classes */
  className?: string;
}

export default function MFA({ onVerify, onCancel, qrCodeUrl, secret, email, className }: MFAProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'setup' | 'verify'>('verify');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Auto-focus first input
    inputRefs.current[0]?.focus();
  }, []);

  const handleCodeChange = (value: string, index: number) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(0, 1);
    if (digit) {
      const newCode = code.split('');
      newCode[index] = digit;
      const updatedCode = newCode.join('').slice(0, 6);
      setCode(updatedCode);
      setError('');

      // Auto-focus next input
      if (index < 5 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1]?.focus();
      }

      // Auto-submit when 6 digits are entered
      if (updatedCode.length === 6) {
        handleVerify(updatedCode);
      }
    } else if (value === '') {
      // Handle backspace
      const newCode = code.split('');
      newCode[index] = '';
      setCode(newCode.join(''));
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      setCode(pastedData);
      setError('');
      // Focus last input
      inputRefs.current[5]?.focus();
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (codeToVerify: string = code) => {
    if (codeToVerify.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onVerify(codeToVerify);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid verification code');
      setCode('');
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = () => {
    setStep('setup');
  };

  return (
    <Card className={clsx('p-6', className)}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Two-Factor Authentication</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {step === 'setup'
              ? 'Set up two-factor authentication for your account'
              : email
                ? `Enter the 6-digit code sent to ${email}`
                : 'Enter the 6-digit code from your authenticator app'}
          </p>
        </div>

        {error && (
          <Alert variant="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {step === 'setup' ? (
          <div className="space-y-4">
            {qrCodeUrl && (
              <div className="flex justify-center p-4 bg-background rounded-lg border border-border">
                <img src={qrCodeUrl} alt="QR Code for MFA setup" className="w-48 h-48" />
              </div>
            )}

            {secret && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">Manual Entry Key</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg font-mono text-sm break-all">
                    {secret}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(secret);
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  If you can't scan the QR code, enter this key manually in your authenticator app
                </p>
              </div>
            )}

            <div className="pt-4">
              <p className="text-sm font-medium text-foreground mb-3">
                Enter the code from your authenticator app to verify:
              </p>
              <div className="flex gap-2 justify-center">
                {Array.from({ length: 6 }).map((_, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={code[index] || ''}
                    onChange={(e) => handleCodeChange(e.target.value, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className={clsx(
                      'w-12 h-12 text-center text-lg font-semibold rounded-lg border transition-all',
                      'bg-background text-foreground',
                      'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400',
                      error ? 'border-error-500 dark:border-error-400' : 'border-border'
                    )}
                    disabled={loading}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setStep('verify');
                  setCode('');
                }}
                disabled={loading}
                fullWidth
              >
                Back
              </Button>
              <Button
                variant="primary"
                onClick={() => handleVerify()}
                loading={loading}
                disabled={code.length !== 6}
                fullWidth
              >
                Verify & Enable
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2 justify-center">
              {Array.from({ length: 6 }).map((_, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={code[index] || ''}
                  onChange={(e) => handleCodeChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className={clsx(
                    'w-12 h-12 text-center text-lg font-semibold rounded-lg border transition-all',
                    'bg-background text-foreground',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400',
                    error ? 'border-error-500 dark:border-error-400' : 'border-border'
                  )}
                  disabled={loading}
                />
              ))}
            </div>

            {loading && (
              <div className="flex justify-center">
                <Loading />
              </div>
            )}

            <div className="flex gap-3">
              {onCancel && (
                <Button variant="secondary" onClick={onCancel} disabled={loading} fullWidth>
                  Cancel
                </Button>
              )}
              <Button
                variant="primary"
                onClick={() => handleVerify()}
                loading={loading}
                disabled={code.length !== 6}
                fullWidth
              >
                Verify Code
              </Button>
            </div>

            {qrCodeUrl && (
              <div className="pt-4 border-t border-border">
                <Button variant="ghost" onClick={handleSetup} fullWidth className="text-sm">
                  Set up authenticator app
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
