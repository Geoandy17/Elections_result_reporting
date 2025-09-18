/**
 * @file Vue de synthèse départementale avec contrôles d'accès basés sur les rôles
 */

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { EntityType, ActionType } from '../types/roles';
import { RoleBasedView, RoleBasedButton, AccessDeniedMessage } from './RoleBasedView';
import ResultatDepartementManagement from './ResultatDepartementManagement';
import { 
  getUserDepartmentResults, 
  getAllRegions, 
  getArrondissementsByDepartement,
  getBureauxVoteByArrondissement,
  getAllBureauVoteSynthesis,
  getAllArrondissementSynthesis,
  getRegionProgress,
  getDepartmentProgress,
  handleConfirmGenerate
} from '../api/electionApi';

interface DepartmentProgressResult {
  department_code: number;
  progress: {
    total_bureaux: number;
    completed_bureaux: number;
    pending_bureaux: number;
    completion_percentage: number;
  };
}

const SynthesisDepartementalPage: React.FC = () => {
  const { user } = useAuth();
  const { canAccess } = usePermissions();
  
  // États locaux
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
  const [selectedArrondissement, setSelectedArrondissement] = useState<number | null>(null);
  const [viewLevel, setViewLevel] = useState<'department' | 'arrondissement' | 'bureau'>('department');
  const [spinnerLoader, setSpinnerLoader] = useState(false);
  const [activeTab, setActiveTab] = useState<'synthesis' | 'management'>('synthesis');

  // Pagination state for bureau vote synthesis
  const [bureauPage, setBureauPage] = useState<number>(1);
  const [bureauLimit] = useState<number>(100);
  const [bureauPagination, setBureauPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);

  // Vérification des permissions
  const canViewSynthesis = canAccess(EntityType.RESULTAT_DEPARTEMENT, ActionType.READ);
  const canManageResults = canAccess(EntityType.RESULTAT_DEPARTEMENT, ActionType.CREATE) || 
                          canAccess(EntityType.RESULTAT_DEPARTEMENT, ActionType.UPDATE) ||
                          canAccess(EntityType.RESULTAT_DEPARTEMENT, ActionType.DELETE);

  // Helper function to get party abbreviation from API data
  const getPartyAbbreviation = (partyCode: string | number, partyData?: any): string => {
    if (partyData?.abbreviation) {
      return partyData.abbreviation;
    }
    
    const codeStr = String(partyCode);
    const fallbackMapping: Record<string, string> = {
      '1': 'RDPC', '2': 'PAL', '3': 'UNDP', '4': 'MCNC', '5': 'FSNC',
      '6': 'FDC', '7': 'UMS', '8': 'PCRN', '9': 'PURS', '10': 'UNIVERS',
      '11': 'SDF', '12': 'UDC'
    };
    
    return fallbackMapping[codeStr] || String(partyCode);
  };

  // Fetch user department results using the new endpoint
  const { 
    data: departmentResultsData, 
    isLoading: isLoadingDepartmentResults
  } = useQuery({
    queryKey: ['user-department-results', user?.code],
    queryFn: () => getUserDepartmentResults(),
    enabled: !!user && canViewSynthesis,
    staleTime: 5 * 60 * 1000,
  });

  // Extract departments from the API response
  const departments = useMemo(() => {
    if (!departmentResultsData?.departments) return [];
    return departmentResultsData.departments;
  }, [departmentResultsData]);

  // Fetch all regions to map region names to codes
  const { data: allRegions } = useQuery({
    queryKey: ['all-regions'],
    queryFn: () => getAllRegions(),
    enabled: canViewSynthesis,
    staleTime: 10 * 60 * 1000,
  });

  // Fetch progress data for all departments when page loads
  const { data: allDepartmentProgressData, isLoading: isLoadingAllProgress } = useQuery({
    queryKey: ['all-department-progress', departments, allRegions],
    queryFn: async () => {
      if (!departments || departments.length === 0 || !allRegions) return [];
      
      const regionGroups = new Map();
      departments.forEach((dept: any) => {
        const regionName = dept.department.region;
        if (!regionGroups.has(regionName)) {
          regionGroups.set(regionName, []);
        }
        regionGroups.get(regionName).push(dept);
      });

      const progressResults: DepartmentProgressResult[] = [];
      
      for (const [regionName, deptList] of regionGroups) {
        try {
          const region = allRegions.find((r: any) => r.libelle === regionName);
          if (!region) continue;
          
          const regionProgressData = await getRegionProgress(region.code);
          
          if (regionProgressData?.departments) {
            deptList.forEach((dept: any) => {
              const deptProgress = regionProgressData.departments.find(
                (p: any) => p.code === dept.department.code
              );
              if (deptProgress) {
                progressResults.push({
                  department_code: dept.department.code,
                  progress: deptProgress.statistics
                });
              }
            });
          }
        } catch (error) {
          console.warn(`Failed to fetch progress for region ${regionName}:`, error);
        }
      }
      
      return progressResults;
    },
    enabled: !!departments && departments.length > 0 && !!allRegions && canViewSynthesis,
    staleTime: 2 * 60 * 1000,
  });

  // Fetch progress data for departments and arrondissements
  const { data: progressData, isLoading: isLoadingProgress } = useQuery({
    queryKey: ['progress-departement', selectedDepartment, allRegions],
    queryFn: () => {
      if (selectedDepartment && allRegions) {
        const departmentData = departments.find((d: any) => d.department.code === selectedDepartment);
        const regionName = departmentData?.department.region;
        const region = allRegions.find((r: any) => r.libelle === regionName);
        const regionCode = region?.code;
        
        if (regionCode) {
          return getDepartmentProgress(regionCode, selectedDepartment);
        }
      }
      return null;
    },
    enabled: !!selectedDepartment && departments.length > 0 && !!allRegions && canViewSynthesis,
  });

  // Fetch arrondissements data when department is selected
  const { data: arrondissementsData, isLoading: isLoadingArrondissements } = useQuery({
    queryKey: ['territorial-arrondissements', selectedDepartment],
    queryFn: () => getArrondissementsByDepartement(selectedDepartment!),
    enabled: !!selectedDepartment && canViewSynthesis,
  });

  // Fetch bureaux data when arrondissement is selected
  const { data: bureauxData, isLoading: isLoadingBureaux } = useQuery({
    queryKey: ['territorial-bureaux', selectedArrondissement],
    queryFn: () => getBureauxVoteByArrondissement(selectedArrondissement!.toString()),
    enabled: !!selectedArrondissement && canViewSynthesis,
  });

  // Fetch synthesis data based on current selection
  const { data: synthesisData, isLoading: isLoadingSynthesis, isError: isErrorSynthesis, error: synthesisError } = useQuery({
    queryKey: ['synthesis-departemental', viewLevel, selectedDepartment, selectedArrondissement, bureauPage, bureauLimit],
    queryFn: async () => {
      if (selectedArrondissement && viewLevel === 'bureau') {
        const response = await getAllBureauVoteSynthesis(undefined, bureauPage, bureauLimit, true);
        setBureauPagination(response.pagination);
        return response.data;
      } else if (selectedArrondissement) {
        const response = await getAllBureauVoteSynthesis(undefined, bureauPage, bureauLimit, true);
        setBureauPagination(response.pagination);
        return response.data;
      } else if (selectedDepartment && viewLevel === 'arrondissement') {
        return getAllArrondissementSynthesis();
      } else if (selectedDepartment) {
        return getAllArrondissementSynthesis();
      }
      return null;
    },
    enabled: canViewSynthesis,
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('Session expirée') || error?.message?.includes('401')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Handlers
  const handleDepartmentChange = (departmentId: number | null) => {
    setSelectedDepartment(departmentId);
    setSelectedArrondissement(null);
    setViewLevel('arrondissement');
  };

  const handleArrondissementChange = (arrondissementId: number | null) => {
    setSelectedArrondissement(arrondissementId);
    setViewLevel('bureau');
  };

  const handleDownloadReport = async (selectedID: number, reportType: string) => {
    let format = 'pdf';
    setSpinnerLoader(true);
    try {
      await handleConfirmGenerate(format, selectedID, reportType);
      setSpinnerLoader(false);
    } catch (error) {
      setSpinnerLoader(false);
      console.error('Failed to fetch report:', error);
    }
  };

  // Helper functions
  const getCurrentLevelName = () => {
    if (selectedArrondissement) return 'Bureau de vote';
    if (selectedDepartment) return 'Arrondissement';
    return 'Département';
  };

  // Extract unique parties for table headers
  const allParties = useMemo(() => {
    if (!selectedDepartment && !selectedArrondissement) {
      if (!departmentResultsData?.departments) return [];
      const uniqueParties = new Map();
      departmentResultsData.departments.forEach((deptData: any) => {
        if (deptData.results) {
          Object.keys(deptData.results).forEach((partyName) => {
            if (!uniqueParties.has(partyName)) {
              uniqueParties.set(partyName, {
                code: partyName,
                name: partyName,
                sigles: partyName,
              });
            }
          });
        }
      });
      return Array.from(uniqueParties.values());
    } else if (selectedDepartment && !selectedArrondissement) {
      if (!departmentResultsData?.departments) return [];
      const selectedDeptData = departmentResultsData.departments.find((dept: any) => 
        dept.department.code === selectedDepartment
      );
      
      if (!selectedDeptData?.arrondissements) return [];
      
      const uniqueParties = new Map();
      selectedDeptData.arrondissements.forEach((arrData: any) => {
        if (arrData.results) {
          Object.keys(arrData.results).forEach((partyName) => {
            if (!uniqueParties.has(partyName)) {
              uniqueParties.set(partyName, {
                code: partyName,
                name: partyName,
                sigles: partyName,
              });
            }
          });
        }
      });
      return Array.from(uniqueParties.values());
    } else {
      if (!synthesisData) return [];
      const uniqueParties = new Map();
      synthesisData.forEach((result: any) => {
        if (result.code_parti && !uniqueParties.has(result.code_parti)) {
          uniqueParties.set(result.code_parti, {
            code: result.code_parti,
            name: result.parti?.designation || result.parti?.abbreviation || `Parti ${result.code_parti}`,
            sigles: getPartyAbbreviation(result.code_parti, result.parti) || result.parti?.abbreviation || result.parti?.sigles || result.code_parti,
          });
        }
      });
      return Array.from(uniqueParties.values());
    }
  }, [departmentResultsData, synthesisData, selectedDepartment, selectedArrondissement]);

  // Group data for table display based on current level
  const tableData = useMemo(() => {
    if (!selectedDepartment && !selectedArrondissement) {
      if (!departmentResultsData?.departments) return [];
      
      return departmentResultsData.departments.map((deptData: any) => ({
        id: deptData.department.code,
        name: deptData.department.libelle,
        inscrit: deptData.totalRegistered || 0,
        votant: (deptData.totalVotes || 0) + (deptData.nullBallots || 0),
        bulletin_nul: deptData.nullBallots || 0,
        parties: deptData.results || {},
        region: deptData.department.region,
        pollingStations: deptData.pollingStations
      }));
    } else if (selectedArrondissement) {
      if (!synthesisData) return [];
      
      const filteredData = synthesisData.filter((item: any) => {
        return item.bureau_vote?.code_arrondissement === selectedArrondissement;
      });
      
      const bureauxMap = new Map();
      filteredData.forEach((item: any) => {
        const bureauCode = item.code_bureau_vote;
        const bureau = item.bureau_vote;
        
        if (!bureauxMap.has(bureauCode)) {
          bureauxMap.set(bureauCode, {
            id: bureauCode,
            name: bureau?.designation || `Bureau ${bureauCode}`,
            inscrit: item.nombre_inscrit || 0,
            votant: item.nombre_votant || 0,
            bulletin_nul: item.bulletin_nul || 0,
            parties: {},
            arrondissement: bureau?.code_arrondissement
          });
        }
        
        const bureauEntry = bureauxMap.get(bureauCode);
        if (item.code_parti && item.parti) {
          bureauEntry.parties[item.code_parti] = item.nombre_vote || 0;
        }
      });
      
      return Array.from(bureauxMap.values());
    } else if (selectedDepartment) {
      if (!departmentResultsData?.departments) return [];
      
      const selectedDeptData = departmentResultsData.departments.find((dept: any) => 
        dept.department.code === selectedDepartment
      );
      
      if (!selectedDeptData?.arrondissements) return [];
      
      return selectedDeptData.arrondissements.map((arrData: any) => ({
        id: arrData.arrondissement.code,
        name: arrData.arrondissement.libelle,
        inscrit: arrData.totalRegistered || 0,
        votant: (arrData.totalVotes || 0) + (arrData.nullBallots || 0),
        bulletin_nul: arrData.nullBallots || 0,
        parties: arrData.results || {},
        department: arrData.arrondissement.code_departement
      }));
    }
    
    return [];
  }, [departmentResultsData, synthesisData, selectedDepartment, selectedArrondissement]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalInscrit = tableData.reduce((sum, item) => sum + (item.inscrit || 0), 0);
    const totalVotant = tableData.reduce((sum, item) => sum + (item.votant || 0), 0);
    const totalBulletinNul = tableData.reduce((sum, item) => sum + (item.bulletin_nul || 0), 0);
    const totalSuffrageExprime = totalVotant - totalBulletinNul;
    const tauxParticipation = totalInscrit > 0 ? (totalVotant / totalInscrit) * 100 : 0;
    const tauxSuffrageExprime = totalVotant > 0 ? (totalSuffrageExprime / totalVotant) * 100 : 0;

    return {
      totalInscrit,
      totalVotant,
      totalBulletinNul,
      totalSuffrageExprime,
      tauxParticipation,
      tauxSuffrageExprime
    };
  }, [tableData]);

  // Calculate party totals
  const partyTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    
    tableData.forEach(item => {
      Object.entries(item.parties || {}).forEach(([partyCode, votes]) => {
        if (typeof votes === 'number') {
          totals[partyCode] = (totals[partyCode] || 0) + votes;
        }
      });
    });
    
    return totals;
  }, [tableData]);

  if (!canViewSynthesis) {
    return <AccessDeniedMessage entity="synthèse départementale" />;
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec onglets */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Synthèse Départementale</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('synthesis')}
              className={`px-4 py-2 rounded-md ${
                activeTab === 'synthesis' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Synthèse
            </button>
            <RoleBasedView
              entity={EntityType.RESULTAT_DEPARTEMENT}
              action={ActionType.CREATE}
            >
              <button
                onClick={() => setActiveTab('management')}
                className={`px-4 py-2 rounded-md ${
                  activeTab === 'management' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Gestion des Résultats
              </button>
            </RoleBasedView>
          </div>
        </div>

        {/* Navigation breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
          <button
            onClick={() => {
              setSelectedDepartment(null);
              setSelectedArrondissement(null);
              setViewLevel('department');
            }}
            className="hover:text-blue-600"
          >
            Départements
          </button>
          {selectedDepartment && (
            <>
              <span>/</span>
              <button
                onClick={() => {
                  setSelectedArrondissement(null);
                  setViewLevel('arrondissement');
                }}
                className="hover:text-blue-600"
              >
                Arrondissements
              </button>
            </>
          )}
          {selectedArrondissement && (
            <>
              <span>/</span>
              <span>Bureaux de vote</span>
            </>
          )}
        </div>
      </div>

      {/* Contenu principal */}
      {activeTab === 'synthesis' ? (
        <div className="space-y-6">
          {/* Statistiques globales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600">Total Inscrits</p>
              <p className="text-2xl font-bold text-blue-900">{totals.totalInscrit.toLocaleString()}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600">Total Votants</p>
              <p className="text-2xl font-bold text-green-900">{totals.totalVotant.toLocaleString()}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-600">Taux Participation</p>
              <p className="text-2xl font-bold text-yellow-900">{totals.tauxParticipation.toFixed(2)}%</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600">Bulletins Nuls</p>
              <p className="text-2xl font-bold text-purple-900">{totals.totalBulletinNul.toLocaleString()}</p>
            </div>
          </div>

          {/* Sélecteurs de niveau */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Département
                </label>
                <select
                  value={selectedDepartment || ''}
                  onChange={(e) => handleDepartmentChange(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Sélectionner un département</option>
                  {departments.map((dept: any) => (
                    <option key={dept.department.code} value={dept.department.code}>
                      {dept.department.libelle}
                    </option>
                  ))}
                </select>
              </div>

              {selectedDepartment && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Arrondissement
                  </label>
                  <select
                    value={selectedArrondissement || ''}
                    onChange={(e) => handleArrondissementChange(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Sélectionner un arrondissement</option>
                    {arrondissementsData?.map((arr: any) => (
                      <option key={arr.code} value={arr.code}>
                        {arr.libelle}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSelectedDepartment(null);
                    setSelectedArrondissement(null);
                    setViewLevel('department');
                  }}
                  className="w-full bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>

          {/* Tableau des résultats */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">
                Résultats par {getCurrentLevelName().toLowerCase()}
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {getCurrentLevelName()}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Inscrits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Votants
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bulletins Nuls
                    </th>
                    {allParties.map((party: any) => (
                      <th key={party.code} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {party.sigles || party.name}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tableData.map((item: any) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.inscrit?.toLocaleString() || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.votant?.toLocaleString() || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.bulletin_nul?.toLocaleString() || 0}
                      </td>
                      {allParties.map((party: any) => (
                        <td key={party.code} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(item.parties?.[party.code] || 0).toLocaleString()}
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDownloadReport(item.id, 'departement')}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Rapport
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr className="font-semibold">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">TOTAL</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {totals.totalInscrit.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {totals.totalVotant.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {totals.totalBulletinNul.toLocaleString()}
                    </td>
                    {allParties.map((party: any) => (
                      <td key={party.code} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(partyTotals[party.code] || 0).toLocaleString()}
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <ResultatDepartementManagement
          selectedDepartement={selectedDepartment}
          selectedRegion={selectedRegion}
          onDepartementSelect={setSelectedDepartment}
          onRegionSelect={setSelectedRegion}
        />
      )}
    </div>
  );
};

export default SynthesisDepartementalPage;
