/**
 * @file Composant de gestion des résultats départementaux avec contrôles d'accès basés sur les rôles
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  resultatDepartementApi, 
  roleBasedResultatDepartementApi,
  ResultatDepartement, 
  ResultatDepartementInput,
  ResultatDepartementFilters 
} from '../api/resultatDepartementApi';
import { usePermissions } from '../hooks/usePermissions';
import { EntityType, ActionType } from '../types/roles';
import { RoleBasedView, RoleBasedButton, AccessDeniedMessage } from './RoleBasedView';

interface ResultatDepartementManagementProps {
  selectedDepartement?: number;
  selectedRegion?: number;
  onDepartementSelect?: (departement: number) => void;
  onRegionSelect?: (region: number) => void;
}

const ResultatDepartementManagement: React.FC<ResultatDepartementManagementProps> = ({
  selectedDepartement,
  selectedRegion,
  onDepartementSelect,
  onRegionSelect
}) => {
  const { canAccess, canModify, canValidate, canApprove, canReject } = usePermissions();
  const queryClient = useQueryClient();
  
  // États locaux
  const [filters, setFilters] = useState<ResultatDepartementFilters>({
    departement: selectedDepartement,
    region: selectedRegion,
    validation_status: undefined
  });
  const [selectedResultats, setSelectedResultats] = useState<number[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [editingResultat, setEditingResultat] = useState<ResultatDepartement | null>(null);
  const [validationReason, setValidationReason] = useState('');

  // Vérification des permissions globales
  const hasAccess = canAccess(EntityType.RESULTAT_DEPARTEMENT, ActionType.READ);
  const canCreate = canAccess(EntityType.RESULTAT_DEPARTEMENT, ActionType.CREATE);
  const canUpdate = canAccess(EntityType.RESULTAT_DEPARTEMENT, ActionType.UPDATE);
  const canDelete = canAccess(EntityType.RESULTAT_DEPARTEMENT, ActionType.DELETE);
  const canValidateResults = canAccess(EntityType.RESULTAT_DEPARTEMENT, ActionType.VALIDATE);
  const canApproveResults = canAccess(EntityType.RESULTAT_DEPARTEMENT, ActionType.APPROVE);
  const canRejectResults = canAccess(EntityType.RESULTAT_DEPARTEMENT, ActionType.REJECT);

  // Récupération des données
  const { 
    data: resultats = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['resultat-departement', filters],
    queryFn: () => roleBasedResultatDepartementApi.getAllWithAccessControl(filters),
    enabled: hasAccess
  });

  const { data: stats } = useQuery({
    queryKey: ['resultat-departement-stats', filters],
    queryFn: () => resultatDepartementApi.getStats(filters),
    enabled: hasAccess
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: roleBasedResultatDepartementApi.createWithAccessControl,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resultat-departement'] });
      setShowCreateModal(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ResultatDepartementInput> }) =>
      roleBasedResultatDepartementApi.updateWithAccessControl(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resultat-departement'] });
      setShowEditModal(false);
      setEditingResultat(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: roleBasedResultatDepartementApi.deleteWithAccessControl,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resultat-departement'] });
    }
  });

  const validateMutation = useMutation({
    mutationFn: roleBasedResultatDepartementApi.validateWithAccessControl,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resultat-departement'] });
      setSelectedResultats([]);
    }
  });

  const approveMutation = useMutation({
    mutationFn: roleBasedResultatDepartementApi.approveWithAccessControl,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resultat-departement'] });
      setSelectedResultats([]);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      roleBasedResultatDepartementApi.rejectWithAccessControl(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resultat-departement'] });
      setSelectedResultats([]);
    }
  });

  const validateBulkMutation = useMutation({
    mutationFn: resultatDepartementApi.validateBulk,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resultat-departement'] });
      setSelectedResultats([]);
    }
  });

  // Données calculées
  const groupedResultats = useMemo(() => {
    return resultatDepartementApi.groupByDepartement(resultats);
  }, [resultats]);

  const sortedResultats = useMemo(() => {
    return resultatDepartementApi.sortByVotes(resultats);
  }, [resultats]);

  // Handlers
  const handleFilterChange = (newFilters: Partial<ResultatDepartementFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleCreate = (data: ResultatDepartementInput) => {
    createMutation.mutate(data);
  };

  const handleEdit = (resultat: ResultatDepartement) => {
    setEditingResultat(resultat);
    setShowEditModal(true);
  };

  const handleUpdate = (data: Partial<ResultatDepartementInput>) => {
    if (editingResultat) {
      updateMutation.mutate({ id: editingResultat.code, data });
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce résultat ?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleValidate = (id: number) => {
    validateMutation.mutate(id);
  };

  const handleApprove = (id: number) => {
    approveMutation.mutate(id);
  };

  const handleReject = (id: number) => {
    if (validationReason.trim()) {
      rejectMutation.mutate({ id, reason: validationReason });
      setValidationReason('');
    }
  };

  const handleBulkValidate = () => {
    if (selectedResultats.length > 0) {
      validateBulkMutation.mutate(selectedResultats);
    }
  };

  const handleSelectResultat = (id: number) => {
    setSelectedResultats(prev => 
      prev.includes(id) 
        ? prev.filter(resultId => resultId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedResultats.length === resultats.length) {
      setSelectedResultats([]);
    } else {
      setSelectedResultats(resultats.map(r => r.code));
    }
  };

  if (!hasAccess) {
    return <AccessDeniedMessage entity="résultats départementaux" />;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Chargement des résultats...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Erreur lors du chargement des résultats : {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Résultats Départementaux</h2>
          <RoleBasedButton
            entity={EntityType.RESULTAT_DEPARTEMENT}
            action={ActionType.CREATE}
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Ajouter un résultat
          </RoleBasedButton>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600">Total Départements</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total_departements}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600">Total Votes</p>
              <p className="text-2xl font-bold text-green-900">{stats.total_votes.toLocaleString()}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-600">En Attente</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.validation_pending}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600">Validés</p>
              <p className="text-2xl font-bold text-purple-900">{stats.validation_completed}</p>
            </div>
          </div>
        )}
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Filtres</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut de validation
            </label>
            <select
              value={filters.validation_status ?? ''}
              onChange={(e) => handleFilterChange({ 
                validation_status: e.target.value ? parseInt(e.target.value) : undefined 
              })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Tous</option>
              <option value="0">En attente</option>
              <option value="1">Validés</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => setFilters({})}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Actions en lot */}
      {selectedResultats.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center justify-between">
            <span className="text-blue-800">
              {selectedResultats.length} résultat(s) sélectionné(s)
            </span>
            <div className="space-x-2">
              <RoleBasedButton
                entity={EntityType.RESULTAT_DEPARTEMENT}
                action={ActionType.VALIDATE}
                onClick={handleBulkValidate}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                Valider en lot
              </RoleBasedButton>
              <button
                onClick={() => setSelectedResultats([])}
                className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tableau des résultats */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedResultats.length === resultats.length && resultats.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Département
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parti
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Votes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pourcentage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedResultats.map((resultat) => (
                <tr key={resultat.code} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedResultats.includes(resultat.code)}
                      onChange={() => handleSelectResultat(resultat.code)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {resultat.departement?.libelle || `Département ${resultat.code_departement}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {resultat.parti?.abbreviation || resultat.parti?.libelle || `Parti ${resultat.code_parti}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {resultat.nombre_vote.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {resultat.pourcentage ? `${resultat.pourcentage.toFixed(2)}%` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      resultat.pourcentage !== undefined 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {resultat.pourcentage !== undefined ? 'Validé' : 'En attente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <RoleBasedButton
                      entity={EntityType.RESULTAT_DEPARTEMENT}
                      action={ActionType.UPDATE}
                      onClick={() => handleEdit(resultat)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Modifier
                    </RoleBasedButton>
                    
                    <RoleBasedButton
                      entity={EntityType.RESULTAT_DEPARTEMENT}
                      action={ActionType.VALIDATE}
                      onClick={() => handleValidate(resultat.code)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Valider
                    </RoleBasedButton>
                    
                    <RoleBasedButton
                      entity={EntityType.RESULTAT_DEPARTEMENT}
                      action={ActionType.APPROVE}
                      onClick={() => handleApprove(resultat.code)}
                      className="text-purple-600 hover:text-purple-900"
                    >
                      Approuver
                    </RoleBasedButton>
                    
                    <RoleBasedButton
                      entity={EntityType.RESULTAT_DEPARTEMENT}
                      action={ActionType.REJECT}
                      onClick={() => {
                        setEditingResultat(resultat);
                        setShowValidationModal(true);
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      Rejeter
                    </RoleBasedButton>
                    
                    <RoleBasedButton
                      entity={EntityType.RESULTAT_DEPARTEMENT}
                      action={ActionType.DELETE}
                      onClick={() => handleDelete(resultat.code)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Supprimer
                    </RoleBasedButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modales */}
      {showCreateModal && (
        <CreateResultatModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
          isLoading={createMutation.isPending}
        />
      )}

      {showEditModal && editingResultat && (
        <EditResultatModal
          resultat={editingResultat}
          onClose={() => {
            setShowEditModal(false);
            setEditingResultat(null);
          }}
          onSubmit={handleUpdate}
          isLoading={updateMutation.isPending}
        />
      )}

      {showValidationModal && editingResultat && (
        <ValidationModal
          resultat={editingResultat}
          onClose={() => {
            setShowValidationModal(false);
            setEditingResultat(null);
            setValidationReason('');
          }}
          onReject={handleReject}
          isLoading={rejectMutation.isPending}
        />
      )}
    </div>
  );
};

// Composant modal de création
interface CreateResultatModalProps {
  onClose: () => void;
  onSubmit: (data: ResultatDepartementInput) => void;
  isLoading: boolean;
}

const CreateResultatModal: React.FC<CreateResultatModalProps> = ({
  onClose,
  onSubmit,
  isLoading
}) => {
  const [formData, setFormData] = useState<ResultatDepartementInput>({
    code_departement: 0,
    code_parti: 0,
    nombre_vote: 0,
    pourcentage: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Créer un résultat départemental</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code Département
            </label>
            <input
              type="number"
              value={formData.code_departement}
              onChange={(e) => setFormData(prev => ({ ...prev, code_departement: parseInt(e.target.value) }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code Parti
            </label>
            <input
              type="number"
              value={formData.code_parti}
              onChange={(e) => setFormData(prev => ({ ...prev, code_parti: parseInt(e.target.value) }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de Votes
            </label>
            <input
              type="number"
              value={formData.nombre_vote}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre_vote: parseInt(e.target.value) }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pourcentage (optionnel)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.pourcentage || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, pourcentage: parseFloat(e.target.value) }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Composant modal d'édition
interface EditResultatModalProps {
  resultat: ResultatDepartement;
  onClose: () => void;
  onSubmit: (data: Partial<ResultatDepartementInput>) => void;
  isLoading: boolean;
}

const EditResultatModal: React.FC<EditResultatModalProps> = ({
  resultat,
  onClose,
  onSubmit,
  isLoading
}) => {
  const [formData, setFormData] = useState<Partial<ResultatDepartementInput>>({
    nombre_vote: resultat.nombre_vote,
    pourcentage: resultat.pourcentage
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Modifier le résultat</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de Votes
            </label>
            <input
              type="number"
              value={formData.nombre_vote || 0}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre_vote: parseInt(e.target.value) }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pourcentage
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.pourcentage || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, pourcentage: parseFloat(e.target.value) }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Modification...' : 'Modifier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Composant modal de validation
interface ValidationModalProps {
  resultat: ResultatDepartement;
  onClose: () => void;
  onReject: (id: number) => void;
  isLoading: boolean;
}

const ValidationModal: React.FC<ValidationModalProps> = ({
  resultat,
  onClose,
  onReject,
  isLoading
}) => {
  const [reason, setReason] = useState('');

  const handleReject = () => {
    onReject(resultat.code);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Rejeter le résultat</h3>
        <div className="space-y-4">
          <p className="text-gray-700">
            Êtes-vous sûr de vouloir rejeter ce résultat ?
          </p>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Raison du rejet (optionnel)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Annuler
            </button>
            <button
              onClick={handleReject}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? 'Rejet...' : 'Rejeter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultatDepartementManagement;
