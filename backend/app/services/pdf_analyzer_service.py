"""
PDF Analyzer Service
Service pour analyser des PDFs de transactions immobilières avec l'IA
"""

import base64
import io
from typing import Dict, Any, Optional, List
from fastapi import UploadFile

try:
    import PyPDF2
    PYPDF2_AVAILABLE = True
except ImportError:
    PYPDF2_AVAILABLE = False

try:
    from pdf2image import convert_from_bytes
    PDF2IMAGE_AVAILABLE = True
except ImportError:
    PDF2IMAGE_AVAILABLE = False

from app.services.ai_service import AIService, AIProvider
from app.core.logging import logger


class PDFAnalyzerService:
    """Service pour analyser des PDFs de transactions immobilières"""
    
    def __init__(self, provider: AIProvider = AIProvider.AUTO):
        """Initialize PDF analyzer service"""
        self.ai_service = AIService(provider=provider)
    
    async def extract_text_from_pdf(self, pdf_content: bytes) -> str:
        """
        Extract text from PDF file
        
        Args:
            pdf_content: PDF file content as bytes
            
        Returns:
            Extracted text
        """
        if not PYPDF2_AVAILABLE:
            raise ImportError("PyPDF2 is required for PDF text extraction. Install with: pip install PyPDF2")
        
        try:
            pdf_file = io.BytesIO(pdf_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            text_parts = []
            for page_num, page in enumerate(pdf_reader.pages):
                try:
                    text = page.extract_text()
                    if text:
                        text_parts.append(f"--- Page {page_num + 1} ---\n{text}\n")
                except Exception as e:
                    logger.warning(f"Error extracting text from page {page_num + 1}: {e}")
                    continue
            
            return "\n".join(text_parts)
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            raise ValueError(f"Failed to extract text from PDF: {str(e)}")
    
    async def convert_pdf_to_images(self, pdf_content: bytes) -> List[str]:
        """
        Convert PDF pages to base64-encoded images
        
        Args:
            pdf_content: PDF file content as bytes
            
        Returns:
            List of base64-encoded image strings
        """
        if not PDF2IMAGE_AVAILABLE:
            raise ImportError("pdf2image is required for PDF to image conversion. Install with: pip install pdf2image")
        
        try:
            images = convert_from_bytes(pdf_content, dpi=200)
            base64_images = []
            
            for img in images:
                # Convert PIL Image to base64
                buffer = io.BytesIO()
                img.save(buffer, format='PNG')
                img_bytes = buffer.getvalue()
                base64_img = base64.b64encode(img_bytes).decode('utf-8')
                base64_images.append(base64_img)
            
            return base64_images
        except Exception as e:
            logger.error(f"Error converting PDF to images: {e}")
            raise ValueError(f"Failed to convert PDF to images: {str(e)}")
    
    async def analyze_transaction_pdf(self, pdf_content: bytes, pdf_filename: str) -> Dict[str, Any]:
        """
        Analyze a transaction PDF using AI to extract structured data
        
        Args:
            pdf_content: PDF file content as bytes
            pdf_filename: Original filename
            
        Returns:
            Dictionary with extracted transaction data and PDF preview
        """
        try:
            # Extract text from PDF
            pdf_text = await self.extract_text_from_pdf(pdf_content)
            
            # Convert first page to image for preview
            pdf_images = await self.convert_pdf_to_images(pdf_content)
            pdf_preview = pdf_images[0] if pdf_images else None
            
            # Use AI to extract structured data from text
            system_prompt = """Tu es un expert en transactions immobilières au Québec.
Analyse le texte extrait d'un document PDF de transaction immobilière et extrais les informations structurées.

Retourne UNIQUEMENT un JSON valide avec la structure suivante (utilise null pour les valeurs manquantes):
{
  "name": "Nom de la transaction (ex: Vente 123 Rue Principale)",
  "dossier_number": "Numéro de dossier si présent",
  "status": "En cours" | "Conditionnelle" | "Ferme" | "Annulée" | "Conclue",
  "property_address": "Adresse complète",
  "property_city": "Ville",
  "property_postal_code": "Code postal",
  "property_type": "Type de propriété (Unifamiliale, condo, plex, etc.)",
  "construction_year": année (nombre),
  "bedrooms": nombre de chambres (nombre),
  "bathrooms": nombre de salles de bain (nombre),
  "living_area_sqft": superficie habitable en pi² (nombre),
  "living_area_sqm": superficie habitable en m² (nombre),
  "sellers": [{"name": "Nom", "address": "Adresse", "phone": "Téléphone", "email": "Email"}],
  "buyers": [{"name": "Nom", "address": "Adresse", "phone": "Téléphone", "email": "Email"}],
  "listing_price": prix demandé (nombre),
  "offered_price": prix offert (nombre),
  "final_sale_price": prix final (nombre),
  "deposit_amount": montant de l'acompte (nombre),
  "expected_closing_date": "YYYY-MM-DD",
  "promise_to_purchase_date": "YYYY-MM-DD",
  "inspection_date": "YYYY-MM-DD",
  "mortgage_amount": montant hypothécaire (nombre),
  "mortgage_institution": "Institution financière",
  "notes": "Notes ou commentaires pertinents"
}

IMPORTANT: Retourne UNIQUEMENT le JSON, sans texte avant ou après."""
            
            user_message = f"""Analyse ce document PDF de transaction immobilière et extrais les informations structurées:

{pdf_text[:8000]}  # Limite à 8000 caractères pour éviter les limites de tokens
"""
            
            # Call AI service
            response = await self.ai_service.chat_completion(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                model=None,  # Use default model
                temperature=0.3,  # Lower temperature for more consistent extraction
                max_tokens=2000,
            )
            
            # Parse JSON response
            import json
            content = response.get("content", "{}")
            
            # Try to extract JSON from response (sometimes AI adds markdown formatting)
            if "```json" in content:
                json_start = content.find("```json") + 7
                json_end = content.find("```", json_start)
                content = content[json_start:json_end].strip()
            elif "```" in content:
                json_start = content.find("```") + 3
                json_end = content.find("```", json_start)
                content = content[json_start:json_end].strip()
            
            try:
                extracted_data = json.loads(content)
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse AI response as JSON: {e}")
                logger.error(f"Response content: {content[:500]}")
                raise ValueError(f"AI returned invalid JSON: {str(e)}")
            
            return {
                "extracted_data": extracted_data,
                "pdf_preview": pdf_preview,
                "pdf_text": pdf_text[:1000],  # First 1000 chars for preview
                "pdf_filename": pdf_filename,
            }
            
        except Exception as e:
            logger.error(f"Error analyzing PDF: {e}")
            raise ValueError(f"Failed to analyze PDF: {str(e)}")
