/**
 * @file Composant principal pour la gestion des arrondissements et documents d'arrondissement
 */

import React, { useState, useEffect } from 'react';
import {
  arrondissementApi,
  documentArrondissementApi,
  regionsApi,
  type Arrondissement,
  type DocumentArrondissement,
  type Region,
  type Departement
} from '../api/arrondissementApi';
import { departementsApi } from '../api/commissionApi';
import { usePermissions } from '../hooks/usePermissions';
import { EntityType, ActionType } from '../types/roles';
import { RoleBasedView, RoleBasedButton, AccessDeniedMessage } from './RoleBasedView';

interface ArrondissementManagementProps {
  className?: string;
}

export const ArrondissementManagement: React.FC<ArrondissementManagementProps> = ({ className = '' }) => {
  const { canAccess, canModify, canCreate, canDelete } = usePermissions();
  const [activeTab, setActiveTab] = useState<'arrondissements' | 'documents'>('arrondissements');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // États pour les données
  const [arrondissements, setArrondissements] = useState<Arrondissement[]>([]);
  const [documents, setDocuments] = useState<DocumentArrondissement[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [departements, setDepartements] = useState<Departement[]>([]);

  // États pour les modales
  const [showArrondissementModal, setShowArrondissementModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  // États pour l'édition
  const [editingArrondissement, setEditingArrondissement] = useState<Arrondissement | null>(null);
  const [editingDocument, setEditingDocument] = useState<DocumentArrondissement | null>(null);

  // Filtres
  const [selectedRegion, setSelectedRegion] = useState<number | ''>('');
  const [selectedDepartement, setSelectedDepartement] = useState<number | ''>('');
  const [selectedArrondissement, setSelectedArrondissement] = useState<number | ''>('');

  // Chargement initial des données
  useEffect(() => {
    loadInitialData();
  }, []);

  // Rechargement des arrondissements quand les filtres changent
  useEffect(() => {
    if (activeTab === 'arrondissements') {
      loadArrondissements();
    }
  }, [selectedRegion, selectedDepartement, activeTab]);

  // Rechargement des documents quand le filtre arrondissement change
  useEffect(() => {
    if (activeTab === 'documents') {
      loadDocuments();
    }
  }, [selectedArrondissement, activeTab]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [regionsData, departementsData] = await Promise.all([
        regionsApi.getAll(),
        departementsApi.getAll()
      ]);
      
      setRegions(regionsData);
      setDepartements(departementsData);
      
      // Charger les données selon l'onglet actif
      await loadDataForActiveTab();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const loadDataForActiveTab = async () => {
    switch (activeTab) {
      case 'arrondissements':
        await loadArrondissements();
        break;
      case 'documents':
        await loadDocuments();
        break;
    }
  };

  const loadArrondissements = async () => {
    try {
      const filters: any = {};
      if (selectedRegion) filters.region = Number(selectedRegion);
      if (selectedDepartement) filters.departement = Number(selectedDepartement);
      
      const data = await arrondissementApi.getAll(filters);
      setArrondissements(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des arrondissements');
    }
  };

  const loadDocuments = async () => {
    try {
      const data = await documentArrondissementApi.getAll(
        selectedArrondissement ? Number(selectedArrondissement) : undefined
      );
      setDocuments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des documents');
    }
  };

  const handleTabChange = async (tab: 'arrondissements' | 'documents') => {
    setActiveTab(tab);
    setError(null);
    await loadDataForActiveTab();
  };

  const handleDeleteArrondissement = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet arrondissement ?')) return;
    
    try {
      await arrondissementApi.delete(id);
      await loadArrondissements();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  const handleDeleteDocument = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;
    
    try {
      await documentArrondissementApi.delete(id);
      await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  const handleDownloadDocument = (document: DocumentArrondissement) => {
    const url = documentArrondissementApi.getDownloadUrl(document);
    if (url) {
      window.open(url, '_blank');
    }
  };

  // Filtrer les départements par région sélectionnée
  const filteredDepartements = selectedRegion
    ? departements.filter(dept => dept.region?.code === Number(selectedRegion))
    : departements;

  // Filtrer les arrondissements pour le dropdown des documents
  const filteredArrondissementsForDocuments = selectedDepartement
    ? arrondissements.filter(arr => arr.code_departement === Number(selectedDepartement))
    : arrondissements;

  // Vérifier les permissions d'accès
  if (!canAccess(EntityType.ARRONDISSEMENT) && !canAccess(EntityType.DOCUMENT_ARRONDISSEMENT)) {
    return (
      <AccessDeniedMessage 
        entity={EntityType.ARRONDISSEMENT} 
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
        <h2 className="text-2xl font-bold text-gray-800">Gestion des Arrondissements</h2>
        <p className="text-gray-600 mt-1">
          Gérez les arrondissements et leurs documents
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
              key: 'arrondissements', 
              label: 'Arrondissements', 
              count: arrondissements.length,
              entity: EntityType.ARRONDISSEMENT
            },
            { 
              key: 'documents', 
              label: 'Documents', 
              count: documents.length,
              entity: EntityType.DOCUMENT_ARRONDISSEMENT
            }
          ].map(({ key, label, count, entity }) => (
            <RoleBasedView
              key={key}
              entity={entity}
              action={ActionType.READ}
              fallback={null}
            >
              <button
                onClick={() => handleTabChange(key as any)}
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
        {activeTab === 'arrondissements' && (
          <ArrondissementsTab
            arrondissements={arrondissements}
            regions={regions}
            departements={filteredDepartements}
            selectedRegion={selectedRegion}
            selectedDepartement={selectedDepartement}
            onRegionChange={setSelectedRegion}
            onDepartementChange={setSelectedDepartement}
            onEdit={(arrondissement) => {
              setEditingArrondissement(arrondissement);
              setShowArrondissementModal(true);
            }}
            onDelete={handleDeleteArrondissement}
            onAdd={() => {
              setEditingArrondissement(null);
              setShowArrondissementModal(true);
            }}
          />
        )}

        {activeTab === 'documents' && (
          <DocumentsTab
            documents={documents}
            regions={regions}
            departements={filteredDepartements}
            arrondissements={filteredArrondissementsForDocuments}
            selectedRegion={selectedRegion}
            selectedDepartement={selectedDepartement}
            selectedArrondissement={selectedArrondissement}
            onRegionChange={setSelectedRegion}
            onDepartementChange={setSelectedDepartement}
            onArrondissementChange={setSelectedArrondissement}
            onEdit={(document) => {
              setEditingDocument(document);
              setShowDocumentModal(true);
            }}
            onDelete={handleDeleteDocument}
            onDownload={handleDownloadDocument}
            onAdd={() => {
              setEditingDocument(null);
              setShowDocumentModal(true);
            }}
          />
        )}
      </div>

      {/* Modales */}
      {showArrondissementModal && (
        <ArrondissementModal
          arrondissement={editingArrondissement}
          regions={regions}
          departements={departements}
          onClose={() => {
            setShowArrondissementModal(false);
            setEditingArrondissement(null);
          }}
          onSave={async () => {
            await loadArrondissements();
            setShowArrondissementModal(false);
            setEditingArrondissement(null);
          }}
        />
      )}

      {showDocumentModal && (
        <DocumentModal
          document={editingDocument}
          arrondissements={arrondissements}
          onClose={() => {
            setShowDocumentModal(false);
            setEditingDocument(null);
          }}
          onSave={async () => {
            await loadDocuments();
            setShowDocumentModal(false);
            setEditingDocument(null);
          }}
        />
      )}
    </div>
  );
};

// Composant pour l'onglet Arrondissements
interface ArrondissementsTabProps {
  arrondissements: Arrondissement[];
  regions: Region[];
  departements: Departement[];
  selectedRegion: number | '';
  selectedDepartement: number | '';
  onRegionChange: (value: number | '') => void;
  onDepartementChange: (value: number | '') => void;
  onEdit: (arrondissement: Arrondissement) => void;
  onDelete: (id: number) => void;
  onAdd: () => void;
}

const ArrondissementsTab: React.FC<ArrondissementsTabProps> = ({
  arrondissements,
  regions,
  departements,
  selectedRegion,
  selectedDepartement,
  onRegionChange,
  onDepartementChange,
  onEdit,
  onDelete,
  onAdd
}) => {
  // Calculer les statistiques
  const totalDocuments = arrondissements.reduce((sum, arr) => sum + (arr.pvArrondissements?.length || 0), 0);
  const arrondissementsAvecDocuments = arrondissements.filter(arr => (arr.pvArrondissements?.length || 0) > 0).length;
  const totalBureauxVote = arrondissements.reduce((sum, arr) => sum + (arr.bureauVotes?.length || 0), 0);

  return (
    <div className="space-y-4">
      {/* Statistiques */}
      {arrondissements.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{arrondissements.length}</div>
            <div className="text-sm text-gray-600">Arrondissements</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{totalDocuments}</div>
            <div className="text-sm text-gray-600">Documents soumis</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{arrondissementsAvecDocuments}</div>
            <div className="text-sm text-gray-600">Avec documents</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{totalBureauxVote}</div>
            <div className="text-sm text-gray-600">Bureaux de vote</div>
          </div>
        </div>
      )}
      
      {/* Filters and Add button */}
    <div className="flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <select
          value={selectedRegion}
          onChange={(e) => onRegionChange(e.target.value ? Number(e.target.value) : '')}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Toutes les régions</option>
          {regions.map((region) => (
            <option key={region.code} value={region.code}>
              {region.libelle} ({region.abbreviation})
            </option>
          ))}
        </select>
        
        <select
          value={selectedDepartement}
          onChange={(e) => onDepartementChange(e.target.value ? Number(e.target.value) : '')}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Tous les départements</option>
          {departements.map((dept) => (
            <option key={dept.code} value={dept.code}>
              {dept.libelle} ({dept.abbreviation})
            </option>
          ))}
        </select>
      </div>
      <RoleBasedButton
        entity={EntityType.ARRONDISSEMENT}
        action={ActionType.CREATE}
        onClick={onAdd}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
      >
        Ajouter un arrondissement
      </RoleBasedButton>
    </div>

    {/* Arrondissements list */}
    <div className="grid gap-4">
      {arrondissements.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Aucun arrondissement trouvé
        </div>
      ) : (
        arrondissements.map((arrondissement) => (
          <div key={arrondissement.code} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center">
                  <h3 className="font-semibold text-lg text-gray-800">{arrondissement.libelle}</h3>
                  {arrondissement.abbreviation && (
                    <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                      {arrondissement.abbreviation}
                    </span>
                  )}
                </div>
                <div className="mt-2 space-y-1">
                  {arrondissement.region && (
                    <p className="text-gray-600 text-sm">
                      Région: {arrondissement.region.libelle} ({arrondissement.region.abbreviation})
                    </p>
                  )}
                  {arrondissement.departement && (
                    <p className="text-gray-600 text-sm">
                      Département: {arrondissement.departement.libelle} ({arrondissement.departement.abbreviation})
                    </p>
                  )}
                  {arrondissement.description && (
                    <p className="text-gray-500 text-sm">{arrondissement.description}</p>
                  )}
                </div>
                <div className="flex items-center mt-3 space-x-4 text-sm text-gray-500">
                  <span>Bureaux de vote: {arrondissement.bureauVotes?.length || 0}</span>
                  <span className="flex items-center">
                    📄 Documents soumis: 
                    <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
                      (arrondissement.pvArrondissements?.length || 0) > 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {arrondissement.pvArrondissements?.length || 0}
                    </span>
                  </span>
                  {arrondissement.date_creation && (
                    <span>Créé le: {new Date(arrondissement.date_creation).toLocaleDateString()}</span>
                  )}
                </div>
                
                {/* Affichage des derniers documents si disponibles */}
                {arrondissement.pvArrondissements && arrondissement.pvArrondissements.length > 0 && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      📋 Derniers documents soumis ({arrondissement.pvArrondissements.length})
                    </h4>
                    <div className="space-y-1">
                      {arrondissement.pvArrondissements
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                        .slice(0, 3) // Afficher seulement les 3 derniers
                        .map((doc) => (
                          <div key={doc.code} className="flex justify-between items-center text-xs text-gray-600">
                            <span className="truncate">{doc.libelle}</span>
                            <span className="ml-2 flex-shrink-0">
                              {new Date(doc.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      {arrondissement.pvArrondissements.length > 3 && (
                        <div className="text-xs text-blue-600 font-medium">
                          ... et {arrondissement.pvArrondissements.length - 3} autre(s) document(s)
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex space-x-2 ml-4">
                <RoleBasedButton
                  entity={EntityType.ARRONDISSEMENT}
                  action={ActionType.UPDATE}
                  onClick={() => onEdit(arrondissement)}
                  className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded border border-blue-300 hover:border-blue-500"
                >
                  Modifier
                </RoleBasedButton>
                <RoleBasedButton
                  entity={EntityType.ARRONDISSEMENT}
                  action={ActionType.DELETE}
                  onClick={() => onDelete(arrondissement.code)}
                  className="text-red-600 hover:text-red-800 px-3 py-1 rounded border border-red-300 hover:border-red-500"
                >
                  Supprimer
                </RoleBasedButton>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
  );
};

// Composant pour l'onglet Documents
interface DocumentsTabProps {
  documents: DocumentArrondissement[];
  regions: Region[];
  departements: Departement[];
  arrondissements: Arrondissement[];
  selectedRegion: number | '';
  selectedDepartement: number | '';
  selectedArrondissement: number | '';
  onRegionChange: (value: number | '') => void;
  onDepartementChange: (value: number | '') => void;
  onArrondissementChange: (value: number | '') => void;
  onEdit: (document: DocumentArrondissement) => void;
  onDelete: (id: number) => void;
  onDownload: (document: DocumentArrondissement) => void;
  onAdd: () => void;
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({
  documents,
  regions,
  departements,
  arrondissements,
  selectedRegion,
  selectedDepartement,
  selectedArrondissement,
  onRegionChange,
  onDepartementChange,
  onArrondissementChange,
  onEdit,
  onDelete,
  onDownload,
  onAdd
}) => (
  <div className="space-y-4">
    {/* Filters and Add button */}
    <div className="flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <select
          value={selectedRegion}
          onChange={(e) => onRegionChange(e.target.value ? Number(e.target.value) : '')}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Toutes les régions</option>
          {regions.map((region) => (
            <option key={region.code} value={region.code}>
              {region.libelle} ({region.abbreviation})
            </option>
          ))}
        </select>
        
        <select
          value={selectedDepartement}
          onChange={(e) => onDepartementChange(e.target.value ? Number(e.target.value) : '')}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Tous les départements</option>
          {departements.map((dept) => (
            <option key={dept.code} value={dept.code}>
              {dept.libelle} ({dept.abbreviation})
            </option>
          ))}
        </select>
        
        <select
          value={selectedArrondissement}
          onChange={(e) => onArrondissementChange(e.target.value ? Number(e.target.value) : '')}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Tous les arrondissements</option>
          {arrondissements.map((arr) => (
            <option key={arr.code} value={arr.code}>
              {arr.libelle} ({arr.abbreviation})
            </option>
          ))}
        </select>
      </div>
      <RoleBasedButton
        entity={EntityType.DOCUMENT_ARRONDISSEMENT}
        action={ActionType.CREATE}
        onClick={onAdd}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
      >
        Ajouter un document
      </RoleBasedButton>
    </div>

    {/* Documents list */}
    <div className="grid gap-4">
      {documents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Aucun document trouvé
        </div>
      ) : (
        documents.map((document) => (
          <div key={document.code} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-800">{document.libelle}</h3>
                <div className="mt-2 space-y-1">
                  {document.arrondissement && (
                    <>
                      <p className="text-gray-600 text-sm">
                        Arrondissement: {document.arrondissement.libelle} ({document.arrondissement.abbreviation})
                      </p>
                      {document.arrondissement.departement && (
                        <p className="text-gray-600 text-sm">
                          Département: {document.arrondissement.departement.libelle} ({document.arrondissement.departement.abbreviation})
                        </p>
                      )}
                      {document.arrondissement.region && (
                        <p className="text-gray-600 text-sm">
                          Région: {document.arrondissement.region.libelle} ({document.arrondissement.region.abbreviation})
                        </p>
                      )}
                    </>
                  )}
                </div>
                <div className="flex items-center mt-3 space-x-4 text-sm text-gray-500">
                  <span>Ajouté le: {new Date(document.timestamp).toLocaleDateString()}</span>
                  {document.hash_file && (
                    <span className="font-mono text-xs">Hash: {document.hash_file.substring(0, 8)}...</span>
                  )}
                </div>
              </div>
              <div className="flex space-x-2 ml-4">
                {document.url_pv && (
                  <RoleBasedButton
                    entity={EntityType.DOCUMENT_ARRONDISSEMENT}
                    action={ActionType.READ}
                    onClick={() => onDownload(document)}
                    className="text-green-600 hover:text-green-800 px-3 py-1 rounded border border-green-300 hover:border-green-500"
                  >
                    📥 Télécharger
                  </RoleBasedButton>
                )}
                <RoleBasedButton
                  entity={EntityType.DOCUMENT_ARRONDISSEMENT}
                  action={ActionType.UPDATE}
                  onClick={() => onEdit(document)}
                  className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded border border-blue-300 hover:border-blue-500"
                >
                  Modifier
                </RoleBasedButton>
                <RoleBasedButton
                  entity={EntityType.DOCUMENT_ARRONDISSEMENT}
                  action={ActionType.DELETE}
                  onClick={() => onDelete(document.code)}
                  className="text-red-600 hover:text-red-800 px-3 py-1 rounded border border-red-300 hover:border-red-500"
                >
                  Supprimer
                </RoleBasedButton>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

// Modale pour Arrondissement
interface ArrondissementModalProps {
  arrondissement: Arrondissement | null;
  regions: Region[];
  departements: Departement[];
  onClose: () => void;
  onSave: () => void;
}

const ArrondissementModal: React.FC<ArrondissementModalProps> = ({ 
  arrondissement, 
  regions, 
  departements, 
  onClose, 
  onSave 
}) => {
  const [formData, setFormData] = useState({
    libelle: arrondissement?.libelle || '',
    abbreviation: arrondissement?.abbreviation || '',
    description: arrondissement?.description || '',
    code_region: arrondissement?.code_region || '',
    code_departement: arrondissement?.code_departement || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtrer les départements par région sélectionnée
  const filteredDepartements = formData.code_region
    ? departements.filter(dept => dept.region?.code === Number(formData.code_region))
    : departements;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.libelle) {
      setError('Le libellé est requis');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const submitData = {
        ...formData,
        code_region: formData.code_region ? Number(formData.code_region) : undefined,
        code_departement: formData.code_departement ? Number(formData.code_departement) : undefined
      };
      
      if (arrondissement) {
        await arrondissementApi.update(arrondissement.code, submitData);
      } else {
        await arrondissementApi.create(submitData);
      }
      
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          {arrondissement ? 'Modifier l\'arrondissement' : 'Nouvel arrondissement'}
        </h3>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Libellé *
            </label>
            <input
              type="text"
              value={formData.libelle}
              onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Abréviation
            </label>
            <input
              type="text"
              value={formData.abbreviation}
              onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Région
            </label>
            <select
              value={formData.code_region}
              onChange={(e) => setFormData({ 
                ...formData, 
                code_region: e.target.value,
                code_departement: '' // Reset département when région changes
              })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sélectionner une région</option>
              {regions.map((region) => (
                <option key={region.code} value={region.code}>
                  {region.libelle} ({region.abbreviation})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Département
            </label>
            <select
              value={formData.code_departement}
              onChange={(e) => setFormData({ ...formData, code_departement: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!formData.code_region}
            >
              <option value="">Sélectionner un département</option>
              {filteredDepartements.map((dept) => (
                <option key={dept.code} value={dept.code}>
                  {dept.libelle} ({dept.abbreviation})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modale pour Document
interface DocumentModalProps {
  document: DocumentArrondissement | null;
  arrondissements: Arrondissement[];
  onClose: () => void;
  onSave: () => void;
}

const DocumentModal: React.FC<DocumentModalProps> = ({ 
  document, 
  arrondissements, 
  onClose, 
  onSave 
}) => {
  const [formData, setFormData] = useState({
    libelle: document?.libelle || '',
    code_arrondissement: document?.code_arrondissement || ''
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.libelle || !formData.code_arrondissement) {
      setError('Le libellé et l\'arrondissement sont requis');
      return;
    }

    if (!document && !file) {
      setError('Un fichier est requis pour un nouveau document');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      if (document) {
        await documentArrondissementApi.update(document.code, {
          libelle: formData.libelle,
          file: file || undefined
        });
      } else {
        await documentArrondissementApi.create({
          libelle: formData.libelle,
          code_arrondissement: Number(formData.code_arrondissement),
          file: file!
        });
      }
      
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          {document ? 'Modifier le document' : 'Nouveau document'}
        </h3>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Libellé *
            </label>
            <input
              type="text"
              value={formData.libelle}
              onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Arrondissement *
            </label>
            <select
              value={formData.code_arrondissement}
              onChange={(e) => setFormData({ ...formData, code_arrondissement: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={!!document} // Désactiver la modification de l'arrondissement pour un document existant
            >
              <option value="">Sélectionner un arrondissement</option>
              {arrondissements.map((arr) => (
                <option key={arr.code} value={arr.code}>
                  {arr.libelle} ({arr.abbreviation}) - {arr.departement?.libelle}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fichier {!document && '*'}
            </label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              required={!document}
            />
            <p className="text-xs text-gray-500 mt-1">
              Formats acceptés: PDF, DOC, DOCX, JPG, JPEG, PNG (max 10MB)
            </p>
            {document && document.url_pv && (
              <p className="text-xs text-blue-600 mt-1">
                Fichier actuel: {document.url_pv.split('/').pop()}
              </p>
            )}
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ArrondissementManagement;
