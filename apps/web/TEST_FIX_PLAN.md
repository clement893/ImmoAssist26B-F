# Test Fix Plan - Batch by Batch

**Created**: 2025-01-27  
**Status**: 🟡 In Progress  
**Total Test Failures**: 448 failures across 121 test files  
**Strategy**: Fix tests batch by batch, ensuring no build/TypeScript errors at each step

## Overview

This plan organizes test fixes into manageable batches, ensuring:

- ✅ No TypeScript errors introduced
- ✅ No build errors introduced
- ✅ Tests pass before moving to next batch
- ✅ Git commit + push after each batch
- ✅ Progress report after each batch

## Test Failure Categories

Based on test output analysis, failures fall into these categories:

1. **API Client & HTTP** (13 failures) - ApiClient constructor issues
2. **Form Hooks** (10+ failures) - useForm hook null references
3. **Data Hooks** (5+ failures) - useTableData iterable issues
4. **Error Handling** (5+ failures) - Error utils, AppError, isApiError
5. **UI Components** (2+ failures) - TimePicker, VirtualTable multiple elements
6. **Theme System** (5+ failures) - Color utils, accessibility, validation
7. **Security Utils** (1+ failures) - Password validation strength
8. **JWT & Auth** (1+ failures) - getUserIdFromPayload return value
9. **Portal Utils** (1+ failures) - getPortalTypeFromUser logic
10. **Monitoring Hooks** (1+ failures) - useErrorTracking isLoading
11. **Environment Validation** (2+ failures) - Console warnings, error throwing
12. **Retry Hook** (4+ failures) - Unhandled promise rejections

## Batch Plan

### Batch 1: API Client & HTTP Infrastructure

**Target**: Fix ApiClient constructor and HTTP-related tests  
**Files**:

- `src/lib/api/__tests__/client.test.ts` (13 failures)

**Issues**:

- ApiClient is not a constructor
- Need to check ApiClient export/import

**Success Criteria**:

- ✅ All ApiClient tests pass
- ✅ No TypeScript errors
- ✅ Build succeeds

---

### Batch 2: Error Handling Utilities

**Target**: Fix error utility functions  
**Files**:

- `src/lib/errors/__tests__/utils.test.ts` (5 failures)

**Issues**:

- `isApiError` not detecting API errors correctly
- `getErrorMessage` not extracting messages properly
- `getErrorDetail` not extracting details

**Success Criteria**:

- ✅ All error utils tests pass
- ✅ No TypeScript errors
- ✅ Build succeeds

---

### Batch 3: Form Hooks (useForm)

**Target**: Fix useForm hook null reference issues  
**Files**:

- `src/hooks/forms/__tests__/useForm.test.ts` (10+ failures)

**Issues**:

- `result.current` is null in some tests
- `isSubmitting` not set correctly
- `handleSubmit` null reference
- `setValue`, `setError`, `resetField` null references
- `getFieldProps` null reference
- `isValid` null reference

**Success Criteria**:

- ✅ All useForm tests pass
- ✅ No TypeScript errors
- ✅ Build succeeds

---

### Batch 4: Data Hooks (useTableData)

**Target**: Fix useTableData iterable issues  
**Files**:

- `src/hooks/data/__tests__/useTableData.test.ts` (5+ failures)

**Issues**:

- "data is not iterable" error
- Need to ensure data is array before spreading

**Success Criteria**:

- ✅ All useTableData tests pass
- ✅ No TypeScript errors
- ✅ Build succeeds

---

### Batch 5: UI Components (TimePicker, VirtualTable)

**Target**: Fix multiple element selection issues  
**Files**:

- `src/components/ui/__tests__/TimePicker.test.tsx` (2 failures)
- `src/components/ui/__tests__/VirtualTable.test.tsx` (1 failure)

**Issues**:

- Multiple elements with same text "15" in TimePicker
- Multiple elements matching regex in VirtualTable
- Need to use `getAllBy*` or more specific queries

**Success Criteria**:

- ✅ All UI component tests pass
- ✅ No TypeScript errors
- ✅ Build succeeds

---

### Batch 6: Theme System

**Target**: Fix theme color and accessibility tests  
**Files**:

- `src/lib/theme/__tests__/color-utils.test.ts` (1 failure)
- `src/lib/theme/__tests__/theme-accessibility.test.ts` (4 failures)

**Issues**:

- `generateColorShades` not adding hash prefix
- WCAG contrast ratio calculations
- Theme accessibility validation not detecting issues

**Success Criteria**:

- ✅ All theme tests pass
- ✅ No TypeScript errors
- ✅ Build succeeds

---

### Batch 7: Security & Validation Utils

**Target**: Fix security validation functions  
**Files**:

- `src/lib/security/__tests__/inputValidation.test.ts` (1 failure)
- `src/lib/auth/__tests__/jwt.test.ts` (1 failure)

**Issues**:

- `validatePassword` not returning strength property
- `getUserIdFromPayload` returning undefined instead of null

**Success Criteria**:

