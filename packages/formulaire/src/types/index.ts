/**
 * Formulaire Module Types
 * Types pour les formulaires OACIQ
 */

export enum OACIQFormCategory {
  OBLIGATOIRE = 'obligatoire',
  RECOMMANDE = 'recommandé',
  CURATEUR_PUBLIC = 'curateur_public',
}

export enum FormSubmissionStatus {
  DRAFT = 'draft',
  COMPLETED = 'completed',
  SIGNED = 'signed',
}

export interface FormFieldConfig {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'email' | 'number' | 'date' | 'select' | 'radio' | 'checkbox' | 'file';
  required: boolean;
  placeholder?: string;
  helpText?: string;
  validation?: Record<string, any>;
  options?: Array<{ value: string; label: string }>;
  format?: string;
  currency?: string;
}

export interface FormSection {
  id: string;
  title: string;
  order: number;
  fields: FormFieldConfig[];
}

export interface OACIQFormFields {
  sections: FormSection[];
}

export interface OACIQForm {
  id: number;
  code: string | null;
  name: string;
  category: string | null;
  pdfUrl: string | null;
  fields: Record<string, any>;
  transactionId: number | null;
  userId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface OACIQFormSubmission {
  id: number;
  formId: number;
  formCode?: string | null;
  transactionId: number | null;
  data: Record<string, any>;
  status: string;
  userId: number | null;
  submittedAt: string;
}

export interface CreateOACIQFormSubmission {
  formCode: string;
  transactionId?: number;
  data: Record<string, any>;
  status?: FormSubmissionStatus;
}

export interface ExtractFieldsRequest {
  formCode: string;
  pdfUrl: string;
}

export interface ExtractFieldsResponse {
  success: boolean;
  fields: Record<string, any>;
  form: OACIQForm;
}
