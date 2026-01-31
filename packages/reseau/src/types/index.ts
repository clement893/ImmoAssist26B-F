/**
 * Réseau Module Types
 * Types pour le module Réseau (contacts réseau)
 */

export interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  company_id: number | null;
  company_name?: string;
  position: string | null;
  circle: string | null;
  linkedin: string | null;
  photo_url: string | null;
  photo_filename: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  birthday: string | null;
  language: string | null;
  employee_id: number | null;
  employee_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ContactCreate {
  first_name: string;
  last_name: string;
  company_id?: number | null;
  company_name?: string | null;
  position?: string | null;
  circle?: string | null;
  linkedin?: string | null;
  photo_url?: string | null;
  photo_filename?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  country?: string | null;
  birthday?: string | null;
  language?: string | null;
  employee_id?: number | null;
}

export interface ContactUpdate extends Partial<ContactCreate> {}
