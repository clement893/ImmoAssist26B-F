# Scheduled Tasks Components

Components for managing scheduled tasks and background jobs.

## 📦 Components

- **TaskManager** - Manage scheduled tasks

## 📖 Usage Examples

### Task Manager

```tsx
import { TaskManager } from '@/components/scheduled-tasks';

<TaskManager
  tasks={scheduledTasks}
  onTaskCreate={async (task) => await createTask(task)}
  onTaskUpdate={async (id, task) => await updateTask(id, task)}
  onTaskDelete={async (id) => await deleteTask(id)}
/>;
```

## 🎨 Features

- **Task Scheduling**: Schedule tasks to run at specific times
- **Recurring Tasks**: Set up recurring tasks
- **Task Status**: Track task execution status
- **Task History**: View task execution history
- **Task Logs**: View task execution logs
- **Task Management**: Create, update, and delete tasks

## 🔧 Configuration

### TaskManager

- `tasks`: Array of task objects
- `onTaskCreate`: Create callback
- `onTaskUpdate`: Update callback
- `onTaskDelete`: Delete callback

## 🔗 Related Components

- See `/components/content` for ScheduledContentManager
- See `/components/ui` for base UI components
