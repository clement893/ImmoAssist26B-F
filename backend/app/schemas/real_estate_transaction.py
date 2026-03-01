"""
Real Estate Transaction Schemas
Schémas Pydantic pour les transactions immobilières
"""

from typing import Optional, List, Dict, Any
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, Field, field_validator
from app.models.real_estate_transaction import RealEstateTransaction


# Schémas pour les parties impliquées
class PersonInfo(BaseModel):
    """Informations sur une personne"""
    name: str = Field(..., description="Nom complet")
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    civil_status: Optional[str] = None  # Célibataire, marié, veuf, divorcé, uni civilement


class ProfessionalInfo(BaseModel):
    """Informations sur un professionnel"""
    name: Optional[str] = None
    agency_or_firm: Optional[str] = None
    license_number: Optional[str] = None  # OACIQ pour courtiers
    contact: Optional[Dict[str, Any]] = None  # Coordonnées (phone, email, etc.)


class RealEstateTransactionCreate(BaseModel):
    """Schéma pour créer une transaction immobilière"""
    # 1. Identification
    name: str = Field(..., min_length=1, description="Nom de la transaction")
    dossier_number: Optional[str] = Field(None, description="Numéro de dossier interne")
    status: str = Field(default="En cours", description="Statut de la transaction")
    expected_closing_date: Optional[date] = None
    actual_closing_date: Optional[date] = None

    @field_validator("dossier_number", mode="before")
    @classmethod
    def empty_dossier_number_to_none(cls, v: Optional[str]) -> Optional[str]:
        """Coerce empty string to None to avoid unique constraint on empty dossier_number."""
        if v is None:
            return None
        if isinstance(v, str) and not v.strip():
            return None
        return v

    # 2. Propriété
    property_address: Optional[str] = Field(None, description="Adresse complète")
    property_city: Optional[str] = Field(None, description="Ville")
    property_postal_code: Optional[str] = Field(None, description="Code postal")
    property_province: Optional[str] = Field(default="QC", description="Province")
    lot_number: Optional[str] = None
    matricule_number: Optional[str] = None
    property_type: Optional[str] = None
    construction_year: Optional[int] = None
    land_area_sqft: Optional[Decimal] = None
    land_area_sqm: Optional[Decimal] = None
    living_area_sqft: Optional[Decimal] = None
    living_area_sqm: Optional[Decimal] = None
    total_rooms: Optional[int] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    inclusions: Optional[List[str]] = None
    exclusions: Optional[List[str]] = None
    
    # 3. Parties impliquées
    sellers: List[Dict[str, Any]] = Field(..., description="Liste des vendeurs")
    buyers: List[Dict[str, Any]] = Field(..., description="Liste des acheteurs")
    
    # Professionnels (optionnels)
    seller_broker: Optional[Dict[str, Any]] = None
    buyer_broker: Optional[Dict[str, Any]] = None
    notary: Optional[Dict[str, Any]] = None
    inspector: Optional[Dict[str, Any]] = None
    surveyor: Optional[Dict[str, Any]] = None
    mortgage_advisor: Optional[Dict[str, Any]] = None
    
    # 4. Transaction financière
    listing_price: Optional[Decimal] = None
    offered_price: Optional[Decimal] = None
    final_sale_price: Optional[Decimal] = None
    deposit_amount: Optional[Decimal] = None
    broker_commission_percent: Optional[Decimal] = None
    broker_commission_amount: Optional[Decimal] = None
    commission_split: Optional[Dict[str, Any]] = None
    
    # 5. Financement
    down_payment_amount: Optional[Decimal] = None
    mortgage_amount: Optional[Decimal] = None
    mortgage_institution: Optional[str] = None
    mortgage_type: Optional[str] = None
    mortgage_interest_rate: Optional[Decimal] = None
    mortgage_term_years: Optional[int] = None
    amortization_years: Optional[int] = None
    mortgage_insurance_required: bool = False
    mortgage_insurance_amount: Optional[Decimal] = None
    
    # 6. Dates importantes
    promise_to_purchase_date: Optional[date] = None
    promise_acceptance_date: Optional[date] = None
    inspection_deadline: Optional[date] = None
    inspection_date: Optional[date] = None
    inspection_condition_lifted_date: Optional[date] = None
    financing_deadline: Optional[date] = None
    financing_condition_lifted_date: Optional[date] = None
    mortgage_act_signing_date: Optional[date] = None
    sale_act_signing_date: Optional[date] = None
    possession_date: Optional[date] = None
    
    # 7. Documents
    location_certificate_received: bool = False
    location_certificate_date: Optional[date] = None
    location_certificate_conform: Optional[bool] = None
    seller_declaration_signed: bool = False
    seller_declaration_date: Optional[date] = None
    inspection_report_received: bool = False
    inspection_report_satisfactory: Optional[bool] = None
    financing_approval_received: bool = False
    financing_approval_date: Optional[date] = None
    home_insurance_proof_received: bool = False
    seller_quittance_received: bool = False
    seller_quittance_amount: Optional[Decimal] = None
    
    # 8. Frais - Acheteur
    buyer_mutation_tax: Optional[Decimal] = None
    buyer_notary_fees_sale: Optional[Decimal] = None
    buyer_notary_fees_mortgage: Optional[Decimal] = None
    buyer_inspection_fees: Optional[Decimal] = None
    buyer_appraisal_fees: Optional[Decimal] = None
    buyer_insurance_tax: Optional[Decimal] = None
    
    # 8. Frais - Vendeur
    seller_broker_commission_total: Optional[Decimal] = None
    seller_quittance_fees: Optional[Decimal] = None
    seller_mortgage_penalty: Optional[Decimal] = None
    seller_location_certificate_fees: Optional[Decimal] = None
    
    # 9. Ajustements
    adjustment_municipal_taxes: Optional[Decimal] = None
    adjustment_school_taxes: Optional[Decimal] = None
    adjustment_condo_fees: Optional[Decimal] = None
    adjustment_rental_income: Optional[Decimal] = None
    
    # 10. Post-transaction
    registry_publication_number: Optional[str] = None
    seller_quittance_confirmed: bool = False
    notes: Optional[str] = None
    
    # 11. Documents associés
    documents: Optional[List[Dict[str, Any]]] = None


