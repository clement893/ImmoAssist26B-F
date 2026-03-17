-- Database Health Check SQL Script
-- Run these queries in Railway's database console or via psql
-- Copy and paste each section to check your database health

-- ============================================================================
-- 1. CHECK ALL TABLES EXIST
-- ============================================================================
SELECT 
    table_name,
    CASE WHEN table_name IN (
        'users', 'roles', 'permissions', 'role_permissions', 'user_roles',
        'teams', 'team_members', 'invitations',
        'plans', 'subscriptions', 'invoices',
        'projects', 'themes', 'files', 'api_keys', 'webhook_events'
    ) THEN '✅ Expected' ELSE 'ℹ️  Extra' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY status DESC, table_name;

-- Expected tables (should see all of these):
-- users, roles, permissions, role_permissions, user_roles
-- teams, team_members, invitations
-- plans, subscriptions, invoices
-- projects, themes, files, api_keys, webhook_events

-- ============================================================================
-- 2. CHECK CRITICAL TABLE STRUCTURES
-- ============================================================================

-- Users table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Files table structure (should have Integer IDs, not UUID)
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'files'
ORDER BY ordinal_position;

-- ============================================================================
-- 3. CHECK INDEXES ON FOREIGN KEYS
-- ============================================================================
SELECT
    tc.table_name,
    kcu.column_name,
    CASE WHEN idx.indexname IS NULL THEN '❌ MISSING INDEX' ELSE '✅ Has Index' END as index_status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN pg_indexes idx 
    ON idx.tablename = tc.table_name 
    AND idx.indexdef LIKE '%' || kcu.column_name || '%'
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- 4. DATA INTEGRITY CHECKS
-- ============================================================================

-- Check for duplicate emails (should return 0 rows)
SELECT email, COUNT(*) as count
FROM users
GROUP BY email
HAVING COUNT(*) > 1;

-- Check for orphaned subscriptions (should return 0)
SELECT COUNT(*) as orphaned_subscriptions
FROM subscriptions s
LEFT JOIN users u ON s.user_id = u.id
WHERE u.id IS NULL;

-- Check for orphaned team members (should return 0)
SELECT COUNT(*) as orphaned_team_members
FROM team_members tm
LEFT JOIN teams t ON tm.team_id = t.id
LEFT JOIN users u ON tm.user_id = u.id
WHERE t.id IS NULL OR u.id IS NULL;

-- Check for multiple active themes (should return 0 or 1)
SELECT COUNT(*) as active_themes_count
FROM themes 
WHERE is_active = true;
-- Should be 0 or 1, not more

-- Check for expired pending invitations
SELECT COUNT(*) as expired_pending_invitations
FROM invitations
WHERE status = 'pending' AND expires_at < NOW();

-- ============================================================================
-- 5. DATABASE STATISTICS
-- ============================================================================

-- Record counts for each table
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'roles', COUNT(*) FROM roles
UNION ALL
SELECT 'permissions', COUNT(*) FROM permissions
UNION ALL
SELECT 'role_permissions', COUNT(*) FROM role_permissions
UNION ALL
SELECT 'user_roles', COUNT(*) FROM user_roles
UNION ALL
SELECT 'teams', COUNT(*) FROM teams
UNION ALL
SELECT 'team_members', COUNT(*) FROM team_members
UNION ALL
SELECT 'invitations', COUNT(*) FROM invitations
UNION ALL
SELECT 'plans', COUNT(*) FROM plans
UNION ALL
SELECT 'subscriptions', COUNT(*) FROM subscriptions
UNION ALL
SELECT 'invoices', COUNT(*) FROM invoices
UNION ALL
SELECT 'projects', COUNT(*) FROM projects
UNION ALL
SELECT 'themes', COUNT(*) FROM themes
UNION ALL
SELECT 'files', COUNT(*) FROM files
UNION ALL
SELECT 'api_keys', COUNT(*) FROM api_keys
UNION ALL
SELECT 'webhook_events', COUNT(*) FROM webhook_events
ORDER BY table_name;

-- Total indexes count
SELECT COUNT(*) as total_indexes
FROM pg_indexes 
WHERE schemaname = 'public';

-- Total foreign keys count
SELECT COUNT(*) as total_foreign_keys
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY' 
AND table_schema = 'public';

-- ============================================================================
-- 6. CHECK CRITICAL CONSTRAINTS
-- ============================================================================

-- Check unique constraints
SELECT
    tc.table_name,
    tc.constraint_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'UNIQUE'
AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- Verify users.email is unique
SELECT 
    COUNT(*) as total_users,
    COUNT(DISTINCT email) as unique_emails,
    COUNT(*) - COUNT(DISTINCT email) as duplicate_emails
FROM users;

-- ============================================================================
-- 7. CHECK TIMESTAMP COLUMNS ARE TIMEZONE-AWARE
-- ============================================================================
SELECT 
    table_name,
    column_name,
    data_type,
    CASE 
        WHEN data_type = 'timestamp with time zone' THEN '✅ Timezone-aware'
        WHEN data_type LIKE '%timestamp%' THEN '⚠️  Not timezone-aware'
        ELSE 'N/A'
    END as timezone_status
FROM information_schema.columns
WHERE table_schema = 'public'
AND (column_name LIKE '%_at' OR column_name IN ('created_at', 'updated_at'))
AND data_type LIKE '%timestamp%'
ORDER BY table_name, column_name;

-- ============================================================================
-- SUMMARY QUERY - Quick Health Check
-- ============================================================================
SELECT 
    'Tables' as check_type,
    COUNT(*) as count,
    CASE WHEN COUNT(*) >= 16 THEN '✅ OK' ELSE '❌ Missing tables' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
UNION ALL
SELECT 
    'Indexes',
    COUNT(*),
    CASE WHEN COUNT(*) >= 50 THEN '✅ OK' ELSE '⚠️  Low index count' END
FROM pg_indexes 
WHERE schemaname = 'public'
UNION ALL
SELECT 
    'Foreign Keys',
    COUNT(*),
    '✅ OK' as status
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY' 
AND table_schema = 'public'
UNION ALL
SELECT 
    'Users',
    COUNT(*),
    '✅ OK' as status
FROM users
UNION ALL
SELECT 
    'Active Users',
    COUNT(*),
    '✅ OK' as status
FROM users WHERE is_active = true;

