'use client';

import { useState } from 'react';
import { Send, Bug, Lightbulb, HelpCircle, MessageSquare, ThumbsUp, FileText } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { apiClient } from '@/lib/api/client';
import { useToast } from '@/components/ui';
import { getErrorMessage } from '@/lib/errors';

interface FeedbackFormProps {
  className?: string;
  onSuccess?: () => void;
}

const feedbackTypes = [
  { value: 'bug', label: 'Bug Report', icon: Bug },
  { value: 'feature_request', label: 'Feature Request', icon: Lightbulb },
  { value: 'question', label: 'Question', icon: HelpCircle },
  { value: 'complaint', label: 'Complaint', icon: MessageSquare },
  { value: 'praise', label: 'Praise', icon: ThumbsUp },
  { value: 'other', label: 'Other', icon: FileText },
];

export function FeedbackForm({ className = '', onSuccess }: FeedbackFormProps) {
  const [type, setType] = useState<'bug' | 'feature_request' | 'question' | 'complaint' | 'praise' | 'other'>(
    'bug'
  );
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !message.trim()) {
      showToast({ message: 'Please fill in all required fields', type: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.post('/api/v1/feedback/feedback', {
        type,
        subject: subject.trim(),
        message: message.trim(),
        priority,
        url: window.location.href,
      });

      showToast({ message: 'Thank you for your feedback!', type: 'success' });

      // Reset form
      setSubject('');
      setMessage('');
      setPriority(1);
      setType('bug');

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: unknown) {
      showToast({ message: getErrorMessage(error) || 'Failed to submit feedback', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={className}>
      <h3 className="text-lg font-semibold mb-4">Send Feedback</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Type</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {feedbackTypes.map((ft) => {
              const Icon = ft.icon;
              return (
                <button
                  key={ft.value}
                  type="button"
                  onClick={() => {
                    const validType = ft.value as
                      | 'bug'
                      | 'feature_request'
                      | 'question'
                      | 'complaint'
                      | 'praise'
                      | 'other';
                    setType(validType);
                  }}
                  className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                    type === ft.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-border hover:border-border dark:hover:border-border'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm">{ft.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Subject <span className="text-error-500">*</span>
          </label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Brief description of your feedback"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Message <span className="text-error-500">*</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Please provide details..."
            rows={6}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background"
          >
            <option value={1}>Low</option>
            <option value={2}>Medium</option>
            <option value={3}>High</option>
            <option value={4}>Critical</option>
          </select>
        </div>

        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting || !subject.trim() || !message.trim()}
          className="w-full"
        >
          <Send className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </Button>
      </form>
    </Card>
  );
}
