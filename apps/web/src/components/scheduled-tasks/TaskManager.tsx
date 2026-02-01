'use client';
import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Clock, Play, Pause, Trash2, CheckCircle, XCircle, AlertCircle, Filter } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Checkbox from '@/components/ui/Checkbox';
import { apiClient } from '@/lib/api/client';
import { useToast } from '@/components/ui';
import { getErrorMessage } from '@/lib/errors';
import { clsx } from 'clsx';
interface ScheduledTask {
  id: number;
  name: string;
  description?: string;
  task_type: string;
  scheduled_at: string;
  recurrence?: string;
  status: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  created_at: string;
}
interface TaskManagerProps {
  className?: string;
}
const statusIcons = {
  pending: Clock,
  running: Play,
  completed: CheckCircle,
  failed: XCircle,
  cancelled: AlertCircle,
};
const statusColors = {
  pending: 'text-warning-600 dark:text-warning-400',
  running: 'text-primary-600 dark:text-primary-400',
  completed: 'text-success-600 dark:text-success-400',
  failed: 'text-error-600 dark:text-error-400',
  cancelled: 'text-muted-foreground',
};
export function TaskManager({ className = '' }: TaskManagerProps) {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [completingTasks, setCompletingTasks] = useState<Set<number>>(new Set());
  const { showToast } = useToast();
  useEffect(() => {
    fetchTasks();
  }, []);
  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<ScheduledTask[]>(
        '/api/v1/scheduled-tasks/scheduled-tasks'
      );
      if (response.data) {
        setTasks(response.data);
      }
    } catch (error) {
      logger.error('', 'Failed to fetch tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleCancel = async (taskId: number) => {
    try {
      await apiClient.post(`/v1/scheduled-tasks/${taskId}/cancel`);
      showToast({ message: 'Task cancelled successfully', type: 'success' });
      fetchTasks();
    } catch (error: unknown) {
      showToast({ message: getErrorMessage(error) || 'Failed to cancel task', type: 'error' });
    }
  };
  const handleDelete = async (taskId: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await apiClient.delete(`/v1/scheduled-tasks/${taskId}`);
      showToast({ message: 'Task deleted successfully', type: 'success' });
      fetchTasks();
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Failed to delete task';
      showToast({ message: errorMessage, type: 'error' });
    }
  };
  if (isLoading) {
    return (
      <Card className={className}>
        {' '}
        <div className="text-center py-8 text-muted-foreground">Loading tasks...</div>{' '}
      </Card>
    );
  }
  // Filter tasks based on completion status
  const filteredTasks = tasks.filter((task) => {
    const isCompleted = task.status === 'completed';
    if (isCompleted && !showCompleted) {
      return false;
    }
    return true;
  });

  // Handle task completion animation
  const handleTaskComplete = (taskId: number) => {
    setCompletingTasks((prev) => new Set(prev).add(taskId));
    
    // After animation completes, update task status
    setTimeout(() => {
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, status: 'completed', completed_at: new Date().toISOString() } : task
        )
      );
      setCompletingTasks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }, 500); // Animation duration
  };

  return (
    <Card className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5" /> Scheduled Tasks
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Checkbox
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              label="Afficher les tâches complétées"
            />
          </div>
          <Button variant="primary" size="sm">
            New Task
          </Button>
        </div>
      </div>
      {filteredTasks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p>
            {tasks.length === 0
              ? 'No scheduled tasks'
              : showCompleted
                ? 'No tasks match the current filter'
                : 'No active tasks. Enable "Show completed" to see completed tasks.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const StatusIcon = statusIcons[task.status as keyof typeof statusIcons] || Clock;
            const statusColor =
              statusColors[task.status as keyof typeof statusColors] || 'text-muted-foreground';
            const isCompleting = completingTasks.has(task.id);
            const isCompleted = task.status === 'completed';

            return (
              <div
                key={task.id}
                className={clsx(
                  'p-4 border border-border rounded-lg transition-modern', // UI Revamp - Transition moderne
                  isCompleting && 'animate-fade-out-slide-up opacity-0 scale-95 -translate-y-2 pointer-events-none',
                  isCompleted && !showCompleted && 'hidden'
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusIcon className={`h-4 w-4 ${statusColor}`} />
                      <span className="font-medium">{task.name}</span>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded capitalize">
                        {task.task_type.replace('_', '')}
                      </span>
                      {task.recurrence && (
                        <span className="text-xs bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-2 py-0.5 rounded">
                          {task.recurrence}
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Scheduled: {new Date(task.scheduled_at).toLocaleString()}</span>
                      {task.completed_at && (
                        <span>Completed: {new Date(task.completed_at).toLocaleString()}</span>
                      )}
                    </div>
                    {task.error_message && (
                      <div className="mt-2 p-2 bg-error-50 dark:bg-error-900/20 rounded text-sm text-error-600 dark:text-error-400">
                        {task.error_message}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {task.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleTaskComplete(task.id)}
                          className="p-1 hover:bg-success-50 dark:hover:bg-success-900/20 rounded text-success-500"
                          title="Mark as completed"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleCancel(task.id)}
                          className="p-1 hover:bg-warning-50 dark:hover:bg-warning-900/20 rounded text-warning-500"
                          title="Cancel"
                        >
                          <Pause className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="p-1 hover:bg-error-50 dark:hover:bg-error-900/20 rounded text-error-500"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
