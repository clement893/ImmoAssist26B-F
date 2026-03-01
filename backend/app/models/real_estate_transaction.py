"""
Real Estate Transaction Model
Modèle pour les transactions immobilières au Québec
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Numeric, Boolean, JSON, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class RealEstateTransaction(Base):
    """Transaction immobilière complète"""
    __tablename__ = "real_estate_transactions"

    # 1. Identification de la transaction
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, comment="Nom de la transaction")
    dossier_number = Column(String, unique=True, nullable=True, index=True, comment="Numéro de dossier interne")
    status = Column(String, nullable=False, default="En cours", comment="Statut: En cours, Conditionnelle, Ferme, Annulée, Conclue")
    pipeline_stage = Column(String(80), nullable=True, index=True, comment="Étape du pipeline kanban (creation_dossier, promesse_achat, inspection_batiment, etc.)")
    transaction_kind = Column(String(20), nullable=True, index=True, comment="Type de pipeline: vente (mandat vente), achat (mandat achat)")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    expected_closing_date = Column(Date, nullable=True, comment="Date de clôture prévue")
    actual_closing_date = Column(Date, nullable=True, comment="Date de clôture réelle")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Suivi des actions
    current_action_code = Column(String(50), ForeignKey("transaction_actions.code"), nullable=True, comment="Code de l'action actuelle")
    last_action_at = Column(DateTime(timezone=True), nullable=True, comment="Date de la dernière action")
    action_count = Column(Integer, default=0, nullable=True, comment="Nombre d'actions effectuées")

    # Suivi des étapes guidées (parcours acheteur/vendeur)
    completed_steps = Column(JSON, nullable=True, default=list, comment="Codes d'étapes complétées")
    completed_actions = Column(JSON, nullable=True, default=list, comment="Codes d'actions complétées (steps)")
    transaction_data = Column(JSON, nullable=True, default=dict, comment="Données dynamiques (dates limites, etc.)")

    # 2. Informations sur la propriété
    property_address = Column(String, nullable=True, comment="Adresse complète")
    property_city = Column(String, nullable=True)
    property_postal_code = Column(String, nullable=True)
    property_province = Column(String, default="QC", nullable=True)
    lot_number = Column(String, nullable=True, comment="Numéro de lot (cadastre)")
    matricule_number = Column(String, nullable=True, comment="Numéro de matricule")
    property_type = Column(String, nullable=True, comment="Unifamiliale, condo, plex, terrain, etc.")
    construction_year = Column(Integer, nullable=True)
    land_area_sqft = Column(Numeric(10, 2), nullable=True, comment="Superficie du terrain en pieds carrés")
    land_area_sqm = Column(Numeric(10, 2), nullable=True, comment="Superficie du terrain en mètres carrés")
    living_area_sqft = Column(Numeric(10, 2), nullable=True, comment="Superficie habitable en pieds carrés")
    living_area_sqm = Column(Numeric(10, 2), nullable=True, comment="Superficie habitable en mètres carrés")
    total_rooms = Column(Integer, nullable=True, comment="Nombre total de pièces")
    bedrooms = Column(Integer, nullable=True)
    bathrooms = Column(Integer, nullable=True)
    inclusions = Column(JSON, nullable=True, comment="Liste des biens meubles inclus")
    exclusions = Column(JSON, nullable=True, comment="Liste des biens meubles exclus")

    # 3. Parties impliquées - Vendeur(s) (JSON pour supporter plusieurs vendeurs)
    sellers = Column(JSON, nullable=False, comment="Liste des vendeurs avec nom, adresse, coordonnées, état civil")
    
    # 3. Parties impliquées - Acheteur(s) (JSON pour supporter plusieurs acheteurs)
    buyers = Column(JSON, nullable=False, comment="Liste des acheteurs avec nom, adresse, coordonnées, état civil")
    
    # 3. Professionnels
    seller_broker_name = Column(String, nullable=True)
    seller_broker_agency = Column(String, nullable=True)
    seller_broker_oaciq = Column(String, nullable=True, comment="Numéro de permis OACIQ")
    seller_broker_contact = Column(JSON, nullable=True, comment="Coordonnées du courtier vendeur")
    
    buyer_broker_name = Column(String, nullable=True)
    buyer_broker_agency = Column(String, nullable=True)
    buyer_broker_oaciq = Column(String, nullable=True, comment="Numéro de permis OACIQ")
    buyer_broker_contact = Column(JSON, nullable=True, comment="Coordonnées du courtier acheteur")
    
    notary_name = Column(String, nullable=True)
    notary_firm = Column(String, nullable=True)
    notary_contact = Column(JSON, nullable=True)
    
    inspector_name = Column(String, nullable=True)
    inspector_company = Column(String, nullable=True)
    inspector_contact = Column(JSON, nullable=True)
    
    surveyor_name = Column(String, nullable=True)
    surveyor_company = Column(String, nullable=True)
    surveyor_contact = Column(JSON, nullable=True)
    
    mortgage_advisor_name = Column(String, nullable=True)
    mortgage_advisor_institution = Column(String, nullable=True)
    mortgage_advisor_contact = Column(JSON, nullable=True)

    # 4. Détails de la transaction financière
    listing_price = Column(Numeric(12, 2), nullable=True, comment="Prix de vente demandé")
    offered_price = Column(Numeric(12, 2), nullable=True, comment="Prix d'achat offert")
    final_sale_price = Column(Numeric(12, 2), nullable=True, comment="Prix de vente final")
    deposit_amount = Column(Numeric(12, 2), nullable=True, comment="Montant de l'acompte")
    broker_commission_percent = Column(Numeric(5, 2), nullable=True, comment="Rétribution du courtier (%)")
    broker_commission_amount = Column(Numeric(12, 2), nullable=True, comment="Rétribution du courtier ($)")
    commission_split = Column(JSON, nullable=True, comment="Répartition de la commission")

    # 5. Financement hypothécaire (Acheteur)
    down_payment_amount = Column(Numeric(12, 2), nullable=True, comment="Mise de fonds")
    mortgage_amount = Column(Numeric(12, 2), nullable=True, comment="Montant du prêt hypothécaire")
    mortgage_institution = Column(String, nullable=True, comment="Institution financière")
    mortgage_type = Column(String, nullable=True, comment="Taux fixe, variable, etc.")
    mortgage_interest_rate = Column(Numeric(5, 2), nullable=True, comment="Taux d'intérêt")
    mortgage_term_years = Column(Integer, nullable=True, comment="Terme de l'hypothèque (années)")
    amortization_years = Column(Integer, nullable=True, comment="Période d'amortissement (années)")
    mortgage_insurance_required = Column(Boolean, default=False, comment="Assurance prêt requise")
    mortgage_insurance_amount = Column(Numeric(12, 2), nullable=True, comment="Montant de la prime d'assurance")

    # 6. Processus et étapes clés (avec dates)
    promise_to_purchase_date = Column(Date, nullable=True, comment="Date de la promesse d'achat")
    promise_acceptance_date = Column(Date, nullable=True, comment="Date d'acceptation de la PA")
    inspection_deadline = Column(Date, nullable=True, comment="Date limite - Inspection")
    inspection_date = Column(Date, nullable=True, comment="Date de l'inspection")
    inspection_condition_lifted_date = Column(Date, nullable=True, comment="Date de levée de la condition d'inspection")
    financing_deadline = Column(Date, nullable=True, comment="Date limite - Financement")
    financing_condition_lifted_date = Column(Date, nullable=True, comment="Date de levée de la condition de financement")
    mortgage_act_signing_date = Column(Date, nullable=True, comment="Date de signature - Acte d'hypothèque")
    sale_act_signing_date = Column(Date, nullable=True, comment="Date de signature - Acte de vente")
    possession_date = Column(Date, nullable=True, comment="Date de prise de possession")

    # 7. Documents et vérifications
    location_certificate_received = Column(Boolean, default=False)
    location_certificate_date = Column(Date, nullable=True)
    location_certificate_conform = Column(Boolean, nullable=True)
    
    seller_declaration_signed = Column(Boolean, default=False)
    seller_declaration_date = Column(Date, nullable=True)
    
    inspection_report_received = Column(Boolean, default=False)
    inspection_report_satisfactory = Column(Boolean, nullable=True)
    
    financing_approval_received = Column(Boolean, default=False)
    financing_approval_date = Column(Date, nullable=True)
    
    home_insurance_proof_received = Column(Boolean, default=False)
    
    seller_quittance_received = Column(Boolean, default=False)
    seller_quittance_amount = Column(Numeric(12, 2), nullable=True)

    # 8. Frais et coûts détaillés - Acheteur
    buyer_mutation_tax = Column(Numeric(12, 2), nullable=True, comment="Droits de mutation")
    buyer_notary_fees_sale = Column(Numeric(12, 2), nullable=True, comment="Honoraires notaire (Vente)")
    buyer_notary_fees_mortgage = Column(Numeric(12, 2), nullable=True, comment="Honoraires notaire (Hypothèque)")
    buyer_inspection_fees = Column(Numeric(12, 2), nullable=True, comment="Frais d'inspection")
    buyer_appraisal_fees = Column(Numeric(12, 2), nullable=True, comment="Frais d'évaluation")
    buyer_insurance_tax = Column(Numeric(12, 2), nullable=True, comment="Taxe sur prime d'assurance prêt (9%)")

    # 8. Frais et coûts détaillés - Vendeur
    seller_broker_commission_total = Column(Numeric(12, 2), nullable=True, comment="Rétribution courtier + taxes")
    seller_quittance_fees = Column(Numeric(12, 2), nullable=True, comment="Frais de quittance (notaire)")
    seller_mortgage_penalty = Column(Numeric(12, 2), nullable=True, comment="Pénalité hypothécaire")
    seller_location_certificate_fees = Column(Numeric(12, 2), nullable=True, comment="Frais de certificat de localisation")

    # 9. Ajustements notariés
    adjustment_municipal_taxes = Column(Numeric(12, 2), nullable=True, comment="Ajustement - Taxes municipales")
    adjustment_school_taxes = Column(Numeric(12, 2), nullable=True, comment="Ajustement - Taxes scolaires")
    adjustment_condo_fees = Column(Numeric(12, 2), nullable=True, comment="Ajustement - Frais de condo")
    adjustment_rental_income = Column(Numeric(12, 2), nullable=True, comment="Ajustement - Revenus de location")

    # 10. Informations post-transaction
    registry_publication_number = Column(String, nullable=True, comment="Numéro de publication (Registre foncier)")
    seller_quittance_confirmed = Column(Boolean, default=False, comment="Confirmation de la quittance")
    notes = Column(Text, nullable=True, comment="Notes et commentaires")
    
    # 11. Documents associés
    documents = Column(JSON, nullable=True, comment="Liste des documents associés (PDF, images, etc.)")
    cover_photo_id = Column(Integer, nullable=True, comment="ID du document (photo) utilisé comme photo à la une")

    # Relations
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    user = relationship("User", backref="real_estate_transactions")
    transaction_contacts = relationship("TransactionContact", back_populates="transaction", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="transaction", cascade="all, delete-orphan")
    
    def get_contacts_by_role(self, role: str):
        """Helper method to get contacts by role"""
        from app.models.real_estate_contact import RealEstateContact
        return [tc.contact for tc in self.transaction_contacts if tc.role == role]
