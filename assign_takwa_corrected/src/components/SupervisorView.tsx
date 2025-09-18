/**
 * @file Vue spécialisée pour les superviseurs départementaux
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
  commissionDepartementaleApi,
  membreCommissionApi,
  type CommissionDepartementale,
  type MembreCommission
} from '../api/commissionApi';
import { 
  resultatDepartementApi,
  type ResultatDepartement 
} from '../api/resultatDepartementApi';
import ResultatDepartementManagement from './ResultatDepartementManagement';

interface SupervisorViewProps {
  className?: string;
}

export const SupervisorView: React.FC<SupervisorViewProps> = ({ className = '' }) => {
  const { isDepartmentSupervisor, canModify, canValidate } = usePermissions();
  const [activeTab, setActiveTab] = useState<'overview' | 'commissions' | 'documents' | 'participations' | 'redressements' | 'resultats'>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // États pour les données
  const [documents, setDocuments] = useState<DocumentArrondissement[]>([]);
  const [participations, setParticipations] = useState<ParticipationDepartement[]>([]);
  const [redressementsCandidats, setRedressementsCandidats] = useState<RedressementCandidat[]>([]);
  const [redressementsBureaux, setRedressementsBureaux] = useState<RedressementBureauVote[]>([]);
  const [commissions, setCommissions] = useState<CommissionDepartementale[]>([]);
  const [membres, setMembres] = useState<MembreCommission[]>([]);
  const [resultats, setResultats] = useState<ResultatDepartement[]>([]);

  // Chargement initial des données
  useEffect(() => {
    if (isDepartmentSupervisor()) {
      loadData();
    }
  }, [isDepartmentSupervisor]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [docsData, partsData, redCandData, redBureauData, commData, membData, resultatsData] = await Promise.all([
        documentArrondissementApi.getAll(),
        participationDepartementApi.getAll(),
        redressementCandidatApi.getAll(),
        redressementBureauVoteApi.getAll(),
        commissionDepartementaleApi.getAll(),
        membreCommissionApi.getAll(),
        resultatDepartementApi.getAll()
      ]);
      
      setDocuments(docsData);
      setParticipations(partsData);
      setRedressementsCandidats(redCandData);
      setRedressementsBureaux(redBureauData);
      setResultats(resultatsData);
      setCommissions(commData);
      setMembres(membData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleValidation = async (entity: string, id: number, action: 'approve' | 'reject', reason?: string) => {
    try {
      setLoading(true);
      console.log(`Validation ${action} pour ${entity} ${id}`, reason);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la validation');
    } finally {
      setLoading(false);
    }
  };

  if (!isDepartmentSupervisor()) {
    return (
      <AccessDeniedMessage 
        entity={EntityType.COMMISSION_DEPARTEMENTALE} 
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
        <h2 className="text-2xl font-bold text-gray-800">Tableau de Bord Superviseur Départemental</h2>
        <p className="text-gray-600 mt-1">
          Supervisez et gérez les données électorales de votre département
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
              key: 'overview', 
              label: 'Vue d\'ensemble', 
              count: 0,
              entity: EntityType.COMMISSION_DEPARTEMENTALE
            },
            { 
              key: 'commissions', 
              label: 'Commissions', 
              count: commissions.length,
              entity: EntityType.COMMISSION_DEPARTEMENTALE
            },
            { 
              key: 'documents', 
              label: 'Documents', 
              count: documents.length,
              entity: EntityType.DOCUMENT_ARRONDISSEMENT
            },
            { 
              key: 'participations', 
              label: 'Participations', 
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
              action={key === 'overview' ? ActionType.READ : ActionType.CREATE}
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
                {label} {count > 0 && `(${count})`}
              </button>
            </RoleBasedView>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <OverviewTab
            documents={documents}
            participations={participations}
            redressementsCandidats={redressementsCandidats}
            redressementsBureaux={redressementsBureaux}
            commissions={commissions}
            membres={membres}
          />
        )}

        {activeTab === 'commissions' && (
          <RoleBasedView
            entity={EntityType.COMMISSION_DEPARTEMENTALE}
            action={ActionType.CREATE}
          >
            <CommissionsSupervisorTab
              commissions={commissions}
              membres={membres}
              onValidation={handleValidation}
            />
          </RoleBasedView>
        )}

        {activeTab === 'documents' && (
          <RoleBasedView
            entity={EntityType.DOCUMENT_ARRONDISSEMENT}
            action={ActionType.VALIDATE}
          >
            <DocumentsSupervisorTab
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
            <ParticipationsSupervisorTab
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
            <RedressementsSupervisorTab
              redressementsCandidats={redressementsCandidats}
              redressementsBureaux={redressementsBureaux}
              onValidation={handleValidation}
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
                Gestion des Résultats Départementaux
              </h3>
              <ResultatDepartementManagement />
            </div>
          </RoleBasedView>
        )}
      </div>
    </div>
  );
};

// Composant pour la vue d'ensemble
interface OverviewTabProps {
  documents: DocumentArrondissement[];
  participations: ParticipationDepartement[];
  redressementsCandidats: RedressementCandidat[];
  redressementsBureaux: RedressementBureauVote[];
  commissions: CommissionDepartementale[];
  membres: MembreCommission[];
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  documents,
  participations,
  redressementsCandidats,
  redressementsBureaux,
  commissions,
  membres
}) => {
  const totalInscrits = participations.reduce((sum, p) => sum + p.nombre_inscrit, 0);
  const totalVotants = participations.reduce((sum, p) => sum + p.nombre_votant, 0);
  const tauxParticipationMoyen = totalInscrits > 0 ? (totalVotants / totalInscrits) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Statistiques générales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{commissions.length}</div>
          <div className="text-sm text-gray-600">Commissions</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{membres.length}</div>
          <div className="text-sm text-gray-600">Membres</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{documents.length}</div>
          <div className="text-sm text-gray-600">Documents</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{tauxParticipationMoyen.toFixed(2)}%</div>
          <div className="text-sm text-gray-600">Taux participation</div>
        </div>
      </div>

      {/* Statistiques détaillées */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Participation Électorale</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Total inscrits:</span>
              <span className="font-medium">{totalInscrits.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total votants:</span>
              <span className="font-medium">{totalVotants.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Taux moyen:</span>
              <span className="font-medium">{tauxParticipationMoyen.toFixed(2)}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Redressements</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Candidats:</span>
              <span className="font-medium">{redressementsCandidats.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Bureaux:</span>
              <span className="font-medium">{redressementsBureaux.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total:</span>
              <span className="font-medium">{redressementsCandidats.length + redressementsBureaux.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dernières activités */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Dernières Activités</h3>
        <div className="space-y-2 text-sm">
          {documents.slice(0, 3).map((doc) => (
            <div key={doc.code} className="flex justify-between items-center py-2 border-b border-gray-100">
              <span>Document soumis: {doc.libelle}</span>
              <span className="text-gray-500">{new Date(doc.timestamp).toLocaleDateString()}</span>
            </div>
          ))}
          {participations.slice(0, 3).map((part) => (
            <div key={part.code} className="flex justify-between items-center py-2 border-b border-gray-100">
              <span>Participation: {part.departement?.libelle}</span>
              <span className="text-gray-500">{part.date_creation ? new Date(part.date_creation).toLocaleDateString() : 'N/A'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Composant pour la gestion des commissions par les superviseurs
interface CommissionsSupervisorTabProps {
  commissions: CommissionDepartementale[];
  membres: MembreCommission[];
  onValidation: (entity: string, id: number, action: 'approve' | 'reject', reason?: string) => void;
}

const CommissionsSupervisorTab: React.FC<CommissionsSupervisorTabProps> = ({ 
  commissions, 
  membres, 
  onValidation 
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {commissions.length} commission(s) départementale(s)
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
          Gérer les commissions
        </button>
      </div>

      {commissions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Aucune commission départementale
        </div>
      ) : (
        <div className="grid gap-4">
          {commissions.map((commission) => (
            <div key={commission.code} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-800">{commission.libelle}</h3>
                  <p className="text-gray-600 mt-1">
                    Département: {commission.departement?.libelle}
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    Membres: {commission.membreCommissions?.length || 0}
                  </p>
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <button className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded border border-blue-300 hover:border-blue-500">
                    Gérer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Composant pour la gestion des documents par les superviseurs
interface DocumentsSupervisorTabProps {
  documents: DocumentArrondissement[];
  onValidation: (entity: string, id: number, action: 'approve' | 'reject', reason?: string) => void;
}

const DocumentsSupervisorTab: React.FC<DocumentsSupervisorTabProps> = ({ documents, onValidation }) => {
  const [validationReasons, setValidationReasons] = useState<Record<number, string>>({});

  const handleValidation = (id: number, action: 'approve' | 'reject') => {
    const reason = validationReasons[id] || '';
    onValidation('document', id, action, reason);
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        {documents.length} document(s) à superviser
      </div>
      
      {documents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Aucun document à superviser
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

// Composant pour la gestion des participations par les superviseurs
interface ParticipationsSupervisorTabProps {
  participations: ParticipationDepartement[];
  onValidation: (entity: string, id: number, action: 'approve' | 'reject', reason?: string) => void;
}

const ParticipationsSupervisorTab: React.FC<ParticipationsSupervisorTabProps> = ({ participations, onValidation }) => {
  const [validationReasons, setValidationReasons] = useState<Record<number, string>>({});

  const handleValidation = (id: number, action: 'approve' | 'reject') => {
    const reason = validationReasons[id] || '';
    onValidation('participation', id, action, reason);
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        {participations.length} participation(s) à superviser
      </div>
      
      {participations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Aucune participation à superviser
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

// Composant pour la gestion des redressements par les superviseurs
interface RedressementsSupervisorTabProps {
  redressementsCandidats: RedressementCandidat[];
  redressementsBureaux: RedressementBureauVote[];
  onValidation: (entity: string, id: number, action: 'approve' | 'reject', reason?: string) => void;
}

const RedressementsSupervisorTab: React.FC<RedressementsSupervisorTabProps> = ({ 
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
      <div className="text-sm text-gray-600 mb-4">
        {redressementsCandidats.length + redressementsBureaux.length} redressement(s) à superviser
      </div>

      {/* Redressements Candidats */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Redressements Candidats ({redressementsCandidats.length})
        </h3>
        {redressementsCandidats.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            Aucun redressement candidat à superviser
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
            Aucun redressement bureau à superviser
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

export default SupervisorView;
