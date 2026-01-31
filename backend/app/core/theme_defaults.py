"""
Default theme configuration constants.
This module provides the complete default theme configuration
that includes all typography, spacing, shadows, and effects.
"""

DEFAULT_THEME_CONFIG = {
    # Mode: system, light, or dark
    "mode": "system",
    
    # Basic color fields (for backward compatibility and simple usage)
    # Professional color palette - harmonious and accessible
    "primary_color": "#2563eb",  # Deep professional blue
    "secondary_color": "#6366f1",  # Elegant indigo (more subtle than purple)
    "danger_color": "#dc2626",  # Refined red
    "warning_color": "#d97706",  # Warm amber
    "info_color": "#0891b2",  # Professional cyan
    "success_color": "#059669",  # Professional green
    "font_family": "Inter",
    "border_radius": "8px",
    
    # Typography configuration - Professional and readable
    "typography": {
        "fontFamily": "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        "fontFamilyHeading": "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        "fontFamilySubheading": "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        "fontFamilyMono": "'Fira Code', 'Courier New', monospace",
        "fontSize": {
            "xs": "12px",
            "sm": "14px",
            "base": "16px",
            "lg": "18px",
            "xl": "20px",
            "2xl": "24px",
            "3xl": "30px",
            "4xl": "36px"
        },
        "fontWeight": {
            "normal": "400",
            "medium": "500",
            "semibold": "600",
            "bold": "700"
        },
        "lineHeight": {
            "tight": "1.25",
            "normal": "1.5",
            "relaxed": "1.75"
        },
        "textHeading": "#0f172a",  # Slate 900 - better contrast
        "textSubheading": "#334155",  # Slate 700
        "textBody": "#1e293b",  # Slate 800
        "textSecondary": "#64748b",  # Slate 500
        "textLink": "#2563eb"  # Matches primary
    },
    
    # Color palette (expanded) - Professional and harmonious
    "colors": {
        "background": "#ffffff",
        "foreground": "#0f172a",  # Slate 900 for better contrast
        "primary": "#2563eb",  # Deep professional blue
        "primaryForeground": "#ffffff",
        "secondary": "#6366f1",  # Elegant indigo
        "secondaryForeground": "#ffffff",
        "accent": "#f59e0b",  # Warm amber for accents
        "accentForeground": "#000000",
        "muted": "#f1f5f9",  # Slate 100 - softer than gray
        "mutedForeground": "#64748b",  # Slate 500
        "border": "#e2e8f0",  # Slate 200 - softer borders
        "input": "#ffffff",
        "ring": "#2563eb",  # Matches primary
        "destructive": "#dc2626",  # Refined red
        "destructiveForeground": "#ffffff",
        "success": "#059669",  # Professional green
        "successForeground": "#ffffff",
        "warning": "#d97706",  # Warm amber
        "warningForeground": "#ffffff",  # White for better contrast on amber
        "info": "#0891b2",  # Professional cyan
        "infoForeground": "#ffffff"
    },
    
    # Spacing system
    "spacing": {
        "unit": "8px",
        "xs": "4px",
        "sm": "8px",
        "md": "16px",
        "lg": "24px",
        "xl": "32px",
        "2xl": "48px",
        "3xl": "64px"
    },
    
    # Border radius system
    "borderRadius": {
        "none": "0",
        "sm": "2px",
        "base": "4px",
        "md": "6px",
        "lg": "8px",
        "xl": "12px",
        "2xl": "16px",
        "full": "9999px"
    },
    
    # Shadow system
    "shadow": {
        "sm": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        "base": "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        "md": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        "lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        "xl": "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
    },
    
    # Breakpoints (for responsive design)
    "breakpoint": {
        "sm": "640px",
        "md": "768px",
        "lg": "1024px",
        "xl": "1280px",
        "2xl": "1536px"
    },
    
    # CSS Effects
    "effects": {
        "glassmorphism": {
            "enabled": False,
            "blur": "10px",
            "saturation": "180%",
            "opacity": 0.1,
            "borderOpacity": 0.2
        },
        "gradients": {
            "enabled": False,
            "direction": "to-br",
            "intensity": 0.3
        },
        "shadows": {
            "sm": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
            "md": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            "lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            "xl": "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
        }
    },
    
    # Font URL for loading Google Fonts or custom fonts
    "font_url": "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
}

