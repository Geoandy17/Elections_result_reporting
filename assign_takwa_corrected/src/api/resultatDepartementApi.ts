/**
 * @file API pour la gestion des résultats départementaux avec contrôles d'accès basés sur les rôles
 */

import { apiFetch, apiMutate } from './electionApi';
import { EntityType, ActionType } from '../types/roles';

// Types pour les résultats départementaux
export interface ResultatDepartement {
  code: number;
  code_departement: number;
  code_parti: number;
  nombre_vote: number;
  pourcentage?: number;
  date_creation?: string;
  departement?: {
    code: number;
    libelle: string;
    code_region?: number;
    region?: {
      code: number;
      libelle: string;
    };
  };
  parti?: {
    code: number;
    libelle: string;
    abbreviation?: string;
  };
}

export interface ResultatDepartementInput {
  code_departement: number;
  code_parti: number;
  nombre_vote: number;
  pourcentage?: number;
}

export interface ResultatDepartementFilters {
  departement?: number;
  region?: number;
  parti?: number;
  validation_status?: number;
}

export interface ResultatDepartementStats {
  total_departements: number;
  total_votes: number;
  total_participation: number;
  validation_pending: number;
  validation_completed: number;
}

// API pour les résultats départementaux avec contrôles d'accès
export const resultatDepartementApi = {
  /**
   * Récupère tous les résultats départementaux avec filtrage par permissions
   * GET /api/resultat-departement
   */
  getAll: (filters?: ResultatDepartementFilters): Promise<ResultatDepartement[]> => {
    const params = new URLSearchParams();
    if (filters?.departement) params.append('departement', filters.departement.toString());
    if (filters?.region) params.append('region', filters.region.toString());
    if (filters?.parti) params.append('parti', filters.parti.toString());
    if (filters?.validation_status !== undefined) params.append('validation_status', filters.validation_status.toString());
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/resultat-departement${queryString}`);
  },

  /**
   * Récupère un résultat départemental par ID
   * GET /api/resultat-departement/{id}
   */
  getById: (id: number): Promise<ResultatDepartement> => 
    apiFetch(`/resultat-departement/${id}`),

  /**
   * Récupère les résultats pour un département spécifique
   * GET /api/resultat-departement/departement/{codeDepartement}
   */
  getByDepartement: (codeDepartement: number): Promise<ResultatDepartement[]> => 
    apiFetch(`/resultat-departement/departement/${codeDepartement}`),

  /**
   * Récupère les résultats pour une région spécifique
   * GET /api/resultat-departement/region/{codeRegion}
   */
  getByRegion: (codeRegion: number): Promise<ResultatDepartement[]> => 
    apiFetch(`/resultat-departement/region/${codeRegion}`),

  /**
   * Crée un nouveau résultat départemental
   * POST /api/resultat-departement
   */
  create: (data: ResultatDepartementInput): Promise<ResultatDepartement> => 
    apiMutate('/resultat-departement', 'POST', data),

  /**
   * Met à jour un résultat départemental
   * PUT /api/resultat-departement/{id}
   */
  update: (id: number, data: Partial<ResultatDepartementInput>): Promise<ResultatDepartement> => 
    apiMutate(`/resultat-departement/${id}`, 'PUT', data),

  /**
   * Supprime un résultat départemental
   * DELETE /api/resultat-departement/{id}
   */
  delete: (id: number): Promise<{ message: string }> => 
    apiMutate(`/resultat-departement/${id}`, 'DELETE'),

  /**
   * Valide un résultat départemental
   * PUT /api/resultat-departement/{id}/validate
   */
  validate: (id: number): Promise<ResultatDepartement> => 
    apiMutate(`/resultat-departement/${id}/validate`, 'PUT'),

  /**
   * Approuve un résultat départemental
   * PUT /api/resultat-departement/{id}/approve
   */
  approve: (id: number): Promise<ResultatDepartement> => 
    apiMutate(`/resultat-departement/${id}/approve`, 'PUT'),

  /**
   * Rejette un résultat départemental
   * PUT /api/resultat-departement/{id}/reject
   */
  reject: (id: number, reason?: string): Promise<ResultatDepartement> => 
    apiMutate(`/resultat-departement/${id}/reject`, 'PUT', { reason }),

  /**
   * Valide plusieurs résultats en lot
   * PUT /api/resultat-departement/validate/bulk
   */
  validateBulk: (ids: number[]): Promise<{ message: string; validated: number }> => 
    apiMutate('/resultat-departement/validate/bulk', 'PUT', { ids }),

  /**
   * Récupère les statistiques des résultats départementaux
   * GET /api/resultat-departement/stats
   */
  getStats: (filters?: ResultatDepartementFilters): Promise<ResultatDepartementStats> => {
    const params = new URLSearchParams();
    if (filters?.departement) params.append('departement', filters.departement.toString());
    if (filters?.region) params.append('region', filters.region.toString());
    if (filters?.validation_status !== undefined) params.append('validation_status', filters.validation_status.toString());
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/resultat-departement/stats${queryString}`);
  },

  /**
   * Récupère les résultats en attente de validation
   * GET /api/resultat-departement/pending
   */
  getPending: (filters?: Omit<ResultatDepartementFilters, 'validation_status'>): Promise<ResultatDepartement[]> => {
    return resultatDepartementApi.getAll({ ...filters, validation_status: 0 });
  },

  /**
   * Récupère les résultats validés
   * GET /api/resultat-departement/validated
   */
  getValidated: (filters?: Omit<ResultatDepartementFilters, 'validation_status'>): Promise<ResultatDepartement[]> => {
    return resultatDepartementApi.getAll({ ...filters, validation_status: 1 });
  },

  // Fonctions utilitaires
  /**
   * Calcule le pourcentage de votes pour un parti
   */
  calculatePercentage: (votes: number, totalVotes: number): number => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 10000) / 100; // 2 décimales
  },

  /**
   * Calcule le total des votes pour un département
   */
  calculateTotalVotes: (resultats: ResultatDepartement[]): number => {
    return resultats.reduce((total, resultat) => total + resultat.nombre_vote, 0);
  },

  /**
   * Calcule les pourcentages pour tous les résultats d'un département
   */
  calculatePercentages: (resultats: ResultatDepartement[]): ResultatDepartement[] => {
    const totalVotes = resultatDepartementApi.calculateTotalVotes(resultats);
    return resultats.map(resultat => ({
      ...resultat,
      pourcentage: resultatDepartementApi.calculatePercentage(resultat.nombre_vote, totalVotes)
    }));
  },

  /**
   * Valide les données d'un résultat départemental
   */
  validateData: (data: ResultatDepartementInput): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data.code_departement || data.code_departement <= 0) {
      errors.push('Le code département est requis et doit être positif');
    }

    if (!data.code_parti || data.code_parti <= 0) {
      errors.push('Le code parti est requis et doit être positif');
    }

    if (data.nombre_vote < 0) {
      errors.push('Le nombre de votes ne peut pas être négatif');
    }

    if (data.pourcentage !== undefined && (data.pourcentage < 0 || data.pourcentage > 100)) {
      errors.push('Le pourcentage doit être entre 0 et 100');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Groupe les résultats par département
   */
  groupByDepartement: (resultats: ResultatDepartement[]): Map<number, ResultatDepartement[]> => {
    const grouped = new Map<number, ResultatDepartement[]>();
    
    resultats.forEach(resultat => {
      const deptCode = resultat.code_departement;
      if (!grouped.has(deptCode)) {
        grouped.set(deptCode, []);
      }
      grouped.get(deptCode)!.push(resultat);
    });

    return grouped;
  },

  /**
   * Groupe les résultats par parti
   */
  groupByParti: (resultats: ResultatDepartement[]): Map<number, ResultatDepartement[]> => {
    const grouped = new Map<number, ResultatDepartement[]>();
    
    resultats.forEach(resultat => {
      const partiCode = resultat.code_parti;
      if (!grouped.has(partiCode)) {
        grouped.set(partiCode, []);
      }
      grouped.get(partiCode)!.push(resultat);
    });

    return grouped;
  },

  /**
   * Trie les résultats par nombre de votes (décroissant)
   */
  sortByVotes: (resultats: ResultatDepartement[]): ResultatDepartement[] => {
    return [...resultats].sort((a, b) => b.nombre_vote - a.nombre_vote);
  },

  /**
   * Trie les résultats par pourcentage (décroissant)
   */
  sortByPercentage: (resultats: ResultatDepartement[]): ResultatDepartement[] => {
    return [...resultats].sort((a, b) => (b.pourcentage || 0) - (a.pourcentage || 0));
  }
};

