/**
 * @file API des arrondissements avec contrôles d'accès basés sur les rôles
 */

import { 
  arrondissementApi as baseArrondissementApi,
  documentArrondissementApi as baseDocumentArrondissementApi,
  type Arrondissement,
  type DocumentArrondissement
} from './arrondissementApi';
import { 
  checkApiPermission, 
  filterDataByScope, 
  validateModificationAction,
  getUserInfoFromContext,
  createErrorResponse,
  logAccessAttempt
} from './roleBasedApi';
import { EntityType, ActionType } from '../types/roles';

// Interface pour les informations d'utilisateur
interface UserInfo {
  roles: string[];
  arrondissementCode?: number;
  departementCode?: number;
  regionCode?: number;
}

// API des arrondissements avec contrôles d'accès
export const roleBasedArrondissementApi = {
  getAll: async (user: any, filters?: { departement?: number; region?: number }): Promise<Arrondissement[]> => {
    const userInfo = getUserInfoFromContext(user);
    
    // Vérifier la permission de lecture
    if (!checkApiPermission(userInfo, EntityType.ARRONDISSEMENT, ActionType.READ)) {
      logAccessAttempt(userInfo, EntityType.ARRONDISSEMENT, ActionType.READ, false);
      throw new Error('Permission insuffisante pour consulter les arrondissements');
    }
    
    try {
      const data = await baseArrondissementApi.getAll(filters);
      
      // Filtrer les données selon la portée de l'utilisateur
      const filteredData = filterDataByScope(data, userInfo, EntityType.ARRONDISSEMENT, 'code_departement');
      
      logAccessAttempt(userInfo, EntityType.ARRONDISSEMENT, ActionType.READ, true, { count: filteredData.length });
      return filteredData;
    } catch (error) {
      logAccessAttempt(userInfo, EntityType.ARRONDISSEMENT, ActionType.READ, false, { error: error.message });
      throw error;
    }
  },
  
  getById: async (user: any, id: number): Promise<Arrondissement> => {
    const userInfo = getUserInfoFromContext(user);
    
    if (!checkApiPermission(userInfo, EntityType.ARRONDISSEMENT, ActionType.READ)) {
      logAccessAttempt(userInfo, EntityType.ARRONDISSEMENT, ActionType.READ, false, { id });
      throw new Error('Permission insuffisante pour consulter cet arrondissement');
    }
    
    try {
      const data = await baseArrondissementApi.getById(id);
      
      // Vérifier que l'utilisateur peut accéder à cet arrondissement
      if (hasPermission(userInfo.roles, EntityType.ARRONDISSEMENT, ActionType.READ, 'department') && 
          data.code_departement !== userInfo.departementCode) {
        throw new Error('Vous ne pouvez consulter que les arrondissements de votre département');
      }
      
      logAccessAttempt(userInfo, EntityType.ARRONDISSEMENT, ActionType.READ, true, { id });
      return data;
    } catch (error) {
      logAccessAttempt(userInfo, EntityType.ARRONDISSEMENT, ActionType.READ, false, { id, error: error.message });
      throw error;
    }
  },
  
  create: async (user: any, data: Omit<Arrondissement, 'code' | 'date_creation' | 'date_modification' | 'departement' | 'region' | 'bureauVotes' | 'pvArrondissements'>): Promise<Arrondissement> => {
    const userInfo = getUserInfoFromContext(user);
    
    if (!checkApiPermission(userInfo, EntityType.ARRONDISSEMENT, ActionType.CREATE)) {
      logAccessAttempt(userInfo, EntityType.ARRONDISSEMENT, ActionType.CREATE, false);
      throw new Error('Permission insuffisante pour créer un arrondissement');
    }
    
    try {
      const result = await baseArrondissementApi.create(data);
      logAccessAttempt(userInfo, EntityType.ARRONDISSEMENT, ActionType.CREATE, true, { id: result.code });
      return result;
    } catch (error) {
      logAccessAttempt(userInfo, EntityType.ARRONDISSEMENT, ActionType.CREATE, false, { error: error.message });
      throw error;
    }
  },
  
  update: async (user: any, id: number, data: Partial<Omit<Arrondissement, 'code' | 'date_creation' | 'date_modification' | 'departement' | 'region' | 'bureauVotes' | 'pvArrondissements'>>): Promise<Arrondissement> => {
    const userInfo = getUserInfoFromContext(user);
    
    // Vérifier la permission de modification
    const validation = validateModificationAction(userInfo, EntityType.ARRONDISSEMENT, ActionType.UPDATE);
    if (!validation.allowed) {
      logAccessAttempt(userInfo, EntityType.ARRONDISSEMENT, ActionType.UPDATE, false, { id, reason: validation.reason });
      throw new Error(validation.reason);
    }
    
    try {
      const result = await baseArrondissementApi.update(id, data);
      logAccessAttempt(userInfo, EntityType.ARRONDISSEMENT, ActionType.UPDATE, true, { id });
      return result;
    } catch (error) {
      logAccessAttempt(userInfo, EntityType.ARRONDISSEMENT, ActionType.UPDATE, false, { id, error: error.message });
      throw error;
    }
  },
  
  delete: async (user: any, id: number): Promise<{ message: string }> => {
    const userInfo = getUserInfoFromContext(user);
    
    // Vérifier la permission de suppression
    const validation = validateModificationAction(userInfo, EntityType.ARRONDISSEMENT, ActionType.DELETE);
    if (!validation.allowed) {
      logAccessAttempt(userInfo, EntityType.ARRONDISSEMENT, ActionType.DELETE, false, { id, reason: validation.reason });
      throw new Error(validation.reason);
    }
    
    try {
      const result = await baseArrondissementApi.delete(id);
      logAccessAttempt(userInfo, EntityType.ARRONDISSEMENT, ActionType.DELETE, true, { id });
      return result;
    } catch (error) {
      logAccessAttempt(userInfo, EntityType.ARRONDISSEMENT, ActionType.DELETE, false, { id, error: error.message });
      throw error;
    }
  }
};

