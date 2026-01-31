/**
 * Workflow Builder Component
 * Visual workflow builder for automation
 */
'use client';
import { useState } from 'react';
import { clsx } from 'clsx';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import type { SelectOption } from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import { Save, Play, Plus, Trash2, Workflow, Zap, CheckCircle } from '@/lib/icons';

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition';
  label: string;
  config?: Record<string, unknown>;
  position?: { x: number; y: number };
}

export interface Workflow {
  id?: string;
  name: string;
  description?: string;
  enabled: boolean;
  nodes: WorkflowNode[];
  connections: Array<{ from: string; to: string }>;
}

export interface WorkflowBuilderProps {
  workflow?: Workflow;
  onSave?: (workflow: Workflow) => void | Promise<void>;
  onTest?: (workflow: Workflow) => void | Promise<void>;
  className?: string;
}

// Template placeholder - Available for future use when implementing dynamic node type selection
// Dynamic node type selection UI - implement when workflow builder is fully developed
export const nodeTypes: SelectOption[] = [
  { label: 'Trigger', value: 'trigger' },
  { label: 'Action', value: 'action' },
  { label: 'Condition', value: 'condition' },
];

const triggerOptions: SelectOption[] = [
  { label: 'User Created', value: 'user.created' },
  { label: 'Payment Received', value: 'payment.received' },
  { label: 'Form Submitted', value: 'form.submitted' },
  { label: 'Schedule', value: 'schedule' },
];

const actionOptions: SelectOption[] = [
  { label: 'Send Email', value: 'email.send' },
  { label: 'Create Record', value: 'record.create' },
  { label: 'Update Record', value: 'record.update' },
  { label: 'Send Notification', value: 'notification.send' },
];

export default function WorkflowBuilder({
  workflow,
  onSave,
  onTest,
  className,
}: WorkflowBuilderProps) {
  const [formData, setFormData] = useState<Workflow>({
    name: workflow?.name || '',
    description: workflow?.description || '',
    enabled: workflow?.enabled ?? false,
    nodes:
      workflow?.nodes || [
        {
          id: 'trigger-1',
          type: 'trigger',
          label: 'User Created',
          config: {
            event: 'user.created',
          },
        },
      ],
    connections: workflow?.connections || [],
  });

  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAddNode = (type: WorkflowNode['type']) => {
    const newNode: WorkflowNode = {
      id: `${type}-${Date.now()}`,
      type,
      label:
        type === 'trigger'
          ? 'New Trigger'
          : type === 'action'
            ? 'New Action'
            : 'New Condition',
      config: {},
    };
    setFormData((prev) => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
    }));
    setSelectedNode(newNode);
  };

  const handleDeleteNode = (nodeId: string) => {
    setFormData((prev) => ({
      ...prev,
      nodes: prev.nodes.filter((n) => n.id !== nodeId),
      connections: prev.connections.filter((c) => c.from !== nodeId && c.to !== nodeId),
    }));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  };

  const handleNodeConfigChange = (nodeId: string, field: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              config: {
                ...n.config,
                [field]: value,
              },
            }
          : n
      ),
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    setLoading(true);
    try {
      await onSave?.(formData);
    } finally {
      setLoading(false);
    }
  };

  const getNodeIcon = (type: WorkflowNode['type']) => {
    switch (type) {
      case 'trigger':
        return <Zap className="w-4 h-4" />;
      case 'action':
        return <Play className="w-4 h-4" />;
      case 'condition':
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getNodeColor = (type: WorkflowNode['type']) => {
    switch (type) {
      case 'trigger':
        return 'bg-primary-100 dark:bg-primary-900/30 border-primary-300 dark:border-primary-700';
      case 'action':
        return 'bg-success-100 dark:bg-success-900/30 border-success-300 dark:border-success-700';
      case 'condition':
        return 'bg-warning-100 dark:bg-warning-900/30 border-warning-300 dark:border-warning-700';
    }
  };

  return (
    <Card className={clsx('bg-background', className)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Workflow className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h3 className="text-lg font-semibold text-foreground"> Workflow Builder </h3>
          </div>
          <div className="flex items-center gap-2">
            {onTest && (
              <Button variant="outline" onClick={() => onTest(formData)}>
                {' '}
                <Play className="w-4 h-4 mr-2" /> Test{' '}
              </Button>
            )}
            <Button variant="primary" onClick={handleSave} loading={loading}>
              {' '}
              <Save className="w-4 h-4 mr-2" /> Save Workflow{' '}
            </Button>
          </div>
        </div>

        {/* Workflow Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Workflow Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="My Workflow"
            required
          />
          <Input
            label="Description (Optional)"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe what this workflow does"
          />
        </div>

        {/* Workflow Canvas */}
        <div className="border-2 border-dashed border-border rounded-lg p-6 min-h-[400px] bg-muted/50">
          {formData.nodes.length === 0 ? (
            <div className="text-center py-12">
              <Workflow className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No nodes in workflow</p>
              <Button variant="primary" onClick={() => handleAddNode('trigger')}>
                {' '}
                <Plus className="w-4 h-4 mr-2" /> Add Trigger{' '}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.nodes.map((node) => (
                <div
                  key={node.id}
                  className={clsx(
                    'p-4 border-2 rounded-lg cursor-pointer transition-all',
                    getNodeColor(node.type),
                    selectedNode?.id === node.id &&
                      'ring-2 ring-primary-500 dark:ring-primary-400'
                  )}
                  onClick={() => setSelectedNode(node)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getNodeIcon(node.type)}
                      <span className="font-medium text-foreground"> {node.label} </span>
                      <Badge variant="default" className="text-xs px-2 py-0.5">
                        {' '}
                        {node.type}{' '}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNode(node.id);
                      }}
                    >
                      {' '}
                      <Trash2 className="w-4 h-4" />{' '}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Node Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Add:</span>
          <Button variant="outline" size="sm" onClick={() => handleAddNode('trigger')}>
            {' '}
            <Plus className="w-4 h-4 mr-2" /> Trigger{' '}
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleAddNode('action')}>
            {' '}
            <Plus className="w-4 h-4 mr-2" /> Action{' '}
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleAddNode('condition')}>
            {' '}
            <Plus className="w-4 h-4 mr-2" /> Condition{' '}
          </Button>
        </div>

        {/* Node Configuration */}
        {selectedNode && (
          <div className="p-4 bg-muted rounded-lg border border-border">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-foreground"> Configure {selectedNode.type} </h4>
              <Button variant="ghost" size="sm" onClick={() => setSelectedNode(null)}>
                {' '}
                Close{' '}
              </Button>
            </div>
            <div className="space-y-4">
              <Input
                label="Label"
                value={selectedNode.label}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    nodes: prev.nodes.map((n) =>
                      n.id === selectedNode.id ? { ...n, label: e.target.value } : n
                    ),
                  }));
                  setSelectedNode({ ...selectedNode, label: e.target.value });
                }}
              />
              {selectedNode.type === 'trigger' && (
                <Select
                  label="Trigger Event"
                  options={triggerOptions}
                  value={(selectedNode.config?.event as string) || ''}
                  onChange={(e) => handleNodeConfigChange(selectedNode.id, 'event', e.target.value)}
                />
              )}
              {selectedNode.type === 'action' && (
                <Select
                  label="Action Type"
                  options={actionOptions}
                  value={(selectedNode.config?.action as string) || ''}
                  onChange={(e) =>
                    handleNodeConfigChange(selectedNode.id, 'action', e.target.value)
                  }
                />
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