// API avec contrôles d'accès basés sur les rôles
export const roleBasedResultatDepartementApi = {
  /**
   * Récupère les résultats départementaux selon les permissions de l'utilisateur
   */
  getAllWithAccessControl: async (filters?: ResultatDepartementFilters): Promise<ResultatDepartement[]> => {
    // Le serveur vérifie automatiquement les permissions via le JWT
    return resultatDepartementApi.getAll(filters);
  },

  /**
   * Crée un résultat départemental avec vérification des permissions
   */
  createWithAccessControl: async (data: ResultatDepartementInput): Promise<ResultatDepartement> => {
    // Le serveur vérifie les permissions CREATE pour RESULTAT_DEPARTEMENT
    return resultatDepartementApi.create(data);
  },

  /**
   * Met à jour un résultat départemental avec vérification des permissions
   */
  updateWithAccessControl: async (id: number, data: Partial<ResultatDepartementInput>): Promise<ResultatDepartement> => {
    // Le serveur vérifie les permissions UPDATE pour RESULTAT_DEPARTEMENT
    return resultatDepartementApi.update(id, data);
  },

  /**
   * Supprime un résultat départemental avec vérification des permissions
   */
  deleteWithAccessControl: async (id: number): Promise<{ message: string }> => {
    // Le serveur vérifie les permissions DELETE pour RESULTAT_DEPARTEMENT
    return resultatDepartementApi.delete(id);
  },

  /**
   * Valide un résultat départemental avec vérification des permissions
   */
  validateWithAccessControl: async (id: number): Promise<ResultatDepartement> => {
    // Le serveur vérifie les permissions VALIDATE pour RESULTAT_DEPARTEMENT
    return resultatDepartementApi.validate(id);
  },

  /**
   * Approuve un résultat départemental avec vérification des permissions
   */
  approveWithAccessControl: async (id: number): Promise<ResultatDepartement> => {
    // Le serveur vérifie les permissions APPROVE pour RESULTAT_DEPARTEMENT
    return resultatDepartementApi.approve(id);
  },

  /**
   * Rejette un résultat départemental avec vérification des permissions
   */
  rejectWithAccessControl: async (id: number, reason?: string): Promise<ResultatDepartement> => {
    // Le serveur vérifie les permissions REJECT pour RESULTAT_DEPARTEMENT
    return resultatDepartementApi.reject(id, reason);
  }
};

export default resultatDepartementApi;
