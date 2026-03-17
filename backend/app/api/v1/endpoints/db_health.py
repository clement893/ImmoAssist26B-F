"""
Database Health Check Endpoint
Comprehensive database health check for monitoring
"""

from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import text

from app.core.database import AsyncSessionLocal
from app.core.config import settings

router = APIRouter()

# Expected tables
EXPECTED_TABLES = [
    'users', 'roles', 'permissions', 'role_permissions', 'user_roles',
    'teams', 'team_members', 'invitations',
    'plans', 'subscriptions', 'invoices',
    'projects', 'themes', 'files', 'api_keys', 'webhook_events'
]


@router.get("/", response_model=Dict[str, Any])
async def database_health_check() -> Dict[str, Any]:
    """
    Comprehensive database health check
    
    Returns:
        Database health status with detailed information
    """
    async with AsyncSessionLocal() as session:
        health_status = {
            "status": "healthy",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "database_url": str(settings.DATABASE_URL).split("@")[1] if "@" in str(settings.DATABASE_URL) else "configured",
            "checks": {}
        }
        
        issues = []
        
        try:
            # 1. Check tables exist
            result = await session.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_type = 'BASE TABLE'
                ORDER BY table_name;
            """))
            existing_tables = {row[0] for row in result}
            expected_set = set(EXPECTED_TABLES)
            
            missing_tables = expected_set - existing_tables
            extra_tables = existing_tables - expected_set
            
            health_status["checks"]["tables"] = {
                "status": "ok" if not missing_tables else "warning",
                "expected": len(EXPECTED_TABLES),
                "found": len(existing_tables),
                "missing": list(missing_tables),
                "extra": list(extra_tables),
                "all_tables": sorted(existing_tables)
            }
            
            if missing_tables:
                issues.append(f"Missing tables: {', '.join(missing_tables)}")
            
            # 2. Check table structures
            structure_checks = {}
            for table_name in EXPECTED_TABLES:
                if table_name in existing_tables:
                    try:
                        result = await session.execute(text(f"""
                            SELECT column_name, data_type, is_nullable
                            FROM information_schema.columns
                            WHERE table_name = :table_name
                            ORDER BY ordinal_position;
                        """), {"table_name": table_name})
                        
                        columns = {row[0]: {'type': row[1], 'nullable': row[2] == 'YES'} for row in result}
                        structure_checks[table_name] = {
                            "status": "ok",
                            "column_count": len(columns),
                            "columns": list(columns.keys())
                        }
                    except Exception as e:
                        structure_checks[table_name] = {
                            "status": "error",
                            "error": str(e)[:100]
                        }
                        issues.append(f"Error checking {table_name}: {str(e)[:50]}")
            
            health_status["checks"]["structure"] = structure_checks
            
            # 3. Data integrity checks
            integrity_checks = {}
            
            # Check duplicate emails
            try:
                result = await session.execute(text("""
                    SELECT email, COUNT(*) as count
                    FROM users
                    GROUP BY email
                    HAVING COUNT(*) > 1;
                """))
                duplicates = result.fetchall()
                integrity_checks["duplicate_emails"] = {
                    "status": "ok" if not duplicates else "error",
                    "count": len(duplicates),
                    "details": [{"email": row[0], "count": row[1]} for row in duplicates]
                }
                if duplicates:
                    issues.append(f"Found {len(duplicates)} duplicate emails")
            except Exception as e:
                integrity_checks["duplicate_emails"] = {
                    "status": "error",
                    "error": str(e)[:100]
                }
            
            # Check orphaned subscriptions
            try:
                result = await session.execute(text("""
                    SELECT COUNT(*) FROM subscriptions s
                    LEFT JOIN users u ON s.user_id = u.id
                    WHERE u.id IS NULL;
                """))
                orphaned = result.scalar()
                integrity_checks["orphaned_subscriptions"] = {
                    "status": "ok" if orphaned == 0 else "warning",
                    "count": orphaned
                }
                if orphaned > 0:
                    issues.append(f"Found {orphaned} orphaned subscriptions")
            except Exception as e:
                integrity_checks["orphaned_subscriptions"] = {
                    "status": "error",
                    "error": str(e)[:100]
                }
            
            # Check orphaned team members
            try:
                result = await session.execute(text("""
                    SELECT COUNT(*) FROM team_members tm
                    LEFT JOIN teams t ON tm.team_id = t.id
                    LEFT JOIN users u ON tm.user_id = u.id
                    WHERE t.id IS NULL OR u.id IS NULL;
                """))
                orphaned = result.scalar()
                integrity_checks["orphaned_team_members"] = {
                    "status": "ok" if orphaned == 0 else "warning",
                    "count": orphaned
                }
                if orphaned > 0:
                    issues.append(f"Found {orphaned} orphaned team members")
            except Exception as e:
                integrity_checks["orphaned_team_members"] = {
                    "status": "error",
                    "error": str(e)[:100]
                }
            
            # Check active themes
            try:
                result = await session.execute(text("""
                    SELECT COUNT(*) FROM themes WHERE is_active = true;
                """))
                active_themes = result.scalar()
                integrity_checks["active_themes"] = {
                    "status": "ok" if active_themes <= 1 else "warning",
                    "count": active_themes,
                    "message": "Should be 0 or 1"
                }
                if active_themes > 1:
                    issues.append(f"Found {active_themes} active themes (should be 0-1)")
            except Exception as e:
                integrity_checks["active_themes"] = {
                    "status": "error",
                    "error": str(e)[:100]
                }
            
            health_status["checks"]["integrity"] = integrity_checks
            
            # 4. Statistics
            stats = {}
            for table in sorted(EXPECTED_TABLES):
                try:
                    result = await session.execute(text(f"SELECT COUNT(*) FROM {table};"))
                    count = result.scalar()
                    stats[table] = count
                except Exception as e:
                    stats[table] = f"Error: {str(e)[:50]}"
            
            health_status["checks"]["statistics"] = stats
            
            # 5. Index check
            try:
                result = await session.execute(text("""
                    SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';
                """))
                index_count = result.scalar()
                health_status["checks"]["indexes"] = {
                    "status": "ok",
                    "count": index_count
                }
            except Exception as e:
                health_status["checks"]["indexes"] = {
                    "status": "error",
                    "error": str(e)[:100]
                }
            
            # Determine overall status
            if issues:
                health_status["status"] = "warning" if len(issues) < 3 else "error"
                health_status["issues"] = issues
            
        except Exception as e:
            health_status["status"] = "error"
            health_status["error"] = str(e)
            health_status["checks"] = {}
        
        return health_status

