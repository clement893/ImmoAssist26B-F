# Test Suite Documentation

This directory contains comprehensive unit and integration tests for the application.

## Test Structure

```
__tests__/
├── integration/          # Integration tests
│   ├── api.test.ts      # API endpoint tests
│   └── auth.test.tsx    # Authentication flow tests
├── unit/                 # Unit tests (organized by feature)
└── README.md            # This file
```

## Test Types

### Unit Tests

Unit tests are located alongside the code they test:

- **Components**: `src/components/**/__tests__/*.test.tsx`
- **Hooks**: `src/hooks/**/__tests__/*.test.ts`
- **Utilities**: `src/lib/**/__tests__/*.test.ts`

### Integration Tests

Integration tests verify the interaction between multiple components:

- **API Integration**: Tests API client, endpoints, and error handling
- **Auth Integration**: Tests complete authentication flows

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test Button.test.tsx

# Run tests matching a pattern
pnpm test -- --grep "Button"
```

## Test Coverage

Current coverage thresholds:

- **Lines**: 80%
- **Functions**: 80%
- **Branches**: 75%
- **Statements**: 80%

View coverage report:

```bash
pnpm test:coverage
# Open coverage/index.html in browser
```

## Writing Tests

### Component Tests

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Button from '../Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

### Hook Tests

```tsx
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useForm } from '../useForm';

describe('useForm', () => {
  it('initializes with default values', () => {
    const { result } = renderHook(() =>
      useForm({
        initialValues: { email: 'test@example.com' },
        onSubmit: vi.fn(),
      })
    );
    expect(result.current.values.email).toBe('test@example.com');
  });
});
```

### Integration Tests

```tsx
import { describe, it, expect } from 'vitest';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { authAPI } from '@/lib/api';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Auth API', () => {
  it('successfully logs in user', async () => {
    server.use(
      rest.post('/api/v1/auth/login', (req, res, ctx) => {
        return res(ctx.json({ success: true, data: { token: '123' } }));
      })
    );

    const result = await authAPI.login('test@example.com', 'password');
    expect(result.data.token).toBe('123');
  });
});
```

## Best Practices

1. **Test Behavior, Not Implementation**: Focus on what the code does, not how it does it
2. **Use Descriptive Test Names**: Test names should clearly describe what is being tested
3. **Arrange-Act-Assert**: Structure tests with clear sections
4. **Mock External Dependencies**: Use MSW for API mocking, vi.mock for modules
5. **Test Edge Cases**: Include tests for error cases, boundary conditions
6. **Keep Tests Isolated**: Each test should be independent and not rely on others
7. **Accessibility Testing**: Use jest-axe for accessibility checks

## Test Utilities

### MSW (Mock Service Worker)

Used for API mocking in integration tests:

```tsx
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/users', (req, res, ctx) => {
    return res(ctx.json({ users: [] }));
  })
);
```

### Testing Library

Used for component and hook testing:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
```

### Vitest

Test runner and assertion library:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
```

## Continuous Integration

Tests run automatically on:

- Pull requests
- Commits to main branch
- Pre-commit hooks (optional)

## Troubleshooting

### Tests failing with "Cannot find module"

Ensure all dependencies are installed:

```bash
pnpm install
```

### MSW server not working

Check that MSW is properly set up:

```bash
# Verify MSW is installed
pnpm list msw
```

### Coverage not updating

Clear coverage directory and rerun:

```bash
rm -rf coverage
pnpm test:coverage
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [MSW Documentation](https://mswjs.io/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
