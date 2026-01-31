/**
 * Transaction Progression Logic
 * Logique de progression des transactions immobilières selon le workflow québécois
 */

import { TransactionStep, StepStatus } from '@/components/transactions/StatusStepper';

export interface TransactionData {
  id: number;
  dossier_number: string;
  status: string;
  created_at: string;
  expected_closing_date?: string;
  actual_closing_date?: string;
  property_address: string;
  property_city: string;
  property_postal_code: string;
  sellers: Array<{ name: string; [key: string]: any }>;
  buyers: Array<{ name: string; [key: string]: any }>;
  final_sale_price?: number;
  promise_to_purchase_date?: string;
  promise_acceptance_date?: string;
  inspection_deadline?: string;
  inspection_date?: string;
  inspection_condition_lifted_date?: string;
  financing_deadline?: string;
  financing_condition_lifted_date?: string;
  mortgage_act_signing_date?: string;
  sale_act_signing_date?: string;
  possession_date?: string;
  location_certificate_received?: boolean;
  location_certificate_conform?: boolean;
  seller_declaration_signed?: boolean;
  inspection_report_received?: boolean;
  inspection_report_satisfactory?: boolean;
  financing_approval_received?: boolean;
  financing_approval_date?: string;
  home_insurance_proof_received?: boolean;
  seller_quittance_received?: boolean;
  seller_quittance_confirmed?: boolean;
  registry_publication_number?: string;
  mortgage_institution?: string;
}

/**
 * Détermine le statut de progression global d'une transaction
 * Basé sur le workflow québécois des transactions immobilières
 */
export function getTransactionProgressionStatus(transaction: TransactionData): {
  currentStep: string;
  overallProgress: number;
  status: 'draft' | 'active' | 'pending_conditions' | 'firm' | 'closing' | 'closed' | 'cancelled';
} {
  const now = new Date();
  
  // 1. DRAFT - Transaction créée mais pas encore listée
  if (!transaction.promise_to_purchase_date) {
    return {
      currentStep: 'creation',
      overallProgress: 5,
      status: 'draft',
    };
  }

  // 2. ACTIVE - Promesse d'achat soumise
  if (transaction.promise_to_purchase_date && !transaction.promise_acceptance_date) {
    return {
      currentStep: 'promise',
      overallProgress: 15,
      status: 'active',
    };
  }

  // 3. PENDING_CONDITIONS - Promesse acceptée, conditions en attente
  const inspectionLifted = !!transaction.inspection_condition_lifted_date;
  const financingLifted = !!transaction.financing_condition_lifted_date;
  const allConditionsMet = inspectionLifted && financingLifted;

  if (transaction.promise_acceptance_date && !allConditionsMet) {
    return {
      currentStep: 'conditions',
      overallProgress: 30,
      status: 'pending_conditions',
    };
  }

  // 4. FIRM - Toutes les conditions sont levées (vente ferme)
  if (allConditionsMet && !transaction.sale_act_signing_date) {
    return {
      currentStep: 'firm',
      overallProgress: 60,
      status: 'firm',
    };
  }

  // 5. CLOSING - Actes signés, en attente de clôture
  if (transaction.sale_act_signing_date && !transaction.actual_closing_date) {
    return {
      currentStep: 'closing',
      overallProgress: 85,
      status: 'closing',
    };
  }

  // 6. CLOSED - Transaction conclue
  if (transaction.actual_closing_date && transaction.seller_quittance_confirmed) {
    return {
      currentStep: 'finalization',
      overallProgress: 100,
      status: 'closed',
    };
  }

  // 7. CANCELLED - Transaction annulée
  if (transaction.status === 'Annulée') {
    return {
      currentStep: 'cancelled',
      overallProgress: 0,
      status: 'cancelled',
    };
  }

  return {
    currentStep: 'creation',
    overallProgress: 0,
    status: 'draft',
  };
}

/**
 * Calcule les étapes détaillées de progression d'une transaction
 */
