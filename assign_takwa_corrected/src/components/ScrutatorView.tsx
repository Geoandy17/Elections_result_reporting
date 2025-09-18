/**
 * @file Vue spécialisée pour les scrutateurs
 */

import React, { useState, useEffect } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { EntityType, ActionType } from '../types/roles';
import { RoleBasedView, AccessDeniedMessage } from './RoleBasedView';
import { 
  documentArrondissementApi, 
  type DocumentArrondissement 
} from '../api/arrondissementApi';
import { 
  participationDepartementApi, 
  type ParticipationDepartement 
} from '../api/participationApi';
import { 
  redressementCandidatApi, 
  redressementBureauVoteApi,
  type RedressementCandidat,
  type RedressementBureauVote
} from '../api/redressementApi';
import { 
  resultatDepartementApi,
  type ResultatDepartement 
} from '../api/resultatDepartementApi';
import ResultatDepartementManagement from './ResultatDepartementManagement';

interface ScrutatorViewProps {
  className?: string;
}

export const ScrutatorView: React.FC<ScrutatorViewProps> = ({ className = '' }) => {
  const { isScrutator, canModify } = usePermissions();
  const [activeTab, setActiveTab] = useState<'documents' | 'participations' | 'redressements' | 'resultats'>('documents');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // États pour les données
  const [documents, setDocuments] = useState<DocumentArrondissement[]>([]);
  const [participations, setParticipations] = useState<ParticipationDepartement[]>([]);
  const [redressementsCandidats, setRedressementsCandidats] = useState<RedressementCandidat[]>([]);
  const [redressementsBureaux, setRedressementsBureaux] = useState<RedressementBureauVote[]>([]);
  const [resultats, setResultats] = useState<ResultatDepartement[]>([]);

  // États pour les modales
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showParticipationModal, setShowParticipationModal] = useState(false);
  const [showRedressementModal, setShowRedressementModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Chargement initial des données
  useEffect(() => {
    if (isScrutator()) {
      loadData();
    }
  }, [isScrutator]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [docsData, partsData, redCandData, redBureauData, resultatsData] = await Promise.all([
        documentArrondissementApi.getAll(),
        participationDepartementApi.getAll(),
        redressementCandidatApi.getAll(),
        redressementBureauVoteApi.getAll(),
        resultatDepartementApi.getAll()
      ]);
      
      setDocuments(docsData);
      setParticipations(partsData);
      setRedressementsCandidats(redCandData);
      setRedressementsBureaux(redBureauData);
      setResultats(resultatsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = (type: 'document' | 'participation' | 'redressement') => {
    setEditingItem(null);
    switch (type) {
      case 'document':
        setShowDocumentModal(true);
        break;
      case 'participation':
        setShowParticipationModal(true);
        break;
      case 'redressement':
        setShowRedressementModal(true);
        break;
    }
  };

  const handleEdit = (item: any, type: 'document' | 'participation' | 'redressement') => {
    setEditingItem(item);
    switch (type) {
      case 'document':
        setShowDocumentModal(true);
        break;
      case 'participation':
        setShowParticipationModal(true);
        break;
      case 'redressement':
        setShowRedressementModal(true);
        break;
    }
  };

  const handleDelete = async (id: number, type: 'document' | 'participation' | 'redressement') => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) return;
    
    try {
      setLoading(true);
      switch (type) {
        case 'document':
          await documentArrondissementApi.delete(id);
          break;
        case 'participation':
          await participationDepartementApi.delete(id);
          break;
        case 'redressement':
          // Déterminer le type de redressement et supprimer
          break;
      }
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  if (!isScrutator()) {
    return (
      <AccessDeniedMessage 
        entity={EntityType.DOCUMENT_ARRONDISSEMENT} 
        action={ActionType.CREATE}
        className={className}
      />
    );
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-2xl font-bold text-gray-800">Tableau de Bord Scrutateur</h2>
        <p className="text-gray-600 mt-1">
          Gérez vos soumissions et données électorales
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="text-red-600 text-sm">{error}</div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex px-6">
          {[
            { 
              key: 'documents', 
              label: 'Documents Arrondissement', 
              count: documents.length,
              entity: EntityType.DOCUMENT_ARRONDISSEMENT
            },
            { 
              key: 'participations', 
              label: 'Participations Départementales', 
              count: participations.length,
              entity: EntityType.PARTICIPATION_DEPARTEMENTALE
            },
            { 
              key: 'redressements', 
              label: 'Redressements', 
              count: redressementsCandidats.length + redressementsBureaux.length,
              entity: EntityType.REDRESSEMENT_CANDIDAT
            },
            { 
              key: 'resultats', 
              label: 'Résultats Départementaux', 
              count: resultats.length,
              entity: EntityType.RESULTAT_DEPARTEMENT
            }
          ].map(({ key, label, count, entity }) => (
            <RoleBasedView
              key={key}
              entity={entity}
              action={ActionType.CREATE}
              fallback={null}
            >
              <button
                onClick={() => setActiveTab(key as any)}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {label} ({count})
              </button>
            </RoleBasedView>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'documents' && (
          <RoleBasedView
            entity={EntityType.DOCUMENT_ARRONDISSEMENT}
            action={ActionType.CREATE}
          >
            <DocumentsScrutatorTab
              documents={documents}
              onCreate={() => handleCreate('document')}
              onEdit={(item) => handleEdit(item, 'document')}
              onDelete={(id) => handleDelete(id, 'document')}
            />
          </RoleBasedView>
        )}

        {activeTab === 'participations' && (
          <RoleBasedView
            entity={EntityType.PARTICIPATION_DEPARTEMENTALE}
            action={ActionType.CREATE}
          >
            <ParticipationsScrutatorTab
              participations={participations}
              onCreate={() => handleCreate('participation')}
              onEdit={(item) => handleEdit(item, 'participation')}
              onDelete={(id) => handleDelete(id, 'participation')}
            />
          </RoleBasedView>
        )}

        {activeTab === 'redressements' && (
          <RoleBasedView
            entity={EntityType.REDRESSEMENT_CANDIDAT}
            action={ActionType.CREATE}
          >
            <RedressementsScrutatorTab
              redressementsCandidats={redressementsCandidats}
              redressementsBureaux={redressementsBureaux}
              onCreate={() => handleCreate('redressement')}
              onEdit={(item, type) => handleEdit(item, 'redressement')}
              onDelete={(id, type) => handleDelete(id, 'redressement')}
            />
          </RoleBasedView>
        )}

        {activeTab === 'resultats' && (
          <RoleBasedView
            entity={EntityType.RESULTAT_DEPARTEMENT}
            action={ActionType.CREATE}
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Soumission des Résultats Départementaux
              </h3>
              <ResultatDepartementManagement />
            </div>
          </RoleBasedView>
        )}
      </div>

      {/* Modales */}
      {showDocumentModal && (
        <DocumentScrutatorModal
          document={editingItem}
          onClose={() => {
            setShowDocumentModal(false);
            setEditingItem(null);
          }}
          onSave={async () => {
            await loadData();
            setShowDocumentModal(false);
            setEditingItem(null);
          }}
        />
      )}

      {showParticipationModal && (
        <ParticipationScrutatorModal
          participation={editingItem}
          onClose={() => {
            setShowParticipationModal(false);
            setEditingItem(null);
          }}
          onSave={async () => {
            await loadData();
            setShowParticipationModal(false);
            setEditingItem(null);
          }}
        />
      )}

      {showRedressementModal && (
        <RedressementScrutatorModal
          redressement={editingItem}
          onClose={() => {
            setShowRedressementModal(false);
            setEditingItem(null);
          }}
          onSave={async () => {
            await loadData();
            setShowRedressementModal(false);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
};

// Composant pour la gestion des documents par les scrutateurs
interface DocumentsScrutatorTabProps {
  documents: DocumentArrondissement[];
  onCreate: () => void;
  onEdit: (document: DocumentArrondissement) => void;
  onDelete: (id: number) => void;
}

const DocumentsScrutatorTab: React.FC<DocumentsScrutatorTabProps> = ({ 
  documents, 
  onCreate, 
  onEdit, 
  onDelete 
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {documents.length} document(s) soumis
        </div>
        <button
          onClick={onCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          Ajouter un document
        </button>
      </div>
      
      {documents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Aucun document soumis
        </div>
      ) : (
        documents.map((document) => (
          <div key={document.code} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-800">{document.libelle}</h3>
                <p className="text-gray-600 mt-1">
                  Arrondissement: {document.arrondissement?.libelle}
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Soumis le: {new Date(document.timestamp).toLocaleDateString()}
                </p>
              </div>
              
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => onEdit(document)}
                  className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded border border-blue-300 hover:border-blue-500"
                >
                  Modifier
                </button>
                <button
                  onClick={() => onDelete(document.code)}
                  className="text-red-600 hover:text-red-800 px-3 py-1 rounded border border-red-300 hover:border-red-500"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// Composant pour la gestion des participations par les scrutateurs
interface ParticipationsScrutatorTabProps {
  participations: ParticipationDepartement[];
  onCreate: () => void;
  onEdit: (participation: ParticipationDepartement) => void;
  onDelete: (id: number) => void;
}

const ParticipationsScrutatorTab: React.FC<ParticipationsScrutatorTabProps> = ({ 
  participations, 
  onCreate, 
  onEdit, 
  onDelete 
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {participations.length} participation(s) soumise(s)
        </div>
        <button
          onClick={onCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          Ajouter une participation
        </button>
      </div>
      
      {participations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Aucune participation soumise
        </div>
      ) : (
        participations.map((participation) => (
          <div key={participation.code} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-800">
                  {participation.departement?.libelle}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                  <div>Inscrits: <span className="font-medium">{participation.nombre_inscrit.toLocaleString()}</span></div>
                  <div>Votants: <span className="font-medium">{participation.nombre_votant.toLocaleString()}</span></div>
                  <div>Taux: <span className="font-medium">{participation.taux_participation?.toFixed(2)}%</span></div>
                  <div>Suffrages: <span className="font-medium">{participation.nombre_suffrages_valable.toLocaleString()}</span></div>
                </div>
              </div>
              
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => onEdit(participation)}
                  className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded border border-blue-300 hover:border-blue-500"
                >
                  Modifier
                </button>
                <button
                  onClick={() => onDelete(participation.code)}
                  className="text-red-600 hover:text-red-800 px-3 py-1 rounded border border-red-300 hover:border-red-500"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// Composant pour la gestion des redressements par les scrutateurs
interface RedressementsScrutatorTabProps {
  redressementsCandidats: RedressementCandidat[];
  redressementsBureaux: RedressementBureauVote[];
  onCreate: () => void;
  onEdit: (item: any, type: 'candidat' | 'bureau') => void;
  onDelete: (id: number, type: 'candidat' | 'bureau') => void;
}

const RedressementsScrutatorTab: React.FC<RedressementsScrutatorTabProps> = ({ 
  redressementsCandidats, 
  redressementsBureaux, 
  onCreate, 
  onEdit, 
  onDelete 
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {redressementsCandidats.length + redressementsBureaux.length} redressement(s) soumis
        </div>
        <button
          onClick={onCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          Ajouter un redressement
        </button>
      </div>

      {/* Redressements Candidats */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Redressements Candidats ({redressementsCandidats.length})
        </h3>
        {redressementsCandidats.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            Aucun redressement candidat soumis
          </div>
        ) : (
          <div className="space-y-3">
            {redressementsCandidats.map((redressement) => (
              <div key={redressement.code} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">
                      {redressement.parti?.candidat?.noms_prenoms || redressement.parti?.designation}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Bureau: {redressement.bureauVote?.designation}
                    </p>
                    <div className="flex space-x-4 mt-2 text-sm">
                      <span>Initial: {redressement.nombre_vote_initial || 0}</span>
                      <span>Redressé: {redressement.nombre_vote_redresse || 0}</span>
                      <span>Différence: {redressementCandidatApi.calculateDifference(
                        redressement.nombre_vote_initial, 
                        redressement.nombre_vote_redresse
                      )}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => onEdit(redressement, 'candidat')}
                      className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded border border-blue-300 hover:border-blue-500"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => onDelete(redressement.code, 'candidat')}
                      className="text-red-600 hover:text-red-800 px-3 py-1 rounded border border-red-300 hover:border-red-500"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Redressements Bureaux */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Redressements Bureaux ({redressementsBureaux.length})
        </h3>
        {redressementsBureaux.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            Aucun redressement bureau soumis
          </div>
        ) : (
          <div className="space-y-3">
            {redressementsBureaux.map((redressement) => (
              <div key={redressement.code} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">
                      {redressement.bureauVote?.designation}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {redressement.bureauVote?.arrondissement?.libelle}
                    </p>
                    <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                      <div>
                        <span className="font-medium">Initial:</span> {redressement.nombre_votant_initial || 0} votants
                      </div>
                      <div>
                        <span className="font-medium">Redressé:</span> {redressement.nombre_votant_redresse || 0} votants
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => onEdit(redressement, 'bureau')}
                      className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded border border-blue-300 hover:border-blue-500"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => onDelete(redressement.code, 'bureau')}
                      className="text-red-600 hover:text-red-800 px-3 py-1 rounded border border-red-300 hover:border-red-500"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Modales pour les scrutateurs (simplifiées)
interface DocumentScrutatorModalProps {
  document: DocumentArrondissement | null;
  onClose: () => void;
  onSave: () => void;
}

const DocumentScrutatorModal: React.FC<DocumentScrutatorModalProps> = ({ document, onClose, onSave }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          {document ? 'Modifier le document' : 'Nouveau document'}
        </h3>
        <p className="text-gray-600 mb-4">
          Interface de gestion des documents pour les scrutateurs
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

interface ParticipationScrutatorModalProps {
  participation: ParticipationDepartement | null;
  onClose: () => void;
  onSave: () => void;
}

const ParticipationScrutatorModal: React.FC<ParticipationScrutatorModalProps> = ({ participation, onClose, onSave }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          {participation ? 'Modifier la participation' : 'Nouvelle participation'}
        </h3>
        <p className="text-gray-600 mb-4">
          Interface de gestion des participations pour les scrutateurs
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

interface RedressementScrutatorModalProps {
  redressement: any;
  onClose: () => void;
  onSave: () => void;
}

const RedressementScrutatorModal: React.FC<RedressementScrutatorModalProps> = ({ redressement, onClose, onSave }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          {redressement ? 'Modifier le redressement' : 'Nouveau redressement'}
        </h3>
        <p className="text-gray-600 mb-4">
          Interface de gestion des redressements pour les scrutateurs
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScrutatorView;
