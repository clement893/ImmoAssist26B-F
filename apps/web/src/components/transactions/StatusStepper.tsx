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
    // Dashboard V2 Style - Transaction Detail Progress Bar
    const completedCount = steps.filter(s => s.status === 'completed').length;
    const progressPercentage = steps.length > 0 ? (completedCount / steps.length) * 100 : 0;
    
    return (
      <div className={`w-full ${className}`}>
        {/* Progress Bar - Dashboard V2 Style */}
        <div className="relative mb-12">
          {/* Background line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200"></div>
          {/* Progress line with gradient */}
          <div
            className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          ></div>

          {/* Steps */}
          <div className="relative flex justify-between">
            {steps.map((step, index) => {
              const isCompleted = step.status === 'completed';
              const isInProgress = step.status === 'current';
              const isPending = step.status === 'pending';
              
              return (
                <div key={step.id} className="flex flex-col items-center" style={{ width: `${100 / steps.length}%` }}>
                  {/* Step Circle - Dashboard V2 Style */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCompleted
                        ? 'bg-green-500 text-white shadow-lg shadow-green-200'
                        : isInProgress
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-200 ring-4 ring-blue-100'
                        : 'bg-white border-2 border-gray-200 text-gray-400'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : isInProgress ? (
                      <Clock className="w-5 h-5" />
                    ) : (
                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    )}
                  </div>
                  
                  {/* Step Labels - Dashboard V2 Style */}
                  <div className="mt-4 text-center">
                    <p
                      className={`text-xs font-medium mb-1 ${
                        isCompleted || isInProgress
                          ? 'text-gray-900'
                          : 'text-gray-400'
                      }`}
                    >
                      {step.title}
                    </p>
                    {step.date && (
                      <p className="text-xs text-gray-400">{formatDate(step.date)}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1 max-w-[100px] mx-auto">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Step Details - Dashboard V2 Style */}
        {steps.find(s => s.status === 'current') && (() => {
          const currentStep = steps.find(s => s.status === 'current')!;
          return (
            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    Current step: {currentStep.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {currentStep.description}
                  </p>
                  {currentStep.details && currentStep.details.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {currentStep.details.map((detail, idx) => (
                        <p key={idx} className="text-sm text-gray-600">• {detail}</p>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <button className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors">
                      View Details
                    </button>
                    {currentStep.deadline && (
                      <button className="px-4 py-2 bg-white text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                        Reschedule
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
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
              className="h-full bg-primary transition-modern" // UI Revamp - Transition moderne
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
                  {step.icon || getStepIcon(step)}
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
                          className="h-full bg-primary transition-modern" // UI Revamp - Transition moderne
                          style={{ width: `${step.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {step.details && step.details.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {step.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className={`mt-1 ${isCompleted ? 'text-success-600' : step.status === 'current' ? 'text-primary-600' : 'text-muted-foreground'}`}>•</span>
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
