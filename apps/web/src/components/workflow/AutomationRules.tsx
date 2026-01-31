/**
 * Automation Rules Component
 * Configure automation rules and conditions
 */
'use client';
import { useState } from 'react';
import { clsx } from 'clsx';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import type { SelectOption } from '@/components/ui/Select';
import Switch from '@/components/ui/Switch';
import Badge from '@/components/ui/Badge';
import { Plus, Trash2, Zap, Settings } from '@/lib/icons';
import { logger } from '@/lib/logger';
export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  trigger: {
    event: string;
    conditions?: Array<{ field: string; operator: string; value: string }>;
  };
  actions: Array<{ type: string; config: Record<string, unknown> }>;
  createdAt: string;
  lastTriggered?: string;
  triggerCount: number;
}
export interface AutomationRulesProps {
  rules?: AutomationRule[];
  onCreate?: (
    rule: Omit<AutomationRule, 'id' | 'createdAt' | 'triggerCount'>
  ) => Promise<AutomationRule>;
  onUpdate?: (id: string, rule: Partial<AutomationRule>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onToggle?: (id: string, enabled: boolean) => Promise<void>;
  className?: string;
}
const eventOptions: SelectOption[] = [
  { label: 'User Created', value: 'user.created' },
  { label: 'User Updated', value: 'user.updated' },
  { label: 'Payment Received', value: 'payment.received' },
  { label: 'Form Submitted', value: 'form.submitted' },
  { label: 'File Uploaded', value: 'file.uploaded' },
];

// Template placeholders - These will be used when implementing conditions and actions UI
// Automation rules UI - implement when automation features are fully developed
export const operatorOptions: SelectOption[] = [
  { label: 'Equals', value: 'equals' },
  { label: 'Not Equals', value: 'not_equals' },
  { label: 'Contains', value: 'contains' },
  { label: 'Greater Than', value: 'greater_than' },
  { label: 'Less Than', value: 'less_than' },
];

export const actionTypeOptions: SelectOption[] = [
  { label: 'Send Email', value: 'email.send' },
  { label: 'Send Notification', value: 'notification.send' },
  { label: 'Create Record', value: 'record.create' },
  { label: 'Update Record', value: 'record.update' },
  { label: 'Call Webhook', value: 'webhook.call' },
];

export default function AutomationRules({
  rules = [],
  onCreate,
  onUpdate,
  onDelete,
  onToggle,
  className,
}: AutomationRulesProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [formData, setFormData] = useState<Omit<AutomationRule, 'id' | 'createdAt' | 'triggerCount'>>({
    name: '',
    description: '',
    enabled: true,
    trigger: {
      event: '',
      conditions: [],
    },
    actions: [],
  });
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    // Edge case: Validate form data
    const trimmedName = formData.name?.trim() || '';
    if (!trimmedName) {
      logger.warn('Cannot create rule: name is required');
      return;
    }
    if (!formData.trigger?.event) {
      logger.warn('Cannot create rule: trigger event is required');
      return;
    }
    if (!formData.actions || formData.actions.length === 0) {
      logger.warn('Cannot create rule: at least one action is required');
      return;
    }
    // Edge case: Validate name length
    if (trimmedName.length > 255) {
      logger.warn('Cannot create rule: name exceeds maximum length');
      return;
    }

    setLoading(true);
    try {
      await onCreate?.(formData);
      setShowCreateModal(false);
      setFormData({
        name: '',
        description: '',
        enabled: true,
        trigger: {
          event: '',
          conditions: [],
        },
        actions: [],
      });
    } catch (error: unknown) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to create rule', errorObj);
      // Edge case: Don't close modal on error so user can retry
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this automation rule?')) return;

    try {
      await onDelete?.(id);
    } catch (error: unknown) {
      logger.error('Failed to delete rule', error instanceof Error ? error : new Error(String(error)));
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await onToggle?.(id, enabled);
    } catch (error: unknown) {
      logger.error('Failed to toggle rule', error instanceof Error ? error : new Error(String(error)));
    }
  };

  return (
    <>
      <Card className={clsx('bg-background', className)}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Automation Rules
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Configure rules to automate your workflows</p>
          </div>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Rule
          </Button>
        </div>

        {rules.length === 0 ? (
          <div className="text-center py-12">
            <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No automation rules configured</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rules.map((rule) => (
              <div key={rule.id} className="p-4 border border-border rounded-lg bg-muted">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-foreground">{rule.name}</h4>
                      {rule.enabled ? (
                        <Badge variant="success">Enabled</Badge>
                      ) : (
                        <Badge variant="default">Disabled</Badge>
                      )}
                    </div>
                    {rule.description && (
                      <p className="text-sm text-muted-foreground mb-2">{rule.description}</p>
                    )}
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Trigger:</span> {rule.trigger.event}
                      </div>
                      <div>
                        <span className="font-medium">Actions:</span> {rule.actions.map((a) => a.type).join(', ')}
                      </div>
                      {rule.lastTriggered && (
                        <div>
                          <span className="font-medium">Last Triggered:</span>{' '}
                          {new Date(rule.lastTriggered).toLocaleString()}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Triggered:</span> {rule.triggerCount} times
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={rule.enabled} onChange={(e) => handleToggle(rule.id, e.target.checked)} />
                    <Button variant="ghost" size="sm" onClick={() => setEditingRule(rule)}>
                      <Settings className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(rule.id)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingRule) && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-background">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  {editingRule ? 'Edit Rule' : 'Create Automation Rule'}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingRule(null);
                  }}
                >
                  Close
                </Button>
              </div>

              <Input
                label="Rule Name"
                value={editingRule?.name || formData.name}
                onChange={(e) =>
                  editingRule
                    ? setEditingRule({ ...editingRule, name: e.target.value })
                    : setFormData({ ...formData, name: e.target.value })
                }
                placeholder="My Automation Rule"
                required
              />

              <Input
                label="Description (Optional)"
                value={editingRule?.description || formData.description || ''}
                onChange={(e) =>
                  editingRule
                    ? setEditingRule({ ...editingRule, description: e.target.value })
                    : setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe what this rule does"
              />

              <Select
                label="Trigger Event"
                options={eventOptions}
                value={editingRule?.trigger.event || formData.trigger.event}
                onChange={(e) =>
                  editingRule
                    ? setEditingRule({
                        ...editingRule,
                        trigger: { ...editingRule.trigger, event: e.target.value },
                      })
                    : setFormData({
                        ...formData,
                        trigger: { ...formData.trigger, event: e.target.value },
                      })
                }
                required
              />

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingRule(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={async () => {
                    if (editingRule) {
                      await onUpdate?.(editingRule.id, editingRule);
                      setEditingRule(null);
                    } else {
                      await handleCreate();
                    }
                  }}
                  loading={loading}
                >
                  {editingRule ? 'Update Rule' : 'Create Rule'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
