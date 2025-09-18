/**
 * @file Vue spécialisée pour les observateurs locaux
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

interface ObserverViewProps {
  className?: string;
}

export const ObserverView: React.FC<ObserverViewProps> = ({ className = '' }) => {
  const { isLocalObserver, canAccess } = usePermissions();
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
    if (isLocalObserver()) {
      loadData();
    }
  }, [isLocalObserver]);

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

  if (!isLocalObserver()) {
    return (
      <AccessDeniedMessage 
        entity={EntityType.DOCUMENT_ARRONDISSEMENT} 
        action={ActionType.READ}
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
        <h2 className="text-2xl font-bold text-gray-800">Tableau de Bord Observateur Local</h2>
        <p className="text-gray-600 mt-1">
          Consultez les données électorales de votre zone d'observation
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
              action={ActionType.READ}
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
            action={ActionType.READ}
          >
            <DocumentsObserverTab documents={documents} />
          </RoleBasedView>
        )}

        {activeTab === 'participations' && (
          <RoleBasedView
            entity={EntityType.PARTICIPATION_DEPARTEMENTALE}
            action={ActionType.READ}
          >
            <ParticipationsObserverTab participations={participations} />
          </RoleBasedView>
        )}

        {activeTab === 'redressements' && (
          <RoleBasedView
            entity={EntityType.REDRESSEMENT_CANDIDAT}
            action={ActionType.READ}
          >
            <RedressementsObserverTab
              redressementsCandidats={redressementsCandidats}
              redressementsBureaux={redressementsBureaux}
            />
          </RoleBasedView>
        )}

        {activeTab === 'resultats' && (
          <RoleBasedView
            entity={EntityType.RESULTAT_DEPARTEMENT}
            action={ActionType.READ}
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Consultation des Résultats Départementaux
              </h3>
              <ResultatDepartementManagement />
            </div>
          </RoleBasedView>
        )}
      </div>
    </div>
  );
};

// Composant pour la consultation des documents par les observateurs
interface DocumentsObserverTabProps {
  documents: DocumentArrondissement[];
}

const DocumentsObserverTab: React.FC<DocumentsObserverTabProps> = ({ documents }) => {
  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        {documents.length} document(s) disponible(s) en consultation
      </div>
      
      {documents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Aucun document disponible
        </div>
      ) : (
        documents.map((document) => (
          <div key={document.code} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-800">{document.libelle}</h3>
                <p className="text-gray-600 mt-1">
                  Arrondissement: {document.arrondissement?.libelle}
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Soumis le: {new Date(document.timestamp).toLocaleDateString()}
                </p>
                {document.hash_file && (
                  <p className="text-gray-400 text-xs mt-1 font-mono">
                    Hash: {document.hash_file.substring(0, 16)}...
                  </p>
                )}
              </div>
              
              <div className="flex space-x-2 ml-4">
                {document.url_pv && (
                  <button
                    onClick={() => {
                      const url = documentArrondissementApi.getDownloadUrl(document);
                      if (url) window.open(url, '_blank');
                    }}
                    className="text-green-600 hover:text-green-800 px-3 py-1 rounded border border-green-300 hover:border-green-500"
                  >
                    📥 Télécharger
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// Composant pour la consultation des participations par les observateurs
interface ParticipationsObserverTabProps {
  participations: ParticipationDepartement[];
}

const ParticipationsObserverTab: React.FC<ParticipationsObserverTabProps> = ({ participations }) => {
  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        {participations.length} participation(s) disponible(s) en consultation
      </div>
      
      {participations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Aucune participation disponible
        </div>
      ) : (
        participations.map((participation) => (
          <div key={participation.code} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-800">
                  {participation.departement?.libelle}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                  <div className="bg-white p-2 rounded">
                    <div className="font-medium text-gray-800">{participation.nombre_inscrit.toLocaleString()}</div>
                    <div className="text-gray-600 text-xs">Inscrits</div>
                  </div>
                  <div className="bg-white p-2 rounded">
                    <div className="font-medium text-gray-800">{participation.nombre_votant.toLocaleString()}</div>
                    <div className="text-gray-600 text-xs">Votants</div>
                  </div>
                  <div className="bg-white p-2 rounded">
                    <div className="font-medium text-gray-800">{participation.taux_participation?.toFixed(2)}%</div>
                    <div className="text-gray-600 text-xs">Taux participation</div>
                  </div>
                  <div className="bg-white p-2 rounded">
                    <div className="font-medium text-gray-800">{participation.nombre_suffrages_valable.toLocaleString()}</div>
                    <div className="text-gray-600 text-xs">Suffrages valables</div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  Créé le: {participation.date_creation ? new Date(participation.date_creation).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// Composant pour la consultation des redressements par les observateurs
interface RedressementsObserverTabProps {
  redressementsCandidats: RedressementCandidat[];
  redressementsBureaux: RedressementBureauVote[];
}

const RedressementsObserverTab: React.FC<RedressementsObserverTabProps> = ({ 
  redressementsCandidats, 
  redressementsBureaux 
}) => {
  return (
    <div className="space-y-6">
      <div className="text-sm text-gray-600 mb-4">
        {redressementsCandidats.length + redressementsBureaux.length} redressement(s) disponible(s) en consultation
      </div>

      {/* Redressements Candidats */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Redressements Candidats ({redressementsCandidats.length})
        </h3>
        {redressementsCandidats.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            Aucun redressement candidat disponible
          </div>
        ) : (
          <div className="space-y-3">
            {redressementsCandidats.map((redressement) => (
              <div key={redressement.code} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">
                      {redressement.parti?.candidat?.noms_prenoms || redressement.parti?.designation}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Bureau: {redressement.bureauVote?.designation}
                    </p>
                    <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                      <div className="bg-white p-2 rounded">
                        <div className="font-medium text-gray-800">{redressement.nombre_vote_initial || 0}</div>
                        <div className="text-gray-600 text-xs">Votes initiaux</div>
                      </div>
                      <div className="bg-white p-2 rounded">
                        <div className="font-medium text-gray-800">{redressement.nombre_vote_redresse || 0}</div>
                        <div className="text-gray-600 text-xs">Votes redressés</div>
                      </div>
                      <div className="bg-white p-2 rounded">
                        <div className={`font-medium ${
                          redressementCandidatApi.calculateDifference(
                            redressement.nombre_vote_initial, 
                            redressement.nombre_vote_redresse
                          ) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {redressementCandidatApi.calculateDifference(
                            redressement.nombre_vote_initial, 
                            redressement.nombre_vote_redresse
                          )}
                        </div>
                        <div className="text-gray-600 text-xs">Différence</div>
                      </div>
                    </div>
                    {redressement.raison_redressement && (
                      <div className="mt-2 p-2 bg-yellow-50 rounded text-sm text-yellow-800">
                        <strong>Raison:</strong> {redressement.raison_redressement}
                      </div>
                    )}
                    <div className="mt-2 text-xs text-gray-500">
                      Redressé le: {new Date(redressement.date_redressement).toLocaleDateString()}
                    </div>
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
            Aucun redressement bureau disponible
          </div>
        ) : (
          <div className="space-y-3">
            {redressementsBureaux.map((redressement) => (
              <div key={redressement.code} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">
                      {redressement.bureauVote?.designation}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {redressement.bureauVote?.arrondissement?.libelle}
                    </p>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="bg-white p-3 rounded">
                        <h5 className="font-medium text-gray-700 mb-2">Données initiales</h5>
                        <div className="space-y-1 text-sm">
                          <div>Inscrits: <span className="font-medium">{redressement.nombre_inscrit_initial || 0}</span></div>
                          <div>Votants: <span className="font-medium">{redressement.nombre_votant_initial || 0}</span></div>
                          <div>Taux: <span className="font-medium">{redressementBureauVoteApi.calculateTauxParticipation(
                            redressement.nombre_votant_initial, 
                            redressement.nombre_inscrit_initial
                          ).toFixed(2)}%</span></div>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded">
                        <h5 className="font-medium text-gray-700 mb-2">Données redressées</h5>
                        <div className="space-y-1 text-sm">
                          <div>Inscrits: <span className="font-medium">{redressement.nombre_inscrit_redresse || 0}</span></div>
                          <div>Votants: <span className="font-medium">{redressement.nombre_votant_redresse || 0}</span></div>
                          <div>Taux: <span className="font-medium">{redressementBureauVoteApi.calculateTauxParticipation(
                            redressement.nombre_votant_redresse, 
                            redressement.nombre_inscrit_redresse
                          ).toFixed(2)}%</span></div>
                        </div>
                      </div>
                    </div>
                    {redressement.raison_redressement && (
                      <div className="mt-2 p-2 bg-yellow-50 rounded text-sm text-yellow-800">
                        <strong>Raison:</strong> {redressement.raison_redressement}
                      </div>
                    )}
                    <div className="mt-2 text-xs text-gray-500">
                      Redressé le: {new Date(redressement.date_redressement).toLocaleDateString()}
                    </div>
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

export default ObserverView;
