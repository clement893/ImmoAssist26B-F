/** * Scheduled Content Manager Component * * Interface for managing scheduled content (posts, pages, etc.). * * @component */ 'use client';
import { useState } from 'react';
import { Card, DataTable, Button, Modal, Input, Textarea, Badge, Alert } from '@/components/ui';
import type { Column } from '@/components/ui/DataTable';
import { Plus, Edit, Trash2, Calendar, Play, Pause } from 'lucide-react';
export interface ScheduledContent extends Record<string, unknown> {
  id: number;
  name: string;
  description?: string;
  task_type: 'publish_post' | 'publish_page' | 'send_email' | 'custom';
  scheduled_at: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  recurrence?: string;
  content_id?: number;
  content_type?: string;
  created_at: string;
  updated_at: string;
}
export interface ScheduledContentManagerProps {
  scheduledContent?: ScheduledContent[];
  onScheduleCreate?: (
    schedule: Omit<ScheduledContent, 'id' | 'created_at' | 'updated_at'>
  ) => Promise<void>;
  onScheduleUpdate?: (id: number, schedule: Partial<ScheduledContent>) => Promise<void>;
  onScheduleDelete?: (id: number) => Promise<void>;
  onScheduleToggle?: (id: number) => Promise<void>;
  className?: string;
}
/** * Scheduled Content Manager Component * * Displays scheduled content in a DataTable with CRUD operations. */ export default function ScheduledContentManager({
  scheduledContent = [],
  onScheduleCreate,
  onScheduleUpdate,
  onScheduleDelete,
  onScheduleToggle,
  className,
}: ScheduledContentManagerProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduledContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    task_type: 'publish_post' as ScheduledContent['task_type'],
    scheduled_at: '',
    recurrence: '',
  });
  const columns: Column<ScheduledContent>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (_value: unknown, schedule: ScheduledContent) => (
        <div className="flex items-center gap-2">
          {' '}
          <Calendar className="w-4 h-4 text-muted-foreground" />{' '}
          <span className="font-medium text-foreground">{schedule.name}</span>{' '}
        </div>
      ),
    },
    {
      key: 'task_type',
      label: 'Type',
      sortable: true,
      render: (_value: unknown, schedule: ScheduledContent) => (
        <Badge variant="default">{schedule.task_type.replace('_', '')}</Badge>
      ),
    },
    {
      key: 'scheduled_at',
      label: 'Scheduled At',
      sortable: true,
      render: (_value: unknown, schedule: ScheduledContent) => (
        <span className="text-sm text-muted-foreground">
          {' '}
          {new Date(schedule.scheduled_at).toLocaleString()}{' '}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_value: unknown, schedule: ScheduledContent) => {
        const statusColors: Record<
          ScheduledContent['status'],
          'default' | 'success' | 'warning' | 'error'
        > = {
          pending: 'default',
          running: 'warning',
          completed: 'success',
          failed: 'error',
          cancelled: 'default',
        };
        return (
          <Badge variant={statusColors[schedule.status]}>
            {' '}
            {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}{' '}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_value: unknown, schedule: ScheduledContent) => (
        <div className="flex items-center gap-2">
          {' '}
          {schedule.status === 'pending' && onScheduleToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggle(schedule.id)}
              title="Run Now"
            >
              {' '}
              <Play className="w-4 h-4" />{' '}
            </Button>
          )}{' '}
          {schedule.status === 'running' && onScheduleToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggle(schedule.id)}
              title="Pause"
            >
              {' '}
              <Pause className="w-4 h-4" />{' '}
            </Button>
          )}{' '}
          <Button variant="ghost" size="sm" onClick={() => handleEdit(schedule)} title="Edit">
            {' '}
            <Edit className="w-4 h-4" />{' '}
          </Button>{' '}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(schedule.id)}
            title="Delete"
          >
            {' '}
            <Trash2 className="w-4 h-4 text-danger-600 dark:text-danger-400" />{' '}
          </Button>{' '}
        </div>
      ),
    },
  ];
  const handleCreate = () => {
    setFormData({
      name: '',
      description: '',
      task_type: 'publish_post',
      scheduled_at: '',
      recurrence: '',
    });
    setSelectedSchedule(null);
    setError(null);
    setIsCreateModalOpen(true);
  };
  const handleEdit = (schedule: ScheduledContent) => {
    setFormData({
      name: schedule.name,
      description: schedule.description || '',
      task_type: schedule.task_type,
      scheduled_at: schedule.scheduled_at,
      recurrence: schedule.recurrence || '',
    });
    setSelectedSchedule(schedule);
    setError(null);
    setIsEditModalOpen(true);
  };
  const handleToggle = async (id: number) => {
    try {
      if (onScheduleToggle) {
        await onScheduleToggle(id);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to toggle schedule');
    }
  };
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this scheduled content?')) {
      return;
    }
    try {
      if (onScheduleDelete) {
        await onScheduleDelete(id);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete schedule');
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      if (selectedSchedule && onScheduleUpdate) {
        await onScheduleUpdate(selectedSchedule.id, formData);
        setIsEditModalOpen(false);
      } else if (onScheduleCreate) {
        await onScheduleCreate({ ...formData, status: 'pending' });
        setIsCreateModalOpen(false);
      }
      setFormData({
        name: '',
        description: '',
        task_type: 'publish_post',
        scheduled_at: '',
        recurrence: '',
      });
      setSelectedSchedule(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save schedule');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className={className}>
      {' '}
      <Card title="Scheduled Content">
        {' '}
        <div className="mb-4 flex justify-end">
          {' '}
          <Button onClick={handleCreate} variant="primary">
            {' '}
            <Plus className="w-4 h-4 mr-2" /> Schedule Content{' '}
          </Button>{' '}
        </div>{' '}
        {error && (
          <div className="mb-4">
            {' '}
            <Alert variant="error" onClose={() => setError(null)}>
              {' '}
              {error}{' '}
            </Alert>{' '}
          </div>
        )}{' '}
        <DataTable
          data={scheduledContent}
          columns={columns}
          pageSize={10}
          searchable
          searchPlaceholder="Search scheduled content..."
        />{' '}
      </Card>{' '}
      {/* Create Modal */}{' '}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Schedule Content"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            {' '}
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isSubmitting}
            >
              {' '}
              Cancel{' '}
            </Button>{' '}
            <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
              {' '}
              {isSubmitting ? 'Scheduling...' : 'Schedule'}{' '}
            </Button>{' '}
          </div>
        }
      >
        {' '}
        <form onSubmit={handleSubmit} className="space-y-4">
          {' '}
          <div>
            {' '}
            <label className="block text-sm font-medium text-foreground mb-2"> Name * </label>{' '}
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Schedule name"
              required
            />{' '}
          </div>{' '}
          <div>
            {' '}
            <label className="block text-sm font-medium text-foreground mb-2">
              {' '}
              Task Type *{' '}
            </label>{' '}
            <select
              value={formData.task_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  task_type: e.target.value as ScheduledContent['task_type'],
                })
              }
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              required
            >
              {' '}
              <option value="publish_post">Publish Post</option>{' '}
              <option value="publish_page">Publish Page</option>{' '}
              <option value="send_email">Send Email</option>{' '}
              <option value="custom">Custom</option>{' '}
            </select>{' '}
          </div>{' '}
          <div>
            {' '}
            <label className="block text-sm font-medium text-foreground mb-2">
              {' '}
              Scheduled At *{' '}
            </label>{' '}
            <Input
              type="datetime-local"
              value={formData.scheduled_at}
              onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
              required
            />{' '}
          </div>{' '}
          <div>
            {' '}
            <label className="block text-sm font-medium text-foreground mb-2">
              {' '}
              Recurrence (optional){' '}
            </label>{' '}
            <select
              value={formData.recurrence}
              onChange={(e) => setFormData({ ...formData, recurrence: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            >
              {' '}
              <option value="">None (One-time)</option> <option value="daily">Daily</option>{' '}
              <option value="weekly">Weekly</option> <option value="monthly">Monthly</option>{' '}
              <option value="yearly">Yearly</option>{' '}
            </select>{' '}
          </div>{' '}
          <div>
            {' '}
            <label className="block text-sm font-medium text-foreground mb-2">
              {' '}
              Description{' '}
            </label>{' '}
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Schedule description..."
              rows={3}
            />{' '}
          </div>{' '}
        </form>{' '}
      </Modal>{' '}
      {/* Edit Modal */}{' '}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Scheduled Content"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            {' '}
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSubmitting}
            >
              {' '}
              Cancel{' '}
            </Button>{' '}
            <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
              {' '}
              {isSubmitting ? 'Saving...' : 'Save Changes'}{' '}
            </Button>{' '}
          </div>
        }
      >
        {' '}
        <form onSubmit={handleSubmit} className="space-y-4">
          {' '}
          <div>
            {' '}
            <label className="block text-sm font-medium text-foreground mb-2"> Name * </label>{' '}
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Schedule name"
              required
            />{' '}
          </div>{' '}
          <div>
            {' '}
            <label className="block text-sm font-medium text-foreground mb-2">
              {' '}
              Task Type *{' '}
            </label>{' '}
            <select
              value={formData.task_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  task_type: e.target.value as ScheduledContent['task_type'],
                })
              }
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              required
            >
              {' '}
              <option value="publish_post">Publish Post</option>{' '}
              <option value="publish_page">Publish Page</option>{' '}
              <option value="send_email">Send Email</option>{' '}
              <option value="custom">Custom</option>{' '}
            </select>{' '}
          </div>{' '}
          <div>
            {' '}
            <label className="block text-sm font-medium text-foreground mb-2">
              {' '}
              Scheduled At *{' '}
            </label>{' '}
            <Input
              type="datetime-local"
              value={formData.scheduled_at}
              onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
              required
            />{' '}
          </div>{' '}
          <div>
            {' '}
            <label className="block text-sm font-medium text-foreground mb-2">
              {' '}
              Recurrence (optional){' '}
            </label>{' '}
            <select
              value={formData.recurrence}
              onChange={(e) => setFormData({ ...formData, recurrence: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            >
              {' '}
              <option value="">None (One-time)</option> <option value="daily">Daily</option>{' '}
              <option value="weekly">Weekly</option> <option value="monthly">Monthly</option>{' '}
              <option value="yearly">Yearly</option>{' '}
            </select>{' '}
          </div>{' '}
          <div>
            {' '}
            <label className="block text-sm font-medium text-foreground mb-2">
              {' '}
              Description{' '}
            </label>{' '}
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Schedule description..."
              rows={3}
            />{' '}
          </div>{' '}
        </form>{' '}
      </Modal>{' '}
    </div>
  );
}
