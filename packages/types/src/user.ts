/**
 * Shared User types for frontend and backend communication
 */

export interface User {
  id: string;
  email: string;
  name: string;
  is_active: boolean;
  is_verified: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserCreate {
  email: string;
  name: string;
  password: string;
}

export interface UserUpdate {
  email?: string;
  name?: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  user: User;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}
