# TypeScript `any` Usage Report

This document tracks all instances of `any` type usage in the codebase and their fixes.

## Summary

**Total instances found: 146**

## Categories

### 1. Error Handling (`error: any`) - ~60 instances

**Priority: HIGH** - Should be fixed first

Common patterns:

- `catch (error: any)` in try-catch blocks
- `(err as any)` type assertions
- `error.response?.data` without proper typing

**Fix**: Use `ApiError` type from `@/lib/types/common` or `AxiosError` from axios

### 2. API Response Types (`response as any`) - ~30 instances

**Priority: HIGH** - Affects type safety

Common patterns:

- `(response as any).data`
- `(response as any).data?.data`
- Complex nested response handling

**Fix**: Create proper response types for each API endpoint

### 3. Data Mapping (`map((item: any)`) - ~20 instances

**Priority: MEDIUM** - Affects data integrity

Common patterns:

- `backendData.map((item: any) => ...)`
- `response.data.map((form: any) => ...)`

**Fix**: Define proper interfaces for backend data structures

### 4. Function Parameters (`value: any`) - ~15 instances

**Priority: MEDIUM**

Common patterns:

- `handleChange(key: string, value: any)`
- `setPreference(key: string, value: any)`
- Generic preference/value handlers

**Fix**: Use union types or generics

### 5. Type Assertions (`as any`) - ~15 instances

**Priority: LOW** - Some may be necessary

Common patterns:

- `user as any` for permission checks
- `config as any` for axios configs
- `(d: any)` in complex data structures

**Fix**: Use proper type guards or narrow types

### 6. Test Files - ~6 instances

**Priority: LOW** - Tests can use `any` for mocking

## Files with Most `any` Usage

1. `apps/web/src/lib/api/admin.ts` - 8 instances
2. `apps/web/src/app/[locale]/settings/*/page.tsx` - 6 instances
3. `apps/web/src/components/**/*.tsx` - ~40 instances
4. `apps/web/src/hooks/**/*.ts` - ~10 instances

## Fix Priority

1. **Error handling** - Replace all `error: any` with proper types
2. **API responses** - Create proper response interfaces
3. **Data mapping** - Define backend data interfaces
4. **Function parameters** - Use union types or generics
5. **Type assertions** - Review and fix where possible

## Progress

- [x] Created common types file (`@/lib/types/common.ts`)
- [ ] Fix error handling (60 instances)
- [ ] Fix API response types (30 instances)
- [ ] Fix data mapping (20 instances)
- [ ] Fix function parameters (15 instances)
- [ ] Review type assertions (15 instances)
