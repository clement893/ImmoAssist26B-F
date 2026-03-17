"""
Data Import Service
Supports importing data from CSV, Excel, and JSON formats
"""

import csv
import json
from typing import List, Dict, Any, Optional, Callable
from io import BytesIO, StringIO
from datetime import datetime

try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False

from app.core.logging import logger


class ImportService:
    """Service for importing data from various formats"""

    @staticmethod
    def import_from_csv(
        file_content: bytes,
        encoding: str = 'utf-8',
        delimiter: str = ',',
        has_headers: bool = True,
        validator: Optional[Callable[[Dict[str, Any]], tuple[bool, Optional[str]]]] = None
    ) -> Dict[str, Any]:
        """
        Import data from CSV format
        
        Args:
            file_content: CSV file content as bytes
            encoding: File encoding (default: utf-8)
            delimiter: CSV delimiter (default: comma)
            has_headers: Whether first row contains headers
            validator: Optional validation function (row, error_message)
            
        Returns:
            Dict with 'data', 'errors', 'warnings', 'total_rows', 'valid_rows'
        """
        try:
            content = file_content.decode(encoding)
        except UnicodeDecodeError:
            # Try with error handling
            content = file_content.decode(encoding, errors='ignore')
        
        reader = csv.DictReader(StringIO(content), delimiter=delimiter)
        
        data = []
        errors = []
        warnings = []
        row_num = 0
        
        for row_num, row in enumerate(reader, start=1):
            # Clean empty values
            cleaned_row = {k: v.strip() if v else None for k, v in row.items()}
            
            # Validate if validator provided
            if validator:
                is_valid, error_msg = validator(cleaned_row)
                if not is_valid:
                    errors.append({
                        'row': row_num,
                        'data': cleaned_row,
                        'error': error_msg
                    })
                    continue
            
            data.append(cleaned_row)
        
        return {
            'data': data,
            'errors': errors,
            'warnings': warnings,
            'total_rows': row_num,
            'valid_rows': len(data),
            'invalid_rows': len(errors)
        }

    @staticmethod
    def import_from_excel(
        file_content: bytes,
        sheet_name: Optional[str] = None,
        has_headers: bool = True,
        validator: Optional[Callable[[Dict[str, Any]], tuple[bool, Optional[str]]]] = None
    ) -> Dict[str, Any]:
        """
        Import data from Excel format (requires pandas)
        
        Args:
            file_content: Excel file content as bytes
            sheet_name: Specific sheet name (uses first sheet if None)
            has_headers: Whether first row contains headers
            validator: Optional validation function
            
        Returns:
            Dict with 'data', 'errors', 'warnings', 'total_rows', 'valid_rows'
        """
        if not PANDAS_AVAILABLE:
            raise ImportError("pandas is required for Excel import. Install with: pip install pandas openpyxl")
        
        buffer = BytesIO(file_content)
        
        try:
            if sheet_name:
                df = pd.read_excel(buffer, sheet_name=sheet_name, header=0 if has_headers else None)
            else:
                df = pd.read_excel(buffer, header=0 if has_headers else None)
        except Exception as e:
            raise ValueError(f"Failed to read Excel file: {str(e)}")
        
        # Convert to list of dicts
        data = []
        errors = []
        warnings = []
        
        for idx, row in df.iterrows():
            row_dict = row.to_dict()
            
            # Convert NaN to None
            cleaned_row = {k: None if pd.isna(v) else v for k, v in row_dict.items()}
            
            # Convert pandas types to Python types
            for key, value in cleaned_row.items():
                if pd.isna(value):
                    cleaned_row[key] = None
                elif isinstance(value, (pd.Timestamp,)):
                    cleaned_row[key] = value.to_pydatetime()
                elif isinstance(value, (pd.Timedelta,)):
                    cleaned_row[key] = str(value)
                else:
                    cleaned_row[key] = value
            
            # Validate if validator provided
            if validator:
                is_valid, error_msg = validator(cleaned_row)
                if not is_valid:
                    errors.append({
                        'row': idx + 1,
                        'data': cleaned_row,
                        'error': error_msg
                    })
                    continue
            
            data.append(cleaned_row)
        
        return {
            'data': data,
            'errors': errors,
            'warnings': warnings,
            'total_rows': len(df),
            'valid_rows': len(data),
            'invalid_rows': len(errors)
        }

    @staticmethod
    def import_from_json(
        file_content: bytes,
        encoding: str = 'utf-8',
        validator: Optional[Callable[[Dict[str, Any]], tuple[bool, Optional[str]]]] = None
    ) -> Dict[str, Any]:
        """
        Import data from JSON format
        
        Args:
            file_content: JSON file content as bytes
            encoding: File encoding
            validator: Optional validation function
            
        Returns:
            Dict with 'data', 'errors', 'warnings', 'total_rows', 'valid_rows'
        """
        try:
            content = file_content.decode(encoding)
            json_data = json.loads(content)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON format: {str(e)}")
        except UnicodeDecodeError:
            content = file_content.decode(encoding, errors='ignore')
            json_data = json.loads(content)
        
        # Ensure it's a list
        if isinstance(json_data, dict):
            json_data = [json_data]
        elif not isinstance(json_data, list):
            raise ValueError("JSON must be an array of objects or a single object")
        
        data = []
        errors = []
        warnings = []
        
        for idx, item in enumerate(json_data, start=1):
            if not isinstance(item, dict):
                errors.append({
                    'row': idx,
                    'data': item,
                    'error': 'Item must be an object'
                })
                continue
            
            # Validate if validator provided
            if validator:
                is_valid, error_msg = validator(item)
                if not is_valid:
                    errors.append({
                        'row': idx,
                        'data': item,
                        'error': error_msg
                    })
                    continue
            
            data.append(item)
        
        return {
            'data': data,
            'errors': errors,
            'warnings': warnings,
            'total_rows': len(json_data),
            'valid_rows': len(data),
            'invalid_rows': len(errors)
        }

    @staticmethod
    def get_import_formats() -> List[str]:
        """Get list of available import formats"""
        formats = ['csv', 'json']
        if PANDAS_AVAILABLE:
            formats.append('excel')
        return formats




