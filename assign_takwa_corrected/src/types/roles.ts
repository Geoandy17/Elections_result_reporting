/**
 * @file Types et configurations pour la gestion des rôles et permissions
 */

// Types de rôles disponibles
export const RoleType = {
  VALIDATEUR: 'validateur',
  SCRUTATEUR: 'scrutateur', 
  OBSERVATEUR_LOCAL: 'observateur-local',
  SUPERVISEUR_DEPARTEMENTALE: 'superviseur-departementale',
  ADMINISTRATEUR: 'administrateur'
} as const;

export type RoleType = typeof RoleType[keyof typeof RoleType];

// Types d'entités sur lesquelles on peut avoir des permissions
export const EntityType = {
  ARRONDISSEMENT: 'arrondissement',
  DOCUMENT_ARRONDISSEMENT: 'document_arrondissement',
  COMMISSION_DEPARTEMENTALE: 'commission_departementale',
  MEMBRE_COMMISSION: 'membre_commission',
  PARTICIPATION_DEPARTEMENTALE: 'participation_departementale',
  REDRESSEMENT_BUREAU: 'redressement_bureau',
  REDRESSEMENT_CANDIDAT: 'redressement_candidat',
  RESULTAT_DEPARTEMENT: 'resultat_departement'
} as const;

export type EntityType = typeof EntityType[keyof typeof EntityType];

// Types d'actions possibles
export const ActionType = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  VALIDATE: 'validate',
  APPROVE: 'approve',
  REJECT: 'reject'
} as const;

export type ActionType = typeof ActionType[keyof typeof ActionType];

// Interface pour une permission
export interface Permission {
  entity: EntityType;
  actions: ActionType[];
  scope?: 'own' | 'department' | 'region' | 'all'; // Portée de la permission
}

// Interface pour un rôle
export interface Role {
  code: number;
  libelle: string;
  permissions: Permission[];
  description?: string;
}

