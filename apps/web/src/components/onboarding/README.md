# Onboarding Components

Components for user onboarding flows and setup wizards.

## 📦 Components

- **OnboardingWizard** - Multi-step onboarding wizard
- **WelcomeScreen** - Welcome screen for new users
- **ProfileSetup** - Profile setup step
- **PreferencesSetup** - Preferences setup step
- **TeamSetup** - Team setup step
- **OnboardingComplete** - Completion screen

## 📖 Usage Examples

### Onboarding Wizard

```tsx
import { OnboardingWizard } from '@/components/onboarding';

<OnboardingWizard steps={onboardingSteps} onComplete={async () => await completeOnboarding()} />;
```

### Welcome Screen

```tsx
import { WelcomeScreen } from '@/components/onboarding';

<WelcomeScreen userName="John" onGetStarted={() => handleGetStarted()} />;
```

### Profile Setup

```tsx
import { ProfileSetup } from '@/components/onboarding';

<ProfileSetup onNext={async (data) => await saveProfile(data)} onSkip={() => handleSkip()} />;
```

## 🎨 Features

- **Multi-Step Flow**: Guided multi-step onboarding
- **Progress Tracking**: Visual progress indicator
- **Skip Options**: Allow users to skip steps
- **Data Persistence**: Save progress between steps
- **Customizable Steps**: Configure onboarding steps
- **Completion Tracking**: Track onboarding completion

## 🔧 Configuration

### OnboardingWizard

- `steps`: Array of onboarding step objects
- `onComplete`: Completion callback
- `onStepChange`: Step change callback

### WelcomeScreen

- `userName`: User's name
- `onGetStarted`: Get started callback

### ProfileSetup

- `onNext`: Next step callback
- `onSkip`: Skip callback
- `initialData`: Initial profile data

## 🔗 Related Components

- See `/components/profile` for profile components
- See `/components/ui` for base UI components
