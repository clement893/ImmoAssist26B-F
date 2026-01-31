# Frontend - Next.js 16

Frontend application built with Next.js 16 and React 19.

## 🚀 Features

### Core Technologies

- ✅ **Next.js 16** with App Router and Server Components
- ✅ **React 19** with latest features
- ✅ **TypeScript 5** with strict configuration
- ✅ **Tailwind CSS 3** for styling
- ✅ **Zustand** for state management
- ✅ **Axios** for API calls
- ✅ **NextAuth.js v5** with Google OAuth
- ✅ **Zod** for schema validation

### UI Components Library

- ✅ **255+ Components** (96 UI components + 159 feature components)
- ✅ **Storybook** for component documentation
- ✅ **Dark Mode** support
- ✅ **Responsive Design** mobile-first
- ✅ **Accessibility** (ARIA, keyboard navigation)
- ✅ **Theme System** with dynamic color management

### Hooks & Utilities

- ✅ **useForm** - Form management with Zod validation
- ✅ **usePagination** - Automatic pagination
- ✅ **useFilters** - Advanced filtering system
- ✅ **usePermissions** - Role-based access control
- ✅ **useEmail** - SendGrid email integration
- ✅ **useAuth** - Authentication utilities

### Development Tools

- ✅ **Vitest** for unit testing
- ✅ **Playwright** for E2E testing
- ✅ **Storybook** for component development
- ✅ **ESLint** + **Prettier** for code quality
- ✅ **TypeScript** strict mode

## Installation

### Prerequisites

- Node.js 20.x or higher
- pnpm 9.x or higher

### Setup

1. Install dependencies:

```bash
npm install
# or
pnpm install
```

2. Create `.env.local` file:

```bash
cp .env.example .env.local
```

3. Update environment variables in `.env.local`

## Running Locally

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
src/
├── app/                      # Next.js App Router pages
│   ├── auth/                # Authentication pages
│   ├── dashboard/           # Dashboard pages
│   ├── components/          # Component gallery & theme manager
│   ├── email/               # Email testing pages
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   ├── error.tsx            # Error boundary
│   ├── loading.tsx          # Loading state
│   ├── not-found.tsx        # 404 page
│   └── globals.css          # Global styles
├── components/
│   ├── ui/                  # UI Component Library (30+ components)
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── DataTable.tsx
│   │   ├── Modal.tsx
│   │   ├── Form.tsx
│   │   ├── Drawer.tsx
│   │   ├── Autocomplete.tsx
│   │   ├── Stepper.tsx
│   │   ├── Popover.tsx
│   │   ├── TreeView.tsx
│   │   └── ... (30+ components)
│   ├── layout/              # Layout components
│   ├── errors/               # Error components
│   └── theme/                # Theme management
├── hooks/                    # Custom React hooks
│   ├── useForm.ts           # Form management
│   ├── usePagination.ts     # Pagination
│   ├── useFilters.ts        # Filtering
│   ├── usePermissions.ts    # RBAC
│   ├── useEmail.ts          # Email sending
│   ├── useAuth.ts           # Authentication
│   └── HOOKS.md             # Hooks documentation
├── lib/
│   ├── api/                 # API clients
│   │   ├── client.ts        # Main API client
│   │   └── email/           # Email API client
│   ├── email/               # Email utilities
│   │   └── client.ts        # SendGrid client
│   ├── utils/               # Utilities
│   │   └── color.ts         # Color palette generation
│   └── store.ts             # Zustand stores
└── public/                   # Static files
```

## Building

```bash
npm run build
npm start
```

## 🧪 Testing

### Unit Tests (Vitest)

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# With UI
pnpm test:ui

# Coverage
pnpm test:coverage
```

### E2E Tests (Playwright)

```bash
# Run E2E tests
pnpm test:e2e

# With UI
pnpm test:e2e:ui

# Debug mode
pnpm test:e2e:debug

# Install browsers (first time)
pnpm exec playwright install --with-deps
```

### Component Testing (Storybook)

```bash
# Start Storybook
pnpm storybook

# Build Storybook
pnpm build-storybook
```

Storybook will be available at `http://localhost:6006`

## ✅ Code Quality

### Linting

```bash
# Lint code
pnpm lint

# Auto-fix issues
pnpm lint --fix
```

### Type Checking

```bash
# Check TypeScript types
pnpm type-check
```

### Formatting

```bash
# Format code
pnpm format

# Check formatting
pnpm format:check
```

### Bundle Analysis

```bash
# Analyze bundle size
pnpm analyze

# Server bundle only
pnpm analyze:server

# Browser bundle only
pnpm analyze:browser
```

## 🔐 Environment Variables

### Required

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-change-in-production
```

### Optional

```env
# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Stripe (Frontend)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Sentry (Error Tracking)
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
SENTRY_DSN=your-sentry-dsn
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=your-token
```

> See `.env.example` for complete configuration options.

## 📄 Pages & Routes

### Public Pages

- `/` - Home page
- `/auth/login` - Login page
- `/auth/register` - Registration page
- `/docs` - Documentation

### Protected Pages

- `/dashboard` - Main dashboard
- `/components` - Component gallery & theme manager
- `/email/test` - Email testing interface
- `/pricing` - Subscription plans and pricing
- `/subscriptions` - Manage your subscription
- `/subscriptions/success` - Subscription success page

### System Pages

- `/404` - Not found page
- Error boundaries for error handling

## 🔌 API Integration

The frontend communicates with the backend FastAPI through the API client.

### Main API Client

```typescript
import { apiClient } from '@/lib/api/client';

// GET request
const users = await apiClient.get('/users');

// POST request
const user = await apiClient.post('/users', { name: 'John' });

