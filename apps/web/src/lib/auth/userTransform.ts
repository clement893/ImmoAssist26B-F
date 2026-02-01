/**
 * User Transformation Utilities
 *
 * Functions to transform user data between API format (backend) and store format (frontend)
 *
 * @module lib/auth/userTransform
 */

import type { User } from '@/lib/store';

/**
 * UserResponse from backend API
 * Matches the UserResponse schema from backend/app/schemas/auth.py
 */
export interface ApiUserResponse {
  id: number;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  is_active: boolean;
  is_client?: boolean;
  theme_preference?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Transform API user response to store user format
 *
 * Converts backend format (id: int, first_name/last_name) to frontend format (id: string, name: string)
 *
 * @param apiUser - User data from backend API (UserResponse format)
 * @returns User data in store format
 *
 * @example
 * ```typescript
 * const apiUser = {
 *   id: 1,
 *   email: "user@example.com",
 *   first_name: "John",
 *   last_name: "Doe",
 *   is_active: true,
 *   created_at: "2025-01-01T00:00:00Z",
 *   updated_at: "2025-01-01T00:00:00Z"
 * };
 *
 * const storeUser = transformApiUserToStoreUser(apiUser);
 * // Result: {
 * //   id: "1",
 * //   email: "user@example.com",
 * //   name: "John Doe",
 * //   is_active: true,
 * //   is_verified: false,
 * //   is_admin: false,
 * //   created_at: "2025-01-01T00:00:00Z",
 * //   updated_at: "2025-01-01T00:00:00Z"
 * // }
 * ```
 */
export function transformApiUserToStoreUser(apiUser: ApiUserResponse): User {
  // Combine first_name and last_name into name
  // Fallback to first_name, last_name, or email if name parts are missing
  const name =
    apiUser.first_name && apiUser.last_name
      ? `${apiUser.first_name} ${apiUser.last_name}`
      : apiUser.first_name || apiUser.last_name || apiUser.email;

  return {
    id: String(apiUser.id), // Convert int to string
    email: apiUser.email,
    name,
    is_active: apiUser.is_active ?? true,
    is_verified: false, // Default value, update if available from API
    is_admin: false, // Default value, update if available from API
    is_client: apiUser.is_client ?? false,
    created_at: apiUser.created_at,
    updated_at: apiUser.updated_at,
  };
}
