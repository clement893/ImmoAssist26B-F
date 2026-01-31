/**
 * Theme Font Types
 * Shared types for theme font management between frontend and backend
 */

export interface ThemeFont {
  id: number;
  name: string;
  font_family: string;
  description?: string;
  file_key: string;
  filename: string;
  file_size: number;
  mime_type: string;
  url: string;
  font_format: "woff" | "woff2" | "ttf" | "otf";
  font_weight?: string;
  font_style?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface ThemeFontCreate {
  name?: string;
  font_family?: string;
  description?: string;
  font_weight?: string;
  font_style?: string;
}

export interface ThemeFontListResponse {
  fonts: ThemeFont[];
  total: number;
}
