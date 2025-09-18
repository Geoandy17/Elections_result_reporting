/**
 * @file Vue spécialisée pour les validateurs
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

interface ValidatorViewProps {
  className?: string;
}

export const ValidatorView: React.FC<ValidatorViewProps> = ({ className = '' }) => {
  const { isValidator, canValidate } = usePermissions();
  const [activeTab, setActiveTab] = useState<'documents' | 'participations' | 'redressements' | 'resultats'>('documents');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // États pour les données
  const [documents, setDocuments] = useState<DocumentArrondissement[]>([]);
  const [participations, setParticipations] = useState<ParticipationDepartement[]>([]);
  const [redressementsCandidats, setRedressementsCandidats] = useState<RedressementCandidat[]>([]);
  const [redressementsBureaux, setRedressementsBureaux] = useState<RedressementBureauVote[]>([]);
  const [resultats, setResultats] = useState<ResultatDepartement[]>([]);

  // Chargement initial des données
  useEffect(() => {
    if (isValidator()) {
      loadData();
    }
  }, [isValidator]);

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

  const handleValidation = async (entity: string, id: number, action: 'approve' | 'reject', reason?: string) => {
    try {
      setLoading(true);
      
      // Ici, vous implémenteriez la logique de validation selon l'entité
      console.log(`Validation ${action} pour ${entity} ${id}`, reason);
      
      // Recharger les données après validation
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la validation');
    } finally {
      setLoading(false);
    }
  };

  if (!isValidator()) {
    return (
      <AccessDeniedMessage 
        entity={EntityType.DOCUMENT_ARRONDISSEMENT} 
        action={ActionType.VALIDATE}
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
        <h2 className="text-2xl font-bold text-gray-800">Tableau de Bord Validateur</h2>
        <p className="text-gray-600 mt-1">
          Validez et approuvez les soumissions des scrutateurs
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
              action={ActionType.VALIDATE}
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
            action={ActionType.VALIDATE}
          >
            <DocumentsValidationTab
              documents={documents}
              onValidation={handleValidation}
            />
          </RoleBasedView>
        )}

        {activeTab === 'participations' && (
          <RoleBasedView
            entity={EntityType.PARTICIPATION_DEPARTEMENTALE}
            action={ActionType.VALIDATE}
          >
            <ParticipationsValidationTab
              participations={participations}
              onValidation={handleValidation}
            />
          </RoleBasedView>
        )}

        {activeTab === 'redressements' && (
          <RoleBasedView
            entity={EntityType.REDRESSEMENT_CANDIDAT}
            action={ActionType.VALIDATE}
          >
            <RedressementsValidationTab
              redressementsCandidats={redressementsCandidats}
              redressementsBureaux={redressementsBureaux}
              onValidation={handleValidation}
            />
          </RoleBasedView>
        )}

        {activeTab === 'resultats' && (
          <RoleBasedView
            entity={EntityType.RESULTAT_DEPARTEMENT}
            action={ActionType.VALIDATE}
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Validation des Résultats Départementaux
              </h3>
              <ResultatDepartementManagement />
            </div>
          </RoleBasedView>
        )}
      </div>
    </div>
  );
};

// Composant pour la validation des documents
interface DocumentsValidationTabProps {
  documents: DocumentArrondissement[];
  onValidation: (entity: string, id: number, action: 'approve' | 'reject', reason?: string) => void;
}

const DocumentsValidationTab: React.FC<DocumentsValidationTabProps> = ({ documents, onValidation }) => {
  const [validationReasons, setValidationReasons] = useState<Record<number, string>>({});

  const handleValidation = (id: number, action: 'approve' | 'reject') => {
    const reason = validationReasons[id] || '';
    onValidation('document', id, action, reason);
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        {documents.length} document(s) en attente de validation
      </div>
      
      {documents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Aucun document en attente de validation
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
                  onClick={() => handleValidation(document.code, 'approve')}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Approuver
                </button>
                <button
                  onClick={() => handleValidation(document.code, 'reject')}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Rejeter
                </button>
              </div>
            </div>
            
            <div className="mt-3">
              <textarea
                placeholder="Raison de la validation (optionnel)"
                value={validationReasons[document.code] || ''}
                onChange={(e) => setValidationReasons(prev => ({ ...prev, [document.code]: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// Composant pour la validation des participations
interface ParticipationsValidationTabProps {
  participations: ParticipationDepartement[];
  onValidation: (entity: string, id: number, action: 'approve' | 'reject', reason?: string) => void;
}

const ParticipationsValidationTab: React.FC<ParticipationsValidationTabProps> = ({ participations, onValidation }) => {
  const [validationReasons, setValidationReasons] = useState<Record<number, string>>({});

  const handleValidation = (id: number, action: 'approve' | 'reject') => {
    const reason = validationReasons[id] || '';
    onValidation('participation', id, action, reason);
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        {participations.length} participation(s) en attente de validation
      </div>
      
      {participations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Aucune participation en attente de validation
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
                  onClick={() => handleValidation(participation.code, 'approve')}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Approuver
                </button>
                <button
                  onClick={() => handleValidation(participation.code, 'reject')}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Rejeter
                </button>
              </div>
            </div>
            
            <div className="mt-3">
              <textarea
                placeholder="Raison de la validation (optionnel)"
                value={validationReasons[participation.code] || ''}
                onChange={(e) => setValidationReasons(prev => ({ ...prev, [participation.code]: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// Composant pour la validation des redressements
interface RedressementsValidationTabProps {
  redressementsCandidats: RedressementCandidat[];
  redressementsBureaux: RedressementBureauVote[];
  onValidation: (entity: string, id: number, action: 'approve' | 'reject', reason?: string) => void;
}

const RedressementsValidationTab: React.FC<RedressementsValidationTabProps> = ({ 
  redressementsCandidats, 
  redressementsBureaux, 
  onValidation 
}) => {
  const [validationReasons, setValidationReasons] = useState<Record<number, string>>({});

  const handleValidation = (id: number, action: 'approve' | 'reject', type: 'candidat' | 'bureau') => {
    const reason = validationReasons[id] || '';
    onValidation(`redressement_${type}`, id, action, reason);
  };

  return (
    <div className="space-y-6">
      {/* Redressements Candidats */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Redressements Candidats ({redressementsCandidats.length})
        </h3>
        {redressementsCandidats.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            Aucun redressement candidat en attente
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
                      onClick={() => handleValidation(redressement.code, 'approve', 'candidat')}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                    >
                      Approuver
                    </button>
                    <button
                      onClick={() => handleValidation(redressement.code, 'reject', 'candidat')}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                    >
                      Rejeter
                    </button>
                  </div>
                </div>
                
                <div className="mt-2">
                  <textarea
                    placeholder="Raison de la validation (optionnel)"
                    value={validationReasons[redressement.code] || ''}
                    onChange={(e) => setValidationReasons(prev => ({ ...prev, [redressement.code]: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                  />
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
            Aucun redressement bureau en attente
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
                      onClick={() => handleValidation(redressement.code, 'approve', 'bureau')}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                    >
                      Approuver
                    </button>
                    <button
                      onClick={() => handleValidation(redressement.code, 'reject', 'bureau')}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                    >
                      Rejeter
                    </button>
                  </div>
                </div>
                
                <div className="mt-2">
                  <textarea
                    placeholder="Raison de la validation (optionnel)"
                    value={validationReasons[redressement.code] || ''}
                    onChange={(e) => setValidationReasons(prev => ({ ...prev, [redressement.code]: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ValidatorView;