// Configuration des rôles et leurs permissions
export const ROLE_PERMISSIONS: Record<RoleType, Permission[]> = {
  [RoleType.VALIDATEUR]: [
    {
      entity: EntityType.DOCUMENT_ARRONDISSEMENT,
      actions: [ActionType.READ, ActionType.VALIDATE, ActionType.APPROVE, ActionType.REJECT],
      scope: 'department'
    },
    {
      entity: EntityType.PARTICIPATION_DEPARTEMENTALE,
      actions: [ActionType.READ, ActionType.VALIDATE, ActionType.APPROVE, ActionType.REJECT],
      scope: 'department'
    },
    {
      entity: EntityType.REDRESSEMENT_BUREAU,
      actions: [ActionType.READ, ActionType.VALIDATE, ActionType.APPROVE, ActionType.REJECT],
      scope: 'department'
    },
    {
      entity: EntityType.REDRESSEMENT_CANDIDAT,
      actions: [ActionType.READ, ActionType.VALIDATE, ActionType.APPROVE, ActionType.REJECT],
      scope: 'department'
    }
  ],

  [RoleType.SCRUTATEUR]: [
    {
      entity: EntityType.DOCUMENT_ARRONDISSEMENT,
      actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE],
      scope: 'own'
    },
    {
      entity: EntityType.PARTICIPATION_DEPARTEMENTALE,
      actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE],
      scope: 'own'
    },
    {
      entity: EntityType.REDRESSEMENT_BUREAU,
      actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE],
      scope: 'own'
    },
    {
      entity: EntityType.REDRESSEMENT_CANDIDAT,
      actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE],
      scope: 'own'
    }
  ],

  [RoleType.OBSERVATEUR_LOCAL]: [
    {
      entity: EntityType.DOCUMENT_ARRONDISSEMENT,
      actions: [ActionType.READ],
      scope: 'own'
    },
    {
      entity: EntityType.PARTICIPATION_DEPARTEMENTALE,
      actions: [ActionType.READ],
      scope: 'own'
    },
    {
      entity: EntityType.REDRESSEMENT_BUREAU,
      actions: [ActionType.READ],
      scope: 'own'
    },
    {
      entity: EntityType.REDRESSEMENT_CANDIDAT,
      actions: [ActionType.READ],
      scope: 'own'
    }
  ],

  [RoleType.SUPERVISEUR_DEPARTEMENTALE]: [
    {
      entity: EntityType.ARRONDISSEMENT,
      actions: [ActionType.READ],
      scope: 'department'
    },
    {
      entity: EntityType.DOCUMENT_ARRONDISSEMENT,
      actions: [ActionType.READ, ActionType.VALIDATE, ActionType.APPROVE, ActionType.REJECT],
      scope: 'department'
    },
    {
      entity: EntityType.COMMISSION_DEPARTEMENTALE,
      actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE],
      scope: 'department'
    },
    {
      entity: EntityType.MEMBRE_COMMISSION,
      actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE],
      scope: 'department'
    },
    {
      entity: EntityType.PARTICIPATION_DEPARTEMENTALE,
      actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE, ActionType.VALIDATE],
      scope: 'department'
    },
    {
      entity: EntityType.REDRESSEMENT_BUREAU,
      actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE, ActionType.VALIDATE],
      scope: 'department'
    },
    {
      entity: EntityType.REDRESSEMENT_CANDIDAT,
      actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE, ActionType.VALIDATE],
      scope: 'department'
    }
  ],

  [RoleType.ADMINISTRATEUR]: [
    {
      entity: EntityType.ARRONDISSEMENT,
      actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE],
      scope: 'all'
    },
    {
      entity: EntityType.DOCUMENT_ARRONDISSEMENT,
      actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE, ActionType.VALIDATE, ActionType.APPROVE, ActionType.REJECT],
      scope: 'all'
    },
    {
      entity: EntityType.COMMISSION_DEPARTEMENTALE,
      actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE],
      scope: 'all'
    },
    {
      entity: EntityType.MEMBRE_COMMISSION,
      actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE],
      scope: 'all'
    },
    {
      entity: EntityType.PARTICIPATION_DEPARTEMENTALE,
      actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE, ActionType.VALIDATE, ActionType.APPROVE, ActionType.REJECT],
      scope: 'all'
    },
    {
      entity: EntityType.REDRESSEMENT_BUREAU,
      actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE, ActionType.VALIDATE, ActionType.APPROVE, ActionType.REJECT],
      scope: 'all'
    },
    {
      entity: EntityType.REDRESSEMENT_CANDIDAT,
      actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE, ActionType.VALIDATE, ActionType.APPROVE, ActionType.REJECT],
      scope: 'all'
    }
  ]
};

// Helper pour vérifier si un utilisateur a une permission spécifique
export const hasPermission = (
  userRoles: string[],
  entity: EntityType,
  action: ActionType,
  scope?: 'own' | 'department' | 'region' | 'all'
): boolean => {
  for (const roleName of userRoles) {
    const roleType = roleName.toLowerCase() as RoleType;
    const permissions = ROLE_PERMISSIONS[roleType];
    
    if (permissions) {
      const permission = permissions.find(p => p.entity === entity);
      if (permission && permission.actions.includes(action)) {
        // Vérifier la portée si spécifiée
        if (!scope || !permission.scope || permission.scope === 'all' || permission.scope === scope) {
          return true;
        }
      }
    }
  }
  return false;
};

// Helper pour obtenir toutes les permissions d'un rôle
export const getRolePermissions = (roleName: string): Permission[] => {
  const roleType = roleName.toLowerCase() as RoleType;
  return ROLE_PERMISSIONS[roleType] || [];
};

// Helper pour vérifier si un utilisateur peut accéder à une entité
export const canAccessEntity = (userRoles: string[], entity: EntityType): boolean => {
  return hasPermission(userRoles, entity, ActionType.READ);
};

// Helper pour vérifier si un utilisateur peut modifier une entité
export const canModifyEntity = (userRoles: string[], entity: EntityType): boolean => {
  return hasPermission(userRoles, entity, ActionType.UPDATE) || 
         hasPermission(userRoles, entity, ActionType.CREATE);
};

// Helper pour vérifier si un utilisateur peut valider une entité
export const canValidateEntity = (userRoles: string[], entity: EntityType): boolean => {
  return hasPermission(userRoles, entity, ActionType.VALIDATE) ||
         hasPermission(userRoles, entity, ActionType.APPROVE) ||
         hasPermission(userRoles, entity, ActionType.REJECT);
};
