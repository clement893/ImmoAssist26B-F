/**
 * API Module Exports
 *
 * Central export point for all API modules and clients.
 * This file re-exports everything from api.ts and other API modules.
 */

// Re-export apiClient and getApiUrl from the main api.ts file
export { apiClient, getApiUrl, api } from '../api';

// Re-export all API modules from the main api.ts file
export {
  authAPI,
  usersAPI,
  resourcesAPI,
  projectsAPI,
  aiAPI,
  emailAPI,
  subscriptionsAPI,
  teamsAPI,
  invitationsAPI,
  integrationsAPI,
  apiSettingsAPI,
  pagesAPI,
  formsAPI,
  formOcrAPI,
  menusAPI,
  supportTicketsAPI,
  seoAPI,
  surveysAPI,
} from '../api';

// Re-export client portal API
export { clientPortalAPI } from './client-portal';

// Re-export ERP portal API
export { erpPortalAPI } from './erp-portal';

// Re-export theme API functions
export * from './theme';

// Re-export theme font API
export * from './theme-font';
export { checkFonts } from './theme-font';

// Re-export notifications API
export { notificationsAPI } from './notifications';

// Re-export settings API
export { settingsAPI } from './settings';

// Re-export admin API
export { adminAPI } from './admin';

// Re-export teams API (from separate file)
export { teamsAPI as teamsAPIModule } from './teams';

// Re-export invitations API (from separate file)
export { invitationsAPI as invitationsAPIModule } from './invitations';

// Re-export RBAC API
export { rbacAPI } from './rbac';

// Re-export pages API (from separate file)
export { pagesAPI as pagesAPIModule } from './pages';

// Re-export client
export { apiClient as client } from './client';

// Re-export theme errors utilities
export * from './theme-errors';

// Re-export API keys API
export { apiKeysAPI } from './apiKeys';
export type {
  APIKeyCreate,
  APIKeyResponse,
  APIKeyListResponse,
  APIKeyRotateResponse,
  AdminAPIKeyListResponse,
} from './apiKeys';

// Re-export API utilities
export { extractApiData } from './utils';

// Re-export module adapters
export { reseauContactsAPI } from './reseau-adapters';
export type { Contact, ContactCreate, ContactUpdate } from './reseau-adapters';

export { transactionsAPI, realEstateContactsAPI } from './transactions-adapters';
export { transactionStepsAPI } from './transaction-steps-adapters';
export type {
  Step,
  StepAction,
  TransactionStepsResponse,
} from './transaction-steps-adapters';
export type {
  Transaction,
  TransactionCreate,
  TransactionUpdate,
  RealEstateContact,
  RealEstateContactCreate,
  RealEstateContactUpdate,
  TransactionContact,
  TransactionContactCreate,
  ContactType,
  TransactionRole,
  TRANSACTION_ROLES,
} from './transactions-adapters';

export { oaciqFormsAPI } from './oaciq-adapters';
export type {
  OACIQForm,
  OACIQFormSubmission,
  OACIQFormCategory,
  FormSubmissionStatus,
  FormFieldConfig,
  FormSection,
  OACIQFormFields,
  CreateOACIQFormSubmission,
} from './oaciq-adapters';

export { appointmentsAPI } from './appointments';
export type {
  AppointmentResponse,
  AppointmentListResponse,
  AppointmentCreate,
  AppointmentUpdate,
  AppointmentAttendeeCreate,
  AppointmentAttendeeResponse,
  AvailabilityResponse,
  AvailabilitySlot,
  CalendarConnectionResponse,
} from './appointments';
