/**
 * Error Reporting UI Component
 * User-friendly form for reporting errors and bugs
 */
'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Checkbox from '@/components/ui/Checkbox';
import Alert from '@/components/ui/Alert';
import { logger } from '@/lib/logger';
import { captureMessage, addBreadcrumb } from '@/lib/monitoring/sentry';

export interface ErrorReportingProps {
  onSubmit?: (data: ErrorReportData) => Promise<void>;
  className?: string;
}

export interface ErrorReportData {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  stepsToReproduce: string;
  expectedBehavior: string;
  actualBehavior: string;
  includeScreenshot: boolean;
  includeConsoleLogs: boolean;
  userAgent?: string;
  url?: string;
}

export default function ErrorReporting({ onSubmit, className }: ErrorReportingProps) {
  const [formData, setFormData] = useState<ErrorReportData>({
    title: '',
    description: '',
    severity: 'medium',
    category: '',
    stepsToReproduce: '',
    expectedBehavior: '',
    actualBehavior: '',
    includeScreenshot: false,
    includeConsoleLogs: false,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    url: typeof window !== 'undefined' ? window.location.href : '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      // Add breadcrumb for Sentry
      addBreadcrumb('Error report submitted', 'user-action', 'info', {
        title: formData.title,
        severity: formData.severity,
        category: formData.category,
      });

      if (onSubmit) {
        await onSubmit(formData);
      } else {
        // Default: log to logger and Sentry
        logger.info('Error Report', { formData });

        // Send to Sentry as a message
        captureMessage(`User Error Report: ${formData.title}`, 'info', {
          tags: {
            severity: formData.severity,
            category: formData.category,
          },
          extra: {
            description: formData.description,
            stepsToReproduce: formData.stepsToReproduce,
            expectedBehavior: formData.expectedBehavior,
            actualBehavior: formData.actualBehavior,
            url: formData.url,
            userAgent: formData.userAgent,
          },
        });

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      setSubmitSuccess(true);

      // Reset form after success
      setTimeout(() => {
        setFormData({
          title: '',
          description: '',
          severity: 'medium',
          category: '',
          stepsToReproduce: '',
          expectedBehavior: '',
          actualBehavior: '',
          includeScreenshot: false,
          includeConsoleLogs: false,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          url: typeof window !== 'undefined' ? window.location.href : '',
        });
        setSubmitSuccess(false);
      }, 3000);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit error report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={clsx('p-6', className)}>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Report an Error</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Help us improve by reporting bugs or issues you've encountered
          </p>
        </div>

        {submitSuccess && (
          <Alert variant="success" onClose={() => setSubmitSuccess(false)}>
            Thank you! Your error report has been submitted successfully.
          </Alert>
        )}

        {submitError && (
          <Alert variant="error" onClose={() => setSubmitError(null)}>
            {submitError}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            placeholder="Brief description of the issue"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <Textarea
            label="Description"
            placeholder="Detailed description of what went wrong"
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Severity"
              value={formData.severity}
              onChange={(e) =>
                setFormData({ ...formData, severity: e.target.value as ErrorReportData['severity'] })
              }
              options={[
                { value: 'low', label: 'Low - Minor issue' },
                { value: 'medium', label: 'Medium - Moderate impact' },
                { value: 'high', label: 'High - Significant impact' },
                { value: 'critical', label: 'Critical - Blocks functionality' },
              ]}
              required
            />

            <Select
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={[
                { value: '', label: 'Select a category' },
                { value: 'ui', label: 'UI/UX Issue' },
                { value: 'functionality', label: 'Functionality Bug' },
                { value: 'performance', label: 'Performance Issue' },
                { value: 'security', label: 'Security Concern' },
                { value: 'other', label: 'Other' },
              ]}
              required
            />
          </div>

          <Textarea
            label="Steps to Reproduce"
            placeholder="1. Go to...\n2. Click on...\n3. See error"
            rows={3}
            value={formData.stepsToReproduce}
            onChange={(e) => setFormData({ ...formData, stepsToReproduce: e.target.value })}
            helperText="List the steps that lead to this issue"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Textarea
              label="Expected Behavior"
              placeholder="What should have happened"
              rows={2}
              value={formData.expectedBehavior}
              onChange={(e) => setFormData({ ...formData, expectedBehavior: e.target.value })}
            />

            <Textarea
              label="Actual Behavior"
              placeholder="What actually happened"
              rows={2}
              value={formData.actualBehavior}
              onChange={(e) => setFormData({ ...formData, actualBehavior: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Additional Information</label>
            <div className="space-y-2">
              <Checkbox
                label="Include screenshot (if available)"
                checked={formData.includeScreenshot}
                onChange={(e) => setFormData({ ...formData, includeScreenshot: e.target.checked })}
              />
              <Checkbox
                label="Include browser console logs"
                checked={formData.includeConsoleLogs}
                onChange={(e) => setFormData({ ...formData, includeConsoleLogs: e.target.checked })}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={!formData.title || !formData.description || !formData.category}
            >
              Submit Report
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setFormData({
                  title: '',
                  description: '',
                  severity: 'medium',
                  category: '',
                  stepsToReproduce: '',
                  expectedBehavior: '',
                  actualBehavior: '',
                  includeScreenshot: false,
                  includeConsoleLogs: false,
                  userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
                  url: typeof window !== 'undefined' ? window.location.href : '',
                });
                setSubmitError(null);
                setSubmitSuccess(false);
              }}
            >
              Reset
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}
