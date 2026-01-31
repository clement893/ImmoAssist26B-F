"""
Data Export Service
Supports exporting data to CSV, Excel, JSON, and PDF formats
"""

import csv
import json
from typing import List, Dict, Any, Optional
from io import StringIO, BytesIO
from datetime import datetime
from decimal import Decimal

try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.units import inch
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False

from app.core.logging import logger


class ExportService:
    """Service for exporting data to various formats"""

    @staticmethod
    def export_to_csv(
        data: List[Dict[str, Any]],
        headers: Optional[List[str]] = None,
        filename: Optional[str] = None
    ) -> tuple[BytesIO, str]:
        """
        Export data to CSV format
        
        Args:
            data: List of dictionaries to export
            headers: Optional list of header names (uses dict keys if not provided)
            filename: Optional filename (generates if not provided)
            
        Returns:
            Tuple of (BytesIO buffer, filename)
        """
        if not data:
            raise ValueError("No data to export")

        output = StringIO()
        
        # Get headers from first item if not provided
        if headers is None:
            headers = list(data[0].keys())
        
        writer = csv.DictWriter(output, fieldnames=headers, extrasaction='ignore')
        writer.writeheader()
        
        for row in data:
            # Convert complex types to strings
            cleaned_row = {}
            for key, value in row.items():
                if key in headers:
                    if isinstance(value, (datetime,)):
                        cleaned_row[key] = value.isoformat()
                    elif isinstance(value, (Decimal,)):
                        cleaned_row[key] = str(value)
                    elif isinstance(value, (dict, list)):
                        cleaned_row[key] = json.dumps(value)
                    elif value is None:
                        cleaned_row[key] = ""
                    else:
                        cleaned_row[key] = str(value)
            writer.writerow(cleaned_row)
        
        buffer = BytesIO()
        buffer.write(output.getvalue().encode('utf-8'))
        buffer.seek(0)
        
        if filename is None:
            filename = f"export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        return buffer, filename

    @staticmethod
    def export_to_excel(
        data: List[Dict[str, Any]],
        headers: Optional[List[str]] = None,
        filename: Optional[str] = None,
        sheet_name: str = "Sheet1"
    ) -> tuple[BytesIO, str]:
        """
        Export data to Excel format (requires pandas)
        
        Args:
            data: List of dictionaries to export
            headers: Optional list of header names
            filename: Optional filename
            sheet_name: Excel sheet name
            
        Returns:
            Tuple of (BytesIO buffer, filename)
        """
        if not PANDAS_AVAILABLE:
            raise ImportError("pandas is required for Excel export. Install with: pip install pandas openpyxl")
        
        if not data:
            raise ValueError("No data to export")

        # Convert to DataFrame
        df = pd.DataFrame(data)
        
        # Reorder columns if headers provided
        if headers:
            # Only include headers that exist in data
            available_headers = [h for h in headers if h in df.columns]
            df = df[available_headers]
        
        # Convert complex types
        for col in df.columns:
            if df[col].dtype == 'object':
                df[col] = df[col].apply(lambda x: json.dumps(x) if isinstance(x, (dict, list)) else x)
        
        buffer = BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name=sheet_name, index=False)
        
        buffer.seek(0)
        
        if filename is None:
            filename = f"export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        
        return buffer, filename

    @staticmethod
    def export_to_json(
        data: List[Dict[str, Any]],
        filename: Optional[str] = None,
        pretty: bool = True
    ) -> tuple[BytesIO, str]:
        """
        Export data to JSON format
        
        Args:
            data: List of dictionaries to export
            filename: Optional filename
            pretty: Whether to format JSON nicely
            
        Returns:
            Tuple of (BytesIO buffer, filename)
        """
        if not data:
            raise ValueError("No data to export")

        # Convert complex types to JSON-serializable
        serializable_data = []
        for item in data:
            cleaned_item = {}
            for key, value in item.items():
                if isinstance(value, (datetime,)):
                    cleaned_item[key] = value.isoformat()
                elif isinstance(value, (Decimal,)):
                    cleaned_item[key] = float(value)
                elif isinstance(value, (bytes,)):
                    cleaned_item[key] = value.decode('utf-8', errors='ignore')
                else:
                    cleaned_item[key] = value
            serializable_data.append(cleaned_item)
        
        if pretty:
            json_str = json.dumps(serializable_data, indent=2, default=str, ensure_ascii=False)
        else:
            json_str = json.dumps(serializable_data, default=str, ensure_ascii=False)
        
        buffer = BytesIO()
        buffer.write(json_str.encode('utf-8'))
        buffer.seek(0)
        
        if filename is None:
            filename = f"export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        return buffer, filename

    @staticmethod
    def export_to_pdf(
        data: List[Dict[str, Any]],
        headers: Optional[List[str]] = None,
        filename: Optional[str] = None,
        title: str = "Data Export"
    ) -> tuple[BytesIO, str]:
        """
        Export data to PDF format (requires reportlab)
        
        Args:
            data: List of dictionaries to export
            headers: Optional list of header names
            filename: Optional filename
            title: PDF title
            
        Returns:
            Tuple of (BytesIO buffer, filename)
        """
        if not REPORTLAB_AVAILABLE:
            raise ImportError("reportlab is required for PDF export. Install with: pip install reportlab")
        
        if not data:
            raise ValueError("No data to export")

        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        story = []
        
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            textColor=colors.HexColor('#1a1a1a'),
            spaceAfter=30,
        )
        
        # Add title
        story.append(Paragraph(title, title_style))
        story.append(Spacer(1, 0.2 * inch))
        
        # Get headers
        if headers is None:
            headers = list(data[0].keys())
        
        # Prepare table data
        table_data = [headers]  # Header row
        
        for row in data:
            table_row = []
            for header in headers:
                value = row.get(header, "")
                # Convert complex types to strings
                if isinstance(value, (datetime,)):
                    value = value.strftime('%Y-%m-%d %H:%M:%S')
                elif isinstance(value, (Decimal,)):
                    value = str(value)
                elif isinstance(value, (dict, list)):
                    value = json.dumps(value, default=str)
                elif value is None:
                    value = ""
                else:
                    value = str(value)
                table_row.append(value)
            table_data.append(table_row)
        
        # Create table
        table = Table(table_data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        
        story.append(table)
        doc.build(story)
        buffer.seek(0)
        
        if filename is None:
            filename = f"export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        
        return buffer, filename

    @staticmethod
    def get_export_formats() -> List[str]:
        """Get list of available export formats"""
        formats = ['csv', 'json']
        if PANDAS_AVAILABLE:
            formats.append('excel')
        if REPORTLAB_AVAILABLE:
            formats.append('pdf')
        return formats




