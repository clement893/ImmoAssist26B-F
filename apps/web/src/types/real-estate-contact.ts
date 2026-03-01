/**
 * Real Estate Contact Types
 * Types pour les contacts des transactions immobilières
 */

export enum ContactType {
  CLIENT = "client",
  REAL_ESTATE_BROKER = "real_estate_broker",
  MORTGAGE_BROKER = "mortgage_broker",
  NOTARY = "notary",
  INSPECTOR = "inspector",
  CONTRACTOR = "contractor",
  INSURANCE_BROKER = "insurance_broker",
  OTHER = "other",
}

export interface RealEstateContact {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company?: string;
  type: ContactType;
  user_id?: number;
  created_at: string;
  updated_at: string;
}

export interface RealEstateContactCreate {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company?: string;
  type: ContactType;
  user_id?: number;
}

export interface RealEstateContactUpdate {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  type?: ContactType;
}

export interface TransactionContact {
  transaction_id: number;
  contact_id: number;
  role: string;
  created_at: string;
  contact: RealEstateContact;
}

export interface TransactionContactCreate {
  /** ID du contact real_estate_contacts (utiliser depuis la section Contacts immobiliers) */
  contact_id?: number;
  /** ID du contact réseau reseau/contacts (utiliser depuis la section Réseau) */
  reseau_contact_id?: number;
  role: string;
}

export interface RealEstateContactListResponse {
  contacts: RealEstateContact[];
  total: number;
  skip: number;
  limit: number;
}

export interface TransactionContactListResponse {
  contacts: TransactionContact[];
  total: number;
}

// Rôles prédéfinis pour les transactions
export const TRANSACTION_ROLES = [
  "Vendeur",
  "Acheteur",
  "Courtier immobilier (vendeur)",
  "Courtier immobilier (acheteur)",
  "Notaire instrumentant",
  "Inspecteur en bâtiments",
  "Arpenteur-géomètre",
  "Conseiller hypothécaire",
  "Autre",
] as const;

export type TransactionRole = typeof TRANSACTION_ROLES[number];
