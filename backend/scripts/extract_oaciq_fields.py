"""
Script d'extraction des champs des formulaires PDF OACIQ
Extrait tous les champs interactifs (AcroForms) des PDF OACIQ et génère des schémas JSON
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional, Any
import logging

try:
    import pdfplumber
    PDFPLUMBER_AVAILABLE = True
except ImportError:
    PDFPLUMBER_AVAILABLE = False
    print("Warning: pdfplumber not available, trying PyPDF2")

try:
    from PyPDF2 import PdfReader
    from PyPDF2.generic import BooleanObject, NameObject, IndirectObject
    PYPDF2_AVAILABLE = True
except ImportError:
    PYPDF2_AVAILABLE = False

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def extract_fields_with_pdfplumber(pdf_path: Path) -> List[Dict[str, Any]]:
    """Extract form fields using pdfplumber"""
    fields = []
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages):
                # Extract form fields from the page
                if hasattr(page, 'forms'):
                    for form in page.forms:
                        for field_name, field_value in form.items():
                            fields.append({
                                "name": field_name,
                                "label": field_name.replace('_', ' ').title(),
                                "type": "text",  # pdfplumber doesn't always detect field types
                                "required": False,
                                "page": page_num + 1,
                                "value": field_value if field_value else None
                            })
    except Exception as e:
        logger.error(f"Error extracting with pdfplumber from {pdf_path}: {e}")
    return fields


def extract_fields_with_pypdf2(pdf_path: Path) -> List[Dict[str, Any]]:
    """Extract form fields using PyPDF2"""
    fields = []
    try:
        reader = PdfReader(str(pdf_path))
        
        if '/AcroForm' not in reader.trailer['/Root']:
            logger.warning(f"No AcroForm found in {pdf_path.name}")
            return fields
        
        acro_form = reader.trailer['/Root']['/AcroForm']
        
        if '/Fields' not in acro_form:
            logger.warning(f"No Fields found in AcroForm for {pdf_path.name}")
            return fields
        
        def get_field_type(field_obj):
            """Determine field type from field object"""
            if '/FT' in field_obj:
                field_type = field_obj['/FT']
                if field_type == '/Btn':
                    return 'checkbox' if '/Ff' in field_obj and field_obj['/Ff'] & 1 << 15 else 'radio'
                elif field_type == '/Tx':
                    return 'text'
                elif field_type == '/Ch':
                    return 'select'
                elif field_type == '/Sig':
                    return 'signature'
            return 'text'
        
        def get_field_value(field_obj):
            """Extract field value"""
            if '/V' in field_obj:
                value = field_obj['/V']
                if isinstance(value, (str, int, float, bool)):
                    return value
                elif isinstance(value, IndirectObject):
                    try:
                        return value.get_object()
                    except:
                        return None
            return None
        
        def get_field_name(field_obj):
            """Extract field name"""
            if '/T' in field_obj:
                return str(field_obj['/T'])
            return None
        
        def process_field(field_obj, page_num=None):
            """Process a single field object"""
            field_name = get_field_name(field_obj)
            if not field_name:
                return None
            
            field_type = get_field_type(field_obj)
            field_value = get_field_value(field_obj)
            
            # Check if required (Ff flag bit 1)
            required = False
            if '/Ff' in field_obj:
                flags = field_obj['/Ff']
                if isinstance(flags, int):
                    required = bool(flags & 1)
            
            # Get placeholder/hint from /TU (tooltip) or /TM (mapping name)
            placeholder = None
            if '/TU' in field_obj:
                placeholder = str(field_obj['/TU'])
            elif '/TM' in field_obj:
                placeholder = str(field_obj['/TM'])
            
            field_data = {
                "name": field_name,
                "label": field_name.replace('_', ' ').replace('.', ' ').title(),
                "type": field_type,
                "required": required,
                "placeholder": placeholder,
            }
            
            if page_num:
                field_data["page"] = page_num
            
            if field_value is not None:
                field_data["default_value"] = field_value
            
            # For select fields, get options
            if field_type == 'select' and '/Opt' in field_obj:
                options = field_obj['/Opt']
                if isinstance(options, list):
                    field_data["options"] = [str(opt) if not isinstance(opt, list) else str(opt[0]) for opt in options]
            
            return field_data
        
        # Process all fields
        fields_list = acro_form['/Fields']
        for field_ref in fields_list:
            try:
                field_obj = field_ref.get_object() if hasattr(field_ref, 'get_object') else field_ref
                
                # Handle parent/child fields
                if '/Kids' in field_obj:
                    # Parent field with children
                    for kid_ref in field_obj['/Kids']:
                        kid_obj = kid_ref.get_object() if hasattr(kid_ref, 'get_object') else kid_ref
                        field_data = process_field(kid_obj)
                        if field_data:
                            fields.append(field_data)
                else:
                    # Single field
                    field_data = process_field(field_obj)
                    if field_data:
                        fields.append(field_data)
            except Exception as e:
                logger.warning(f"Error processing field: {e}")
                continue
        
    except Exception as e:
        logger.error(f"Error extracting with PyPDF2 from {pdf_path}: {e}")
    
    return fields


def extract_fields(pdf_path: Path) -> List[Dict[str, Any]]:
    """Extract fields from PDF using available library"""
    if PDFPLUMBER_AVAILABLE:
        fields = extract_fields_with_pdfplumber(pdf_path)
        if fields:
            return fields
    
    if PYPDF2_AVAILABLE:
        fields = extract_fields_with_pypdf2(pdf_path)
        if fields:
            return fields
    
    logger.warning(f"Could not extract fields from {pdf_path.name} - no suitable library available")
    return []


def generate_schema_json(pdf_path: Path, output_dir: Path) -> Optional[Path]:
    """Generate JSON schema file for a PDF form"""
    logger.info(f"Processing {pdf_path.name}...")
    
    fields = extract_fields(pdf_path)
    
    if not fields:
        logger.warning(f"No fields extracted from {pdf_path.name}")
        return None
    
    # Generate schema
    schema = {
        "form_code": pdf_path.stem.upper(),  # Use filename without extension as code
        "form_name": pdf_path.stem.replace('_', ' ').title(),
        "pdf_path": str(pdf_path),
        "fields": fields,
        "total_fields": len(fields),
        "extraction_method": "pdfplumber" if PDFPLUMBER_AVAILABLE else "PyPDF2" if PYPDF2_AVAILABLE else "none"
    }
    
    # Save to JSON file
    output_file = output_dir / f"{pdf_path.stem}.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(schema, f, indent=2, ensure_ascii=False)
    
    logger.info(f"Generated schema for {pdf_path.name}: {len(fields)} fields -> {output_file}")
    return output_file


def main():
    """Main function to extract fields from all PDFs in a directory"""
    # Default paths
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    pdf_dir = project_root / "data" / "oaciq_forms"
    output_dir = project_root / "data" / "oaciq_schemas"
    
    # Allow override via command line
    if len(sys.argv) > 1:
        pdf_dir = Path(sys.argv[1])
    if len(sys.argv) > 2:
        output_dir = Path(sys.argv[2])
    
    # Create output directory if it doesn't exist
    output_dir.mkdir(parents=True, exist_ok=True)
    
    if not pdf_dir.exists():
        logger.error(f"PDF directory not found: {pdf_dir}")
        logger.info("Usage: python extract_oaciq_fields.py [pdf_directory] [output_directory]")
        sys.exit(1)
    
    # Find all PDF files
    pdf_files = list(pdf_dir.glob("*.pdf"))
    
    if not pdf_files:
        logger.warning(f"No PDF files found in {pdf_dir}")
        sys.exit(1)
    
    logger.info(f"Found {len(pdf_files)} PDF files in {pdf_dir}")
    
    # Process each PDF
    success_count = 0
    failed_count = 0
    
    for pdf_path in sorted(pdf_files):
        try:
            result = generate_schema_json(pdf_path, output_dir)
            if result:
                success_count += 1
            else:
                failed_count += 1
        except Exception as e:
            logger.error(f"Failed to process {pdf_path.name}: {e}")
            failed_count += 1
    
    logger.info(f"\nExtraction complete:")
    logger.info(f"  Success: {success_count}")
    logger.info(f"  Failed: {failed_count}")
    logger.info(f"  Output directory: {output_dir}")


if __name__ == "__main__":
    main()