// API des documents d'arrondissement avec contrôles d'accès
export const roleBasedDocumentArrondissementApi = {
  getAll: async (user: any, arrondissementCode?: number): Promise<DocumentArrondissement[]> => {
    const userInfo = getUserInfoFromContext(user);
    
    if (!checkApiPermission(userInfo, EntityType.DOCUMENT_ARRONDISSEMENT, ActionType.READ)) {
      logAccessAttempt(userInfo, EntityType.DOCUMENT_ARRONDISSEMENT, ActionType.READ, false);
      throw new Error('Permission insuffisante pour consulter les documents');
    }
    
    try {
      const data = await baseDocumentArrondissementApi.getAll(arrondissementCode);
      
      // Filtrer les données selon la portée de l'utilisateur
      const filteredData = filterDataByScope(data, userInfo, EntityType.DOCUMENT_ARRONDISSEMENT, 'code_arrondissement');
      
      logAccessAttempt(userInfo, EntityType.DOCUMENT_ARRONDISSEMENT, ActionType.READ, true, { count: filteredData.length });
      return filteredData;
    } catch (error) {
      logAccessAttempt(userInfo, EntityType.DOCUMENT_ARRONDISSEMENT, ActionType.READ, false, { error: error.message });
      throw error;
    }
  },
  
  getById: async (user: any, id: number): Promise<DocumentArrondissement> => {
    const userInfo = getUserInfoFromContext(user);
    
    if (!checkApiPermission(userInfo, EntityType.DOCUMENT_ARRONDISSEMENT, ActionType.READ)) {
      logAccessAttempt(userInfo, EntityType.DOCUMENT_ARRONDISSEMENT, ActionType.READ, false, { id });
      throw new Error('Permission insuffisante pour consulter ce document');
    }
    
    try {
      const data = await baseDocumentArrondissementApi.getById(id);
      
      // Vérifier que l'utilisateur peut accéder à ce document
      if (hasPermission(userInfo.roles, EntityType.DOCUMENT_ARRONDISSEMENT, ActionType.READ, 'own') && 
          data.code_arrondissement !== userInfo.arrondissementCode) {
        throw new Error('Vous ne pouvez consulter que les documents de votre arrondissement');
      }
      
      logAccessAttempt(userInfo, EntityType.DOCUMENT_ARRONDISSEMENT, ActionType.READ, true, { id });
      return data;
    } catch (error) {
      logAccessAttempt(userInfo, EntityType.DOCUMENT_ARRONDISSEMENT, ActionType.READ, false, { id, error: error.message });
      throw error;
    }
  },
  
  create: async (user: any, data: { code_arrondissement: number; libelle: string; file: File }): Promise<DocumentArrondissement> => {
    const userInfo = getUserInfoFromContext(user);
    
    if (!checkApiPermission(userInfo, EntityType.DOCUMENT_ARRONDISSEMENT, ActionType.CREATE)) {
      logAccessAttempt(userInfo, EntityType.DOCUMENT_ARRONDISSEMENT, ActionType.CREATE, false);
      throw new Error('Permission insuffisante pour créer un document');
    }
    
    // Vérifier que l'utilisateur peut créer un document pour cet arrondissement
    if (hasPermission(userInfo.roles, EntityType.DOCUMENT_ARRONDISSEMENT, ActionType.CREATE, 'own') && 
        data.code_arrondissement !== userInfo.arrondissementCode) {
      throw new Error('Vous ne pouvez créer des documents que pour votre arrondissement');
    }
    
    try {
      const result = await baseDocumentArrondissementApi.create(data);
      logAccessAttempt(userInfo, EntityType.DOCUMENT_ARRONDISSEMENT, ActionType.CREATE, true, { id: result.code });
      return result;
    } catch (error) {
      logAccessAttempt(userInfo, EntityType.DOCUMENT_ARRONDISSEMENT, ActionType.CREATE, false, { error: error.message });
      throw error;
    }
  },
  
  update: async (user: any, id: number, data: { libelle: string; file?: File }): Promise<DocumentArrondissement> => {
    const userInfo = getUserInfoFromContext(user);
    
    // Vérifier la permission de modification
    const validation = validateModificationAction(userInfo, EntityType.DOCUMENT_ARRONDISSEMENT, ActionType.UPDATE);
    if (!validation.allowed) {
      logAccessAttempt(userInfo, EntityType.DOCUMENT_ARRONDISSEMENT, ActionType.UPDATE, false, { id, reason: validation.reason });
      throw new Error(validation.reason);
    }
    
    try {
      const result = await baseDocumentArrondissementApi.update(id, data);
      logAccessAttempt(userInfo, EntityType.DOCUMENT_ARRONDISSEMENT, ActionType.UPDATE, true, { id });
      return result;
    } catch (error) {
      logAccessAttempt(userInfo, EntityType.DOCUMENT_ARRONDISSEMENT, ActionType.UPDATE, false, { id, error: error.message });
      throw error;
    }
  },
  
  delete: async (user: any, id: number): Promise<{ message: string }> => {
    const userInfo = getUserInfoFromContext(user);
    
    // Vérifier la permission de suppression
    const validation = validateModificationAction(userInfo, EntityType.DOCUMENT_ARRONDISSEMENT, ActionType.DELETE);
    if (!validation.allowed) {
      logAccessAttempt(userInfo, EntityType.DOCUMENT_ARRONDISSEMENT, ActionType.DELETE, false, { id, reason: validation.reason });
      throw new Error(validation.reason);
    }
    
    try {
      const result = await baseDocumentArrondissementApi.delete(id);
      logAccessAttempt(userInfo, EntityType.DOCUMENT_ARRONDISSEMENT, ActionType.DELETE, true, { id });
      return result;
    } catch (error) {
      logAccessAttempt(userInfo, EntityType.DOCUMENT_ARRONDISSEMENT, ActionType.DELETE, false, { id, error: error.message });
      throw error;
    }
  },
  
  getDownloadUrl: (document: DocumentArrondissement): string => {
    return baseDocumentArrondissementApi.getDownloadUrl(document);
  }
};

// Helper pour vérifier les permissions (importé depuis le fichier roles.ts)
const hasPermission = (userRoles: string[], entity: EntityType, action: ActionType, scope?: 'own' | 'department' | 'region' | 'all'): boolean => {
  // Cette fonction devrait être importée depuis le fichier roles.ts
  // Pour l'instant, on fait une implémentation basique
  return true; // À remplacer par l'import réel
};
