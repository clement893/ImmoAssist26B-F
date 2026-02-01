"""
Configuration des actions de transaction immobilière
Définit toutes les actions possibles et leurs règles
"""

TRANSACTION_ACTIONS = [
    # ===== NOUVELLE INSCRIPTION → PROPRIÉTÉ LISTÉE =====
    {
        'code': 'publish_listing',
        'name': "Publier l'annonce",
        'description': 'Rendre la propriété visible sur les plateformes immobilières',
        'from_status': 'En cours',
        'to_status': 'Propriété listée',
        'required_documents': ['contrat_courtage', 'declaration_vendeur'],
        'required_fields': ['property_address', 'listing_price'],
        'required_roles': [],
        'creates_deadline': True,
        'deadline_days': 90,
        'deadline_type': 'listing_expiry',
        'sends_notification': True,
        'notification_recipients': ['client', 'broker'],
        'order_index': 1,
    },

    # ===== PROPRIÉTÉ LISTÉE → OFFRE SOUMISE =====
    {
        'code': 'submit_offer',
        'name': "Soumettre une offre",
        'description': "Soumettre une promesse d'achat au vendeur",
        'from_status': 'Propriété listée',
        'to_status': 'Offre soumise',
        'required_documents': ['promesse_achat'],
        'required_fields': ['offered_price', 'buyers'],
        'required_roles': [],
        'creates_deadline': True,
        'deadline_days': 3,
        'deadline_type': 'offer_response',
        'generates_document': True,
        'document_template': 'promesse_achat_PA',
        'sends_notification': True,
        'notification_recipients': ['seller', 'seller_broker', 'buyer'],
        'order_index': 2,
    },

    # ===== OFFRE SOUMISE → OFFRE ACCEPTÉE =====
    {
        'code': 'accept_offer',
        'name': "Accepter l'offre",
        'description': "Le vendeur accepte la promesse d'achat",
        'from_status': 'Offre soumise',
        'to_status': 'Offre acceptée',
        'required_documents': ['promesse_achat_signee'],
        'required_fields': [],
        'required_roles': [],
        'creates_deadline': True,
        'deadline_days': 10,
        'deadline_type': 'inspection',
        'sends_notification': True,
        'notification_recipients': ['buyer', 'buyer_broker', 'seller'],
        'order_index': 3,
    },

    # ===== OFFRE SOUMISE → CONTRE-OFFRE =====
    {
        'code': 'counter_offer',
        'name': 'Faire une contre-offre',
        'description': "Le vendeur propose des modifications à l'offre",
        'from_status': 'Offre soumise',
        'to_status': 'Contre-offre',
        'required_documents': ['contre_proposition'],
        'required_fields': ['counter_offer_price'],
        'required_roles': [],
        'creates_deadline': True,
        'deadline_days': 2,
        'deadline_type': 'counter_offer_response',
        'generates_document': True,
        'document_template': 'contre_proposition_CP',
        'sends_notification': True,
        'notification_recipients': ['buyer', 'buyer_broker'],
        'order_index': 4,
    },

    # ===== OFFRE ACCEPTÉE → INSPECTION COMPLÉTÉE =====
    {
        'code': 'complete_inspection',
        'name': "Compléter l'inspection",
        'description': "Inspection pré-achat effectuée et rapport reçu",
        'from_status': 'Offre acceptée',
        'to_status': 'Inspection complétée',
        'required_documents': ['rapport_inspection'],
        'required_fields': ['inspection_date', 'inspector_name'],
        'required_roles': [],
        'creates_deadline': True,
        'deadline_days': 30,
        'deadline_type': 'financing',
        'sends_notification': True,
        'notification_recipients': ['buyer', 'seller', 'buyer_broker'],
        'order_index': 5,
    },

    # ===== INSPECTION COMPLÉTÉE → FINANCEMENT APPROUVÉ =====
    {
        'code': 'approve_financing',
        'name': 'Obtenir le financement',
        'description': "Approbation hypothécaire confirmée par l'institution financière",
        'from_status': 'Inspection complétée',
        'to_status': 'Financement approuvé',
        'required_documents': ['lettre_engagement_hypothecaire'],
        'required_fields': ['mortgage_advisor_institution', 'financing_approval_date'],
        'required_roles': [],
        'creates_deadline': True,
        'deadline_days': 14,
        'deadline_type': 'notary_signing',
        'sends_notification': True,
        'notification_recipients': ['buyer', 'seller', 'buyer_broker', 'seller_broker'],
        'order_index': 6,
    },

    # ===== FINANCEMENT APPROUVÉ → SIGNATURE COMPLÉTÉE =====
    {
        'code': 'complete_signing',
        'name': 'Signer chez le notaire',
        'description': "Signature de l'acte de vente chez le notaire",
        'from_status': 'Financement approuvé',
        'to_status': 'Signature complétée',
        'required_documents': ['acte_vente'],
        'required_fields': ['notary_name', 'sale_act_signing_date'],
        'required_roles': [],
        'creates_deadline': True,
        'deadline_days': 7,
        'deadline_type': 'key_transfer',
        'sends_notification': True,
        'notification_recipients': ['buyer', 'seller', 'buyer_broker', 'seller_broker'],
        'order_index': 7,
    },

    # ===== SIGNATURE COMPLÉTÉE → TRANSACTION COMPLÉTÉE =====
    {
        'code': 'transfer_keys',
        'name': 'Transférer les clés',
        'description': 'Remise des clés et prise de possession',
        'from_status': 'Signature complétée',
        'to_status': 'Conclue',
        'required_fields': ['possession_date'],
        'required_documents': [],
        'required_roles': [],
        'creates_deadline': False,
        'sends_notification': True,
        'notification_recipients': ['buyer', 'seller', 'buyer_broker', 'seller_broker'],
        'order_index': 8,
    },

    # ===== ACTIONS SPÉCIALES =====
    {
        'code': 'cancel_transaction',
        'name': 'Annuler la transaction',
        'description': 'Annulation de la transaction pour raison valide',
        'from_status': '*',  # Peut être fait depuis n'importe quel statut
        'to_status': 'Annulée',
        'required_fields': ['cancellation_reason'],
        'required_documents': [],
        'required_roles': [],
        'creates_deadline': False,
        'sends_notification': True,
        'notification_recipients': ['buyer', 'seller', 'buyer_broker', 'seller_broker'],
        'order_index': 99,
    },
]
