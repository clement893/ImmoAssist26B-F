# Standardized Error Handling

This document describes the standardized error handling system for the application.

## 🎯 Overview

The error handling system provides:

- **Reusable error components** for consistent display
- **Structured logging** for frontend and backend
- **Centralized** API error handling
- **Custom Next.js** error pages

## 📦 Error Components

### ErrorBoundary

React component to catch errors in the component tree:

```tsx
import { ErrorBoundary } from '@/components/errors';

<ErrorBoundary fallback={<CustomError />}>
  <YourComponent />
</ErrorBoundary>;
```

### ErrorDisplay

Reusable component to display errors:

```tsx
import { ErrorDisplay } from '@/components/errors';
import { NotFoundError } from '@/lib/errors';

<ErrorDisplay
  error={new NotFoundError('Resource not found')}
  onRetry={() => retry()}
  showDetails={true}
/>;
```

### ApiError

Specialized component for API errors:

```tsx
import { ApiError } from '@/components/errors';

try {
  await apiCall();
} catch (error) {
  return <ApiError error={error} onRetry={() => retry()} />;
}
```

## 📝 Structured Logging

### Frontend

```tsx
import { logger } from '@/lib/logger';
// or
import { useLogger } from '@/hooks/useLogger';

// In a component
const log = useLogger();
log.info('User action', { userId: user.id });
log.error('API call failed', error, { endpoint: '/api/users' });

// Directly
logger.debug('Debug message', { context: 'value' });
logger.warn('Warning message', { context: 'value' });
```

### Backend

```python
from app.core.logging import logger

logger.info("User created", context={"user_id": user.id})
logger.error("Database error", context={"query": query}, exc_info=exception)
logger.warning("Rate limit approaching", context={"user_id": user_id})
```

## 🔧 API Error Handling

### Frontend

The API client automatically handles errors:

```tsx
import { apiClient } from '@/lib/api/client';
import { handleApiError } from '@/lib/errors/api';

try {
  const response = await apiClient.get('/api/users');
} catch (error) {
  const appError = handleApiError(error);
  // appError is an instance of AppError
  console.error(appError.code, appError.message);
}
```

### Backend

Exceptions are handled automatically:

```python
from app.core.exceptions import NotFoundException, ValidationException

# In an endpoint
if not user:
    raise NotFoundException("User not found")

# Validation
if not email_valid:
    raise ValidationException("Invalid email", details={"field": "email"})
```

## 🎨 Next.js Error Pages

### error.tsx

Global error page for unhandled errors:

```tsx
// app/error.tsx
'use client';

export default function Error({ error, reset }) {
  return <ErrorDisplay error={error} onRetry={reset} />;
}
```

### not-found.tsx

Custom 404 page:

```tsx
// app/not-found.tsx
import { NotFoundError } from '@/lib/errors';

export default function NotFound() {
  return <ErrorDisplay error={new NotFoundError()} />;
}
```

### global-error.tsx

Error boundary for root layout:

```tsx
// app/global-error.tsx
'use client';

export default function GlobalError({ error, reset }) {
  return <ErrorDisplay error={error} onRetry={reset} />;
}
```

## 🔍 Error Types

### Error Codes

```typescript
enum ErrorCode {
  // Client Errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',

  // Server Errors (5xx)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',

  // Network
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
}
```

### Error Classes

```typescript
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ValidationError,
  InternalServerError,
} from '@/lib/errors';

throw new NotFoundError('User not found');
throw new ValidationError('Invalid input', { field: 'email' });
```

## 📊 API Error Response Format

All API errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found",
    "details": {
      "resource": "user",
      "id": "123"
    },
    "validationErrors": [
      {
        "field": "email",
        "message": "Invalid email format",
        "code": "invalid"
      }
    ]
  },
  "timestamp": "2025-12-21T18:00:00.000Z"
}
```

## 🛠️ Practical Usage

### In a React Component

```tsx
'use client';

import { useState } from 'react';
import { ApiError } from '@/components/errors';
import { apiClient } from '@/lib/api/client';
import { useLogger } from '@/hooks/useLogger';

export function UserList() {
  const [error, setError] = useState(null);
  const log = useLogger();

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/api/users');
      log.info('Users fetched', { count: response.data?.length });
    } catch (err) {
      setError(err);
      log.error('Failed to fetch users', err);
    }
  };

  if (error) {
    return <ApiError error={error} onRetry={fetchUsers} />;
  }

  return <div>...</div>;
}
```

### In a FastAPI Endpoint

```python
from app.core.exceptions import NotFoundException
from app.core.logging import logger

@router.get("/users/{user_id}")
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    user = await db.get(User, user_id)
    if not user:
        logger.warning("User not found", context={"user_id": user_id})
        raise NotFoundException("User not found", details={"user_id": user_id})

    logger.info("User retrieved", context={"user_id": user_id})
    return user
```

## 🔐 Authentication Error Handling

```tsx
import { UnauthorizedError } from '@/lib/errors';

try {
  await apiClient.get('/api/protected');
} catch (error) {
  if (error instanceof UnauthorizedError) {
    // Redirect to login page
    router.push('/auth/signin');
  }
}
```

## 📈 Monitoring and Tracking

In production, errors are automatically sent to tracking services:

- **Frontend**: Integration with Sentry (to be configured)
- **Backend**: Structured JSON logs for aggregation

## 🧪 Tests

```typescript
import { NotFoundError } from '@/lib/errors';

test('should throw NotFoundError', () => {
  expect(() => {
    throw new NotFoundError('Not found');
  }).toThrow(NotFoundError);
});
```

## 📚 Resources

- [Next.js Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [FastAPI Exception Handling](https://fastapi.tiangolo.com/tutorial/handling-errors/)
