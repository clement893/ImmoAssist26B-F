"""
Script to analyze Alembic migrations and identify issues
"""

import os
import re
from pathlib import Path
from typing import Dict, List, Tuple

def analyze_migrations():
    """Analyze all migration files and identify issues"""
    versions_dir = Path(__file__).parent.parent / "alembic" / "versions"
    
    migrations = {}
    issues = []
    
    # Read all migration files
    for file_path in sorted(versions_dir.glob("*.py")):
        if file_path.name == "__init__.py":
            continue
            
        content = file_path.read_text(encoding='utf-8')
        
        # Extract revision
        revision_match = re.search(r"revision\s*[:=]\s*['\"]([^'\"]+)['\"]", content)
        if not revision_match:
            continue
            
        revision = revision_match.group(1)
        
        # Extract down_revision
        down_revision_match = re.search(r"down_revision\s*[:=]\s*(?:Union\[[^\]]+\])?\s*['\"]?([^'\"]+)['\"]?", content)
        down_revision = None
        if down_revision_match:
            down_revision = down_revision_match.group(1)
            if down_revision == "None" or down_revision.strip() == "":
                down_revision = None
        else:
            # Check for None explicitly
            if re.search(r"down_revision\s*[:=]\s*None", content):
                down_revision = None
        
        migrations[revision] = {
            "file": file_path.name,
            "revision": revision,
            "down_revision": down_revision,
        }
    
    # Build chain and identify issues
    print("=" * 80)
    print("Migration Analysis")
    print("=" * 80)
    print(f"\nTotal migrations found: {len(migrations)}")
    
    # Find root migrations (no down_revision)
    roots = [r for r, m in migrations.items() if m["down_revision"] is None]
    if len(roots) > 1:
        issues.append(f"Multiple root migrations found: {roots}")
        print(f"\n[ISSUE] Multiple root migrations: {roots}")
    elif len(roots) == 1:
        print(f"\n[OK] Root migration: {roots[0]}")
    
    # Build chain from root
    chain = []
    current = roots[0] if roots else None
    
    while current:
        chain.append(current)
        next_migrations = [r for r, m in migrations.items() if m["down_revision"] == current]
        if len(next_migrations) > 1:
            issues.append(f"Multiple migrations with down_revision={current}: {next_migrations}")
            print(f"\n[ISSUE] Multiple migrations point to {current}: {next_migrations}")
            current = next_migrations[0]  # Take first one
        elif len(next_migrations) == 1:
            current = next_migrations[0]
        else:
            current = None
    
    print(f"\nMigration chain ({len(chain)} migrations):")
    for i, rev in enumerate(chain, 1):
        file_name = migrations[rev]["file"]
        print(f"  {i:2d}. {rev:40s} ({file_name})")
    
    # Find orphaned migrations (not in chain)
    orphaned = [r for r in migrations.keys() if r not in chain]
    if orphaned:
        issues.append(f"Orphaned migrations: {orphaned}")
        print(f"\n[ISSUE] Orphaned migrations (not in chain): {orphaned}")
        for rev in orphaned:
            print(f"      - {rev} ({migrations[rev]['file']})")
    
    # Check for duplicate revisions
    revision_counts = {}
    for rev in migrations.keys():
        revision_counts[rev] = revision_counts.get(rev, 0) + 1
    
    duplicates = {rev: count for rev, count in revision_counts.items() if count > 1}
    if duplicates:
        issues.append(f"Duplicate revisions: {duplicates}")
        print(f"\n[ISSUE] Duplicate revisions: {duplicates}")
    
    print("\n" + "=" * 80)
    if issues:
        print(f"[WARNING] Found {len(issues)} issue(s)")
        return False
    else:
        print("[OK] No issues found - migration chain is valid")
        return True

if __name__ == "__main__":
    analyze_migrations()