class RealEstateTransactionUpdate(BaseModel):
    """Schéma pour mettre à jour une transaction - tous les champs sont optionnels"""
    status: Optional[str] = None
    expected_closing_date: Optional[date] = None
    actual_closing_date: Optional[date] = None
    property_address: Optional[str] = None
    property_city: Optional[str] = None
    property_postal_code: Optional[str] = None
    property_province: Optional[str] = None
    lot_number: Optional[str] = None
    matricule_number: Optional[str] = None
    property_type: Optional[str] = None
    construction_year: Optional[int] = None
    land_area_sqft: Optional[Decimal] = None
    land_area_sqm: Optional[Decimal] = None
    living_area_sqft: Optional[Decimal] = None
    living_area_sqm: Optional[Decimal] = None
    total_rooms: Optional[int] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    inclusions: Optional[List[str]] = None
    exclusions: Optional[List[str]] = None
    sellers: Optional[List[Dict[str, Any]]] = None
    buyers: Optional[List[Dict[str, Any]]] = None
    seller_broker: Optional[Dict[str, Any]] = None
    buyer_broker: Optional[Dict[str, Any]] = None
    notary: Optional[Dict[str, Any]] = None
    inspector: Optional[Dict[str, Any]] = None
    surveyor: Optional[Dict[str, Any]] = None
    mortgage_advisor: Optional[Dict[str, Any]] = None
    listing_price: Optional[Decimal] = None
    offered_price: Optional[Decimal] = None
    final_sale_price: Optional[Decimal] = None
    deposit_amount: Optional[Decimal] = None
    broker_commission_percent: Optional[Decimal] = None
    broker_commission_amount: Optional[Decimal] = None
    commission_split: Optional[Dict[str, Any]] = None
    down_payment_amount: Optional[Decimal] = None
    mortgage_amount: Optional[Decimal] = None
    mortgage_institution: Optional[str] = None
    mortgage_type: Optional[str] = None
    mortgage_interest_rate: Optional[Decimal] = None
    mortgage_term_years: Optional[int] = None
    amortization_years: Optional[int] = None
    mortgage_insurance_required: Optional[bool] = None
    mortgage_insurance_amount: Optional[Decimal] = None
    promise_to_purchase_date: Optional[date] = None
    promise_acceptance_date: Optional[date] = None
    inspection_deadline: Optional[date] = None
    inspection_date: Optional[date] = None
    inspection_condition_lifted_date: Optional[date] = None
    financing_deadline: Optional[date] = None
    financing_condition_lifted_date: Optional[date] = None
    mortgage_act_signing_date: Optional[date] = None
    sale_act_signing_date: Optional[date] = None
    possession_date: Optional[date] = None
    location_certificate_received: Optional[bool] = None
    location_certificate_date: Optional[date] = None
    location_certificate_conform: Optional[bool] = None
    seller_declaration_signed: Optional[bool] = None
    seller_declaration_date: Optional[date] = None
    inspection_report_received: Optional[bool] = None
    inspection_report_satisfactory: Optional[bool] = None
    financing_approval_received: Optional[bool] = None
    financing_approval_date: Optional[date] = None
    home_insurance_proof_received: Optional[bool] = None
    seller_quittance_received: Optional[bool] = None
    seller_quittance_amount: Optional[Decimal] = None
    buyer_mutation_tax: Optional[Decimal] = None
    buyer_notary_fees_sale: Optional[Decimal] = None
    buyer_notary_fees_mortgage: Optional[Decimal] = None
    buyer_inspection_fees: Optional[Decimal] = None
    buyer_appraisal_fees: Optional[Decimal] = None
    buyer_insurance_tax: Optional[Decimal] = None
    seller_broker_commission_total: Optional[Decimal] = None
    seller_quittance_fees: Optional[Decimal] = None
    seller_mortgage_penalty: Optional[Decimal] = None
    seller_location_certificate_fees: Optional[Decimal] = None
    adjustment_municipal_taxes: Optional[Decimal] = None
    adjustment_school_taxes: Optional[Decimal] = None
    adjustment_condo_fees: Optional[Decimal] = None
    adjustment_rental_income: Optional[Decimal] = None
    registry_publication_number: Optional[str] = None
    seller_quittance_confirmed: Optional[bool] = None
    notes: Optional[str] = None
    documents: Optional[List[Dict[str, Any]]] = None


