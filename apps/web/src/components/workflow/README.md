# Workflow Components

Components for building and managing automated workflows and automation rules.

## 📦 Components

- **WorkflowBuilder** - Visual workflow builder
- **AutomationRules** - Manage automation rules
- **TriggerManager** - Manage workflow triggers

## 📖 Usage Examples

### Workflow Builder

```tsx
import { WorkflowBuilder } from '@/components/workflow';

<WorkflowBuilder
  workflow={workflowData}
  onSave={async (workflow) => await saveWorkflow(workflow)}
/>;
```

### Automation Rules

```tsx
import { AutomationRules } from '@/components/workflow';

<AutomationRules
  rules={automationRules}
  onRuleCreate={async (rule) => await createRule(rule)}
  onRuleUpdate={async (id, rule) => await updateRule(id, rule)}
/>;
```

### Trigger Manager

```tsx
import { TriggerManager } from '@/components/workflow';

<TriggerManager
  triggers={triggersList}
  onTriggerCreate={async (trigger) => await createTrigger(trigger)}
/>;
```

## 🎨 Features

- **Visual Builder**: Drag-and-drop workflow builder
- **Automation Rules**: Create automation rules
- **Triggers**: Set up workflow triggers
- **Actions**: Define workflow actions
- **Conditions**: Conditional logic in workflows
- **Workflow Execution**: Execute and test workflows
- **Workflow History**: Track workflow execution history

## 🔧 Configuration

### WorkflowBuilder

- `workflow`: Workflow object
- `onSave`: Save callback
- `onExecute`: Execute callback

### AutomationRules

- `rules`: Array of automation rule objects
- `onRuleCreate`: Create callback
- `onRuleUpdate`: Update callback
- `onRuleDelete`: Delete callback

### TriggerManager

- `triggers`: Array of trigger objects
- `onTriggerCreate`: Create callback
- `onTriggerUpdate`: Update callback

## 🔗 Related Components

- See `/components/ui` for base UI components
- See `/components/scheduled-tasks` for scheduled tasks
