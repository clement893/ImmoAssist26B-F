# Fix Migration 036 Issue

## Problem

Migration `036_fix_transaction_actions_columns` failed in production because the revision ID was too long (36 characters > 32 character limit for `alembic_version.version_num`).

**Error:**
```
sqlalchemy.exc.DataError: (psycopg2.errors.StringDataRightTruncation) 
value too long for type character varying(32)
```

**Symptoms:**
- API returns 500 error: `column real_estate_transactions.current_action_code does not exist`
- Database schema is out of sync with code

## Solution

The migration file has been fixed with a shorter revision ID (`036_fix_txn_actions` instead of `036_fix_transaction_actions_columns`).

### Step 1: Clean up production database

Run the fix script to clean up any bad state:

```bash
# On Railway or local environment
cd backend
python scripts/fix_migration_036.py
```

This script will:
1. Check if required columns exist
2. Add missing columns if needed
3. Remove any bad `alembic_version` entries
4. Update the version to the correct one

### Step 2: Run migrations

After cleaning up, run migrations normally:

```bash
# On Railway (via Railway CLI or dashboard)
alembic upgrade head

# Or locally
cd backend
alembic upgrade head
```

### Alternative: Manual SQL Fix

If you can't run the Python script, you can fix it manually with SQL:

```sql
-- 1. Check current state
SELECT version_num FROM alembic_version;
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'real_estate_transactions' 
AND column_name IN ('current_action_code', 'last_action_at', 'action_count');

-- 2. Add missing columns (if needed)
ALTER TABLE real_estate_transactions 
ADD COLUMN IF NOT EXISTS current_action_code VARCHAR(50);

ALTER TABLE real_estate_transactions 
ADD COLUMN IF NOT EXISTS last_action_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE real_estate_transactions 
ADD COLUMN IF NOT EXISTS action_count INTEGER DEFAULT 0;

-- 3. Remove bad version entry (if exists)
DELETE FROM alembic_version 
WHERE version_num LIKE '036_fix_transaction%';

-- 4. Update version to correct one (if current version is 035)
UPDATE alembic_version 
SET version_num = '036_fix_txn_actions'
WHERE version_num = '035_create_user_availabilities';

-- 5. Verify
SELECT version_num FROM alembic_version;
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'real_estate_transactions' 
AND column_name IN ('current_action_code', 'last_action_at', 'action_count');
```

## Verification

After fixing, verify the database is in the correct state:

1. Check alembic version:
   ```sql
   SELECT version_num FROM alembic_version;
   ```
   Should show: `036_fix_txn_actions`

2. Check columns exist:
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'real_estate_transactions' 
   AND column_name IN ('current_action_code', 'last_action_at', 'action_count');
   ```
   Should return 3 rows.

3. Test API endpoint:
   ```bash
   curl https://your-api-url/api/v1/transactions/
   ```
   Should return 200 OK (not 500).

## Prevention

To prevent this issue in the future:
- Keep revision IDs under 32 characters
- Use shorter, descriptive names like `036_fix_txn_actions` instead of `036_fix_transaction_actions_columns`
- Test migrations locally before deploying
