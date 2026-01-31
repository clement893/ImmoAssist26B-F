'use client';

import { CheckCircle2, Circle, Clock, XCircle, AlertCircle } from 'lucide-react';

export type StepStatus = 'completed' | 'current' | 'pending' | 'blocked' | 'warning';

export interface TransactionStep {
  id: string;
  title: string;
  description: string;
  status: StepStatus;
  date?: string;
  deadline?: string;
  details?: string[];
  icon?: React.ReactNode;
  progress?: number; // Pourcentage de complétion de cette étape (0-100)
}

interface StatusStepperProps {
  steps: TransactionStep[];
  orientation?: 'vertical' | 'horizontal';
  showProgress?: boolean;
  className?: string;
}

export default function StatusStepper({
  steps,
  orientation = 'vertical',
  showProgress = true,
  className = '',
}: StatusStepperProps) {
  const getStepIcon = (step: TransactionStep) => {
    const iconClass = 'w-6 h-6';
    
    switch (step.status) {
      case 'completed':
        return <CheckCircle2 className={`${iconClass} text-success-600 dark:text-success-400`} />;
      case 'current':
        return <Clock className={`${iconClass} text-primary-600 dark:text-primary-400 animate-pulse`} />;
      case 'blocked':
        return <XCircle className={`${iconClass} text-error-600 dark:text-error-400`} />;
      case 'warning':
        return <AlertCircle className={`${iconClass} text-warning-600 dark:text-warning-400`} />;
      default:
        return <Circle className={`${iconClass} text-muted-foreground`} />;
    }
  };

  const getStepColor = (step: TransactionStep) => {
    switch (step.status) {
      case 'completed':
        return 'border-success-500 bg-success-50 dark:bg-success-950/30';
      case 'current':
        return 'border-primary-500 bg-primary-50 dark:bg-primary-950/30';
      case 'blocked':
        return 'border-error-500 bg-error-50 dark:bg-error-950/30';
      case 'warning':
        return 'border-warning-500 bg-warning-50 dark:bg-warning-950/30';
      default:
        return 'border-muted bg-muted/30';
    }
  };

  const getStepTextColor = (step: TransactionStep) => {
    switch (step.status) {
      case 'completed':
        return 'text-success-700 dark:text-success-300';
      case 'current':
        return 'text-primary-700 dark:text-primary-300';
      case 'blocked':
        return 'text-error-700 dark:text-error-300';
      case 'warning':
        return 'text-warning-700 dark:text-warning-300';
      default:
        return 'text-muted-foreground';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-CA', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const getProgressPercentage = () => {
    const completed = steps.filter(s => s.status === 'completed').length;
    return steps.length > 0 ? Math.round((completed / steps.length) * 100) : 0;
  };

  if (orientation === 'horizontal') {
    return (
      <div className={`w-full ${className}`}>
        {showProgress && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progression globale</span>
              <span className="text-sm text-muted-foreground">{getProgressPercentage()}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </div>
        )}
        
        <div className="flex items-start gap-4 overflow-x-auto pb-4">
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1;
            const isCompleted = step.status === 'completed';
            
            return (
              <div key={step.id} className="flex-shrink-0 flex items-start gap-3 min-w-[200px]">
                {/* Step Circle */}
                <div className="flex flex-col items-center">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center ${getStepColor(step)}`}>
                    {step.icon || getStepIcon(step)}
                  </div>
                  {!isLast && (
                    <div
                      className={`w-0.5 flex-1 mt-2 ${
                        isCompleted ? 'bg-success-500' : 'bg-muted'
                      }`}
                      style={{ minHeight: '40px' }}
                    />
                  )}
                </div>
                
                {/* Step Content */}
                <div className="flex-1 pt-1">
                  <h4 className={`text-sm font-semibold mb-1 ${getStepTextColor(step)}`}>
                    {step.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mb-2">{step.description}</p>
                  {step.date && (
                    <p className="text-xs text-muted-foreground">
                      {formatDate(step.date)}
                    </p>
                  )}
                  {step.progress !== undefined && step.progress > 0 && step.progress < 100 && (
                    <div className="mt-2 w-full bg-muted rounded-full h-1.5">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${step.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Vertical orientation (default)
  return (
    <div className={className}>
      {showProgress && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progression globale</span>
            <span className="text-sm text-muted-foreground">{getProgressPercentage()}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>
      )}
      
      <div className="space-y-6">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const isCompleted = step.status === 'completed';

          return (
            <div key={step.id} className="relative">
              {/* Connector Line */}
              {!isLast && (
                <div
                  className={`absolute left-6 top-12 w-0.5 ${
                    isCompleted ? 'bg-success-500' : 'bg-muted'
                  }`}
                  style={{ height: 'calc(100% - 3rem)' }}
                />
              )}

              {/* Step Content */}
              <div className="flex gap-4">
                {/* Icon */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center ${getStepColor(step)}`}>
                  {step.icon || getStepIcon(step, index)}
                </div>

                {/* Content */}
                <div className="flex-1 pb-6">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className={`text-lg font-semibold mb-1 ${getStepTextColor(step)}`}>
                        {step.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                    {step.date && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground ml-4">
                        <span>{formatDate(step.date)}</span>
                      </div>
                    )}
                  </div>

                  {step.deadline && !step.date && (
                    <div className={`flex items-center gap-1 text-sm mb-2 ${
                      new Date(step.deadline) < new Date() 
                        ? 'text-error-600 dark:text-error-400' 
                        : 'text-warning-600 dark:text-warning-400'
                    }`}>
                      <Clock className="w-4 h-4" />
                      <span>Date limite: {formatDate(step.deadline)}</span>
                    </div>
                  )}

                  {step.progress !== undefined && step.progress > 0 && step.progress < 100 && (
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Progression de l'étape</span>
                        <span className="text-xs text-muted-foreground">{step.progress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${step.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {step.details && step.details.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {step.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className={`mt-1 ${isCompleted ? 'text-success-600' : isCurrent ? 'text-primary-600' : 'text-muted-foreground'}`}>•</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
