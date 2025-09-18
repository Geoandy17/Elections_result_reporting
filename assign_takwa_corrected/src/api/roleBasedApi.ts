/**
 * @file API avec contrôles d'accès basés sur les rôles
 */

import { EntityType, ActionType, hasPermission } from '../types/roles';

// Interface pour les informations d'utilisateur
interface UserInfo {
  roles: string[];
  arrondissementCode?: number;
  departementCode?: number;
  regionCode?: number;
}

// Helper pour vérifier les permissions dans les appels API
export const checkApiPermission = (
  userInfo: UserInfo,
  entity: EntityType,
  action: ActionType,
  scope?: 'own' | 'department' | 'region' | 'all'
): boolean => {
  return hasPermission(userInfo.roles, entity, action, scope);
};

// Helper pour filtrer les données selon la portée de l'utilisateur
export const filterDataByScope = <T extends any>(
  data: T[],
  userInfo: UserInfo,
  entity: EntityType,
  scopeField?: string
): T[] => {
  if (!scopeField) return data;
  
  // Si l'utilisateur a accès à tout, retourner toutes les données
  if (hasPermission(userInfo.roles, entity, ActionType.READ, 'all')) {
    return data;
  }
  
  // Filtrer selon la portée
  if (hasPermission(userInfo.roles, entity, ActionType.READ, 'region') && userInfo.regionCode) {
    return data.filter((item: any) => item.regionCode === userInfo.regionCode);
  }
  
  if (hasPermission(userInfo.roles, entity, ActionType.READ, 'department') && userInfo.departementCode) {
    return data.filter((item: any) => item.departementCode === userInfo.departementCode);
  }
  
  if (hasPermission(userInfo.roles, entity, ActionType.READ, 'own') && userInfo.arrondissementCode) {
    return data.filter((item: any) => item.arrondissementCode === userInfo.arrondissementCode);
  }
  
  return [];
};

// Helper pour valider les actions de modification
export const validateModificationAction = (
  userInfo: UserInfo,
  entity: EntityType,
  action: ActionType,
  targetData?: any
): { allowed: boolean; reason?: string } => {
  // Vérifier la permission de base
  if (!hasPermission(userInfo.roles, entity, action)) {
    return { allowed: false, reason: 'Permission insuffisante' };
  }
  
  // Vérifications spécifiques selon l'entité et l'action
  switch (entity) {
    case EntityType.DOCUMENT_ARRONDISSEMENT:
      if (action === ActionType.UPDATE || action === ActionType.DELETE) {
        // Vérifier que l'utilisateur peut modifier ses propres documents
        if (hasPermission(userInfo.roles, entity, action, 'own') && 
            targetData?.arrondissementCode !== userInfo.arrondissementCode) {
          return { allowed: false, reason: 'Vous ne pouvez modifier que vos propres documents' };
        }
      }
      break;
      
    case EntityType.PARTICIPATION_DEPARTEMENTALE:
      if (action === ActionType.UPDATE || action === ActionType.DELETE) {
        // Vérifier que l'utilisateur peut modifier les participations de son département
        if (hasPermission(userInfo.roles, entity, action, 'department') && 
            targetData?.departementCode !== userInfo.departementCode) {
          return { allowed: false, reason: 'Vous ne pouvez modifier que les participations de votre département' };
        }
      }
      break;
      
    case EntityType.REDRESSEMENT_CANDIDAT:
    case EntityType.REDRESSEMENT_BUREAU:
      if (action === ActionType.UPDATE || action === ActionType.DELETE) {
        // Vérifier que l'utilisateur peut modifier les redressements de sa zone
        if (hasPermission(userInfo.roles, entity, action, 'own') && 
            targetData?.arrondissementCode !== userInfo.arrondissementCode) {
          return { allowed: false, reason: 'Vous ne pouvez modifier que les redressements de votre zone' };
        }
      }
      break;
  }
  
  return { allowed: true };
};

// Helper pour les actions de validation
export const validateValidationAction = (
  userInfo: UserInfo,
  entity: EntityType,
  action: ActionType,
  targetData?: any
): { allowed: boolean; reason?: string } => {
  // Vérifier la permission de validation
  if (!hasPermission(userInfo.roles, entity, action)) {
    return { allowed: false, reason: 'Permission de validation insuffisante' };
  }
  
  // Vérifications spécifiques pour la validation
  switch (entity) {
    case EntityType.DOCUMENT_ARRONDISSEMENT:
      if (hasPermission(userInfo.roles, entity, action, 'department') && 
          targetData?.arrondissementCode && 
          userInfo.departementCode) {
        // Vérifier que le document appartient au département de l'utilisateur
        // Cette logique dépendrait de la structure de vos données
        return { allowed: true };
      }
      break;
      
    case EntityType.PARTICIPATION_DEPARTEMENTALE:
      if (hasPermission(userInfo.roles, entity, action, 'department') && 
          targetData?.departementCode === userInfo.departementCode) {
        return { allowed: true };
      }
      break;
  }
  
  return { allowed: true };
};

// Helper pour obtenir les informations de l'utilisateur depuis le contexte
export const getUserInfoFromContext = (user: any): UserInfo => {
  const roles = user?.roles ? 
    user.roles.map((role: any) => role.libelle.toLowerCase()) : 
    (user?.role ? [user.role.libelle.toLowerCase()] : []);
    
  return {
    roles,
    arrondissementCode: user?.arrondissementCode,
    departementCode: user?.departementCode,
    regionCode: user?.regionCode
  };
};

// Helper pour créer des réponses d'erreur standardisées
export const createErrorResponse = (message: string, code: string = 'PERMISSION_DENIED') => {
  return {
    error: message,
    code,
    timestamp: new Date().toISOString()
  };
};

// Helper pour logger les tentatives d'accès
export const logAccessAttempt = (
  userInfo: UserInfo,
  entity: EntityType,
  action: ActionType,
  success: boolean,
  details?: any
) => {
  console.log('Access Attempt:', {
    user: userInfo,
    entity,
    action,
    success,
    details,
    timestamp: new Date().toISOString()
  });
};
