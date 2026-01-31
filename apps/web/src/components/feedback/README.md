# Feedback Components

Components for collecting and managing user feedback.

## 📦 Components

- **FeedbackForm** - Form for submitting feedback
- **FeedbackList** - Display and manage feedback submissions

## 📖 Usage Examples

### Feedback Form

```tsx
import { FeedbackForm } from '@/components/feedback';

<FeedbackForm onSubmit={async (feedback) => await submitFeedback(feedback)} />;
```

### Feedback List

```tsx
import { FeedbackList } from '@/components/feedback';

<FeedbackList
  feedback={feedbackList}
  onFeedbackUpdate={async (id, status) => await updateStatus(id, status)}
/>;
```

## 🎨 Features

- **Multiple Types**: Support for bug reports, feature requests, general feedback
- **Attachments**: Attach files or screenshots
- **Status Tracking**: Track feedback status (new, in-progress, resolved)
- **Priority Levels**: Set priority levels
- **Response System**: Respond to feedback
- **Voting**: Users can vote on feedback items

## 🔧 Configuration

### FeedbackForm

- `onSubmit`: Submit callback
- `type`: Feedback type (optional)
- `entityType`: Related entity type (optional)
- `entityId`: Related entity ID (optional)

### FeedbackList

- `feedback`: Array of feedback objects
- `onFeedbackUpdate`: Update callback
- `filters`: Filter options

## 🔗 Related Components

- See `/components/forms` for form components
- See `/components/ui` for base UI components
