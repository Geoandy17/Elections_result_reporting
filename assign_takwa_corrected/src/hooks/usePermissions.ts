/**
 * @file Hook personnalisé pour la gestion des permissions basées sur les rôles
 */

import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  EntityType, 
  ActionType, 
  hasPermission, 
  canAccessEntity, 
  canModifyEntity, 
  canValidateEntity,
  RoleType 
} from '../types/roles';

export const usePermissions = () => {
  const { user } = useAuth();

  // Obtenir les rôles de l'utilisateur
  const userRoles = useMemo(() => {
    if (!user) return [];
    
    // Support pour la structure multiple rôles (nouvelle)
    if (user.roles && Array.isArray(user.roles)) {
      return user.roles.map(role => role.libelle.toLowerCase());
    }
    
    // Support pour la structure single rôle (legacy)
    if (user.role) {
      return [user.role.libelle.toLowerCase()];
    }
    
    return [];
  }, [user]);

  // Vérifier si l'utilisateur a une permission spécifique
  const hasPermissionFor = (
    entity: EntityType, 
    action: ActionType, 
    scope?: 'own' | 'department' | 'region' | 'all'
  ): boolean => {
    return hasPermission(userRoles, entity, action, scope);
  };

  // Vérifier si l'utilisateur peut accéder à une entité
  const canAccess = (entity: EntityType): boolean => {
    return canAccessEntity(userRoles, entity);
  };

  // Vérifier si l'utilisateur peut modifier une entité
  const canModify = (entity: EntityType): boolean => {
    return canModifyEntity(userRoles, entity);
  };

  // Vérifier si l'utilisateur peut valider une entité
  const canValidate = (entity: EntityType): boolean => {
    return canValidateEntity(userRoles, entity);
  };

  // Vérifier si l'utilisateur peut créer une entité
  const canCreate = (entity: EntityType): boolean => {
    return hasPermissionFor(entity, ActionType.CREATE);
  };

  // Vérifier si l'utilisateur peut supprimer une entité
  const canDelete = (entity: EntityType): boolean => {
    return hasPermissionFor(entity, ActionType.DELETE);
  };

  // Vérifier si l'utilisateur peut approuver une entité
  const canApprove = (entity: EntityType): boolean => {
    return hasPermissionFor(entity, ActionType.APPROVE);
  };

  // Vérifier si l'utilisateur peut rejeter une entité
  const canReject = (entity: EntityType): boolean => {
    return hasPermissionFor(entity, ActionType.REJECT);
  };

  // Obtenir le niveau d'accès de l'utilisateur
  const getAccessLevel = (): 'read' | 'modify' | 'validate' | 'admin' => {
    if (userRoles.includes(RoleType.ADMINISTRATEUR)) return 'admin';
    if (userRoles.some(role => [RoleType.VALIDATEUR, RoleType.SUPERVISEUR_DEPARTEMENTALE].includes(role as RoleType))) return 'validate';
    if (userRoles.includes(RoleType.SCRUTATEUR)) return 'modify';
    return 'read';
  };

  // Vérifier si l'utilisateur est administrateur
  const isAdmin = (): boolean => {
    return userRoles.includes(RoleType.ADMINISTRATEUR);
  };

  // Vérifier si l'utilisateur est validateur
  const isValidator = (): boolean => {
    return userRoles.includes(RoleType.VALIDATEUR) || userRoles.includes(RoleType.SUPERVISEUR_DEPARTEMENTALE);
  };

  // Vérifier si l'utilisateur est scrutateur
  const isScrutator = (): boolean => {
    return userRoles.includes(RoleType.SCRUTATEUR);
  };

  // Vérifier si l'utilisateur est observateur local
  const isLocalObserver = (): boolean => {
    return userRoles.includes(RoleType.OBSERVATEUR_LOCAL);
  };

  // Vérifier si l'utilisateur est superviseur départemental
  const isDepartmentSupervisor = (): boolean => {
    return userRoles.includes(RoleType.SUPERVISEUR_DEPARTEMENTALE);
  };

  // Obtenir les entités accessibles par l'utilisateur
  const getAccessibleEntities = (): EntityType[] => {
    const entities: EntityType[] = [];
    
    Object.values(EntityType).forEach(entity => {
      if (canAccess(entity)) {
        entities.push(entity);
      }
    });
    
    return entities;
  };

  // Vérifier si l'utilisateur peut voir les actions de validation
  const canSeeValidationActions = (entity: EntityType): boolean => {
    return canValidate(entity) || canApprove(entity) || canReject(entity);
  };

  // Vérifier si l'utilisateur peut voir les actions de modification
  const canSeeModificationActions = (entity: EntityType): boolean => {
    return canModify(entity) || canCreate(entity) || canDelete(entity);
  };

  return {
    userRoles,
    hasPermissionFor,
    canAccess,
    canModify,
    canValidate,
    canCreate,
    canDelete,
    canApprove,
    canReject,
    getAccessLevel,
    isAdmin,
    isValidator,
    isScrutator,
    isLocalObserver,
    isDepartmentSupervisor,
    getAccessibleEntities,
    canSeeValidationActions,
    canSeeModificationActions
  };
};
