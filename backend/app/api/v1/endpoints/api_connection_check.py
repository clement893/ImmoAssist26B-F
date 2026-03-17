"""
API Connection Check Endpoint
Provides endpoint to check API connections status
"""

from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.models.user import User
from app.dependencies import is_admin_or_superadmin
from typing import Dict, List, Any, Optional
from pydantic import BaseModel
import os
import subprocess
import json
import asyncio
import logging
import re
from pathlib import Path

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api-connection-check", tags=["api-connection-check"])


class FrontendAnalysisResult(BaseModel):
    """Model for frontend analysis results sent from frontend"""
    pages: List[Dict[str, Any]]
    summary: Dict[str, int]
    timestamp: Optional[float] = None


async def run_node_script(script_path: str, args: List[str] = None) -> Dict[str, Any]:
    """
    Run a Node.js script and return its output
    Works in production by finding scripts relative to backend or project root
    """
    try:
        # Get project root - try multiple possible locations
        # In production, scripts might be at different paths
        current_file = Path(__file__)
        
        # Try different possible project root locations
        # In production, backend is typically at /app, and scripts might be at various locations
        possible_roots = [
            Path("/app"),  # Docker default - backend root
            Path("/app").parent,  # Project root if whole project is copied
            current_file.parent.parent.parent.parent.parent,  # backend/app/api/v1/endpoints -> root
            current_file.parent.parent.parent.parent.parent.parent,  # if backend is nested
            Path("/app/backend").parent,  # If backend is in /app/backend
        ]
        
        # Also try scripts directly in various locations
        script_name = Path(script_path).name
        possible_script_paths = [
            Path("/app/scripts") / script_name,  # If scripts copied to /app/scripts
            Path("/app") / script_path,  # Relative to /app
            Path("/app") / "scripts" / script_name,  # scripts/ subdirectory
        ]
        
        project_root = None
        script_full_path = None
        
        # First, try direct script paths
        for script_path_test in possible_script_paths:
            if script_path_test.exists():
                # Determine project root from script location
                if "scripts" in str(script_path_test):
                    project_root = script_path_test.parent.parent  # scripts/ is at root
                else:
                    project_root = script_path_test.parent
                script_full_path = script_path_test
                break
        
        # If not found, try relative to possible roots
        if not script_full_path:
            for root in possible_roots:
                test_path = root / script_path
                if test_path.exists():
                    project_root = root
                    script_full_path = test_path
                    break
        
        # If script not found, try to find it in scripts directory
        if not script_full_path:
            for root in possible_roots:
                scripts_dir = root / "scripts"
                if scripts_dir.exists():
                    test_path = scripts_dir / Path(script_path).name
                    if test_path.exists():
                        project_root = root
                        script_full_path = test_path
                        break
        
        # Also try scripts directly in /app/scripts (Dockerfile copies them here)
        if not script_full_path:
            direct_script = Path("/app/scripts") / Path(script_path).name
            if direct_script.exists():
                project_root = Path("/app")
                script_full_path = direct_script
        
        # Try backend/scripts as fallback (if backend is at /app)
        if not script_full_path:
            backend_scripts = Path("/app/backend/scripts") / Path(script_path).name
            if backend_scripts.exists():
                project_root = Path("/app")
                script_full_path = backend_scripts
        
        if not script_full_path or not script_full_path.exists():
            # Return helpful error with all searched paths
            searched_paths = [str(p) for p in possible_script_paths] + [str(r / script_path) for r in possible_roots]
            # Add /app/scripts to searched paths for clarity
            searched_paths.append(str(Path("/app/scripts") / Path(script_path).name))
            return {
                "success": False,
                "error": f"Script not found: {script_path}",
                "message": f"Searched in: {', '.join(searched_paths[:8])}",
                "hint": "Make sure scripts are copied to the container. Check Dockerfile COPY commands. Scripts should be at /app/scripts/ in production.",
            }
        
        # Check if node is available
        try:
            node_check = subprocess.run(
                ["node", "--version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if node_check.returncode != 0:
                return {
                    "success": False,
                    "error": "Node.js is not available. Please install Node.js in the container.",
                }
        except FileNotFoundError:
            return {
                "success": False,
                "error": "Node.js is not installed. Please install Node.js in the container.",
            }
        
        # Build command with sanitized arguments
        cmd = ["node", str(script_full_path)]
        if args:
            # Sanitize arguments to prevent command injection
            # Defense in depth: strict validation since we use shell=False
            # Note: shlex.quote is NOT used here because shell=False passes args directly
            # Using shlex.quote would add literal quotes that become part of the argument
            safe_args = []
            for arg in args:
                # Convert to string if not already
                arg_str = str(arg)
                
                # Validate argument contains only safe characters
                # Only allow alphanumeric, hyphens, underscores, dots, slashes, equals
                if not re.match(r'^[a-zA-Z0-9_\-./=]+$', arg_str):
                    logger.warning(
                        f"Rejected unsafe argument (invalid characters): {arg_str[:50]}...",
                        extra={"arg_length": len(arg_str), "arg_preview": arg_str[:50]}
                    )
                    continue
                
                # Additional check: ensure no shell metacharacters
                # This is redundant with regex but provides extra safety layer
                dangerous_chars = [';', '&', '|', '`', '$', '(', ')', '<', '>', '\n', '\r', '\t', '\0', ' ', '\x00']
                if any(char in arg_str for char in dangerous_chars):
                    logger.warning(
                        f"Rejected argument with shell metacharacters: {arg_str[:50]}...",
                        extra={"arg_length": len(arg_str), "arg_preview": arg_str[:50]}
                    )
                    continue
                
                # Additional validation: ensure argument is not empty after stripping
                if not arg_str.strip():
                    logger.warning("Rejected empty argument")
                    continue
                
                # Additional length check to prevent extremely long arguments
                if len(arg_str) > 1000:
                    logger.warning(
                        f"Rejected argument (too long): {arg_str[:50]}...",
                        extra={"arg_length": len(arg_str)}
                    )
                    continue
                
                # Argument passed all checks - add to safe list
                safe_args.append(arg_str)
            
            if safe_args:
                cmd.extend(safe_args)
            else:
                logger.info("All arguments were filtered out, proceeding with command without arguments")
        
        # Run script with sanitized command
        result = subprocess.run(
            cmd,
            cwd=str(project_root),
            capture_output=True,
            text=True,
            timeout=60,  # 60 second timeout
            shell=False,  # Explicitly disable shell to prevent injection
        )
        
        return {
            "success": result.returncode == 0,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode,
        }
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "error": "Script execution timeout (60s)",
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
        }


@router.post("/frontend/analyze", response_model=Dict[str, Any])
async def receive_frontend_analysis(
    analysis_data: FrontendAnalysisResult = Body(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Receive frontend analysis results from frontend client
    
    This endpoint allows the frontend to analyze its own files and send results to backend.
    Useful in production where backend doesn't have access to frontend source files.
    
    Requires authentication and admin or superadmin role
    """
    # Check if user is admin or superadmin
    user_is_admin = await is_admin_or_superadmin(current_user, db)
    if not user_is_admin:
        raise HTTPException(
            status_code=403,
            detail="This endpoint requires admin or superadmin privileges"
        )
    
    # Process the analysis data
    summary = analysis_data.summary
    pages = analysis_data.pages
    
    # Generate output string similar to Node.js script
    output_lines = []
    output_lines.append("Frontend API Connection Analysis")
    output_lines.append("=" * 50)
    output_lines.append("")
    
    if pages:
        output_lines.append("Pages analyzed:")
        for page in pages:
            output_lines.append(f"  - {page.get('path', 'Unknown')}")
            if page.get('apiCalls'):
                for call in page.get('apiCalls', []):
                    output_lines.append(f"    {call.get('method', 'GET')} {call.get('endpoint', '')}")
        output_lines.append("")
    
    output_lines.append("Summary:")
    output_lines.append(f"  Total pages analyzed: {summary.get('total', 0)}")
    output_lines.append(f"  Connected: {summary.get('connected', 0)}")
    output_lines.append(f"  Partial: {summary.get('partial', 0)}")
    output_lines.append(f"  Needs integration: {summary.get('needsIntegration', 0)}")
    output_lines.append(f"  Static: {summary.get('static', 0)}")
    
    output = "\n".join(output_lines)
    
    return {
        "success": True,
        "summary": summary,
        "output": output,
        "pages": pages,
        "source": "frontend_client",
    }


@router.get("/frontend", response_model=Dict[str, Any])
async def check_frontend_connections(
    detailed: bool = False,
    page: str = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Check frontend API connections
    
    Requires authentication and admin or superadmin role
    """
    # Check if user is admin or superadmin (using async function to avoid lazy load)
    user_is_admin = await is_admin_or_superadmin(current_user, db)
    if not user_is_admin:
        raise HTTPException(
            status_code=403,
            detail="This endpoint requires admin or superadmin privileges"
        )
    
    args = []
    if detailed:
        args.append("--detailed")
    if page:
        args.extend(["--page", page])
    
    result = await run_node_script("scripts/check-api-connections.js", args)
    
    if not result.get("success"):
        # If script not found, return instructions for frontend to analyze itself
        error_msg = result.get('error', result.get('stderr', 'Unknown error'))
        if "Script not found" in error_msg or "not found" in error_msg.lower() or "ENOENT" in error_msg:
            return {
                "success": False,
                "error": "API connection check scripts are not available in this environment.",
                "message": "Node.js scripts are not available. Use the frontend client to analyze files.",
                "hint": "The frontend can analyze its own files and send results to POST /v1/api-connection-check/frontend/analyze",
                "summary": {},
                "useFrontendAnalysis": True,
            }
        raise HTTPException(
            status_code=500,
            detail=f"Failed to run check: {error_msg}"
        )
    
    # Parse the output to extract structured data
    output = result.get("stdout", "")
    
    # Try to extract summary from output
    summary = {}
    if "Summary:" in output:
        # Extract numbers from summary
        import re
        total_match = re.search(r"Total pages analyzed: (\d+)", output)
        connected_match = re.search(r"Connected: (\d+)", output)
        partial_match = re.search(r"Partial: (\d+)", output)
        needs_match = re.search(r"Needs integration: (\d+)", output)
        static_match = re.search(r"Static: (\d+)", output)
        
        summary = {
            "total": int(total_match.group(1)) if total_match else 0,
            "connected": int(connected_match.group(1)) if connected_match else 0,
            "partial": int(partial_match.group(1)) if partial_match else 0,
            "needsIntegration": int(needs_match.group(1)) if needs_match else 0,
            "static": int(static_match.group(1)) if static_match else 0,
        }
    
    return {
        "success": True,
        "summary": summary,
        "output": output,
        "raw": result,
        "source": "node_script",
    }


@router.get("/backend", response_model=Dict[str, Any])
async def check_backend_endpoints(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Check backend API endpoints registration
    
    Requires authentication and admin or superadmin role
    """
    # Check if user is admin or superadmin (using async function to avoid lazy load)
    user_is_admin = await is_admin_or_superadmin(current_user, db)
    if not user_is_admin:
        raise HTTPException(
            status_code=403,
            detail="This endpoint requires admin or superadmin privileges"
        )
    
    result = await run_node_script("scripts/check-api-connections-backend.js")
    
    # Check if script execution actually failed (not just non-zero exit code)
    # The script may return non-zero exit code if it finds issues (unregistered modules), but that's OK
    # We only treat it as an error if there's no stdout (script didn't run) or there's an actual error
    has_output = bool(result.get("stdout", "").strip())
    has_error = bool(result.get("error"))
    
    if has_error or (not has_output and result.get("returncode") != 0):
        # If script not found or execution failed, return a helpful message
        error_msg = result.get('error', result.get('stderr', 'Unknown error'))
        if "Script not found" in error_msg or "not found" in error_msg.lower() or "ENOENT" in error_msg:
            return {
                "success": False,
                "error": "API connection check scripts are not available in this environment.",
                "message": "This feature requires Node.js scripts that are not included in the production backend container.",
                "hint": "To use this feature, ensure scripts/check-api-connections-backend.js is available in the container, or run the check locally using: pnpm api:check:backend",
                "summary": {}
            }
        raise HTTPException(
            status_code=500,
            detail=f"Failed to run check: {error_msg}"
        )
    
    output = result.get("stdout", "")
    
    # Parse the output to extract structured data
    # The script may return non-zero exit code if it finds unregistered modules, but that's OK
    summary = {}
    if "Summary:" in output or "Registered modules:" in output or "Unregistered modules:" in output:
        import re
        registered_match = re.search(r"Registered modules: (\d+)", output)
        unregistered_match = re.search(r"Unregistered modules: (\d+)", output)
        
        summary = {
            "registered": int(registered_match.group(1)) if registered_match else 0,
            "unregistered": int(unregistered_match.group(1)) if unregistered_match else 0,
        }
    
    # Also try to extract endpoint count if available
    endpoints_match = re.search(r"Found (\d+) endpoints", output)
    if endpoints_match:
        summary["totalEndpoints"] = int(endpoints_match.group(1))
    
    return {
        "success": True,
        "summary": summary,
        "output": output,
        "raw": result,
    }


@router.get("/report", response_model=Dict[str, Any])
async def generate_report(
    output_name: str = "API_CONNECTION_REPORT",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate API connection report
    
    Requires authentication and admin or superadmin role
    """
    # Check if user is admin or superadmin (using async function to avoid lazy load)
    user_is_admin = await is_admin_or_superadmin(current_user, db)
    if not user_is_admin:
        raise HTTPException(
            status_code=403,
            detail="This endpoint requires admin or superadmin privileges"
        )
    
    result = await run_node_script(
        "scripts/generate-api-connection-report.js",
        ["--output", f"{output_name}.md"]
    )
    
    # Check if script execution actually failed (not just non-zero exit code)
    # The script may return non-zero exit code if it finds issues, but that's OK
    # We only treat it as an error if there's no stdout (script didn't run) or there's an actual error
    has_output = bool(result.get("stdout", "").strip())
    has_error = bool(result.get("error"))
    
    if has_error or (not has_output and result.get("returncode") != 0):
        # If script not found or execution failed, return a helpful message
        error_msg = result.get('error', result.get('stderr', 'Unknown error'))
        if "Script not found" in error_msg or "not found" in error_msg.lower() or "ENOENT" in error_msg:
            return {
                "success": False,
                "error": "Report generation scripts are not available in this environment.",
                "message": "This feature requires Node.js scripts that are not included in the production backend container.",
                "hint": "To use this feature, ensure scripts/generate-api-connection-report.js is available in the container, or run the report locally using: pnpm api:report",
            }
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate report: {error_msg}"
        )
    
    output = result.get("stdout", "")
    
    # Try to read the generated report from various possible locations
    # In Docker, the report might be generated in different locations
    possible_roots = [
        Path("/app"),  # Docker default - backend root
        Path("/app").parent,  # Project root if whole project is copied
        Path(__file__).parent.parent.parent.parent.parent,  # backend/app/api/v1/endpoints -> root
    ]
    
    report_content = None
    report_path = None
    
    for root in possible_roots:
        test_path = root / f"{output_name}.md"
        if test_path.exists():
            report_path = test_path
            try:
                report_content = test_path.read_text(encoding="utf-8")
                break
            except Exception as e:
                logger.warning(f"Could not read report file {test_path}: {e}")
    
    # If report file not found but script ran successfully, return output
    if not report_path and has_output:
        return {
            "success": True,
            "output": output,
            "message": "Report generation completed, but report file not found in expected locations.",
            "hint": "The report may have been generated in a different location. Check the script output for details.",
            "raw": result,
        }
    
    return {
        "success": True,
        "output": output,
        "reportPath": str(report_path.relative_to(report_path.parent.parent)) if report_path else None,
        "reportContent": report_content,
        "raw": result,
    }


@router.get("/status", response_model=Dict[str, Any])
async def get_connection_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get quick API connection status summary
    
    Requires authentication
    """
    try:
        # Check if user is admin or superadmin (using async function to avoid lazy load)
        try:
            user_is_admin = await is_admin_or_superadmin(current_user, db)
        except Exception as e:
            # If we can't check admin status, log but don't fail
            logger.warning(f"Could not check admin status: {e}")
            user_is_admin = False
        
        # If not admin, return basic status without running checks
        if not user_is_admin:
            return {
                "success": True,
                "frontend": {
                    "message": "Admin privileges required for detailed checks"
                },
                "backend": {
                    "message": "Admin privileges required for detailed checks"
                },
                "timestamp": asyncio.get_event_loop().time(),
            }
        
        # Run both checks with error handling
        frontend_result = {}
        backend_result = {}
        
        try:
            frontend_result = await check_frontend_connections(
                detailed=False,
                current_user=current_user,
                db=db
            )
            # If the result indicates scripts are not available or frontend files are not accessible
            if not frontend_result.get("success"):
                frontend_result = {
                    "success": False,
                    "error": frontend_result.get("error", "Scripts not available"),
                    "message": frontend_result.get("message", "Node.js scripts required"),
                    "summary": {}
                }
            # If success but no summary (frontend files not available in backend container)
            elif not frontend_result.get("summary") or not frontend_result.get("summary", {}):
                frontend_result = {
                    "success": True,
                    "message": "Frontend files are not available in backend container. This is normal in production.",
                    "summary": frontend_result.get("summary", {}) or {}
                }
        except HTTPException as e:
            frontend_result = {
                "success": False,
                "error": e.detail,
                "summary": {}
            }
        except Exception as e:
            logger.error(f"Error checking frontend connections: {e}", exc_info=True)
            frontend_result = {
                "success": False,
                "error": f"An unexpected error occurred: {str(e)}",
                "summary": {}
            }
        
        try:
            backend_result = await check_backend_endpoints(
                current_user=current_user,
                db=db
            )
            # If the result indicates scripts are not available, extract that info
            if not backend_result.get("success") and "not available" in str(backend_result.get("error", "")).lower():
                backend_result = {
                    "success": False,
                    "error": backend_result.get("error", "Scripts not available"),
                    "message": backend_result.get("message", "Node.js scripts required"),
                    "summary": {}
                }
        except HTTPException as e:
            backend_result = {
                "success": False,
                "error": e.detail,
                "summary": {}
            }
        except Exception as e:
            logger.error(f"Error checking backend endpoints: {e}", exc_info=True)
            backend_result = {
                "success": False,
                "error": f"An unexpected error occurred: {str(e)}",
                "summary": {}
            }
        
        return {
            "success": True,
            "frontend": frontend_result.get("summary", {}),
            "backend": backend_result.get("summary", {}),
            "timestamp": asyncio.get_event_loop().time(),
        }
    except Exception as e:
        # Catch any database or other errors
        logger.error(f"Error in get_connection_status: {e}", exc_info=True)
        
        # Return a more informative error response
        return {
            "success": False,
            "error": f"A database error occurred: {str(e)}",
            "frontend": {},
            "backend": {},
            "timestamp": asyncio.get_event_loop().time(),
        }

