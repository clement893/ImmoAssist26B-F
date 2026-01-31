/**
 * Usage Meter Component
 * Visual display of usage against limits
 */
'use client';

import { clsx } from 'clsx';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Progress from '@/components/ui/Progress';
import { AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

export interface UsageMeterProps {
  label: string;
  current: number;
  limit: number;
  unit?: string;
  className?: string;
  showDetails?: boolean;
  thresholds?: {
    warning: number; // Percentage (0-100)
    critical: number; // Percentage (0-100)
  };
}

export default function UsageMeter({
  label,
  current,
  limit,
  unit = '',
  className,
  showDetails = true,
  thresholds = { warning: 70, critical: 90 },
}: UsageMeterProps) {
  const percentage = Math.min((current / limit) * 100, 100);
  const remaining = Math.max(limit - current, 0);

  const getStatus = () => {
    if (percentage >= thresholds.critical) return 'critical';
    if (percentage >= thresholds.warning) return 'warning';
    return 'normal';
  };

  const status = getStatus();

  const getStatusConfig = () => {
    switch (status) {
      case 'critical':
        return {
          variant: 'error' as const,
          icon: <AlertTriangle className="w-4 h-4" />,
          message: 'Usage limit nearly reached',
          color: 'text-error-600 dark:text-error-400',
        };
      case 'warning':
        return {
          variant: 'warning' as const,
          icon: <TrendingUp className="w-4 h-4" />,
          message: 'Approaching usage limit',
          color: 'text-warning-600 dark:text-warning-400',
        };
      default:
        return {
          variant: 'success' as const,
          icon: <CheckCircle className="w-4 h-4" />,
          message: 'Usage within limits',
          color: 'text-success-600 dark:text-success-400',
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <Card className={clsx('bg-background', className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">{label}</h3>
          <Badge variant={statusConfig.variant}>
            <span className="flex items-center gap-1">
              {statusConfig.icon}
              {Math.round(percentage)}%
            </span>
          </Badge>
        </div>

        {/* Usage Display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {current.toLocaleString()} {unit} used
            </span>
            <span className="text-muted-foreground">
              {limit.toLocaleString()} {unit} limit
            </span>
          </div>

          {/* Progress Bar */}
          <Progress
            value={percentage}
            variant={status === 'critical' ? 'error' : status === 'warning' ? 'warning' : 'success'}
            showLabel={false}
          />

          {/* Status Message */}
          {status !== 'normal' && (
            <div className={clsx('flex items-center gap-2 text-sm', statusConfig.color)}>
              {statusConfig.icon}
              {statusConfig.message}
            </div>
          )}
        </div>

        {/* Details */}
        {showDetails && (
          <div className="pt-4 border-t border-border">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Remaining</div>
                <div className="text-lg font-semibold text-foreground">
                  {remaining.toLocaleString()} {unit}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Used</div>
                <div className="text-lg font-semibold text-foreground">
                  {current.toLocaleString()} {unit}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
