-- SQL script to create Hype Modern Theme (ID 34) - Complex, Modern, Hype Design
-- Run this directly on the database: psql $DATABASE_URL -f scripts/create_hype_theme.sql

-- Check if Hype Theme exists
DO $$
BEGIN
    -- Check if Hype Theme (ID 34) already exists
    IF NOT EXISTS (SELECT 1 FROM themes WHERE id = 34) THEN
        -- Create Hype Modern Theme with complex premium configuration
        INSERT INTO themes (id, name, display_name, description, config, is_active, created_by, created_at, updated_at)
        VALUES (
            34,
            'HypeModernTheme',
            'Hype Modern Theme',
            'Thème moderne et hype avec design complexe : gradients néon, glassmorphism avancé, effets de lueur, animations fluides, et palette de couleurs vibrantes. Parfait pour des interfaces modernes et attractives.',
            '{
                "mode": "system",
                "primary_color": "#00F5FF",
                "secondary_color": "#FF00F5",
                "danger_color": "#FF006E",
                "warning_color": "#FFB800",
                "info_color": "#00D9FF",
                "success_color": "#00FF88",
                "font_family": "Inter",
                "border_radius": "16px",
                "typography": {
                    "fontFamily": "Inter, system-ui, -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', sans-serif",
                    "fontFamilyHeading": "Inter, system-ui, -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', sans-serif",
                    "fontFamilySubheading": "Inter, system-ui, -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', sans-serif",
                    "fontFamilyMono": "''Fira Code'', ''Courier New'', monospace",
                    "fontSize": {
                        "xs": "11px",
                        "sm": "13px",
                        "base": "16px",
                        "lg": "19px",
                        "xl": "22px",
                        "2xl": "26px",
                        "3xl": "32px",
                        "4xl": "40px",
                        "5xl": "48px",
                        "6xl": "64px"
                    },
                    "fontWeight": {
                        "normal": "400",
                        "medium": "500",
                        "semibold": "600",
                        "bold": "700",
                        "extrabold": "800",
                        "black": "900"
                    },
                    "lineHeight": {
                        "tight": "1.2",
                        "normal": "1.5",
                        "relaxed": "1.75",
                        "loose": "2"
                    },
                    "textHeading": "#FFFFFF",
                    "textSubheading": "#E0E0E0",
                    "textBody": "#F5F5F5",
                    "textSecondary": "#B0B0B0",
                    "textLink": "#00F5FF"
                },
                "colors": {
                    "background": "#0A0A0F",
                    "foreground": "#FFFFFF",
                    "primary": "#00F5FF",
                    "primaryForeground": "#000000",
                    "secondary": "#FF00F5",
                    "secondaryForeground": "#FFFFFF",
                    "accent": "#FFB800",
                    "accentForeground": "#000000",
                    "muted": "#1A1A24",
                    "mutedForeground": "#A0A0A0",
                    "border": "#2A2A3A",
                    "input": "#1A1A24",
                    "ring": "#00F5FF",
                    "destructive": "#FF006E",
                    "destructiveForeground": "#FFFFFF",
                    "success": "#00FF88",
                    "successForeground": "#000000",
                    "warning": "#FFB800",
                    "warningForeground": "#000000",
                    "info": "#00D9FF",
                    "infoForeground": "#000000"
                },
                "spacing": {
                    "unit": "8px",
                    "xs": "4px",
                    "sm": "8px",
                    "md": "16px",
                    "lg": "24px",
                    "xl": "32px",
                    "2xl": "48px",
                    "3xl": "64px",
                    "4xl": "96px",
                    "5xl": "128px"
                },
                "borderRadius": {
                    "none": "0",
                    "sm": "6px",
                    "base": "8px",
                    "md": "12px",
                    "lg": "16px",
                    "xl": "20px",
                    "2xl": "24px",
                    "3xl": "32px",
                    "full": "9999px"
                },
                "shadow": {
                    "sm": "0 2px 4px rgba(0, 245, 255, 0.1), 0 0 8px rgba(0, 245, 255, 0.05)",
                    "base": "0 4px 8px rgba(0, 245, 255, 0.15), 0 0 16px rgba(0, 245, 255, 0.1)",
                    "md": "0 8px 16px rgba(0, 245, 255, 0.2), 0 0 24px rgba(0, 245, 255, 0.15)",
                    "lg": "0 16px 32px rgba(0, 245, 255, 0.25), 0 0 48px rgba(0, 245, 255, 0.2)",
                    "xl": "0 24px 48px rgba(0, 245, 255, 0.3), 0 0 64px rgba(0, 245, 255, 0.25)",
                    "2xl": "0 32px 64px rgba(0, 245, 255, 0.35), 0 0 96px rgba(0, 245, 255, 0.3)",
                    "neon": "0 0 20px rgba(0, 245, 255, 0.5), 0 0 40px rgba(0, 245, 255, 0.3), 0 0 60px rgba(0, 245, 255, 0.2)",
                    "neonHover": "0 0 30px rgba(0, 245, 255, 0.7), 0 0 60px rgba(0, 245, 255, 0.5), 0 0 90px rgba(0, 245, 255, 0.3)",
                    "inner": "inset 0 2px 4px rgba(0, 245, 255, 0.1)"
                },
                "effects": {
                    "glassmorphism": "backdrop-filter: blur(20px) saturate(200%); background: rgba(26, 26, 36, 0.8); border: 1px solid rgba(0, 245, 255, 0.2); box-shadow: 0 8px 32px rgba(0, 245, 255, 0.1);",
                    "glassmorphismLight": "backdrop-filter: blur(16px) saturate(180%); background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2);",
                    "gradientPrimary": "linear-gradient(135deg, #00F5FF 0%, #00D9FF 50%, #00B8FF 100%)",
                    "gradientSecondary": "linear-gradient(135deg, #FF00F5 0%, #FF00CC 50%, #FF0099 100%)",
                    "gradientAccent": "linear-gradient(135deg, #FFB800 0%, #FF9500 50%, #FF6B00 100%)",
                    "gradientNeon": "linear-gradient(135deg, #00F5FF 0%, #FF00F5 50%, #FFB800 100%)",
                    "gradientRadial": "radial-gradient(circle at 50% 50%, rgba(0, 245, 255, 0.3) 0%, rgba(255, 0, 245, 0.2) 50%, transparent 100%)",
                    "glow": "0 0 20px rgba(0, 245, 255, 0.4), 0 0 40px rgba(0, 245, 255, 0.3), 0 0 60px rgba(0, 245, 255, 0.2)",
                    "glowHover": "0 0 30px rgba(0, 245, 255, 0.6), 0 0 60px rgba(0, 245, 255, 0.4), 0 0 90px rgba(0, 245, 255, 0.3)",
                    "glowSecondary": "0 0 20px rgba(255, 0, 245, 0.4), 0 0 40px rgba(255, 0, 245, 0.3), 0 0 60px rgba(255, 0, 245, 0.2)",
                    "shimmer": "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent)",
                    "shimmerAnimated": "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)",
                    "animation": "smooth, modern, hype, premium",
                    "transition": "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                },
                "components": {
                    "button": {
                        "style": "hype-modern",
                        "hover": "glowHover",
                        "transition": "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        "shadow": "neon",
                        "gradient": "gradientPrimary",
                        "animation": "pulse-on-hover"
                    },
                    "card": {
                        "style": "glassmorphism",
                        "border": "neon-glow",
                        "shadow": "xl",
                        "hover": "lift-with-glow",
                        "background": "gradientRadial"
                    },
                    "input": {
                        "style": "modern-glass",
                        "focus": "neon-glow",
                        "border": "gradient",
                        "background": "glassmorphismLight"
                    },
                    "modal": {
                        "style": "glassmorphism",
                        "backdrop": "blur-heavy",
                        "animation": "smooth-scale",
                        "border": "neon"
                    },
                    "badge": {
                        "style": "neon-glow",
                        "shadow": "neon"
                    }
                },
                "animations": {
                    "keyframes": {
                        "pulse": {
                            "0%, 100%": { "opacity": 1, "transform": "scale(1)" },
                            "50%": { "opacity": 0.8, "transform": "scale(1.05)" }
                        },
                        "glow": {
                            "0%, 100%": { "boxShadow": "0 0 20px rgba(0, 245, 255, 0.4)" },
                            "50%": { "boxShadow": "0 0 40px rgba(0, 245, 255, 0.8)" }
                        },
                        "shimmer": {
                            "0%": { "backgroundPosition": "-1000px 0" },
                            "100%": { "backgroundPosition": "1000px 0" }
                        },
                        "float": {
                            "0%, 100%": { "transform": "translateY(0px)" },
                            "50%": { "transform": "translateY(-10px)" }
                        }
                    },
                    "durations": {
                        "fast": "200ms",
                        "normal": "300ms",
                        "slow": "500ms",
                        "slower": "1000ms"
                    },
                    "easings": {
                        "smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
                        "bounce": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
                        "elastic": "cubic-bezier(0.68, -0.6, 0.32, 1.6)"
                    }
                },
                "breakpoint": {
                    "sm": "640px",
                    "md": "768px",
                    "lg": "1024px",
                    "xl": "1280px",
                    "2xl": "1536px"
                }
            }'::jsonb,
            false,
            1,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ Created Hype Modern Theme (ID 34) - Complex Modern Hype Design';
    ELSE
        RAISE NOTICE 'ℹ️  Hype Modern Theme (ID 34) already exists';
    END IF;
END $$;
