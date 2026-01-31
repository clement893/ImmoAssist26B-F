/**
 * Shared TypeScript types for MODELE-NEXTJS-FULLSTACK
 *
 * This package contains type definitions shared between frontend and backend
 */

// User types
export interface User {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserCreate {
  email: string;
  password: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

export interface UserUpdate {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Resource types (generic)
export interface Resource {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceCreate {
  [key: string]: unknown;
}

export interface ResourceUpdate {
  [key: string]: unknown;
}

// File upload types
export interface FileUpload {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedBy: string;
  createdAt: string;
}

export interface FileUploadRequest {
  file: File | Blob;
  metadata?: Record<string, unknown>;
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Common utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

export type ID = string | number;

export type Timestamp = string; // ISO 8601 format

// Status types
export type Status = "pending" | "active" | "inactive" | "deleted";

export interface StatusChange {
  status: Status;
  changedAt: Timestamp;
  changedBy: string;
}

// Re-export API types
export * from "./api";

export * from "./generated";

// Theme types
export * from "./theme";
export * from "./theme-font";

// Portal types
export * from "./portal";
