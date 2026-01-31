/**
 * Theme Types
 * Shared types for theme management between frontend and backend
 */

/**
 * Layout configuration for themeable spacing, gaps, and containers
 */
export interface LayoutConfig {
  spacing?: {
    unit?: string;
    scale?: number;
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
    "2xl"?: string;
    "3xl"?: string;
  };
  gaps?: {
    tight?: string;
    normal?: string;
    loose?: string;
  };
  containers?: {
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
}

/**
 * Component size configuration
 */
export interface ComponentSizeConfig {
  paddingX?: string;
  paddingY?: string;
  fontSize?: string;
  minHeight?: string;
  borderRadius?: string;
  [key: string]: unknown; // Allow extra size properties
}

/**
 * Component variant configuration
 */
export interface ComponentVariantConfig {
  background?: string;
  hover?: string;
  text?: string;
  border?: string;
  borderRadius?: string;
  boxShadow?: string;
  textShadow?: string;
  [key: string]: unknown; // Allow extra variant properties
}

/**
 * Component layout configuration
 */
export interface ComponentLayoutConfig {
  iconPosition?: "left" | "right" | "top" | "bottom";
  iconGap?: string;
  contentAlignment?: "left" | "center" | "right";
  [key: string]: unknown; // Allow extra layout properties
}

/**
 * Component configuration for themeable components
 */
export interface ComponentConfig {
  button?: {
    sizes?: Record<string, ComponentSizeConfig>;
    variants?: Record<string, ComponentVariantConfig>;
    layout?: ComponentLayoutConfig;
  };
  card?: {
    padding?: {
      sm?: string;
      md?: string;
      lg?: string;
    };
    structure?: {
      header?: boolean;
      footer?: boolean;
      divider?: boolean;
    };
  };
  input?: {
    sizes?: Record<string, ComponentSizeConfig>;
    variants?: Record<string, ComponentVariantConfig>;
  };
  [key: string]: unknown; // Allow extra component configs
}

/**
 * Typography configuration
 */
export interface TypographyConfig {
  fontFamily?: string;
  fontFamilyHeading?: string;
  fontFamilySubheading?: string;
  fontUrl?: string;
  fontFiles?: number[];
  fontSize?: Record<string, string>;
  [key: string]: unknown; // Allow extra typography properties
}

/**
 * Animation configuration
 */
export interface AnimationConfig {
  duration?: {
    fast?: string;
    normal?: string;
    slow?: string;
    [key: string]: string | undefined;
  };
  easing?: {
    default?: string;
    bounce?: string;
    smooth?: string;
    [key: string]: string | undefined;
  };
  transitions?: {
    colors?: string;
    transform?: string;
    opacity?: string;
    [key: string]: string | undefined;
  };
}

/**
 * Responsive configuration
 */
export interface ResponsiveConfig {
  breakpoints?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
    wide?: string;
  };
  behaviors?: {
    mobileFirst?: boolean;
    containerQueries?: boolean;
  };
}

/**
 * Extended Theme Configuration
 * Supports both simple (backward compatible) and complex theming
 */
export interface ThemeConfig {
  // Existing fields (keep for backward compatibility)
  primary_color: string;
  secondary_color: string;
  danger_color: string;
  warning_color: string;
  info_color: string;
  success_color: string;
  font_family?: string;
  border_radius?: string;

  // New complex theming fields (all optional for backward compatibility)
  layout?: LayoutConfig;
  components?: ComponentConfig;
  animations?: AnimationConfig;
  responsive?: ResponsiveConfig;

  // Existing optional fields
  colors?: Record<string, unknown>;
  typography?: TypographyConfig;
  effects?: Record<string, unknown>;
  spacing?: Record<string, string | number | undefined>;
  borderRadius?: Record<string, string | number | undefined>;
  shadow?: Record<string, string | undefined>;
  breakpoint?: Record<string, string | number | undefined>;
  mode?: "light" | "dark" | "system";

  // Additional properties for backward compatibility (short format)
  primary?: string;
  secondary?: string;
  danger?: string;
  warning?: string;
  info?: string;
  success?: string;

  [key: string]: unknown; // Allow extra config fields
}

/**
 * Helper type for accessing theme config properties that may be in different formats
 * This allows safe access to properties like primary/primary_color, etc.
 */
export type ThemeConfigAccessor = ThemeConfig & {
  colors?: {
    primary_color?: string;
    primary?: string;
    secondary_color?: string;
    secondary?: string;
    danger_color?: string;
    danger?: string;
    destructive?: string;
    warning_color?: string;
    warning?: string;
    info_color?: string;
    info?: string;
    success_color?: string;
    success?: string;
    background?: string;
    foreground?: string;
    muted?: string;
    mutedForeground?: string;
    border?: string;
    input?: string;
    ring?: string;
    [key: string]: unknown;
  };
};

export interface ThemeBase {
  name: string;
  display_name: string;
  description?: string;
  config: ThemeConfig;
}

export interface ThemeCreate extends ThemeBase {
  is_active?: boolean;
}

export interface ThemeUpdate {
  display_name?: string;
  description?: string;
  config?: Partial<ThemeConfig>;
}

export interface Theme extends ThemeBase {
  id: number;
  is_active: boolean;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface ThemeResponse {
  theme: Theme;
}

export interface ThemeListResponse {
  themes: Theme[];
  total: number;
  active_theme_id?: number;
}

export interface ThemeConfigResponse {
  id: number;
  name: string;
  display_name: string;
  config: ThemeConfig;
  is_active?: boolean;
}
