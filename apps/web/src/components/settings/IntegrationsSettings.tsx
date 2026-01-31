/** * Integrations Settings Component * * Third-party integrations and connections management. * * @component */ 'use client';
import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Puzzle, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
export interface Integration {
  id: string;
  name: string;
  description: string;
  icon?: React.ReactNode;
  enabled: boolean;
  category: string;
}
export interface IntegrationsSettingsProps {
  integrations?: Integration[];
  onToggle?: (integrationId: string, enabled: boolean) => void | Promise<void>;
  className?: string;
}
/** * Integrations Settings Component * * Displays list of available integrations with toggle functionality. */ export default function IntegrationsSettings({
  integrations = [],
  onToggle,
  className,
}: IntegrationsSettingsProps) {
  const [localIntegrations, setLocalIntegrations] = useState<Integration[]>(integrations);
  const defaultIntegrations: Integration[] = [
    {
      id: 'slack',
      name: 'Slack',
      description: 'Connect with Slack for notifications and team collaboration',
      enabled: false,
      category: 'Communication',
    },
    {
      id: 'github',
      name: 'GitHub',
      description: 'Integrate with GitHub for code repository management',
      enabled: false,
      category: 'Development',
    },
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Payment processing and subscription management',
      enabled: false,
      category: 'Payment',
    },
    {
      id: 'sendgrid',
      name: 'SendGrid',
      description: 'Email delivery and marketing automation',
      enabled: false,
      category: 'Email',
    },
    {
      id: 'aws',
      name: 'AWS',
      description: 'Amazon Web Services integration for cloud resources',
      enabled: false,
      category: 'Cloud',
    },
  ];
  const displayIntegrations =
    localIntegrations.length > 0 ? localIntegrations : defaultIntegrations;
  const handleToggle = async (integrationId: string, enabled: boolean) => {
    if (onToggle) {
      await onToggle(integrationId, enabled);
    }
    setLocalIntegrations((prev) =>
      prev.map((int) => (int.id === integrationId ? { ...int, enabled } : int))
    );
  };
  const groupedIntegrations = displayIntegrations.reduce(
    (acc, integration) => {
      const category = integration.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(integration);
      return acc;
    },
    {} as Record<string, Integration[]>
  );
  return (
    <div className={className}>
      {' '}
      <Card title="Available Integrations">
        {' '}
        <div className="space-y-6">
          {' '}
          {Object.entries(groupedIntegrations).map(([category, categoryIntegrations]) => (
            <div key={category}>
              {' '}
              <h3 className="text-sm font-semibold text-foreground mb-3"> {category} </h3>{' '}
              <div className="space-y-3">
                {' '}
                {categoryIntegrations.map((integration) => (
                  <div
                    key={integration.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted dark:hover:bg-muted transition-colors"
                  >
                    {' '}
                    <div className="flex-1">
                      {' '}
                      <div className="flex items-center gap-3">
                        {' '}
                        {integration.icon || (
                          <Puzzle className="w-5 h-5 text-muted-foreground" />
                        )}{' '}
                        <div>
                          {' '}
                          <h4 className="font-medium text-foreground"> {integration.name} </h4>{' '}
                          <p className="text-sm text-muted-foreground">
                            {' '}
                            {integration.description}{' '}
                          </p>{' '}
                        </div>{' '}
                      </div>{' '}
                    </div>{' '}
                    <div className="flex items-center gap-3">
                      {' '}
                      {integration.enabled ? (
                        <span className="flex items-center gap-1 text-sm text-success-600 dark:text-success-400">
                          {' '}
                          <CheckCircle className="w-4 h-4" /> Enabled{' '}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          {' '}
                          <XCircle className="w-4 h-4" /> Disabled{' '}
                        </span>
                      )}{' '}
                      <Button
                        variant={integration.enabled ? 'outline' : 'primary'}
                        size="sm"
                        onClick={() => handleToggle(integration.id, !integration.enabled)}
                        disabled={!onToggle || isNaN(parseInt(integration.id, 10))}
                        title={
                          isNaN(parseInt(integration.id, 10))
                            ? 'Create an integration first to enable this feature'
                            : undefined
                        }
                      >
                        {' '}
                        {integration.enabled ? 'Disable' : 'Enable'}{' '}
                      </Button>{' '}
                      <Button variant="ghost" size="sm">
                        {' '}
                        <ExternalLink className="w-4 h-4 mr-1" /> Setup{' '}
                      </Button>{' '}
                    </div>{' '}
                  </div>
                ))}{' '}
              </div>{' '}
            </div>
          ))}{' '}
        </div>{' '}
      </Card>{' '}
    </div>
  );
}