// With authentication (automatic)
const profile = await apiClient.get('/users/me');
```

### Email API

```typescript
import { emailAPI } from '@/lib/email/client';

// Send welcome email
await emailAPI.sendWelcome('user@example.com', 'John Doe');

// Send invoice
await emailAPI.sendInvoice({
  to_email: 'user@example.com',
  name: 'John Doe',
  invoice_number: 'INV-001',
  invoice_date: '2025-01-27',
  amount: 99.99,
  currency: 'EUR',
});
```

### Using Hooks

```typescript
import { useEmail } from '@/hooks/useEmail';

function MyComponent() {
  const { sendWelcomeEmail, loading } = useEmail();

  const handleSend = async () => {
    await sendWelcomeEmail('user@example.com', 'John Doe');
  };

  return <button onClick={handleSend} disabled={loading}>Send</button>;
}
```

## 🎣 Custom Hooks

### Form Management (useForm)

```typescript
import { useForm } from '@/hooks';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const form = useForm({
  validationSchema: schema,
  onSubmit: async (data) => {
    await login(data);
  },
});
```

### Pagination (usePagination)

```typescript
import { usePagination } from '@/hooks';

const pagination = usePagination({
  totalItems: 100,
  pageSize: 10,
});

const pageData = pagination.getPageData(items);
```

### Filters (useFilters)

```typescript
import { useFilters } from '@/hooks';

const { filteredData, setFilterValue } = useFilters({
  data: products,
});

setFilterValue('name', 'search term', 'contains');
```

### Email (useEmail)

```typescript
import { useEmail } from '@/hooks/useEmail';

const { sendWelcomeEmail, sendInvoiceEmail, loading } = useEmail();
```

> 📖 **Complete hooks documentation**: [src/hooks/HOOKS.md](./src/hooks/HOOKS.md)

## 🎨 UI Components

### Using Components

```typescript
import { Button, Input, DataTable, Modal, Form } from '@/components/ui';

// Button
<Button variant="primary" size="md" onClick={handleClick}>
  Click me
</Button>

// DataTable
<DataTable
  data={users}
  columns={[
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', filterable: true },
  ]}
  pageSize={10}
  searchable
/>

// Modal
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
>
  Content
</Modal>
```

> 📖 **Complete components documentation**: [UI_COMPONENTS.md](./UI_COMPONENTS.md)  
> 🎨 **Storybook**: Run `pnpm storybook` to see all components

## 🎨 Theme System

The app includes a dynamic theme system with:

- **Color Management**: Primary, secondary, danger, warning, info palettes
- **Font Customization**: Change font family dynamically
- **Border Radius**: Adjustable border radius
- **Dark Mode**: Automatic dark mode support

Access the theme manager at `/components` page.

## 📦 State Management

Using Zustand for global state:

```typescript
import { useAuthStore } from '@/lib/store';

const { user, token, login, logout } = useAuthStore();
```

## 🚀 Deployment

### Railway

1. Push to GitHub
2. Connect Railway to GitHub repository
3. Set environment variables in Railway dashboard
4. Deploy automatically

**Required Environment Variables:**

```env
NEXT_PUBLIC_API_URL=https://your-backend-api.railway.app
NEXTAUTH_URL=https://your-frontend.railway.app
NEXTAUTH_SECRET=your-secret-key-min-32-chars
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Docker

```bash
# Build
docker build -t modele-web .

# Run
docker run -p 3000:3000 modele-web
```

### Vercel

1. Connect GitHub repository
2. Configure environment variables
3. Deploy automatically on push

## 📚 Documentation

- 📖 [Hooks Documentation](./src/hooks/HOOKS.md) - Complete hooks guide
- 🎨 [UI Components](./UI_COMPONENTS.md) - Component library documentation
- 🔐 [Authentication](./AUTHENTICATION.md) - Auth setup guide
- ⚠️ [Error Handling](./ERROR_HANDLING.md) - Error handling patterns
- 💳 [Stripe Setup](../../docs/STRIPE_SETUP.md) - Payment and subscription setup
- 📋 [Subscriptions Guide](../../docs/SUBSCRIPTIONS_GUIDE.md) - Using subscriptions API
- 📧 [Email Integration](../../docs/SENDGRID_SETUP.md) - SendGrid setup

## 🛠️ Available Scripts

```bash
# Development
pnpm dev                    # Start dev server
pnpm build                  # Build for production
pnpm start                  # Start production server

# Testing
pnpm test                   # Run unit tests
pnpm test:watch            # Watch mode
pnpm test:ui                # Test UI
pnpm test:e2e              # E2E tests
pnpm test:coverage         # Coverage report

# Code Quality
pnpm lint                   # Lint code
pnpm type-check            # TypeScript check
pnpm format                # Format code

# Storybook
pnpm storybook             # Start Storybook
pnpm build-storybook       # Build Storybook

# Analysis
pnpm analyze               # Bundle analysis
pnpm analyze:server       # Server bundle
pnpm analyze:browser       # Browser bundle

# Environment
pnpm env:validate          # Validate env vars
pnpm env:docs             # Generate env docs

# Cleanup
pnpm clean                 # Clean build files
```

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feat/feature-name`
2. Make your changes
3. Run tests: `pnpm test`
4. Run linting: `pnpm lint`
5. Check types: `pnpm type-check`
6. Commit with clear messages: `git commit -m "feat: add feature"`
7. Push and open Pull Request

## 📖 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Zustand Documentation](https://zustand-demo.pmnd.rs)
- [Storybook Documentation](https://storybook.js.org/docs)

## 📄 License

MIT

---

**Happy coding! 🚀**
