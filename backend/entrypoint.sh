#!/bin/sh
# Don't use set -e to allow graceful error handling

# Use PORT environment variable if set, otherwise default to 8000
# Railway automatically sets PORT to the port the service should listen on
PORT=${PORT:-8000}

echo "=========================================="
echo "Backend startup configuration:"
echo "PORT environment variable: ${PORT}"
echo "DATABASE_URL set: $([ -n "$DATABASE_URL" ] && echo 'yes' || echo 'no')"
echo "Environment: ${ENVIRONMENT:-development}"
echo "Python version: $(python --version 2>&1 || echo 'unknown')"
echo "Working directory: $(pwd)"
echo "=========================================="

# Verify Python and uvicorn are available
if ! command -v python >/dev/null 2>&1; then
    echo "ERROR: Python not found!"
    exit 1
fi

if ! python -c "import uvicorn" 2>/dev/null; then
    echo "ERROR: uvicorn not installed!"
    exit 1
fi

# Run database migrations before starting the server (non-blocking with timeout)
# Use timeout to prevent migrations from blocking startup indefinitely
if [ -n "$DATABASE_URL" ]; then
    echo "=========================================="
    echo "Running database migrations..."
    echo "=========================================="
    
    # Note: Alembic env.py handles URL conversion automatically
    # No need to modify DATABASE_URL here
    
    # Check for multiple heads (migration overlap) and merge if needed
    echo "Checking for migration conflicts..."
    HEADS_OUTPUT=$(alembic heads 2>&1)
    # Count actual head revisions (lines that contain revision IDs)
    HEAD_COUNT=$(echo "$HEADS_OUTPUT" | grep -E "^[a-f0-9]+_[a-z_]+" | wc -l | tr -d ' ')
    
    # Check if merge migration 023 already exists in filesystem
    MERGE_FILE_EXISTS=$(ls alembic/versions/023_merge_migration_heads.py 2>/dev/null || echo "")
    # Also check if any merge migration file exists (pattern: *merge*.py)
    ANY_MERGE_EXISTS=$(ls alembic/versions/*merge*.py 2>/dev/null | head -1 || echo "")
    
    # If multiple heads detected and no merge exists, try to merge them
    if [ "$HEAD_COUNT" -gt 1 ] && [ -z "$MERGE_FILE_EXISTS" ] && [ -z "$ANY_MERGE_EXISTS" ]; then
        echo "⚠️  Multiple migration heads detected ($HEAD_COUNT heads). Attempting to merge..."
        # Get all head revisions
        HEADS=$(echo "$HEADS_OUTPUT" | grep -E "^[a-f0-9]+_[a-z_]+" | tr '\n' ' ')
        if [ -n "$HEADS" ]; then
            echo "Merging heads: $HEADS"
            # Create a merge migration
            MERGE_OUTPUT=$(alembic merge -m "Merge migration heads" $HEADS 2>&1)
            if echo "$MERGE_OUTPUT" | grep -qE "(Generating|Created)"; then
                echo "✅ Merge migration created successfully"
            else
                echo "⚠️  Could not create merge migration (may already exist or error occurred)"
            fi
        fi
    elif [ "$HEAD_COUNT" -gt 1 ]; then
        if [ -n "$MERGE_FILE_EXISTS" ]; then
            echo "ℹ️  Multiple heads detected but merge migration 023 already exists - will use existing merge"
        elif [ -n "$ANY_MERGE_EXISTS" ]; then
            echo "ℹ️  Multiple heads detected but merge migration already exists: $(basename $ANY_MERGE_EXISTS) - will use existing merge"
        fi
    fi
    
    # Run migrations with timeout (60 seconds max) - don't fail if migrations fail
    # Use timeout command if available, otherwise run directly
    if command -v timeout >/dev/null 2>&1; then
        MIGRATION_RESULT=$(timeout 60 alembic upgrade head 2>&1)
        MIGRATION_EXIT_CODE=$?
        echo "$MIGRATION_RESULT"
        if [ $MIGRATION_EXIT_CODE -eq 0 ]; then
            MIGRATION_STATUS="success"
        elif echo "$MIGRATION_RESULT" | grep -q "overlaps with other requested revisions"; then
            echo "⚠️  Migration overlap detected. Attempting to resolve..."
            # Try to merge heads again
            HEADS=$(alembic heads 2>&1 | grep -oE "[a-f0-9]+_[a-z_]+" | tr '\n' ' ')
            if [ -n "$HEADS" ]; then
                alembic merge -m "Auto-merge migration heads" $HEADS 2>&1 || true
                # Retry upgrade after merge
                timeout 60 alembic upgrade head 2>&1 && MIGRATION_STATUS="success" || MIGRATION_STATUS="timeout_or_failed"
            else
                MIGRATION_STATUS="timeout_or_failed"
            fi
        else
            MIGRATION_STATUS="timeout_or_failed"
        fi
    else
        # Fallback: run without timeout if timeout command not available
        MIGRATION_RESULT=$(alembic upgrade head 2>&1)
        MIGRATION_EXIT_CODE=$?
        echo "$MIGRATION_RESULT"
        if [ $MIGRATION_EXIT_CODE -eq 0 ]; then
            MIGRATION_STATUS="success"
        elif echo "$MIGRATION_RESULT" | grep -q "overlaps with other requested revisions"; then
            echo "⚠️  Migration overlap detected. Attempting to resolve..."
            # Try to merge heads again
            HEADS=$(alembic heads 2>&1 | grep -oE "[a-f0-9]+_[a-z_]+" | tr '\n' ' ')
            if [ -n "$HEADS" ]; then
                alembic merge -m "Auto-merge migration heads" $HEADS 2>&1 || true
                # Retry upgrade after merge
                alembic upgrade head 2>&1 && MIGRATION_STATUS="success" || MIGRATION_STATUS="failed"
            else
                MIGRATION_STATUS="failed"
            fi
        else
            MIGRATION_STATUS="failed"
        fi
    fi
    
    if [ "$MIGRATION_STATUS" = "success" ]; then
        echo "✅ Database migrations completed successfully"
        
        # Verify avatar column migration was applied
        echo "=========================================="
        echo "Verifying avatar column migration..."
        echo "=========================================="
        if command -v timeout >/dev/null 2>&1; then
            timeout 30 python scripts/ensure_avatar_migration.py 2>&1 || echo "⚠️  Avatar column verification skipped (will be created by auto-migration if needed)"
        else
            python scripts/ensure_avatar_migration.py 2>&1 || echo "⚠️  Avatar column verification skipped (will be created by auto-migration if needed)"
        fi
        
        # Ensure default theme exists after migrations (with timeout)
        echo "=========================================="
        echo "Ensuring default theme exists..."
        echo "=========================================="
        if command -v timeout >/dev/null 2>&1; then
            timeout 30 python scripts/create_default_theme.py 2>&1 || echo "⚠️  Could not ensure default theme (will be created on first API call)"
        else
            python scripts/create_default_theme.py 2>&1 || echo "⚠️  Could not ensure default theme (will be created on first API call)"
        fi
    else
        echo "⚠️  Database migrations failed, timed out, or skipped!"
        echo "This may be due to:"
        echo "  - Database connection issues"
        echo "  - Migration conflicts"
        echo "  - Missing database permissions"
        echo "  - Migration timeout (taking too long)"
        echo ""
        echo "Continuing startup anyway - the application will attempt to start."
        echo "Database operations may fail until migrations are resolved."
        echo "Migrations will be retried on next startup or can be run manually."
    fi
else
    echo "⚠️  Warning: DATABASE_URL not set, skipping migrations..."
    echo "The application will start but database operations may fail."
fi

# Start Uvicorn directly for FastAPI
# Railway will route traffic to this port
echo "=========================================="
echo "Starting Uvicorn on 0.0.0.0:$PORT..."
echo "=========================================="
echo "Application will be available at http://0.0.0.0:$PORT"
echo "Health check endpoint: http://0.0.0.0:$PORT/api/v1/health"
echo "=========================================="

# Use exec to replace shell process with uvicorn
# This ensures signals are properly handled
exec python -m uvicorn app.main:app --host 0.0.0.0 --port "$PORT" --log-level info --access-log

