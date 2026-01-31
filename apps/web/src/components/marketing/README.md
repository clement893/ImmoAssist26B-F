# Marketing Components

Components for marketing campaigns, lead capture, and newsletter management.

## 📦 Components

- **NewsletterSignup** - Newsletter subscription form
- **LeadCaptureForm** - Lead capture form with customizable fields

## 📖 Usage Examples

### Newsletter Signup

```tsx
import { NewsletterSignup } from '@/components/marketing';

<NewsletterSignup
  placeholder="Enter your email"
  buttonText="Subscribe"
  showNameFields={true}
  onSuccess={() => handleSuccess()}
  onError={(error) => handleError(error)}
/>;
```

### Lead Capture Form

```tsx
import { LeadCaptureForm } from '@/components/marketing';

<LeadCaptureForm
  title="Get Started"
  description="Fill out the form below"
  fields={['name', 'email', 'phone', 'company']}
  onSubmit={async (data) => await captureLead(data)}
/>;
```

## 🎨 Features

- **Email Collection**: Collect email addresses
- **Custom Fields**: Customizable form fields
- **Validation**: Form validation
- **Success/Error States**: Visual feedback
- **Source Tracking**: Track lead sources
- **Integration Ready**: Ready for marketing automation tools

## 🔧 Configuration

### NewsletterSignup

- `placeholder`: Input placeholder text
- `buttonText`: Submit button text
- `showNameFields`: Show first/last name fields
- `source`: Source tracking identifier
- `onSuccess`: Success callback
- `onError`: Error callback

### LeadCaptureForm

- `title`: Form title
- `description`: Form description
- `fields`: Array of field names ('name', 'email', 'phone', 'company', 'message')
- `source`: Source tracking identifier
- `onSubmit`: Submit callback

## 🔗 Related Components

- See `/components/forms` for form components
- See `/components/ui` for base UI components
