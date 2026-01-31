/** * Webhook Manager Component * Manage webhook endpoints and configurations * Note: This is similar to WebhooksSettings but focused on management UI */ 'use client';
import { useState } from 'react';
import { clsx } from 'clsx';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Switch from '@/components/ui/Switch';
import { Plus, Webhook, Trash2, CheckCircle, Activity } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { logger } from '@/lib/logger';
export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
  createdAt: string;
  lastTriggered?: string;
  successCount: number;
  failureCount: number;
  lastStatus?: 'success' | 'failure';
}
export interface WebhookManagerProps {
  webhooks?: Webhook[];
  onCreate?: (data: { name: string; url: string; events: string[] }) => Promise<Webhook>;
  onUpdate?: (id: string, data: Partial<Webhook>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onToggle?: (id: string, active: boolean) => Promise<void>;
  onTest?: (id: string) => Promise<void>;
  className?: string;
}
const availableEvents = [
  { id: 'user.created', label: 'User Created' },
  { id: 'user.updated', label: 'User Updated' },
  { id: 'user.deleted', label: 'User Deleted' },
  { id: 'payment.succeeded', label: 'Payment Succeeded' },
  { id: 'payment.failed', label: 'Payment Failed' },
  { id: 'subscription.created', label: 'Subscription Created' },
  { id: 'subscription.updated', label: 'Subscription Updated' },
  { id: 'subscription.cancelled', label: 'Subscription Cancelled' },
];
export default function WebhookManager({
  webhooks = [],
  onCreate,
  onUpdate: _onUpdate,
  onDelete,
  onToggle,
  onTest,
  className,
}: WebhookManagerProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', url: '', events: [] as string[] });
  const [loading, setLoading] = useState(false);
  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.url.trim() || formData.events.length === 0) return;
    setLoading(true);
    try {
      await onCreate?.(formData);
      setShowCreateModal(false);
      setFormData({ name: '', url: '', events: [] });
    } catch (error: unknown) {
      logger.error('Failed to create webhook', error instanceof Error ? error : undefined);
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;
    try {
      await onDelete?.(id);
    } catch (error: unknown) {
      logger.error('Failed to delete webhook', error instanceof Error ? error : undefined);
    }
  };
  const handleToggle = async (id: string, active: boolean) => {
    try {
      await onToggle?.(id, active);
    } catch (error: unknown) {
      logger.error('Failed to toggle webhook', error instanceof Error ? error : undefined);
    }
  };
  const getSuccessRate = (webhook: Webhook) => {
    const total = webhook.successCount + webhook.failureCount;
    if (total === 0) return 100;
    return Math.round((webhook.successCount / total) * 100);
  };
  return (
    <>
      {' '}
      <Card className={clsx('bg-background', className)}>
        {' '}
        <div className="flex items-center justify-between mb-6">
          {' '}
          <div>
            {' '}
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              {' '}
              <Webhook className="w-5 h-5" /> Webhook Manager{' '}
            </h3>{' '}
            <p className="text-sm text-muted-foreground mt-1">
              {' '}
              Manage webhook endpoints and monitor delivery status{' '}
            </p>{' '}
          </div>{' '}
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            {' '}
            <span className="flex items-center gap-2">
              {' '}
              <Plus className="w-4 h-4" /> Create Webhook{' '}
            </span>{' '}
          </Button>{' '}
        </div>{' '}
        {webhooks.length === 0 ? (
          <div className="text-center py-12">
            {' '}
            <Webhook className="w-12 h-12 text-muted-foreground mx-auto mb-4" />{' '}
            <p className="text-muted-foreground">No webhooks configured</p>{' '}
          </div>
        ) : (
          <div className="space-y-4">
            {' '}
            {webhooks.map((webhook) => (
              <div key={webhook.id} className="p-4 border border-border rounded-lg bg-muted">
                {' '}
                <div className="flex items-start justify-between">
                  {' '}
                  <div className="flex-1">
                    {' '}
                    <div className="flex items-center gap-2 mb-2">
                      {' '}
                      <span className="font-medium text-foreground"> {webhook.name} </span>{' '}
                      {webhook.active ? (
                        <Badge variant="success">
                          {' '}
                          <span className="flex items-center gap-1">
                            {' '}
                            <CheckCircle className="w-3 h-3" /> Active{' '}
                          </span>{' '}
                        </Badge>
                      ) : (
                        <Badge variant="default">Inactive</Badge>
                      )}{' '}
                      {webhook.lastStatus && (
                        <Badge variant={webhook.lastStatus === 'success' ? 'success' : 'error'}>
                          {' '}
                          {webhook.lastStatus === 'success' ? 'Last: Success' : 'Last: Failed'}{' '}
                        </Badge>
                      )}{' '}
                    </div>{' '}
                    <div className="text-sm text-muted-foreground mb-2 font-mono">
                      {' '}
                      {webhook.url}{' '}
                    </div>{' '}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                      {' '}
                      <div className="flex items-center gap-1">
                        {' '}
                        <Activity className="w-3 h-3" /> Success: {webhook.successCount} (
                        {getSuccessRate(webhook)}%){' '}
                      </div>{' '}
                      {webhook.failureCount > 0 && (
                        <div className="text-danger-600 dark:text-danger-400">
                          {' '}
                          Failures: {webhook.failureCount}{' '}
                        </div>
                      )}{' '}
                      {webhook.lastTriggered && (
                        <div> Last: {new Date(webhook.lastTriggered).toLocaleString()} </div>
                      )}{' '}
                    </div>{' '}
                    <div className="flex items-center gap-2 flex-wrap">
                      {' '}
                      {webhook.events.map((event) => (
                        <Badge key={event} variant="info">
                          {' '}
                          {event}{' '}
                        </Badge>
                      ))}{' '}
                    </div>{' '}
                  </div>{' '}
                  <div className="flex items-center gap-2">
                    {' '}
                    <Switch
                      checked={webhook.active}
                      onChange={(e) => handleToggle(webhook.id, e.target.checked)}
                    />{' '}
                    {onTest && (
                      <Button variant="ghost" size="sm" onClick={() => onTest(webhook.id)}>
                        {' '}
                        <span className="flex items-center gap-2">
                          {' '}
                          <Activity className="w-4 h-4" /> Test{' '}
                        </span>{' '}
                      </Button>
                    )}{' '}
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(webhook.id)}>
                      {' '}
                      <span className="flex items-center gap-2">
                        {' '}
                        <Trash2 className="w-4 h-4" /> Delete{' '}
                      </span>{' '}
                    </Button>{' '}
                  </div>{' '}
                </div>{' '}
              </div>
            ))}{' '}
          </div>
        )}{' '}
      </Card>{' '}
      {/* Create Webhook Modal */}{' '}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setFormData({ name: '', url: '', events: [] });
        }}
        title="Create Webhook"
        size="lg"
      >
        {' '}
        <div className="space-y-4">
          {' '}
          <div>
            {' '}
            <label className="block text-sm font-medium text-foreground mb-2">
              {' '}
              Webhook Name{' '}
            </label>{' '}
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="My Webhook"
              className={clsx(
                'w-full px-4 py-2 border rounded-lg',
                'bg-background',
                'text-foreground',
                'border-border',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400'
              )}
            />{' '}
          </div>{' '}
          <div>
            {' '}
            <label className="block text-sm font-medium text-foreground mb-2">
              {' '}
              Webhook URL{' '}
            </label>{' '}
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://example.com/webhook"
              className={clsx(
                'w-full px-4 py-2 border rounded-lg',
                'bg-background',
                'text-foreground',
                'border-border',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400'
              )}
            />{' '}
          </div>{' '}
          <div>
            {' '}
            <label className="block text-sm font-medium text-foreground mb-2">
              {' '}
              Events to Subscribe{' '}
            </label>{' '}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {' '}
              {availableEvents.map((event) => (
                <label
                  key={event.id}
                  className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted dark:hover:bg-muted"
                >
                  {' '}
                  <input
                    type="checkbox"
                    checked={formData.events.includes(event.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, events: [...formData.events, event.id] });
                      } else {
                        setFormData({
                          ...formData,
                          events: formData.events.filter((e) => e !== event.id),
                        });
                      }
                    }}
                  />{' '}
                  <span className="text-sm text-foreground">{event.label}</span>{' '}
                </label>
              ))}{' '}
            </div>{' '}
          </div>{' '}
          <div className="flex items-center justify-end gap-3">
            {' '}
            <Button
              variant="ghost"
              onClick={() => {
                setShowCreateModal(false);
                setFormData({ name: '', url: '', events: [] });
              }}
            >
              {' '}
              Cancel{' '}
            </Button>{' '}
            <Button
              variant="primary"
              onClick={handleCreate}
              loading={loading}
              disabled={
                !formData.name.trim() || !formData.url.trim() || formData.events.length === 0
              }
            >
              {' '}
              Create Webhook{' '}
            </Button>{' '}
          </div>{' '}
        </div>{' '}
      </Modal>{' '}
    </>
  );
}
