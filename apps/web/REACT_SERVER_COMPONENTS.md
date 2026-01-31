# ⚡ React Server Components Optimization Guide

This guide explains how React Server Components (RSC) are used and optimized in this Next.js 16 application.

## 📋 Overview

Next.js 16 uses React Server Components by default. Components are Server Components unless explicitly marked with `'use client'`.

## 🎯 Server vs Client Components

### Server Components (Default)

**Characteristics**:

- ✅ Rendered on the server
- ✅ No JavaScript sent to client
- ✅ Can directly access backend resources
- ✅ Better SEO and initial load performance
- ❌ Cannot use browser APIs
- ❌ Cannot use React hooks (useState, useEffect, etc.)
- ❌ Cannot handle user interactions

**When to Use**:

- Static content
- Data fetching
- Components that don't need interactivity
- Layout components
- SEO-critical content

**Example**:

```tsx
// Server Component (default)
import { getData } from '@/lib/api';

export default async function ServerPage() {
  const data = await getData(); // Direct server-side fetch

  return (
    <div>
      <h1>{data.title}</h1>
      <p>{data.content}</p>
    </div>
  );
}
```

### Client Components

**Characteristics**:

- ✅ Can use browser APIs
- ✅ Can use React hooks
- ✅ Can handle user interactions
- ✅ Can access localStorage, sessionStorage
- ❌ JavaScript sent to client (increases bundle size)
- ❌ Rendered on client (slower initial render)

**When to Use**:

- Interactive components (buttons, forms, modals)
- Components using hooks (useState, useEffect, etc.)
- Components using browser APIs
- Components with event handlers

**Example**:

```tsx
'use client';

import { useState } from 'react';

export default function ClientComponent() {
  const [count, setCount] = useState(0);

  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
}
```

## 🏗️ Architecture Patterns

### Pattern 1: Server Component Wrapper

Use Server Components as containers, Client Components for interactivity:

```tsx
// Server Component (page.tsx)
import { getData } from '@/lib/api';
import InteractiveComponent from './InteractiveComponent';

export default async function Page() {
  const data = await getData(); // Server-side fetch

  return (
    <div>
      <h1>{data.title}</h1>
      <InteractiveComponent initialData={data} />
    </div>
  );
}
```

```tsx
// Client Component (InteractiveComponent.tsx)
'use client';

export default function InteractiveComponent({ initialData }) {
  const [data, setData] = useState(initialData);
  // ... interactive logic
}
```

### Pattern 2: Dynamic Imports for Code Splitting

Use `next/dynamic` for large Client Components:

```tsx
import dynamic from 'next/dynamic';

// Lazy load heavy component
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>,
  ssr: false, // Disable SSR if not needed
});
```

### Pattern 3: Server Actions

Use Server Actions for form submissions and mutations:

```tsx
// Server Action (actions.ts)
'use server';

export async function createItem(formData: FormData) {
  // Server-side logic
  const name = formData.get('name');
  // ... save to database
}
```

```tsx
// Client Component using Server Action
'use client';

import { createItem } from './actions';

export default function Form() {
  return (
    <form action={createItem}>
      <input name="name" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

## ⚡ Optimization Strategies

### 1. Minimize Client Components

**Before**:

```tsx
'use client'; // Entire page is client component

export default function Page() {
  const data = useQuery(...); // Client-side fetch
  return <div>{data.title}</div>;
}
```

**After**:

```tsx
// Server Component (default)
import { getData } from '@/lib/api';

export default async function Page() {
  const data = await getData(); // Server-side fetch
  return <div>{data.title}</div>;
}
```

### 2. Use Dynamic Imports for Large Components

**Before**:

```tsx
import HeavyChart from '@/components/HeavyChart'; // Always loaded

export default function Page() {
  return <HeavyChart />;
}
```

**After**:

```tsx
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <div>Loading chart...</div>,
});

export default function Page() {
  return <HeavyChart />; // Only loaded when needed
}
```

### 3. Split Interactive Parts

**Before**:

```tsx
'use client'; // Entire component is client

export default function Card({ title, content }) {
  const [liked, setLiked] = useState(false);

  return (
    <div>
      <h2>{title}</h2>
      <p>{content}</p>
      <button onClick={() => setLiked(!liked)}>{liked ? '❤️' : '🤍'}</button>
    </div>
  );
}
```

**After**:

```tsx
// Server Component (Card.tsx)
import LikeButton from './LikeButton';

export default function Card({ title, content }) {
  return (
    <div>
      <h2>{title}</h2>
      <p>{content}</p>
      <LikeButton /> {/* Only this is client */}
    </div>
  );
}
```

```tsx
// Client Component (LikeButton.tsx)
'use client';

export default function LikeButton() {
  const [liked, setLiked] = useState(false);
  return <button onClick={() => setLiked(!liked)}>{liked ? '❤️' : '🤍'}</button>;
}
```

### 4. Use Server Actions for Mutations

**Before**:

```tsx
'use client';

export default function Form() {
  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch('/api/items', { method: 'POST', ... }); // Client-side API call
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

**After**:

```tsx
'use client';

import { createItem } from './actions'; // Server Action

export default function Form() {
  return <form action={createItem}>...</form>; // Direct server call
}
```

## 📊 Current Implementation

### Server Components Used

- Layout components (`layout.tsx`)
- Most page components (unless they need interactivity)
- Static content components
- Data fetching components

### Client Components Used

Components marked with `'use client'`:

- Interactive components (forms, buttons with handlers)
- Components using hooks (useState, useEffect, etc.)
- Components using browser APIs
- Components with event handlers

**Count**: ~17 components use `'use client'` (out of 270+ total)

### Code Splitting

Dynamic imports are used for:

- Heavy components (charts, editors)
- Route-based splitting (component showcase pages)
- Conditional component loading

## 🎯 Best Practices

1. **Default to Server Components**: Only use `'use client'` when necessary
2. **Minimize Client Bundle**: Keep client components small and focused
3. **Use Dynamic Imports**: Lazy load heavy components
4. **Server Actions**: Use for form submissions and mutations
5. **Data Fetching**: Prefer server-side fetching in Server Components
6. **Composition**: Compose Server and Client Components together

## 🔍 Identifying Optimization Opportunities

### Checklist

- [ ] Is this component interactive? → If no, use Server Component
- [ ] Does it use hooks? → If yes, use Client Component
- [ ] Does it fetch data? → Prefer Server Component with async/await
- [ ] Is it a large component? → Consider dynamic import
- [ ] Does it handle form submission? → Use Server Action

### Tools

- **Bundle Analyzer**: `pnpm analyze` to see bundle sizes
- **React DevTools**: Check component tree
- **Next.js Build Output**: Shows which components are client/server

## 📚 References

- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [React Server Components RFC](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components)
- [Next.js App Router](https://nextjs.org/docs/app)

## 🚀 Future Improvements

- [ ] Audit all components for unnecessary `'use client'` directives
- [ ] Implement more Server Actions for mutations
- [ ] Add bundle size monitoring for client components
- [ ] Document component architecture decisions
