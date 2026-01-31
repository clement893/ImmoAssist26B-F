/**
 * Réseau Module Adapters
 * Adapters pour utiliser le package @immoassist/reseau avec l'apiClient de l'application
 */

import { createReseauContactsAPI } from '@immoassist/reseau/api';
import { apiClient } from './client';
import { extractApiData } from './utils';

// Créer l'instance de l'API avec l'apiClient de l'application
export const reseauContactsAPI = createReseauContactsAPI({
  apiClient: apiClient as any, // apiClient est compatible avec AxiosInstance
  extractApiData,
});

// Réexporter les types pour compatibilité
export type { Contact, ContactCreate, ContactUpdate } from '@immoassist/reseau';
