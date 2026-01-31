/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom" />

import '@testing-library/jest-dom';
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

declare module 'vitest' {
  interface Assertion<T = any> extends jest.Matchers<void, T> {}
  interface AsymmetricMatchersContaining extends jest.Matchers<void, any> {}
}

declare global {
  namespace Vi {
    interface JestAssertion<T = any> extends jest.Matchers<void, T> {}
  }
}
