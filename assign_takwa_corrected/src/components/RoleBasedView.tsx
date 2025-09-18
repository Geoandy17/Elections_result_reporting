/**
 * @file Composant de base pour les vues avec contrôles d'accès basés sur les rôles
 */

import React from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { EntityType, ActionType } from '../types/roles';

interface RoleBasedViewProps {
  children: React.ReactNode;
  entity: EntityType;
  action?: ActionType;
  scope?: 'own' | 'department' | 'region' | 'all';
  fallback?: React.ReactNode;
  requireAll?: boolean; // Si true, tous les rôles doivent avoir la permission
  roles?: string[]; // Rôles spécifiques requis
}

/**
 * Composant wrapper qui affiche le contenu seulement si l'utilisateur a les permissions requises
 */
export const RoleBasedView: React.FC<RoleBasedViewProps> = ({
  children,
  entity,
  action = ActionType.READ,
  scope,
  fallback = null,
  requireAll = false,
  roles
}) => {
  const { hasPermissionFor, userRoles } = usePermissions();

  // Vérifier les permissions
  const hasPermission = hasPermissionFor(entity, action, scope);

  // Vérifier les rôles spécifiques si fournis
  const hasRequiredRole = roles ? roles.some(role => userRoles.includes(role.toLowerCase())) : true;

  // Vérifier si l'utilisateur a toutes les permissions requises
  const hasAllPermissions = requireAll ? 
    roles?.every(role => hasPermissionFor(entity, action, scope)) : true;

  const canAccess = hasPermission && hasRequiredRole && hasAllPermissions;

  if (!canAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * Composant pour afficher un message d'accès refusé
 */
export const AccessDeniedMessage: React.FC<{ 
  entity: EntityType; 
  action?: ActionType;
  className?: string;
}> = ({ entity, action = ActionType.READ, className = '' }) => {
  const { userRoles } = usePermissions();
  
  const getActionText = (action: ActionType): string => {
    switch (action) {
      case ActionType.CREATE: return 'créer';
      case ActionType.READ: return 'consulter';
      case ActionType.UPDATE: return 'modifier';
      case ActionType.DELETE: return 'supprimer';
      case ActionType.VALIDATE: return 'valider';
      case ActionType.APPROVE: return 'approuver';
      case ActionType.REJECT: return 'rejeter';
      default: return 'accéder à';
    }
  };

  const getEntityText = (entity: EntityType): string => {
    switch (entity) {
      case EntityType.ARRONDISSEMENT: return 'les arrondissements';
      case EntityType.DOCUMENT_ARRONDISSEMENT: return 'les documents d\'arrondissement';
      case EntityType.COMMISSION_DEPARTEMENTALE: return 'les commissions départementales';
      case EntityType.MEMBRE_COMMISSION: return 'les membres de commission';
      case EntityType.PARTICIPATION_DEPARTEMENTALE: return 'les participations départementales';
      case EntityType.REDRESSEMENT_BUREAU: return 'les redressements de bureau';
      case EntityType.REDRESSEMENT_CANDIDAT: return 'les redressements de candidat';
      default: return 'cette ressource';
    }
  };

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-6 text-center ${className}`}>
      <div className="text-red-600 text-lg font-medium mb-2">
        Accès refusé
      </div>
      <div className="text-red-700 text-sm">
        Vous n'avez pas les permissions nécessaires pour {getActionText(action)} {getEntityText(entity)}.
      </div>
      <div className="text-red-600 text-xs mt-2">
        Rôles actuels: {userRoles.join(', ')}
      </div>
    </div>
  );
};

/**
 * Composant pour afficher un bouton avec contrôle d'accès
 */
interface RoleBasedButtonProps {
  children: React.ReactNode;
  entity: EntityType;
  action: ActionType;
  scope?: 'own' | 'department' | 'region' | 'all';
  onClick: () => void;
  className?: string;
  disabled?: boolean;
  title?: string;
}

export const RoleBasedButton: React.FC<RoleBasedButtonProps> = ({
  children,
  entity,
  action,
  scope,
  onClick,
  className = '',
  disabled = false,
  title
}) => {
  const { hasPermissionFor } = usePermissions();
  
  const canAccess = hasPermissionFor(entity, action, scope);
  
  if (!canAccess) {
    return null;
  }

  return (
    <button
      onClick={onClick}
      className={className}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
};

/**
 * Composant pour afficher une section avec contrôle d'accès
 */
interface RoleBasedSectionProps {
  children: React.ReactNode;
  entity: EntityType;
  action?: ActionType;
  scope?: 'own' | 'department' | 'region' | 'all';
  fallback?: React.ReactNode;
  className?: string;
}

export const RoleBasedSection: React.FC<RoleBasedSectionProps> = ({
  children,
  entity,
  action = ActionType.READ,
  scope,
  fallback = <AccessDeniedMessage entity={entity} action={action} />,
  className = ''
}) => {
  const { hasPermissionFor } = usePermissions();
  
  const canAccess = hasPermissionFor(entity, action, scope);
  
  if (!canAccess) {
    return <div className={className}>{fallback}</div>;
  }

  return <div className={className}>{children}</div>;
};
