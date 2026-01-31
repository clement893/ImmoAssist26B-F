/**
 * Payment Method Form Component
 * Form to add or update payment methods
 */
'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { CreditCard, Lock, CheckCircle } from 'lucide-react';

export interface PaymentMethodFormProps {
  onSubmit?: (data: PaymentMethodData) => void | Promise<void>;
  onCancel?: () => void;
  defaultValues?: Partial<PaymentMethodData>;
  className?: string;
}

export interface PaymentMethodData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
  billingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

export default function PaymentMethodForm({
  onSubmit,
  onCancel,
  defaultValues,
  className,
}: PaymentMethodFormProps) {
  const [formData, setFormData] = useState<PaymentMethodData>({
    cardNumber: defaultValues?.cardNumber || '',
    expiryDate: defaultValues?.expiryDate || '',
    cvv: defaultValues?.cvv || '',
    cardholderName: defaultValues?.cardholderName || '',
    billingAddress: defaultValues?.billingAddress,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.slice(0, 19); // Max 16 digits + 3 spaces
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  const handleChange = (field: keyof PaymentMethodData, value: string) => {
    if (field === 'cardNumber') {
      value = formatCardNumber(value);
    } else if (field === 'expiryDate') {
      value = formatExpiryDate(value);
    } else if (field === 'cvv') {
      value = value.replace(/\D/g, '').slice(0, 4);
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, '').length < 13) {
      newErrors.cardNumber = 'Please enter a valid card number';
    }

    if (!formData.expiryDate || formData.expiryDate.length !== 5) {
      newErrors.expiryDate = 'Please enter a valid expiry date (MM/YY)';
    }

    if (!formData.cvv || formData.cvv.length < 3) {
      newErrors.cvv = 'Please enter a valid CVV';
    }

    if (!formData.cardholderName) {
      newErrors.cardholderName = 'Please enter the cardholder name';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await onSubmit?.(formData);
    } catch (_error) {
      setErrors({ submit: 'Failed to save payment method. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={clsx('bg-background', className)}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h3 className="text-lg font-semibold text-foreground">Payment Method</h3>
        </div>

        {/* Card Number */}
        <Input
          label="Card Number"
          value={formData.cardNumber}
          onChange={(e) => handleChange('cardNumber', e.target.value)}
          placeholder="1234 5678 9012 3456"
          error={errors.cardNumber}
          leftIcon={<CreditCard className="w-5 h-5" />}
          maxLength={19}
          required
        />

        {/* Expiry and CVV */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Expiry Date"
            value={formData.expiryDate}
            onChange={(e) => handleChange('expiryDate', e.target.value)}
            placeholder="MM/YY"
            error={errors.expiryDate}
            maxLength={5}
            required
          />
          <Input
            label="CVV"
            type="password"
            value={formData.cvv}
            onChange={(e) => handleChange('cvv', e.target.value)}
            placeholder="123"
            error={errors.cvv}
            maxLength={4}
            required
          />
        </div>

        {/* Cardholder Name */}
        <Input
          label="Cardholder Name"
          value={formData.cardholderName}
          onChange={(e) => handleChange('cardholderName', e.target.value)}
          placeholder="John Doe"
          error={errors.cardholderName}
          required
        />

        {/* Security Notice */}
        <div className="flex items-start gap-2 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
          <Lock className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-primary-800 dark:text-primary-200">
            <div className="font-medium mb-1">Secure Payment</div>
            <div>
              Your payment information is encrypted and secure. We never store your full card
              details.
            </div>
          </div>
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="p-3 bg-error-50 dark:bg-error-900/20 rounded-lg border border-error-200 dark:border-error-800 text-sm text-error-800 dark:text-error-200">
            {errors.submit}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          {onCancel && (
            <Button variant="ghost" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
          )}
          <Button type="submit" variant="primary" loading={loading}>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Save Payment Method
            </span>
          </Button>
        </div>
      </form>
    </Card>
  );
}
