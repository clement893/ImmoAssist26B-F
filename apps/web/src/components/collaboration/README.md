# Collaboration Components

Components for real-time collaboration, comments, and mentions.

## 📦 Components

- **Comments** - Comment system with threading
- **CommentThread** - Individual comment thread
- **Mentions** - User mention functionality
- **CollaborationPanel** - Real-time collaboration panel

## 📖 Usage Examples

### Comments

```tsx
import { Comments } from '@/components/collaboration';

<Comments
  entityType="post"
  entityId={123}
  comments={commentsList}
  onCommentAdd={(comment) => handleAddComment(comment)}
/>;
```

### Mentions

```tsx
import { Mentions } from '@/components/collaboration';

<Mentions users={userList} onMention={(user) => handleMention(user)} />;
```

### Collaboration Panel

```tsx
import { CollaborationPanel } from '@/components/collaboration';

<CollaborationPanel collaborators={collaboratorsList} onInvite={(email) => handleInvite(email)} />;
```

## 🎨 Features

- **Threaded Comments**: Nested comment threads
- **Real-time Updates**: Live collaboration updates
- **User Mentions**: @mention functionality
- **Presence Indicators**: See who's online
- **Permissions**: Role-based access control
- **Notifications**: Comment and mention notifications

## 🔧 Configuration

### Comments

- `entityType`: Type of entity being commented on
- `entityId`: ID of the entity
- `comments`: Array of comment objects
- `onCommentAdd`: Add comment callback

### Mentions

- `users`: Array of users available for mention
- `onMention`: Mention callback

### CollaborationPanel

- `collaborators`: Array of collaborator objects
- `onInvite`: Invite callback

## 🔗 Related Components

- See `/components/ui` for base UI components
- See `/components/rbac` for permissions
