-- Simple SQL script to make clement@nukleo.com superadmin
-- Execute this directly in your PostgreSQL database

-- 1. Ensure superadmin role exists
INSERT INTO roles (name, slug, description, is_system, is_active, created_at, updated_at)
VALUES ('Super Admin', 'superadmin', 'Super administrator with full system access', true, true, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- 2. Add superadmin role to user clement@nukleo.com
INSERT INTO user_roles (user_id, role_id, created_at)
SELECT u.id, r.id, NOW()
FROM users u
CROSS JOIN roles r
WHERE u.email = 'clement@nukleo.com'
  AND r.slug = 'superadmin'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- 3. Verify (optional - shows the result)
SELECT 
    u.email,
    r.name as role_name,
    ur.created_at as assigned_at
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'clement@nukleo.com' AND r.slug = 'superadmin';


