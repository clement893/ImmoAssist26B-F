"""
Documentation Service
Loads and processes documentation files for AI context
"""

import os
from pathlib import Path
from typing import List, Dict, Optional
from app.core.logging import logger


class DocumentationService:
    """Service for loading and processing documentation files"""
    
    def __init__(self, docs_path: Optional[str] = None):
        """
        Initialize documentation service.
        
        Args:
            docs_path: Path to documentation directory (defaults to project root/docs)
        """
        if docs_path:
            self.docs_path = Path(docs_path)
        else:
            # Default to project root/docs
            # Assuming backend/app/services/documentation_service.py
            # Project root is backend/../
            current_file = Path(__file__)
            project_root = current_file.parent.parent.parent
            self.docs_path = project_root / "docs"
        
        if not self.docs_path.exists():
            logger.warning(f"Documentation path does not exist: {self.docs_path}")
            self.docs_path = None
    
    def load_all_documentation(self, max_size_per_file: int = 50000) -> Dict[str, str]:
        """
        Load all markdown documentation files.
        
        Args:
            max_size_per_file: Maximum size per file in characters (default: 50000)
            
        Returns:
            Dict mapping file paths to file contents
        """
        if not self.docs_path or not self.docs_path.exists():
            logger.warning("Documentation path not available")
            return {}
        
        documentation = {}
        
        try:
            # Find all markdown files
            md_files = list(self.docs_path.glob("**/*.md"))
            
            for md_file in md_files:
                try:
                    # Read file content
                    content = md_file.read_text(encoding='utf-8')
                    
                    # Limit file size to avoid token limits
                    if len(content) > max_size_per_file:
                        content = content[:max_size_per_file] + "\n\n[... content truncated ...]"
                    
                    # Use relative path as key
                    relative_path = md_file.relative_to(self.docs_path)
                    documentation[str(relative_path)] = content
                    
                except Exception as e:
                    logger.error(f"Error reading documentation file {md_file}: {e}")
                    continue
            
            logger.info(f"Loaded {len(documentation)} documentation files")
            
        except Exception as e:
            logger.error(f"Error loading documentation: {e}")
        
        return documentation
    
    def get_documentation_summary(self) -> str:
        """
        Get a summary of available documentation files.
        
        Returns:
            String listing all available documentation files
        """
        if not self.docs_path or not self.docs_path.exists():
            return "No documentation available"
        
        try:
            md_files = list(self.docs_path.glob("**/*.md"))
            file_list = [str(f.relative_to(self.docs_path)) for f in md_files]
            return f"Available documentation files ({len(file_list)}):\n" + "\n".join(f"- {f}" for f in sorted(file_list))
        except Exception as e:
            logger.error(f"Error getting documentation summary: {e}")
            return "Error loading documentation summary"
    
    def format_documentation_for_context(self, max_total_size: int = 100000) -> str:
        """
        Format documentation for AI context.
        
        Args:
            max_total_size: Maximum total size in characters (default: 100000)
            
        Returns:
            Formatted documentation string
        """
        docs = self.load_all_documentation()
        
        if not docs:
            return "No documentation available."
        
        # Format as a single string
        formatted = []
        total_size = 0
        
        for file_path, content in docs.items():
            file_section = f"\n\n=== {file_path} ===\n{content}\n"
            
            # Check if adding this file would exceed limit
            if total_size + len(file_section) > max_total_size:
                # Add partial content if possible
                remaining = max_total_size - total_size
                if remaining > 100:  # Only add if meaningful amount remains
                    formatted.append(f"\n\n=== {file_path} (partial) ===\n{content[:remaining]}...\n")
                break
            
            formatted.append(file_section)
            total_size += len(file_section)
        
        return "".join(formatted)
    
    def search_documentation(self, query: str, max_results: int = 5) -> List[Dict[str, str]]:
        """
        Simple text search in documentation files.
        
        Args:
            query: Search query
            max_results: Maximum number of results
            
        Returns:
            List of dicts with 'file' and 'content' keys
        """
        if not self.docs_path or not self.docs_path.exists():
            return []
        
        query_lower = query.lower()
        results = []
        
        try:
            md_files = list(self.docs_path.glob("**/*.md"))
            
            for md_file in md_files:
                try:
                    content = md_file.read_text(encoding='utf-8')
                    
                    # Simple text search
                    if query_lower in content.lower():
                        # Extract relevant snippet (around the match)
                        content_lower = content.lower()
                        index = content_lower.find(query_lower)
                        
                        if index >= 0:
                            # Extract context around match (500 chars before and after)
                            start = max(0, index - 500)
                            end = min(len(content), index + len(query) + 500)
                            snippet = content[start:end]
                            
                            results.append({
                                'file': str(md_file.relative_to(self.docs_path)),
                                'content': snippet,
                                'relevance': content_lower.count(query_lower)  # Simple relevance score
                            })
                            
                            if len(results) >= max_results:
                                break
                                
                except Exception as e:
                    logger.error(f"Error searching in {md_file}: {e}")
                    continue
            
            # Sort by relevance
            results.sort(key=lambda x: x['relevance'], reverse=True)
            
        except Exception as e:
            logger.error(f"Error searching documentation: {e}")
        
        return results[:max_results]


# Singleton instance
_documentation_service: Optional[DocumentationService] = None


def get_documentation_service() -> DocumentationService:
    """Get singleton documentation service instance"""
    global _documentation_service
    if _documentation_service is None:
        _documentation_service = DocumentationService()
    return _documentation_service
