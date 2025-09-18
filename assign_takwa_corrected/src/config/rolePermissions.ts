/**
 * @file Configuration des rôles et permissions
 * Ce fichier peut être modifié pour ajuster les permissions sans toucher au code principal
 */

import { RoleType, EntityType, ActionType, Permission } from '../types/roles';

// Configuration des permissions par rôle
export const ROLE_PERMISSIONS_CONFIG: Record<RoleType, Permission[]> = {
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
    },
    {
      entity: EntityType.RESULTAT_DEPARTEMENT,
      actions: [ActionType.READ, ActionType.CREATE, ActionType.UPDATE, ActionType.DELETE, ActionType.VALIDATE, ActionType.APPROVE, ActionType.REJECT],
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
    },
    {
      entity: EntityType.RESULTAT_DEPARTEMENT,
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
    },
    {
      entity: EntityType.RESULTAT_DEPARTEMENT,
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
    },
    {
      entity: EntityType.RESULTAT_DEPARTEMENT,
      actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE, ActionType.VALIDATE, ActionType.APPROVE, ActionType.REJECT],
      scope: 'all'
    }
  ]
};

// Configuration des messages d'erreur par rôle
export const ROLE_ERROR_MESSAGES = {
  [RoleType.VALIDATEUR]: {
    accessDenied: 'Vous n\'avez pas les permissions nécessaires pour valider cette ressource.',
    scopeError: 'Vous ne pouvez valider que les ressources de votre département.'
  },
  [RoleType.SCRUTATEUR]: {
    accessDenied: 'Vous n\'avez pas les permissions nécessaires pour modifier cette ressource.',
    scopeError: 'Vous ne pouvez modifier que vos propres soumissions.'
  },
  [RoleType.OBSERVATEUR_LOCAL]: {
    accessDenied: 'Vous n\'avez que des permissions de consultation.',
    scopeError: 'Vous ne pouvez consulter que les données de votre zone.'
  },
  [RoleType.SUPERVISEUR_DEPARTEMENTALE]: {
    accessDenied: 'Vous n\'avez pas les permissions nécessaires pour gérer cette ressource.',
    scopeError: 'Vous ne pouvez gérer que les ressources de votre département.'
  },
  [RoleType.ADMINISTRATEUR]: {
    accessDenied: 'Erreur de permission inattendue.',
    scopeError: 'Erreur de portée inattendue.'
  }
};

// Configuration des vues par rôle
export const ROLE_VIEWS_CONFIG = {
  [RoleType.VALIDATEUR]: {
    defaultView: 'validation',
    availableViews: ['validation'],
    title: 'Tableau de Bord Validateur',
    description: 'Validez et approuvez les soumissions des scrutateurs'
  },
  [RoleType.SCRUTATEUR]: {
    defaultView: 'submissions',
    availableViews: ['submissions'],
    title: 'Tableau de Bord Scrutateur',
    description: 'Gérez vos soumissions et données électorales'
  },
  [RoleType.OBSERVATEUR_LOCAL]: {
    defaultView: 'consultation',
    availableViews: ['consultation'],
    title: 'Tableau de Bord Observateur Local',
    description: 'Consultez les données électorales de votre zone d\'observation'
  },
  [RoleType.SUPERVISEUR_DEPARTEMENTALE]: {
    defaultView: 'overview',
    availableViews: ['overview', 'commissions', 'documents', 'participations', 'redressements', 'resultats'],
    title: 'Tableau de Bord Superviseur Départemental',
    description: 'Supervisez et gérez les données électorales de votre département'
  },
  [RoleType.ADMINISTRATEUR]: {
    defaultView: 'dashboard',
    availableViews: ['dashboard', 'arrondissements', 'commissions', 'participations', 'redressements', 'resultats'],
    title: 'Tableau de Bord Administrateur',
    description: 'Gestion complète du système électoral'
  }
};

// Configuration des entités par rôle (pour l'affichage des onglets)
export const ROLE_ENTITIES_CONFIG = {
  [RoleType.VALIDATEUR]: [
    { entity: EntityType.DOCUMENT_ARRONDISSEMENT, label: 'Documents', icon: '📄' },
    { entity: EntityType.PARTICIPATION_DEPARTEMENTALE, label: 'Participations', icon: '📊' },
    { entity: EntityType.REDRESSEMENT_CANDIDAT, label: 'Redressements', icon: '🔄' },
    { entity: EntityType.RESULTAT_DEPARTEMENT, label: 'Résultats', icon: '📈' }
  ],
  [RoleType.SCRUTATEUR]: [
    { entity: EntityType.DOCUMENT_ARRONDISSEMENT, label: 'Documents', icon: '📄' },
    { entity: EntityType.PARTICIPATION_DEPARTEMENTALE, label: 'Participations', icon: '📊' },
    { entity: EntityType.REDRESSEMENT_CANDIDAT, label: 'Redressements', icon: '🔄' },
    { entity: EntityType.RESULTAT_DEPARTEMENT, label: 'Résultats', icon: '📈' }
  ],
  [RoleType.OBSERVATEUR_LOCAL]: [
    { entity: EntityType.DOCUMENT_ARRONDISSEMENT, label: 'Documents', icon: '📄' },
    { entity: EntityType.PARTICIPATION_DEPARTEMENTALE, label: 'Participations', icon: '📊' },
    { entity: EntityType.REDRESSEMENT_CANDIDAT, label: 'Redressements', icon: '🔄' },
    { entity: EntityType.RESULTAT_DEPARTEMENT, label: 'Résultats', icon: '📈' }
  ],
  [RoleType.SUPERVISEUR_DEPARTEMENTALE]: [
    { entity: EntityType.COMMISSION_DEPARTEMENTALE, label: 'Commissions', icon: '👥' },
    { entity: EntityType.DOCUMENT_ARRONDISSEMENT, label: 'Documents', icon: '📄' },
    { entity: EntityType.PARTICIPATION_DEPARTEMENTALE, label: 'Participations', icon: '📊' },
    { entity: EntityType.REDRESSEMENT_CANDIDAT, label: 'Redressements', icon: '🔄' },
    { entity: EntityType.RESULTAT_DEPARTEMENT, label: 'Résultats', icon: '📈' }
  ],
  [RoleType.ADMINISTRATEUR]: [
    { entity: EntityType.ARRONDISSEMENT, label: 'Arrondissements', icon: '🏘️' },
    { entity: EntityType.COMMISSION_DEPARTEMENTALE, label: 'Commissions', icon: '👥' },
    { entity: EntityType.PARTICIPATION_DEPARTEMENTALE, label: 'Participations', icon: '📊' },
    { entity: EntityType.REDRESSEMENT_CANDIDAT, label: 'Redressements', icon: '🔄' },
    { entity: EntityType.RESULTAT_DEPARTEMENT, label: 'Résultats', icon: '📈' }
  ]
};