class RealEstateTransactionResponse(BaseModel):
    """Schéma de réponse pour une transaction"""
    id: int
    name: str
    dossier_number: Optional[str] = None
    status: str
    created_at: datetime
    expected_closing_date: Optional[date] = None
    actual_closing_date: Optional[date] = None
    updated_at: datetime
    
    # Propriété
    property_address: Optional[str] = None
    property_city: Optional[str] = None
    property_postal_code: Optional[str] = None
    property_province: Optional[str] = None
    lot_number: Optional[str] = None
    matricule_number: Optional[str] = None
    property_type: Optional[str] = None
    construction_year: Optional[int] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    
    # Parties
    sellers: List[Dict[str, Any]]
    buyers: List[Dict[str, Any]]
    
    # Prix
    listing_price: Optional[Decimal] = None
    offered_price: Optional[Decimal] = None
    final_sale_price: Optional[Decimal] = None
    
    # Dates importantes
    promise_to_purchase_date: Optional[date] = None
    promise_acceptance_date: Optional[date] = None
    expected_closing_date: Optional[date] = None
    actual_closing_date: Optional[date] = None
    possession_date: Optional[date] = None
    
    # Notes
    notes: Optional[str] = None
    
    # Documents
    documents: Optional[List[Dict[str, Any]]] = None
    
    user_id: int
    
    class Config:
        from_attributes = True


class RealEstateTransactionListResponse(BaseModel):
    """Schéma de réponse pour une liste de transactions"""
    transactions: List[RealEstateTransactionResponse]
    total: int
    skip: int
    limit: int
