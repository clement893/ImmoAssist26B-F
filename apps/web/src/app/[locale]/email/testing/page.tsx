'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import { emailAPI } from '@/lib/api';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {
  Button,
  Card,
  Input,
  Textarea,
  Alert,
  Badge,
  Tabs,
  TabList,
  Tab,
  Container,
} from '@/components/ui';
import type { EmailResponse, EmailHealthResponse } from '@/lib/email/client';

interface ApiErrorResponse {
  detail?: string;
  message?: string;
}

function EmailTestContent() {
  const router = useRouter();
  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [textContent, setTextContent] = useState('');
  const [emailType, setEmailType] = useState<'test' | 'welcome' | 'custom'>('test');
  const [response, setResponse] = useState<EmailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [healthStatus, setHealthStatus] = useState<EmailHealthResponse | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const checkHealth = async () => {
    setIsCheckingHealth(true);
    setError('');

    try {
      const res = await emailAPI.health();
      setHealthStatus(res.data);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      const errorMessage = axiosError.response?.data?.detail || 'Failed to check health';
      setError(errorMessage);
      setHealthStatus(null);

      if (axiosError.response?.status === 401) {
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      }
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const sendTestEmail = async () => {
    if (!toEmail.trim()) {
      setError('Please enter an email address');
      return;
    }

    setIsLoading(true);
    setError('');
    setResponse(null);

    try {
      const res = await emailAPI.sendTest(toEmail);
      setResponse(res.data);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      const errorMessage = axiosError.response?.data?.detail || 'Failed to send email';
      setError(errorMessage);

      if (axiosError.response?.status === 401) {
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const sendWelcomeEmail = async () => {
    if (!toEmail.trim()) {
      setError('Please enter an email address');
      return;
    }

    setIsLoading(true);
    setError('');
    setResponse(null);

    try {
      const res = await emailAPI.sendWelcome(toEmail);
      setResponse(res.data);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      const errorMessage = axiosError.response?.data?.detail || 'Failed to send email';
      setError(errorMessage);

      if (axiosError.response?.status === 401) {
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const sendCustomEmail = async () => {
    if (!toEmail.trim() || !subject.trim() || !htmlContent.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError('');
    setResponse(null);

    try {
      const res = await emailAPI.sendCustom({
        to_email: toEmail,
        subject,
        html_content: htmlContent,
        text_content: textContent || undefined,
      });
      setResponse(res.data);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      const errorMessage = axiosError.response?.data?.detail || 'Failed to send email';
      setError(errorMessage);

      if (axiosError.response?.status === 401) {
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (emailType === 'test') {
      sendTestEmail();
    } else if (emailType === 'welcome') {
      sendWelcomeEmail();
    } else {
      sendCustomEmail();
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-muted dark:to-muted py-8">
      <Container maxWidth="xl" className="space-y-6">
        <Card title="Email Test Interface (SendGrid)">
          {/* Health Check */}
          <Card title="SendGrid Health Check" className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                Verify SendGrid configuration and connection status
              </p>
              <Button variant="primary" onClick={checkHealth} loading={isCheckingHealth} size="sm">
                Check Status
              </Button>
            </div>
            {healthStatus && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <strong className="text-sm text-foreground">Configured:</strong>
                  <Badge variant={healthStatus.configured ? 'success' : 'error'}>
                    {healthStatus.configured ? '✅ Yes' : '❌ No'}
                  </Badge>
                </div>
                <div className="text-sm">
                  <p className="text-foreground">
                    <strong>From Email:</strong> {healthStatus.from_email || 'N/A'}
                  </p>
                  <p className="text-foreground">
                    <strong>From Name:</strong> {healthStatus.from_name || 'N/A'}
                  </p>
                  <p className="text-foreground">
                    <strong>Status:</strong> {healthStatus.status || 'N/A'}
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Email Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-foreground">Email Type</label>
            <Tabs
              defaultTab={emailType}
              onChange={(value) => setEmailType(value as 'test' | 'welcome' | 'custom')}
            >
              <TabList>
                <Tab value="test">Test Email</Tab>
                <Tab value="welcome">Welcome Email</Tab>
                <Tab value="custom">Custom Email</Tab>
              </TabList>
            </Tabs>
          </div>

          {/* Email Form */}
          <div className="space-y-4">
            <Input
              type="email"
              label="To Email"
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              placeholder="recipient@example.com"
              required
              fullWidth
            />

            {emailType === 'custom' && (
              <>
                <Input
                  type="text"
                  label="Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject"
                  required
                  fullWidth
                />
                <Textarea
                  label="HTML Content"
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  placeholder="<h1>Hello!</h1><p>This is a test email.</p>"
                  required
                  rows={6}
                  className="font-mono text-sm"
                  fullWidth
                />
                <Textarea
                  label="Text Content (optional)"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Plain text version of the email"
                  rows={4}
                  fullWidth
                />
              </>
            )}

            {emailType === 'test' && (
              <Alert variant="info" title="Test Email">
                This will send a test email to verify SendGrid configuration.
              </Alert>
            )}

            {emailType === 'welcome' && (
              <Alert variant="success" title="Welcome Email">
                This will send a welcome email template to the recipient.
              </Alert>
            )}

            <Button
              onClick={handleSend}
              disabled={isLoading}
              loading={isLoading}
              variant="primary"
              fullWidth
              size="lg"
            >
              {isLoading
                ? 'Sending...'
                : `Send ${emailType === 'test' ? 'Test' : emailType === 'welcome' ? 'Welcome' : 'Custom'} Email`}
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="error" title="Error" className="mt-4">
              {error}
            </Alert>
          )}

          {/* Response Display */}
          {response && (
            <Alert variant="success" title="Email Sent Successfully!" className="mt-6">
              <div className="text-sm space-y-1 mt-2">
                <p>
                  <strong>Status:</strong> {response.status}
                </p>
                {response.status_code && (
                  <p>
                    <strong>Status Code:</strong> {response.status_code}
                  </p>
                )}
                {response.message_id && (
                  <p>
                    <strong>Message ID:</strong> {response.message_id}
                  </p>
                )}
                <p>
                  <strong>To:</strong> {response.to}
                </p>
              </div>
            </Alert>
          )}
        </Card>

        {/* Instructions */}
        <Card title="How to Test">
          <div className="space-y-4 text-sm text-foreground">
            <div>
              <h3 className="font-semibold mb-1 text-foreground">1. Health Check</h3>
              <p>Click "Check Status" to verify SendGrid configuration. You should see:</p>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>Configured: ✅ Yes</li>
                <li>From Email: hello@nukleo.digital</li>
                <li>From Name: Nukleo Digital</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-1 text-foreground">2. Test Email</h3>
              <p>
                Select "Test Email" and enter your email address. This sends a simple test email.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1 text-foreground">3. Welcome Email</h3>
              <p>Select "Welcome Email" to send a formatted welcome email template.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-1 text-foreground">4. Custom Email</h3>
              <p>Select "Custom Email" to send a fully customized email with HTML content.</p>
            </div>
            <Alert variant="warning" title="⚠️ Important" className="mt-4">
              Make sure SendGrid API key is configured in Railway environment variables. The email
              address "hello@nukleo.digital" must be verified in SendGrid.
            </Alert>
          </div>
        </Card>
      </Container>
    </main>
  );
}

export default function EmailTestPage() {
  return (
    <ProtectedRoute>
      <EmailTestContent />
    </ProtectedRoute>
  );
}