- ✅ All security/auth tests pass
- ✅ No TypeScript errors
- ✅ Build succeeds

---

### Batch 8: Portal & Monitoring Utils

**Target**: Fix portal utils and monitoring hooks  
**Files**:

- `src/lib/portal/__tests__/utils.test.ts` (1 failure)
- `src/hooks/monitoring/__tests__/useErrorTracking.test.ts` (1 failure)

**Issues**:

- `getPortalTypeFromUser` returning wrong value for admin role
- `useErrorTracking` isLoading not set correctly initially

**Success Criteria**:

- ✅ All portal/monitoring tests pass
- ✅ No TypeScript errors
- ✅ Build succeeds

---

### Batch 9: Environment Validation

**Target**: Fix environment validation tests  
**Files**:

- `src/lib/utils/__tests__/envValidation.test.ts` (1 failure)
- `src/lib/utils/__tests__/envValidation.comprehensive.test.ts` (2 failures)

**Issues**:

- Console.warn not being called
- Error not being thrown in production mode

**Success Criteria**:

- ✅ All env validation tests pass
- ✅ No TypeScript errors
- ✅ Build succeeds

---

### Batch 10: Retry Hook (Unhandled Rejections)

**Target**: Fix unhandled promise rejections in useRetry  
**Files**:

- `src/hooks/__tests__/useRetry.test.ts` (4 unhandled rejections)

**Issues**:

- Unhandled promise rejections in tests
- Need to properly await/catch rejected promises

**Success Criteria**:

- ✅ All useRetry tests pass
- ✅ No unhandled rejections
- ✅ No TypeScript errors
- ✅ Build succeeds

---

## Workflow for Each Batch

For each batch:

1. **Pre-check**:

   ```bash
   cd apps/web
   pnpm type-check
   pnpm lint
   ```

2. **Fix tests**:
   - Identify root cause of failures
   - Fix implementation or test code
   - Ensure no breaking changes

3. **Verify**:

   ```bash
   pnpm type-check  # Must pass
   pnpm lint        # Must pass
   pnpm test        # Run specific test file
   ```

4. **Full verification**:

   ```bash
   pnpm test        # Run all tests
   pnpm test:coverage  # Check coverage
   ```

5. **Commit & Push**:

   ```bash
   git add .
   git commit -m "test: fix [Batch X] - [description]"
   git push
   ```

6. **Update Progress**:
   - Update `TEST_FIX_PLAN.md` with batch status
   - Update `BATCH_PROGRESS.md` with results
   - Create progress report

## Progress Tracking

| Batch    | Status         | Tests Fixed                | TypeScript Errors | Build Errors | Git Commit |
| -------- | -------------- | -------------------------- | ----------------- | ------------ | ---------- |
| Batch 1  | ✅ Complete    | 13/13 passing              | ✅ None           | ✅ None      | ⏳ Pending |
| Batch 2  | ✅ Complete    | 14/14 passing              | ✅ None           | ✅ None      | ⏳ Pending |
| Batch 3  | 🟡 In Progress | 18/27 passing (9 failures) | ✅ None           | ✅ None      | ⏳ Pending |
| Batch 4  | ⏳ Pending     | -                          | -                 | -            | -          |
| Batch 5  | ⏳ Pending     | -                          | -                 | -            | -          |
| Batch 6  | ⏳ Pending     | -                          | -                 | -            | -          |
| Batch 7  | ⏳ Pending     | -                          | -                 | -            | -          |
| Batch 8  | ⏳ Pending     | -                          | -                 | -            | -          |
| Batch 9  | ⏳ Pending     | -                          | -                 | -            | -          |
| Batch 10 | ⏳ Pending     | -                          | -                 | -            | -          |

## Notes

- Start with infrastructure (API Client, Error Handling) as other tests may depend on these
- Fix hooks before components that use them
- Ensure backward compatibility when fixing implementations
- Document any breaking changes if necessary
- Keep test coverage high (aim for 100%)

## Current Status (2025-01-27)

**Batches 1 & 2**: ✅ Already fixed - tests passing

- Batch 1 (ApiClient): 13/13 tests passing
- Batch 2 (Error Utils): 14/14 tests passing

**Batch 3**: 🟡 In Progress - React 19 compatibility issue

- Issue: `result.current` is null when `validationSchema` is used in useForm hook
- 9 tests failing: Tests that use `validationSchema` fail because `result.current` is null
- Attempted fixes:
  - Changed `parse` to `safeParse` in `validateAll`
  - Added try-catch around `isValid` computation
  - Added `waitFor` checks (timed out)
  - Used `partial()` schema for partial validation
- Root cause: Likely React 19 compatibility issue with `@testing-library/react` or hook rendering
- Next steps: Investigate React 19 compatibility, check if hook throws during render, or skip and return later

## Success Metrics

- ✅ All 448 test failures resolved
- ✅ 0 TypeScript errors
- ✅ 0 build errors
- ✅ Test coverage maintained or improved
- ✅ All batches committed and pushed
