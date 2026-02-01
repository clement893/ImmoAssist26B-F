/** * Trigger Manager Component * Manage workflow triggers and events */ 'use client';
import { useState, useMemo } from 'react';
import { clsx } from 'clsx';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Switch from '@/components/ui/Switch';
import type { ColorVariant } from '@/components/ui/types';
import { Zap, Plus, Trash2, Edit, CheckCircle, Calendar, Database } from '@/lib/icons';
import { logger } from '@/lib/logger';
export interface Trigger {
  id: string;
  name: string;
  type: 'event' | 'schedule' | 'webhook' | 'manual';
  event?: string;
  schedule?: string;
  webhookUrl?: string;
  enabled: boolean;
  workflows: string[];
  lastTriggered?: string;
  triggerCount: number;
  createdAt: string;
}
export interface TriggerManagerProps {
  triggers?: Trigger[];
  onCreate?: (trigger: Omit<Trigger, 'id' | 'createdAt' | 'triggerCount'>) => Promise<Trigger>;
  onUpdate?: (id: string, trigger: Partial<Trigger>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onToggle?: (id: string, enabled: boolean) => Promise<void>;
  className?: string;
}
const triggerTypeIcons = {
  event: <Zap className="w-4 h-4" />,
  schedule: <Calendar className="w-4 h-4" />,
  webhook: <Database className="w-4 h-4" />,
  manual: <CheckCircle className="w-4 h-4" />,
};
const triggerTypeColors: Record<Trigger['type'], ColorVariant> = {
  event: 'info',
  schedule: 'warning',
  webhook: 'info',
  manual: 'success',
};
export default function TriggerManager({
  triggers = [],
  onCreate: _onCreate,
  onUpdate: _onUpdate,
  onDelete,
  onToggle,
  className,
}: TriggerManagerProps) {
  const [filter, setFilter] = useState<'all' | Trigger['type']>('all');
  const filteredTriggers = useMemo(() => {
    if (filter === 'all') return triggers;
    return triggers.filter((t) => t.type === filter);
  }, [triggers, filter]);
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this trigger?')) return;
    try {
      await onDelete?.(id);
    } catch (error: unknown) {
      logger.error(
        'Failed to delete trigger',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  };
  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await onToggle?.(id, enabled);
    } catch (error: unknown) {
      logger.error(
        'Failed to toggle trigger',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  };
  return (
    <Card className={clsx('bg-background', className)}>
      {' '}
      <div className="mb-6">
        {' '}
        <div className="flex items-center justify-between mb-4">
          {' '}
          <div>
            {' '}
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              {' '}
              <Zap className="w-5 h-5" /> Trigger Manager{' '}
            </h3>{' '}
            <p className="text-sm text-muted-foreground mt-1">
              {' '}
              Manage workflow triggers and events{' '}
            </p>{' '}
          </div>{' '}
          <Button variant="primary">
            {' '}
            <Plus className="w-4 h-4 mr-2" /> Create Trigger{' '}
          </Button>{' '}
        </div>{' '}
        {/* Filter */}{' '}
        <div className="flex items-center gap-2">
          {' '}
          <span className="text-sm text-muted-foreground">Filter:</span>{' '}
          {(['all', 'event', 'schedule', 'webhook', 'manual'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={clsx(
                'px-3 py-1 rounded-lg text-sm transition-modern', // UI Revamp - Transition moderne
                filter === type
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              )}
            >
              {' '}
              {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}{' '}
            </button>
          ))}{' '}
        </div>{' '}
      </div>{' '}
      {filteredTriggers.length === 0 ? (
        <div className="text-center py-12">
          {' '}
          <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />{' '}
          <p className="text-muted-foreground">No triggers found</p>{' '}
        </div>
      ) : (
        <div className="space-y-4">
          {' '}
          {filteredTriggers.map((trigger) => (
            <div key={trigger.id} className="p-4 border border-border rounded-lg bg-muted">
              {' '}
              <div className="flex items-start justify-between">
                {' '}
                <div className="flex-1">
                  {' '}
                  <div className="flex items-center gap-2 mb-2">
                    {' '}
                    <div className="text-primary-600 dark:text-primary-400">
                      {' '}
                      {triggerTypeIcons[trigger.type]}{' '}
                    </div>{' '}
                    <h4 className="font-semibold text-foreground"> {trigger.name} </h4>{' '}
                    <Badge variant={triggerTypeColors[trigger.type]}> {trigger.type} </Badge>{' '}
                    {trigger.enabled ? (
                      <Badge variant="success">
                        {' '}
                        <CheckCircle className="w-3 h-3 mr-1" /> Enabled{' '}
                      </Badge>
                    ) : (
                      <Badge variant="default">Disabled</Badge>
                    )}{' '}
                  </div>{' '}
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {' '}
                    {trigger.event && (
                      <div>
                        {' '}
                        <span className="font-medium">Event:</span> {trigger.event}{' '}
                      </div>
                    )}{' '}
                    {trigger.schedule && (
                      <div>
                        {' '}
                        <span className="font-medium">Schedule:</span> {trigger.schedule}{' '}
                      </div>
                    )}{' '}
                    {trigger.webhookUrl && (
                      <div>
                        {' '}
                        <span className="font-medium">Webhook:</span>
                        {''} <code className="text-xs">{trigger.webhookUrl}</code>{' '}
                      </div>
                    )}{' '}
                    <div>
                      {' '}
                      <span className="font-medium">Workflows:</span>{' '}
                      {trigger.workflows.length}{' '}
                    </div>{' '}
                    {trigger.lastTriggered && (
                      <div>
                        {' '}
                        <span className="font-medium">Last Triggered:</span>
                        {''} {new Date(trigger.lastTriggered).toLocaleString()}{' '}
                      </div>
                    )}{' '}
                    <div>
                      {' '}
                      <span className="font-medium">Total Triggers:</span>{' '}
                      {trigger.triggerCount}{' '}
                    </div>{' '}
                  </div>{' '}
                </div>{' '}
                <div className="flex items-center gap-2">
                  {' '}
                  <Switch
                    checked={trigger.enabled}
                    onChange={(e) => handleToggle(trigger.id, e.target.checked)}
                  />{' '}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => logger.info('Edit trigger:', { id: trigger.id })}
                  >
                    {' '}
                    <Edit className="w-4 h-4 mr-2" /> Edit{' '}
                  </Button>{' '}
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(trigger.id)}>
                    {' '}
                    <Trash2 className="w-4 h-4 mr-2" /> Delete{' '}
                  </Button>{' '}
                </div>{' '}
              </div>{' '}
            </div>
          ))}{' '}
        </div>
      )}{' '}
    </Card>
  );
}
