-- SQL script to create TemplateTheme (ID 32) if it doesn't exist
-- Run this directly on the database if migrations fail
-- Usage: psql $DATABASE_URL -f scripts/create_default_theme.sql

-- Check if TemplateTheme exists
DO $$
BEGIN
    -- Check if TemplateTheme (ID 32) already exists
    IF NOT EXISTS (SELECT 1 FROM themes WHERE id = 32) THEN
        -- Check if any theme is currently active
        DECLARE
            has_active_theme BOOLEAN;
        BEGIN
            SELECT EXISTS(SELECT 1 FROM themes WHERE is_active = true) INTO has_active_theme;
            
            -- Create TemplateTheme - activate it only if no other theme is active
            INSERT INTO themes (id, name, display_name, description, config, is_active, created_by, created_at, updated_at)
            VALUES (
                32,
                'TemplateTheme',
                'Template Theme',
                'Master theme that controls all components',
                '{"mode": "system", "primary_color": "#3b82f6", "secondary_color": "#8b5cf6", "danger_color": "#ef4444", "warning_color": "#f59e0b", "info_color": "#06b6d4", "success_color": "#10b981", "font_family": "Inter", "border_radius": "8px"}'::jsonb,
                NOT has_active_theme,
                1,
                NOW(),
                NOW()
            );
            
            RAISE NOTICE '✅ Created TemplateTheme (ID 32) - Active: %', NOT has_active_theme;
        END;
    ELSE
        -- TemplateTheme exists, ensure it's active if no other theme is active
        DECLARE
            has_active_theme BOOLEAN;
        BEGIN
            SELECT EXISTS(SELECT 1 FROM themes WHERE is_active = true AND id != 32) INTO has_active_theme;
            
            IF NOT has_active_theme THEN
                UPDATE themes SET is_active = true, updated_at = NOW() WHERE id = 32;
                RAISE NOTICE '✅ Activated TemplateTheme (ID 32)';
            ELSE
                RAISE NOTICE 'ℹ️  TemplateTheme (ID 32) already exists and another theme is active';
            END IF;
        END;
    END IF;
END $$;

