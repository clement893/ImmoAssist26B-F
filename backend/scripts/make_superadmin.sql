-- Script to make a user superadmin directly in the database
-- Usage: psql <database_url> -f scripts/make_superadmin.sql
-- Or execute these SQL commands directly in your database client

-- Set the email of the user to make superadmin
\set email 'clement@nukleo.com'

-- Step 1: Find or create the superadmin role
INSERT INTO roles (name, slug, description, is_system, is_active, created_at, updated_at)
VALUES ('Super Admin', 'superadmin', 'Super administrator with full system access', true, true, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Step 2: Get the user ID and role ID
DO $$
DECLARE
    v_user_id INTEGER;
    v_role_id INTEGER;
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id FROM users WHERE email = :'email';
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', :'email';
    END IF;
    
    -- Get superadmin role ID
    SELECT id INTO v_role_id FROM roles WHERE slug = 'superadmin';
    
    IF v_role_id IS NULL THEN
        RAISE EXCEPTION 'Superadmin role not found';
    END IF;
    
    -- Check if user already has superadmin role
    IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = v_user_id AND role_id = v_role_id) THEN
        RAISE NOTICE 'User % already has superadmin role', :'email';
    ELSE
        -- Add superadmin role to user
        INSERT INTO user_roles (user_id, role_id, created_at)
        VALUES (v_user_id, v_role_id, NOW())
        ON CONFLICT (user_id, role_id) DO NOTHING;
        
        RAISE NOTICE 'Successfully added superadmin role to user %', :'email';
    END IF;
END $$;

-- Verify the change
SELECT 
    u.email,
    u.id as user_id,
    r.name as role_name,
    r.slug as role_slug,
    ur.created_at as role_assigned_at
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'clement@nukleo.com' AND r.slug = 'superadmin';