export function calculateTransactionSteps(transaction: TransactionData): TransactionStep[] {
  const steps: TransactionStep[] = [];
  const now = new Date();

  // 1. Création du dossier
  steps.push({
    id: 'creation',
    title: 'Création du dossier',
    description: 'Dossier de transaction créé',
    status: 'completed',
    date: transaction.created_at,
    details: [
      `Numéro de dossier: ${transaction.dossier_number}`,
      `Statut initial: ${transaction.status}`,
    ],
    progress: 100,
  });

  // 2. Promesse d'achat
  const promiseDate = transaction.promise_to_purchase_date 
    ? new Date(transaction.promise_to_purchase_date) 
    : null;
  const promiseAccepted = !!transaction.promise_acceptance_date;
  
  let promiseStatus: StepStatus = 'pending';
  let promiseProgress = 0;
  
  if (promiseAccepted) {
    promiseStatus = 'completed';
    promiseProgress = 100;
  } else if (promiseDate) {
    promiseStatus = 'current';
    promiseProgress = 50; // Promesse soumise mais pas encore acceptée
  }

  steps.push({
    id: 'promise',
    title: 'Promesse d\'achat',
    description: promiseAccepted 
      ? 'Promesse d\'achat acceptée' 
      : promiseDate 
      ? 'Promesse d\'achat soumise - En attente d\'acceptation'
      : 'En attente de promesse d\'achat',
    status: promiseStatus,
    date: transaction.promise_acceptance_date || transaction.promise_to_purchase_date,
    details: promiseAccepted ? [
      `Date de la promesse: ${formatDate(transaction.promise_to_purchase_date)}`,
      `Date d'acceptation: ${formatDate(transaction.promise_acceptance_date)}`,
    ] : promiseDate ? [
      `Date de soumission: ${formatDate(transaction.promise_to_purchase_date)}`,
      'En attente d\'acceptation du vendeur',
    ] : undefined,
    progress: promiseProgress,
  });

  // 3. Condition d'inspection
  const inspectionDeadline = transaction.inspection_deadline 
    ? new Date(transaction.inspection_deadline) 
    : null;
  const inspectionDone = !!transaction.inspection_date;
  const inspectionLifted = !!transaction.inspection_condition_lifted_date;
  const inspectionSatisfactory = transaction.inspection_report_satisfactory;
  
  let inspectionStatus: StepStatus = 'pending';
  let inspectionProgress = 0;
  
  if (inspectionLifted) {
    inspectionStatus = 'completed';
    inspectionProgress = 100;
  } else if (inspectionDone && inspectionSatisfactory === false) {
    inspectionStatus = 'blocked';
    inspectionProgress = 50;
  } else if (inspectionDone) {
    inspectionStatus = 'current';
    inspectionProgress = 75; // Inspection faite, rapport reçu, en attente de levée
  } else if (inspectionDeadline && now >= inspectionDeadline) {
    inspectionStatus = 'warning';
    inspectionProgress = 25;
  } else if (promiseAccepted) {
    inspectionStatus = 'current';
    inspectionProgress = 10;
  }

  steps.push({
    id: 'inspection',
    title: 'Inspection du bâtiment',
    description: inspectionLifted 
      ? 'Inspection complétée et condition levée' 
      : inspectionDone 
      ? inspectionSatisfactory === false
        ? 'Inspection effectuée - Rapport non satisfaisant'
        : 'Inspection effectuée - En attente de levée de condition'
      : inspectionDeadline && now >= inspectionDeadline
      ? 'Date limite dépassée - Action requise'
      : 'En attente d\'inspection',
    status: inspectionStatus,
    date: transaction.inspection_condition_lifted_date || transaction.inspection_date,
    deadline: transaction.inspection_deadline,
    details: [
      inspectionDone && `Date d'inspection: ${formatDate(transaction.inspection_date)}`,
      inspectionDeadline && `Date limite: ${formatDate(transaction.inspection_deadline)}`,
      inspectionLifted && `Condition levée: ${formatDate(transaction.inspection_condition_lifted_date)}`,
      transaction.inspection_report_received && 'Rapport d\'inspection reçu',
      inspectionSatisfactory !== undefined && `Rapport ${inspectionSatisfactory ? 'satisfaisant' : 'non satisfaisant'}`,
    ].filter(Boolean) as string[],
    progress: inspectionProgress,
  });

  // 4. Condition de financement
  const financingDeadline = transaction.financing_deadline 
    ? new Date(transaction.financing_deadline) 
    : null;
  const financingApproved = transaction.financing_approval_received;
  const financingLifted = !!transaction.financing_condition_lifted_date;
  
  let financingStatus: StepStatus = 'pending';
  let financingProgress = 0;
  
  if (financingLifted) {
    financingStatus = 'completed';
    financingProgress = 100;
  } else if (financingApproved) {
    financingStatus = 'current';
    financingProgress = 75; // Financement approuvé, en attente de levée
  } else if (financingDeadline && now >= financingDeadline) {
    financingStatus = 'warning';
    financingProgress = 25;
  } else if (promiseAccepted) {
    financingStatus = 'current';
    financingProgress = 10;
  }

  steps.push({
    id: 'financing',
    title: 'Financement hypothécaire',
    description: financingLifted 
      ? 'Financement approuvé et condition levée' 
      : financingApproved 
      ? 'Financement approuvé - En attente de levée de condition'
      : financingDeadline && now >= financingDeadline
      ? 'Date limite dépassée - Action requise'
      : 'En attente d\'approbation',
    status: financingStatus,
    date: transaction.financing_condition_lifted_date || transaction.financing_approval_date,
    deadline: transaction.financing_deadline,
    details: [
      financingApproved && transaction.financing_approval_date && `Approbation reçue: ${formatDate(transaction.financing_approval_date)}`,
      financingDeadline && `Date limite: ${formatDate(transaction.financing_deadline)}`,
      financingLifted && transaction.financing_condition_lifted_date && `Condition levée: ${formatDate(transaction.financing_condition_lifted_date)}`,
      transaction.mortgage_institution && `Institution: ${transaction.mortgage_institution}`,
    ].filter(Boolean) as string[],
    progress: financingProgress,
  });

  // 5. Vente ferme (toutes conditions levées)
  const allConditionsMet = inspectionLifted && financingLifted;
  
  steps.push({
    id: 'firm',
    title: 'Vente ferme',
    description: allConditionsMet 
      ? 'Toutes les conditions sont levées - Transaction ferme'
      : 'En attente de levée de toutes les conditions',
    status: allConditionsMet ? 'completed' : 'pending',
    date: allConditionsMet && inspectionLifted && financingLifted
      ? (transaction.inspection_condition_lifted_date && transaction.financing_condition_lifted_date
          ? new Date(transaction.inspection_condition_lifted_date > transaction.financing_condition_lifted_date 
              ? transaction.inspection_condition_lifted_date 
              : transaction.financing_condition_lifted_date).toISOString()
          : undefined)
      : undefined,
    details: allConditionsMet ? [
      'Toutes les conditions préalables sont levées',
      'La transaction est maintenant ferme',
    ] : [
      'En attente de levée des conditions d\'inspection et de financement',
    ],
    progress: allConditionsMet ? 100 : 0,
  });

  // 6. Documents notariés
  const locationCertReceived = transaction.location_certificate_received;
  const locationCertConform = transaction.location_certificate_conform;
  const sellerDeclSigned = transaction.seller_declaration_signed;
  const insuranceReceived = transaction.home_insurance_proof_received;
  
  const documentsComplete = locationCertReceived && 
    locationCertConform !== false && 
    sellerDeclSigned && 
    insuranceReceived;
  
  const documentsProgress = [
    locationCertReceived,
    locationCertConform !== false,
    sellerDeclSigned,
    insuranceReceived,
  ].filter(Boolean).length * 25;

  steps.push({
    id: 'documents',
    title: 'Documents notariés',
    description: documentsComplete 
      ? 'Tous les documents requis sont prêts' 
      : 'En attente de documents',
    status: documentsComplete ? 'completed' : allConditionsMet ? 'current' : 'pending',
    details: [
      locationCertReceived && `Certificat de localisation: ${locationCertConform === true ? 'Conforme' : locationCertConform === false ? 'Non conforme' : 'En attente de vérification'}`,
      sellerDeclSigned && 'Déclaration du vendeur signée',
      insuranceReceived && 'Preuve d\'assurance habitation reçue',
    ].filter(Boolean) as string[],
    progress: documentsProgress,
  });

  // 7. Signature des actes
  const mortgageActSigned = !!transaction.mortgage_act_signing_date;
  const saleActSigned = !!transaction.sale_act_signing_date;
  const closingDate = transaction.actual_closing_date 
    ? new Date(transaction.actual_closing_date) 
    : null;
  const expectedClosing = transaction.expected_closing_date 
    ? new Date(transaction.expected_closing_date) 
    : null;
  
  let signingStatus: StepStatus = 'pending';
  let signingProgress = 0;
  
  if (saleActSigned) {
    signingStatus = 'completed';
    signingProgress = 100;
  } else if (mortgageActSigned) {
    signingStatus = 'current';
    signingProgress = 50; // Acte d'hypothèque signé, en attente de l'acte de vente
  } else if (expectedClosing && now >= expectedClosing) {
    signingStatus = 'warning';
    signingProgress = 10;
  } else if (documentsComplete) {
    signingStatus = 'current';
    signingProgress = 10;
  }

  steps.push({
    id: 'signing',
    title: 'Signature des actes',
    description: saleActSigned 
      ? 'Actes signés - Transaction conclue' 
      : mortgageActSigned 
      ? 'Acte d\'hypothèque signé - En attente de l\'acte de vente'
      : expectedClosing && now >= expectedClosing
      ? 'Date prévue dépassée - Signature requise'
      : 'En attente de signature',
    status: signingStatus,
    date: transaction.sale_act_signing_date || transaction.mortgage_act_signing_date,
    deadline: transaction.expected_closing_date,
    details: [
      mortgageActSigned && `Acte d'hypothèque signé: ${formatDate(transaction.mortgage_act_signing_date)}`,
      saleActSigned && `Acte de vente signé: ${formatDate(transaction.sale_act_signing_date)}`,
      expectedClosing && `Date prévue: ${formatDate(transaction.expected_closing_date)}`,
      closingDate && `Date réelle: ${formatDate(transaction.actual_closing_date)}`,
    ].filter(Boolean) as string[],
    progress: signingProgress,
  });

  // 8. Prise de possession
  const possessionDate = transaction.possession_date 
    ? new Date(transaction.possession_date) 
    : null;
  const possessionDone = possessionDate && now >= possessionDate;
  
  steps.push({
    id: 'possession',
    title: 'Prise de possession',
    description: possessionDone 
      ? 'Prise de possession effectuée' 
      : possessionDate 
      ? `Prise de possession prévue le ${formatDate(transaction.possession_date)}`
      : 'En attente de prise de possession',
    status: possessionDone ? 'completed' : saleActSigned ? 'current' : 'pending',
    date: transaction.possession_date,
    details: [
      possessionDate && `Date: ${formatDate(transaction.possession_date)}`,
    ].filter(Boolean) as string[],
    progress: possessionDone ? 100 : saleActSigned ? 50 : 0,
  });

  // 9. Finalisation
  const quittanceReceived = transaction.seller_quittance_received;
  const quittanceConfirmed = transaction.seller_quittance_confirmed;
  const finalizationComplete = quittanceConfirmed && saleActSigned;
  
  steps.push({
    id: 'finalization',
    title: 'Finalisation',
    description: finalizationComplete 
      ? 'Transaction finalisée' 
      : quittanceReceived 
      ? 'Quittance reçue - En attente de confirmation'
      : 'En attente de finalisation',
    status: finalizationComplete ? 'completed' : quittanceReceived ? 'current' : 'pending',
    date: quittanceConfirmed ? transaction.actual_closing_date : undefined,
    details: [
      quittanceReceived && 'Quittance du vendeur reçue',
      quittanceConfirmed && 'Quittance confirmée',
      transaction.registry_publication_number && `Publication: ${transaction.registry_publication_number}`,
    ].filter(Boolean) as string[],
    progress: finalizationComplete ? 100 : quittanceReceived ? 75 : saleActSigned ? 25 : 0,
  });

  return steps;
}

function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-CA', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch {
    return dateString;
  }
}
