/**
 * Auto-generated TypeScript types from Pydantic schemas
 * DO NOT EDIT MANUALLY - This file is auto-generated
 * Run: npm run generate:types
 */

export interface Config {
  id: string;
  filename: string;
  original_filename: string;
}

export interface File {
  filename: string;
  original_filename: string;
  content_type: string;
  size: number;
  url: string;
}

export interface FileUpload {
  id: string;
  filename: string;
  original_filename: string;
}

export interface Token {
  access_token: string;
}

export interface User {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  email: string;
  password: string;
  first_name: string | null;
  last_name: string | null;
}

export interface UserUpdate {
  email?: string | null;
  first_name?: string | null;
}
