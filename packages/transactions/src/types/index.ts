/**
 * Transactions Module Types
 * Types pour le module Transactions (transactions immobilières)
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
  contact_id: number;
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

export interface Transaction {
  id: number;
  name: string;
  dossier_number?: string;
  status: string;
  created_at: string;
  updated_at: string;
  expected_closing_date?: string;
  actual_closing_date?: string;
  property_address?: string;
  property_city?: string;
  property_postal_code?: string;
  property_province?: string;
  lot_number?: string;
  matricule_number?: string;
  property_type?: string;
  construction_year?: number;
  land_area_sqft?: number;
  land_area_sqm?: number;
  living_area_sqft?: number;
  living_area_sqm?: number;
  total_rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  inclusions?: string[];
  exclusions?: string[];
  sellers?: Array<{ name: string; [key: string]: any }>;
  buyers?: Array<{ name: string; [key: string]: any }>;
  seller_broker?: { name: string; [key: string]: any };
  buyer_broker?: { name: string; [key: string]: any };
  notary?: { name: string; [key: string]: any };
  inspector?: { name: string; [key: string]: any };
  surveyor?: { name: string; [key: string]: any };
  mortgage_advisor?: { name: string; [key: string]: any };
  listing_price?: number;
  offered_price?: number;
  final_sale_price?: number;
  deposit_amount?: number;
  broker_commission_percent?: number;
  broker_commission_amount?: number;
  down_payment_amount?: number;
  mortgage_amount?: number;
  mortgage_institution?: string;
  [key: string]: any;
}

export interface TransactionCreate {
  name: string;
  dossier_number?: string;
  status?: string;
  [key: string]: any;
}

export interface TransactionUpdate {
  name?: string;
  dossier_number?: string;
  status?: string;
  [key: string]: any;
}
