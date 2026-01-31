# Profile Components

Components for user profile management and display.

## 📦 Components

- **ProfileCard** - Display user profile information
- **ProfileForm** - Form for editing user profile

## 📖 Usage Examples

### Profile Card

```tsx
import { ProfileCard } from '@/components/profile';

<ProfileCard user={userData} onEdit={() => handleEdit()} />;
```

### Profile Form

```tsx
import { ProfileForm } from '@/components/profile';

<ProfileForm
  user={userData}
  onSubmit={async (data) => await updateProfile(data)}
  isLoading={isLoading}
/>;
```

## 🎨 Features

- **Profile Display**: Show user profile information
- **Avatar Management**: Upload and manage avatars
- **Profile Editing**: Edit name, email, bio, etc.
- **Validation**: Form validation
- **Theme-Aware**: Supports light and dark modes
- **Accessible**: WCAG AA compliant

## 🔧 Configuration

### ProfileCard

- `user`: User object with profile data
- `onEdit`: Edit callback
- `showStats`: Show user statistics (optional)
- `className`: Additional CSS classes

### ProfileForm

- `user`: User object with initial data
- `onSubmit`: Form submission callback
- `isLoading`: Loading state
- `className`: Additional CSS classes

## 🔗 Related Components

- See `/components/ui` for Input, Button, Avatar components
- See `/components/onboarding` for ProfileSetup
