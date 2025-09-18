import React, { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import CameroonMapView from './components/CameroonMapView'
import ProtectedRoute from './components/ProtectedRoute'
import ValidationResultsNew from './components/ValidationResultsNew'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useTerritorialAccess } from './hooks/useTerritorialAccess'
import { 
  politicalParties,
  cameroonRegionsData,
  calculateNationalTotals,
  type ViewMode 
} from './data/cameroonElectionData'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

// Type definitions for progress results
interface DepartmentProgressResult {
  department_code: string;
  progress: any; // You may want to define a more specific type for progress statistics
}

interface ArrondissementProgressResult {
  arrondissement_code: string;
  progress: any; // You may want to define a more specific type for progress statistics
}
import {
  getNationalStats,
  getNationalResults,
  getRegionsData, // Import the new API function
  getPollingStationResults,
  validatePollingStationResult,
  validateMultipleResults,
  // getPollingStationResultDetails,
  updatePollingStationResult,
  getPVForBureau,
  type PV,
  // New territorial results API functions
  getUserAssignedRegions,
  getAllRegions,
  getDepartementsByRegion,
  getArrondissementsByDepartement,
  getBureauxVoteByArrondissement,
  // Synthesis API functions
  getAllArrondissementSynthesis,
  getAllDepartementSynthesis,
  getAllRegionalSynthesis,
  getAllBureauVoteSynthesis,
  // triggerSynthesisAggregation,
  // Participation API functions
  getParticipationByBureau,
  updateParticipation,
  type UpdateParticipationDto,
  // Bureau results API function
  getResultsByBureau,
  // User department results API function
  getUserDepartmentResults,
  // User arrondissement results API function
  getUserArrondissementResults,
  handleConfirmGenerate,
  // Progress tracking API functions
  getProgressOverview,
  getRegionProgress,
  getDepartmentProgress,
} from './api/electionApi'
import ReportsComponent from './components/reportsPageView'
import SubmissionPage from './components/submissionPageView'
import CommissionManagement from './components/CommissionManagement'
import ArrondissementManagement from './components/ArrondissementManagement'
import ParticipationManagement from './components/ParticipationManagement'
import RedressementManagement from './components/RedressementManagement'

// Utility function to clean PV URLs by removing '/uploads' part
const cleanPVUrl = (url: string): string => {
  if (!url) return url;
  // Remove '/uploads' from the URL path and ensure proper leading slash
  let cleanUrl = url.replace(/\/?uploads\/pv\//, '/pv/');
  // Ensure the URL starts with a slash
  if (!cleanUrl.startsWith('/')) { 
    cleanUrl = '/' + cleanUrl;
  }
  return cleanUrl;
};


interface StatCardProps {
  icon: string;
  title: string;
  subtitle: string;
  color: 'blue' | 'green' | 'yellow' | 'orange' | 'purple' | 'red';
  badge?: string;
  trend?: { value: number; isUp: boolean };
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  children?: { id: string; label: string; icon: string }[];
}

interface PartyResult {
  code: string;
  name: string;
  color: string;
  votes: number;
  candidate?: string; // Optional candidate field
}

// @ts-ignore
interface PollingStation {
  code: string;
  name: string;
  district: string;
  registered: number;
  voters: number;
  turnout: number;
}
// @ts-ignore
interface ElectionData {
  totalRegistered: number;
  totalVotes: number;
  turnout: number;
  processedStations: number;
  totalStations: number;
}

interface Bureau {
  code: number;
  designation: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  altititude: number | null;
  code_arrondissement: number;
  code_createur: string | null;
  code_modificateur: string | null;
  date_creation: string | null;
  date_modification: string | null;
}

interface PartiPolitique {
  code: number;
  designation: string;
  abbreviation: string;
  description: string;
  coloration_bulletin: string;
  image: string | null;
  code_candidat: number | null;
  candidat: any | null;
  code_createur: string | null;
  code_modificateur: string | null;
  date_creation: string | null;
  date_modification: string | null;
}

interface PollingStationResult {
  code: number;
  code_bureau: number;
  bureau: Bureau;
  code_parti_politique: number;
  parti_politique: PartiPolitique;
  nombre_vote: number;
  code_createur: string;
  code_modificateur: string | null;
  date_creation: string;
  date_modification: string | null;
  statut_validation: number;
}

const StatCard = ({ icon, title, subtitle, color }: StatCardProps) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600', 
    yellow: 'from-yellow-500 to-yellow-600',
    orange: 'from-orange-500 to-orange-600',
    purple: 'from-purple-500 to-purple-600',
    red: 'from-red-500 to-red-600'
  };

  return (
    <div className="stat-card group">
      <div className={`stat-icon bg-gradient-to-br ${colorClasses[color]} group-hover:scale-110 transition-transform duration-300`}>
        <i className={icon}></i>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
          {/* {trend && (
            <span className={`text-sm font-medium flex items-center ${trend.isUp ? 'text-green-600' : 'text-red-600'}`}>
              <i className={`fas fa-arrow-${trend.isUp ? 'up' : 'down'} text-xs mr-1`}></i>
              {Math.abs(trend.value)}%
            </span>
          )} */}
        </div>
        <p className="text-gray-600 text-sm">
          {subtitle}
          {/* {badge && (
            <span className="ml-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              {badge}
            </span>
          )} */}
        </p>
      </div>
    </div>
  );
};

const Header = () => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  return (
    <header className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-6 h-16 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg text-lg font-bold shadow-md">
          E
        </div>
        <span className="text-xl font-bold font-display">Vote FLow</span>
      </div>
      <div className="flex items-center gap-6">
        <div className="relative">
          <div 
            className="flex items-center gap-3 cursor-pointer hover:bg-slate-600 rounded-lg px-3 py-2 transition-colors duration-200"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
              <i className="fas fa-user text-sm"></i>
            </div>
            <div>
              <div className="text-sm font-medium font-display">{user?.noms_prenoms || user?.username}</div>
              <div className="text-xs text-gray-300">
                {/* Display multiple roles or single role */}
                {user?.roles && Array.isArray(user.roles) 
                  ? user.roles.map(role => role.libelle).join(', ')
                  : user?.role?.libelle
                }
              </div>
            </div>
            <i className={`fas fa-chevron-down text-sm transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}></i>
          </div>
          
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="text-sm font-medium text-gray-900">{user?.noms_prenoms}</div>
                <div className="text-sm text-gray-500">{user?.email}</div>
                <div className="text-xs text-blue-600 font-medium mt-1">
                  {/* Display multiple roles or single role with badges */}
                  {user?.roles && Array.isArray(user.roles) ? (
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {role.libelle}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {user?.role?.libelle}
                    </span>
                  )}
                </div>
              </div>
              <div className="py-2">
                <button
                  onClick={() => setShowUserMenu(false)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                >
                  <i className="fas fa-user"></i>
                  Mon profil
                </button>
                <button
                  onClick={() => setShowUserMenu(false)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                >
                  <i className="fas fa-cog"></i>
                  Paramètres
                </button>
                <div className="border-t border-gray-100 mt-2 pt-2">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                  >
                    <i className="fas fa-sign-out-alt"></i>
                    Se déconnecter
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

const Navigation = ({ menuItems, activeMenu, onMenuClick }: {
  menuItems: MenuItem[];
  activeMenu: string;
  onMenuClick: (menuId: string) => void;
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const handleMenuClick = (item: MenuItem) => {
    if (item.children) {
      setOpenDropdown(openDropdown === item.id ? null : item.id);
    } else {
      onMenuClick(item.id);
      setOpenDropdown(null);
    }
  };

  // Vérifier si le scroll est nécessaire
  React.useEffect(() => {
    const checkScrollNeed = () => {
      if (scrollContainerRef.current) {
        const { scrollWidth, clientWidth } = scrollContainerRef.current;
        setShowScrollButtons(scrollWidth > clientWidth);
      }
    };

    checkScrollNeed();
    window.addEventListener('resize', checkScrollNeed);
    return () => window.removeEventListener('resize', checkScrollNeed);
  }, [menuItems]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  return (
    <nav className="bg-gradient-to-r from-slate-700 to-slate-600 h-14 shadow-md relative">
      {/* Bouton de scroll gauche */}
      {showScrollButtons && (
        <button
          onClick={scrollLeft}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-slate-600/80 hover:bg-slate-600 text-white p-1 rounded-full transition-all duration-200"
        >
          <i className="fas fa-chevron-left text-sm"></i>
        </button>
      )}
      
      {/* Bouton de scroll droite */}
      {showScrollButtons && (
        <button
          onClick={scrollRight}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-slate-600/80 hover:bg-slate-600 text-white p-1 rounded-full transition-all duration-200"
        >
          <i className="fas fa-chevron-right text-sm"></i>
        </button>
      )}

      <div 
        ref={scrollContainerRef}
        className="px-6 h-full flex items-center gap-6 overflow-x-auto nav-scroll"
        style={{ 
          scrollbarWidth: 'thin',
          paddingLeft: showScrollButtons ? '3rem' : '1.5rem',
          paddingRight: showScrollButtons ? '3rem' : '1.5rem'
        }}>
        {menuItems.map((item) => (
        <div key={item.id} className="relative group flex-shrink-0">
          <button
            onClick={() => handleMenuClick(item)}
            className={`flex items-center gap-2 text-white hover:text-blue-300 transition-all duration-200 py-2 px-3 rounded-lg font-medium whitespace-nowrap ${
              activeMenu === item.id ? 'text-blue-300 bg-slate-600/50 border-b-2 border-blue-300' : ''
            }`}
          >
            <i className={item.icon}></i>
            <span>{item.label}</span>
            {item.children && <i className="fas fa-chevron-down text-xs transition-transform duration-200 group-hover:rotate-180"></i>}
          </button>
          
          {item.children && openDropdown === item.id && (
            <div className="nav-dropdown">
              {item.children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => onMenuClick(child.id)}
                  className="w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-all duration-200"
                >
                  <i className={child.icon}></i>
                  <span>{child.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        ))}
      </div>
    </nav>
  );
};

// 3D Pie Chart Component for Election Results
const ElectionResultsPieChart = ({ nationalStats, nationalResults }: { 
  nationalStats: any, 
  nationalResults: any 
}) => {
  const chartData = useMemo(() => {
    // Use fallback data without abstention
    const fallbackData = [
      { name: 'Paul BIYA', y: 48, color: '#1E40AF' },
      { name: 'Maurice KAMTO', y: 31, color: '#DC2626' },
      { name: 'Cabral LIBII', y: 12, color: '#10B981' },
      { name: 'Autres', y: 9, color: '#F59E0B' }
    ];

    if (!nationalStats || !nationalResults) {
      console.log('Pie Chart: Using fallback data', fallbackData);
      return fallbackData;
    }
    
    const totalRegistered = nationalStats.totalRegistered || 0;
    const totalVotes = nationalResults.totalVotes || 0;
    
    console.log('Pie Chart Data:', { totalRegistered, totalVotes });
    
    // Calculate percentages for each party based on registered voters (no abstention)
    const partyData = nationalResults.partyResults?.map((party: any) => ({
      name: party.name || party.code,
      y: totalRegistered > 0 ? (party.votes / totalRegistered) * 100 : 0,
      color: party.color || '#1E40AF'
    })) || [];
    
    console.log('Pie Chart Final Data:', partyData);
    
    // If no data or all values are 0, use fallback
    if (partyData.length === 0 || partyData.every((item: any) => item.y === 0)) {
      console.log('Pie Chart: Using fallback data due to empty results');
      return fallbackData;
    }
    
    // Filter out parties with 0% to avoid clutter
    return partyData.filter((item: any) => item.y > 0);
  }, [nationalStats, nationalResults]);

  const options = {
    chart: {
      type: 'pie',
      height: 500,
      backgroundColor: 'transparent'
    },
    title: {
      text: ''
    },
    tooltip: {
      pointFormat: '{point.name}: <b>{point.percentage:.1f}%</b>'
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        borderColor: '#9ca3af',
        borderWidth: 3,
        dataLabels: {
          enabled: true,
          format: '{point.name}<br>{point.percentage:.1f}%',
          style: {
            fontSize: '12px',
            fontWeight: 'bold'
          }
        },
        showInLegend: false, // Disable legend
        size: '90%', // Make pie chart much bigger
        center: ['50%', '50%'] // Center the pie chart
      }
    },
    series: [{
      name: 'Pourcentage',
      colorByPoint: true,
      data: chartData
    }],
    legend: {
      enabled: false // Completely disable legend
    },
    credits: {
      enabled: false
    }
  };

  // Show loading state if no data
  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return <HighchartsReact highcharts={Highcharts} options={options} />;
};

// Vertical Bar Chart Component for Candidate Results
const CandidateResultsBarChart = ({ nationalResults }: { nationalResults: any }) => {
  const chartData = useMemo(() => {
    // Use fallback data if API data is not available
    const fallbackData = [
      { name: 'RDPC', y: 27.85, color: '#F59E0B' },
      { name: 'UNDP', y: 23.15, color: '#1E40AF' },
      { name: 'PALI', y: 21.95, color: '#DC2626' },
      { name: 'MCNC', y: 7.07, color: '#8B5CF6' },
      { name: 'FSNC', y: 4.78, color: '#06B6D4' },
      { name: 'SDF', y: 4.63, color: '#10B981' },
      { name: 'UDC', y: 3.13, color: '#6D28D9' },
      { name: 'FDC', y: 2.28, color: '#B91C1C' },
      { name: 'UMS', y: 2.06, color: '#6B7280' },
      { name: 'PURS', y: 1.75, color: '#EC4899' },
      { name: 'PCRN', y: 0.77, color: '#92400E' },
      { name: 'UNIVERS', y: 0.56, color: '#7C2D12' }
    ];

    if (!nationalResults?.partyResults) {
      console.log('Bar Chart: Using fallback data', fallbackData);
      return fallbackData;
    }
    
    const totalVotes = nationalResults.totalVotes || 1;
    
    const data = nationalResults.partyResults
      .map((party: any) => ({
        name: party.code || party.name,
        y: (party.votes / totalVotes) * 100,
        color: party.color || '#1E40AF'
      }))
      .sort((a: any, b: any) => b.y - a.y) // Sort by percentage descending
      .filter((item: any) => item.y > 0); // Filter out 0% results
    
    console.log('Bar Chart Data:', { totalVotes, data });
    
    // If no data or all values are 0, use fallback
    if (data.length === 0 || data.every((item: any) => item.y === 0)) {
      console.log('Bar Chart: Using fallback data due to empty results');
      return fallbackData;
    }
    
    return data;
  }, [nationalResults]);

  const options = {
    chart: {
      type: 'column',
      height: 500,
      backgroundColor: 'transparent'
    },
    title: {
      text: ''
    },
    xAxis: {
      categories: chartData.map((item: any) => item.name),
      title: {
        text: 'Partis Politiques'
      },
      labels: {
        rotation: -45,
        style: {
          fontSize: '11px',
          fontWeight: 'bold'
        }
      }
    },
    yAxis: {
      min: 0,
      max: Math.max(30, Math.max(...chartData.map((item: any) => item.y)) * 1.1),
      title: {
        text: 'Pourcentage de votes (%)'
      },
      gridLineColor: '#E5E7EB',
      gridLineWidth: 1
    },
    tooltip: {
      pointFormat: '{point.name}: <b>{point.y:.2f}%</b>'
    },
    plotOptions: {
      column: {
        dataLabels: {
          enabled: true,
          format: '{point.y:.1f}%',
          style: {
            color: 'white',
            textOutline: '2px 2px 2px black',
            fontWeight: 'bold',
            fontSize: '12px'
          },
          verticalAlign: 'top',
          y: -5
        },
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#9ca3af'
      }
    },
    series: [{
      name: 'Pourcentage',
      data: chartData.map((item: any) => ({
        name: item.name,
        y: item.y,
        color: item.color
      }))
    }],
    legend: {
      enabled: false
    },
    credits: {
      enabled: false
    }
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
};

const Dashboard = () => {
  const [viewMode] = useState<ViewMode>('results');
  const [selectedParty, setSelectedParty] = useState<string | undefined>(undefined);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [isRegionalTableFullscreen, setIsRegionalTableFullscreen] = useState(false);
  const [showOnlyValidated, setShowOnlyValidated] = useState(false);

  // Fetch data using TanStack Query with fallback to hardcoded data
  const { data: nationalStats, isLoading: isLoadingStats, isError: isErrorStats } = useQuery({
    queryKey: ['nationalStats'],
    queryFn: () => getNationalStats(),
  });

  const { data: nationalResults, isLoading: isLoadingResults, isError: isErrorResults } = useQuery({
    queryKey: ['nationalResults'],
    queryFn: () => getNationalResults(),
  });
  const { data: regionsData, isLoading: isLoadingRegions, isError: isErrorRegions } = useQuery({
    queryKey: ['regions'],
    queryFn: () => getRegionsData(),
  });

  // Party code to backend ID mapping - based on the API structure
  // Backend uses numeric IDs: "1": 1870, "2": 750, "3": 600
  const partyCodeToBackendId: { [key: string]: string } = {
    'RDPC': '1',  // 1870 votes
    'MRC': '2',   // 750 votes
    'FSNC': '3',  // 600 votes  
    'SDF': '4',   
    'UNDP': '5'   
  };

  // Helper function to get party abbreviation from API data
  const getPartyAbbreviation = (partyCode: string | number, partyData?: any): string => {
    // First try to get abbreviation from API data
    if (partyData?.abbreviation) {
      return partyData.abbreviation;
    }
    
    // Fallback to hardcoded mapping if API data not available
    const codeStr = String(partyCode);
    const fallbackMapping: Record<string, string> = {
      '1': 'RDPC',
      '2': 'PAL', 
      '3': 'UNDP',
      '4': 'MCNC',
      '5': 'FSNC',
      '6': 'FDC',
      '7': 'UMS',
      '8': 'PCRN',
      '9': 'PURS',
      '10': 'UNIVERS',
      '11': 'SDF',
      '12': 'UDC'
    };
    
    return fallbackMapping[codeStr] || String(partyCode);
  };

  // Alternative: Dynamic mapping based on vote counts for debugging
  const createDynamicMapping = (regionWithResults: any, nationalResults: any) => {
    if (!regionWithResults?.results || !nationalResults?.partyResults) return {};
    
    const mapping: { [key: string]: string } = {};
    
    // Try to match vote counts - handle both string and number values
    nationalResults.partyResults.forEach((party: PartyResult) => {
      Object.entries(regionWithResults.results).forEach(([backendId, votes]) => {
        // Convert both to numbers for comparison
        const votesAsNumber = typeof votes === 'string' ? parseInt(votes) : votes;
        const partyVotesAsNumber = typeof party.votes === 'string' ? parseInt(party.votes) : party.votes;
        
        if (votesAsNumber === partyVotesAsNumber) {
          mapping[party.code] = backendId;
          console.log(`🔗 Dynamic mapping: ${party.code} -> ${backendId} (${votesAsNumber} votes)`);
        }
      });
    });
    
    return mapping;
  };

  // Use hardcoded data when API fails
  const effectiveRegionsData = useMemo(() => {
    console.log('🔍 API Regions Data:', regionsData);
    console.log('🔍 Is Error Regions:', isErrorRegions);
    
    if (regionsData && !isErrorRegions) {
      console.log('🔍 Using API data - first region with results:', 
        regionsData.find((r: any) => Object.keys(r.results || {}).length > 0));
      return regionsData;
    }
    // Convert hardcoded data to API format with proper ID mapping
    const regionKeyToId: { [key: string]: string } = {
      'adamaoua': '1',
      'centre': '2', 
      'est': '3',
      'extreme-nord': '4',
      'littoral': '5',
      'nord': '6',
      'nord-ouest': '7',
      'ouest': '8',
      'sud': '9',
      'sud-ouest': '10'
    };
    
    const fallbackData = Object.entries(cameroonRegionsData).map(([key, region]) => ({
      id: regionKeyToId[key] || key,
      name: region.name,
      capital: region.capital,
      totalRegistered: region.totalRegistered,
      totalVotes: region.totalVotes,
      turnout: region.turnout,
      pollingStations: region.pollingStations,
      results: region.results
    }));
    
    console.log('🔍 Using fallback data');
    return fallbackData;
  }, [regionsData, isErrorRegions]);

  const effectiveNationalResults = useMemo(() => {
    console.log('🔍 National Results from API:', nationalResults);
    console.log('🔍 National Results Error:', isErrorResults);
    
    if (nationalResults && !isErrorResults) {
      console.log('🔍 Using API National Results:', nationalResults);
      return nationalResults;
    }
    // Generate national results from hardcoded data
    const totals = calculateNationalTotals();
    const fallbackResults = {
      totalVotes: totals.totalVotes,
      partyResults: politicalParties.map(party => ({
        code: party.code,
        name: party.name,
        color: party.color,
        votes: totals.results[party.code] || 0
      }))
    };
    console.log('🔍 Using Fallback National Results:', fallbackResults);
    return fallbackResults;
  }, [nationalResults, isErrorResults]);

  const handleRegionSelect = (regionKey: string | null) => {
    setSelectedRegion(regionKey);
  };

  // Regional table fullscreen handlers
  const toggleRegionalTableFullscreen = () => {
    setIsRegionalTableFullscreen(!isRegionalTableFullscreen);
  };

  // Handle escape key for regional table fullscreen
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isRegionalTableFullscreen) {
        setIsRegionalTableFullscreen(false);
      }
    };

    if (isRegionalTableFullscreen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isRegionalTableFullscreen]);
  
  if (isLoadingStats || isLoadingResults || isLoadingRegions) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mr-4"></div>
          <span className="text-xl text-gray-600 font-semibold">Chargement des données du tableau de bord...</span>
        </div>
      </div>
    );
  }

  if (isErrorStats || isErrorResults || isErrorRegions) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <i className="fas fa-exclamation-triangle text-6xl text-red-500 mb-6"></i>
          <h2 className="text-2xl font-semibold text-gray-700 mb-3">Erreur de chargement des données</h2>
          <p className="max-w-md">Impossible de récupérer les informations depuis le serveur. Veuillez réessayer plus tard.</p>
        </div>
      </div>
    );
  }

  const sortedNationalResults = nationalResults?.partyResults || [];
  const selectedRegionData = effectiveRegionsData?.find((r: any) => r.id === selectedRegion);

  return (
    <div className="space-y-8">
      {/* Page Header can be re-enabled here if needed */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
  <StatCard
    icon="fas fa-users"
    title={`${(nationalStats?.totalRegistered ?? 0).toLocaleString('fr-FR').replace(/,/g, ' ')}`}
    subtitle="Électeurs inscrits"
    color="blue"
    trend={{ value: 2.3, isUp: true }}
  />
  <StatCard 
    icon="fas fa-chart-line"
    title={`${(nationalStats?.turnout ?? 0).toFixed(1)}%`}
    subtitle="Taux de participation"
    color="green"
    trend={{ value: 1.8, isUp: true }}
  />
  <StatCard
    icon="fas fa-file-lines"
    title={nationalStats?.pollingStations.displayText ?? `${nationalStats?.pollingStations.reported ?? 0}/${nationalStats?.pollingStations.total ?? 0}`}
    subtitle="Procès verbaux reçus"
    color="yellow"
    badge={nationalStats && nationalStats.pollingStations.reported < nationalStats.pollingStations.total ? "En cours" : "Complet"}
  />
  <StatCard
    icon="fas fa-check-circle"
    title={nationalStats?.pollingStations.displayText ?? `${(((nationalStats?.pollingStations.reported ?? 0) / (nationalStats?.pollingStations.total ?? 1)) * 100).toFixed(2)}%`}
    subtitle="Bureaux dépouillés"
    color="purple"
    trend={{ value: 5.2, isUp: true }}
  />
</div>
      {/* Stats Grid & Map Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Map */}
        
        <div className="xl:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  
                </h2>
                
                {/* Validation Filter Toggle */}
                <div className="flex items-center gap-3" >
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showOnlyValidated}
                      onChange={(e) => setShowOnlyValidated(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700 hidden" >
                      Résultats validés seulement
                    </span>
                  </label>
                  {showOnlyValidated && (
                    <span  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <i className="fas fa-check-circle mr-1"></i>
                      Validés
                    </span>
                  )}
                </div>
              </div>
                
                {/* View Mode Controls */}
                {/* <div className="flex flex-wrap gap-2">
                  {[
                    { mode: 'results', label: 'Résultats', icon: 'fas fa-trophy' },
                    { mode: 'turnout', label: 'Participation', icon: 'fas fa-chart-line' },
                    { mode: 'participation', label: 'Bureaux', icon: 'fas fa-building' },
                    { mode: 'party-votes', label: 'Par parti', icon: 'fas fa-users' }
                  ].map(({ mode, label, icon }) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode as ViewMode)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        viewMode === mode 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <i className={icon}></i>
                      {label}
                    </button>
                  ))}
                </div>
              </div> */}
              
              {/* Party Selection for Party Votes Mode */}
              {viewMode === 'party-votes' && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {politicalParties.map(party => (
                    <button
                      key={party.code}
                      onClick={() => setSelectedParty(selectedParty === party.code ? undefined : party.code)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        selectedParty === party.code
                          ? 'text-white shadow-md'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                      }`}
                      style={{
                        backgroundColor: selectedParty === party.code ? party.color : undefined
                      }}
                    >
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: party.color }}
                      ></div>
                      {getPartyAbbreviation(party.code, party)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <CameroonMapView 
              regionsData={effectiveRegionsData || []}
              nationalResults={effectiveNationalResults}
              viewMode={viewMode}
              selectedParty={selectedParty}
              selectedRegion={selectedRegion}
              onRegionSelect={handleRegionSelect}
            />
          </div>
        </div>

        {/* Right Column: Stats and National Results */}
        <div className="space-y-8">
          {/* Stats Grid */}
          

          {/* Political Parties Results Table */}
          <div className="table-container">
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">
                Parti Politique
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {(nationalResults?.totalVotes ?? 0).toLocaleString()} votes exprimés au total
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 font-bold text-left text-xs font-extrabold text-black uppercase tracking-wider">
                      <b>Rang</b>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-extrabold text-black uppercase tracking-wider">
                      <b>Parti Politique</b>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-extrabold text-black uppercase tracking-wider">
                      <b>Votes</b>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-extrabold text-black uppercase tracking-wider">
                      <b>Taux (%)</b>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-extrabold text-black uppercase tracking-wider">
                      <b>Evolution des votes</b>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedNationalResults.map((result: PartyResult, index: number) => {
                    const percentage = ((result.votes / (nationalResults?.totalVotes || 1)) * 100);
                    return (
                      <tr key={result.code} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md ${
                      index < 3 ? 
                        index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500' :
                        index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-500' : 
                        'bg-gradient-to-br from-yellow-600 to-yellow-700'
                      : 'bg-gradient-to-br from-gray-300 to-gray-400'
                    }`}>
                      {index + 1}
                    </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
                              <div 
                                className="w-full h-full rounded-full flex items-center justify-center text-xs font-bold text-white"
                                style={{ backgroundColor: result.color }}
                              >
                                {String(result.code || '').substring(0, 2)}
                              </div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{getPartyAbbreviation(result.code, result)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {result.votes.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                            percentage >= 50 ? 'bg-green-100 text-green-800' :
                            percentage >= 30 ? 'bg-blue-100 text-blue-800' :
                            percentage >= 15 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {percentage.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full transition-all duration-1000 ease-out"
                          style={{ 
                                width: `${Math.min(percentage, 100)}%`,
                            backgroundColor: result.color || '#9CA3AF'
                          }}
                        ></div>
                      </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {percentage.toFixed(1)}%
                    </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
                  </div>
            {sortedNationalResults.length === 0 && (
              <div className="p-12 text-center text-gray-500">
                <i className="fas fa-chart-bar text-4xl mb-4 text-gray-400"></i>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucun résultat disponible</h3>
                <p>Les résultats des partis politiques seront affichés ici une fois disponibles.</p>
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Regional Statistics */}
      {selectedRegion && selectedRegionData && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Détails - {selectedRegionData.name}
            </h3>
            <button 
              onClick={() => setSelectedRegion(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {selectedRegionData.turnout}%
              </div>
              <div className="text-sm text-gray-600">Taux de participation</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {selectedRegionData.totalVotes.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Votes exprimés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {selectedRegionData.pollingStations.displayText ?? `${selectedRegionData.pollingStations.reported}/${selectedRegionData.pollingStations.total}`}
              </div>
              <div className="text-sm text-gray-600">Bureaux rapportés</div>
            </div>
          </div>
        </div>
      )}

      {/* Regional Results Table */}
      <div 
        className={`table-container ${isRegionalTableFullscreen ? 'fullscreen-table-overlay' : ''}`}
        style={isRegionalTableFullscreen ? {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          width: '100vw',
          height: '100vh',
          borderRadius: 0,
          overflow: 'auto',
        } : {}}
      >
        {/* Fullscreen Exit Button - Only shown in fullscreen mode */}
        {isRegionalTableFullscreen && (
          <div className="fullscreen-controls">
            <button
              onClick={toggleRegionalTableFullscreen}
              className="p-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
              title="Quitter le plein écran"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Resultats par region
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Répartition des votes par parti politique et par région
              </p>
            </div>
            {!isRegionalTableFullscreen && (
              <button
                onClick={toggleRegionalTableFullscreen}
                className="ml-4 p-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                title="Mode plein écran"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                  Parti Politique
                </th>
                {effectiveRegionsData?.map((region: any) => (
                  <th key={region.id} className="px-4 py-6 text-center text-sm font-bold text-black  uppercase tracking-wider h-24">
                    <div className="transform -rotate-45 origin-center whitespace-nowrap font-bold">
                      {region.name}
                    </div>
                  </th>
                ))}
                <th className="px-6 py-3 text-center text-xs font-bold text-black uppercase tracking-wider">
                  Total National
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedNationalResults?.map((result: PartyResult) => {
                const totalVotes = result.votes;
                
                // Create dynamic mapping for this render cycle
                const regionWithResults = effectiveRegionsData?.find((r: any) => Object.keys(r.results || {}).length > 0);
                const dynamicMapping = createDynamicMapping(regionWithResults, effectiveNationalResults);
                
                // Helper function to get exact votes displayed in regional cell
                const getRegionalVotes = (region: any, partyResult: PartyResult) => {
                  let backendId = partyCodeToBackendId[partyResult.code] || dynamicMapping[partyResult.code];
                  let regionVotes = backendId ? (region.results?.[backendId] || 0) : 0;
                  
                  // Same fallback logic as in the regional cells
                  if (regionVotes === 0 && region.results) {
                    const matchingEntry = Object.entries(region.results).find(([, votes]) => {
                      const votesAsNumber = typeof votes === 'string' ? parseInt(votes) : votes;
                      const resultVotesAsNumber = typeof partyResult.votes === 'string' ? parseInt(partyResult.votes) : partyResult.votes;
                      return votesAsNumber === resultVotesAsNumber;
                    });
                    if (matchingEntry) {
                      regionVotes = typeof matchingEntry[1] === 'string' ? parseInt(matchingEntry[1]) : matchingEntry[1];
                    }
                  }
                  
                  return regionVotes;
                };
                
                // Debug: Show all parties being processed
                console.log(`🎯 Processing party:`, {
                  code: result.code,
                  name: result.name,
                  votes: result.votes,
                  backendMapping: partyCodeToBackendId[result.code]
                });
                return (
                  <tr key={result.code} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white z-10 border-r border-gray-200">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: result.color }}
                        ></div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{result.code}</div>
                          <div className="text-xs font-bold text-gray-700" title={result.name}>
                            {result.name && result.name.length > 25 ? `${result.name.substring(0, 25)}...` : (result.name || '')}
                          </div>
                        </div>
                      </div>
                    </td>
                    {effectiveRegionsData?.map((region: any) => {
                      // Use helper function to get exact votes
                      const regionVotes = getRegionalVotes(region, result);
                      const regionPercentage = region.totalVotes > 0 ? (regionVotes / region.totalVotes) * 100 : 0;
                      
                      // Enhanced debugging - show for all parties in Extrême-Nord
                      if (region.name === 'Extrême-Nord') {
                        console.log(`🔍 ${result.code} in ${region.name}:`, {
                          partyCode: result.code,
                          finalVotes: regionVotes,
                          totalVotes: region.totalVotes,
                          percentage: regionPercentage.toFixed(1) + '%',
                          allBackendKeys: Object.keys(region.results || {})
                        });
                      }
                      
                      return (
                        <td key={region.id} className="px-4 py-4 whitespace-nowrap text-center">
                          <div className="text-sm font-medium text-gray-900">
                            {regionVotes.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {regionPercentage.toFixed(1)}%
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div 
                              className="h-1.5 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${Math.min(regionPercentage, 100)}%`,
                                backgroundColor: result.color || '#9CA3AF'
                              }}
                            ></div>
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {(() => {
                        // Calculate sum of regional values using the same helper function
                        const regionalSum = effectiveRegionsData?.reduce((sum: number, region: any) => {
                          const votes = getRegionalVotes(region, result);
                          return sum + votes;
                        }, 0) || 0;
                        
                        console.log(`📊 Total calculation for ${result.code}:`, {
                          partyCode: result.code,
                          regionalSum: regionalSum,
                          originalAPITotal: result.votes,
                          difference: regionalSum - result.votes
                        });
                        
                        // Calculate total of all regional votes for percentage
                        const grandTotal = effectiveRegionsData?.reduce((sum: number, region: any) => {
                          return sum + (region.totalVotes || 0);
                        }, 0) || 0;
                        
                        return (
                          <>
                            <div className="text-lg font-bold text-gray-900">
                              {regionalSum.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              {grandTotal > 0 ? ((regionalSum / grandTotal) * 100).toFixed(2) : '0.00'}%
                            </div>
                          </>
                        );
                      })()}
                    </td>
                  </tr>
                );
              })}
              {/* Totals Row */}
              <tr className="bg-gray-100 font-semibold">
                <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-gray-100 z-10 border-r border-gray-200">
                  <div className="text-sm font-bold text-gray-900">TOTAL</div>
                </td>
                {effectiveRegionsData?.map((region: any) => {
                  // Calculate region total by summing all party votes in this region's column
                  const regionWithResults = effectiveRegionsData?.find((r: any) => Object.keys(r.results || {}).length > 0);
                  const dynamicMapping = createDynamicMapping(regionWithResults, effectiveNationalResults);
                  
                  const getRegionalVotes = (region: any, partyResult: PartyResult) => {
                    let backendId = partyCodeToBackendId[partyResult.code] || dynamicMapping[partyResult.code];
                    let regionVotes = backendId ? (region.results?.[backendId] || 0) : 0;
                    
                    if (regionVotes === 0 && region.results) {
                      const matchingEntry = Object.entries(region.results).find(([, votes]) => {
                        const votesAsNumber = typeof votes === 'string' ? parseInt(votes) : votes;
                        const resultVotesAsNumber = typeof partyResult.votes === 'string' ? parseInt(partyResult.votes) : partyResult.votes;
                        return votesAsNumber === resultVotesAsNumber;
                      });
                      if (matchingEntry) {
                        regionVotes = typeof matchingEntry[1] === 'string' ? parseInt(matchingEntry[1]) : matchingEntry[1];
                      }
                    }
                    
                    return regionVotes;
                  };
                  
                  const calculatedRegionTotal = sortedNationalResults?.reduce((sum: number, party: PartyResult) => {
                    return sum + getRegionalVotes(region, party);
                  }, 0) || 0;
                  
                  return (
                    <td key={region.id} className="px-4 py-4 whitespace-nowrap text-center">
                      <div className="text-sm font-medium text-gray-900">
                        {calculatedRegionTotal.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {region.turnout?.toFixed(1) || '0.0'}%
                      </div>
                    </td>
                  );
                })}
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="text-lg font-bold text-gray-900">
                    {(() => {
                      // Calculate grand total by summing all calculated regional totals
                      const regionWithResults = effectiveRegionsData?.find((r: any) => Object.keys(r.results || {}).length > 0);
                      const dynamicMapping = createDynamicMapping(regionWithResults, effectiveNationalResults);
                      
                      const getRegionalVotes = (region: any, partyResult: PartyResult) => {
                        let backendId = partyCodeToBackendId[partyResult.code] || dynamicMapping[partyResult.code];
                        let regionVotes = backendId ? (region.results?.[backendId] || 0) : 0;
                        
                        if (regionVotes === 0 && region.results) {
                          const matchingEntry = Object.entries(region.results).find(([, votes]) => {
                            const votesAsNumber = typeof votes === 'string' ? parseInt(votes) : votes;
                            const resultVotesAsNumber = typeof partyResult.votes === 'string' ? parseInt(partyResult.votes) : partyResult.votes;
                            return votesAsNumber === resultVotesAsNumber;
                          });
                          if (matchingEntry) {
                            regionVotes = typeof matchingEntry[1] === 'string' ? parseInt(matchingEntry[1]) : matchingEntry[1];
                          }
                        }
                        
                        return regionVotes;
                      };
                      
                      const grandTotal = effectiveRegionsData?.reduce((sum: number, region: any) => {
                        const calculatedRegionTotal = sortedNationalResults?.reduce((regionSum: number, party: PartyResult) => {
                          return regionSum + getRegionalVotes(region, party);
                        }, 0) || 0;
                        return sum + calculatedRegionTotal;
                      }, 0) || 0;
                      
                      return grandTotal.toLocaleString();
                    })()}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {sortedNationalResults?.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <i className="fas fa-chart-bar text-4xl mb-4 text-gray-400"></i>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucun résultat disponible</h3>
            <p>Les résultats par région seront affichés ici une fois disponibles.</p>
          </div>
        )}
      </div>
      
      {/* Charts Section */}
      <ChartsSection 
        nationalStats={nationalStats}
        effectiveNationalResults={effectiveNationalResults}
      />
    </div>
  );
};

// Charts Section Component
const ChartsSection = ({ nationalStats, effectiveNationalResults }: { 
  nationalStats: any, 
  effectiveNationalResults: any 
}) => {
  return (
    <div className="mt-8">
      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Pie Chart - Election Results */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h3 className="text-xl font-semibold text-gray-900">
              Resultats des élections (Diagramme circulaire)
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Distribution des votes et abstentions
            </p>
          </div>
          <div className="p-6">
            <ElectionResultsPieChart 
              nationalStats={nationalStats}
              nationalResults={effectiveNationalResults}
            />
          </div>
        </div>

        {/* Vertical Bar Chart - Candidate Results */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h3 className="text-xl font-semibold text-gray-900">
            Resultats des élections (Diagramme en baton)
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Résultats par parti politique
            </p>
          </div>
          <div className="p-6">
            <CandidateResultsBarChart 
              nationalResults={effectiveNationalResults}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Bureau Row Component for individual bureau results
const BureauRow = ({ bureau }: { bureau: any }) => {
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [bureauResults, setBureauResults] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);

  const fetchBureauResults = async () => {
    if (bureau.data_filled !== 1) return;
    
    setIsLoadingResults(true);
    try {
      const results = await getResultsByBureau(bureau.code);
      setBureauResults(results);
    } catch (error) {
      console.error(`Error fetching results for bureau ${bureau.code}:`, error);
      setBureauResults(null);
    } finally {
      setIsLoadingResults(false);
    }
  };

  const toggleResults = () => {
    if (!showResults && !bureauResults && bureau.data_filled === 1) {
      fetchBureauResults();
    }
    setShowResults(!showResults);
  };

  // Calculate totals if results are available
  const totalInscrit = bureauResults?.reduce((sum: number, result: any) => 
    sum + (result.nombre_inscrit || 0), 0) || 0;
  const totalVotant = bureauResults?.reduce((sum: number, result: any) => 
    sum + (result.nombre_votant || 0), 0) || 0;
  const totalBulletinNul = bureauResults?.reduce((sum: number, result: any) => 
    sum + (result.bulletin_nul || 0), 0) || 0;
  const participationRate = totalInscrit > 0 ? ((totalVotant / totalInscrit) * 100).toFixed(1) : '0.0';

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
          {bureau.designation}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
          {bureau.code}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            bureau.data_filled === 1 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {bureau.data_filled === 1 ? 'Disponible' : 'Manquant'}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
          {bureau.data_filled === 1 && bureauResults ? totalInscrit.toLocaleString() : '-'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
          {bureau.data_filled === 1 && bureauResults ? totalVotant.toLocaleString() : '-'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
          {bureau.data_filled === 1 && bureauResults ? totalBulletinNul.toLocaleString() : '-'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
          {bureau.data_filled === 1 && bureauResults ? `${participationRate}%` : '-'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
          {bureau.data_filled === 1 ? (
            <button
              onClick={toggleResults}
              disabled={isLoadingResults}
              className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center justify-center gap-1"
            >
              {isLoadingResults ? (
                'Chargement...'
              ) : (
                <>
                  {showResults ? 'Masquer' : 'Voir'}
                  <i className={`fas ${showResults ? 'fa-chevron-up' : 'fa-chevron-down'} text-xs`}></i>
                </>
              )}
            </button>
          ) : (
            <span className="text-gray-400 text-xs">Non disponible</span>
          )}
        </td>
      </tr>
      {showResults && bureauResults && bureauResults.length > 0 && (
        <tr>
          <td colSpan={8} className="px-6 py-4 bg-gray-50">
            <div className="max-w-full">
              <h4 className="font-medium text-gray-900 mb-3">Résultats détaillés par parti</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bureauResults.map((result: any, index: number) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-sm text-gray-900">
                        {result.parti?.abbreviation || result.parti?.designation || `Parti ${result.code_parti}`}
                      </h5>
                      <span className="text-xs text-gray-500">#{result.code_parti}</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Votes:</span>
                        <span className="font-medium">{(result.nombre_vote || 0).toLocaleString()}</span>
                      </div>
                      {result.nombre_inscrit > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">% des inscrits:</span>
                          <span className="font-medium">
                            {((result.nombre_vote || 0) / result.nombre_inscrit * 100).toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// Dynamic Synthesis Component
const SynthesisPage = () => {
  const [selectedRegion, setSelectedRegion] = useState<number | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
  const [selectedArrondissement, setSelectedArrondissement] = useState<number | null>(null);
  const [viewLevel, setViewLevel] = useState<'region' | 'department' | 'arrondissement' | 'bureau'>('region');
  const [spinnerLoader, setSpinnerLoader] = useState(false);

  // Pagination state for bureau vote synthesis
  const [bureauPage, setBureauPage] = useState<number>(1);
  const [bureauLimit] = useState<number>(100); // Fixed limit for now
  const [bureauPagination, setBureauPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);

  // const queryClient = useQueryClient();

  const handleDownloadReport = async (selectedID: number, reportType: string) => {
    let format = 'pdf'; // or allow user choice
    setSpinnerLoader(true);
    try {
      await handleConfirmGenerate(format, selectedID, reportType); // fetch report
      // You can show success UI or trigger file download here...
      setSpinnerLoader(false);
    } catch (error) {
      setSpinnerLoader(false);
      console.error('Failed to fetch report:', error); 
    }
  };

  // Helper function to get party abbreviation from API data
  const getPartyAbbreviation = (partyCode: string | number, partyData?: any): string => {
    // First try to get abbreviation from API data
    if (partyData?.abbreviation) {
      return partyData.abbreviation;
    }
    
    // Fallback to hardcoded mapping if API data not available
    const codeStr = String(partyCode);
    const fallbackMapping: Record<string, string> = {
      '1': 'RDPC',
      '2': 'PAL', 
      '3': 'UNDP',
      '4': 'MCNC',
      '5': 'FSNC',
      '6': 'FDC',
      '7': 'UMS',
      '8': 'PCRN',
      '9': 'PURS',
      '10': 'UNIVERS',
      '11': 'SDF',
      '12': 'UDC'
    };
    
    return fallbackMapping[codeStr] || String(partyCode);
  };

  // Get territorial access for current user
  const { 
    isLoading: isTerritorialLoading, 
    territorialAccess,
    isRegionalUser, 
    isDepartmentUser, 
    isArrondissementUser, 
    isBureauUser,
    canAccessRegion,
    canAccessDepartment,
    canAccessArrondissement
  } = useTerritorialAccess({
    selectedRegion,
    selectedDepartment,
    selectedArrondissement,
  });

  // Initialize selections based on user level
  useEffect(() => {
    if (!territorialAccess || isTerritorialLoading) return;

    // Set appropriate view level based on user's territorial access
    if (isRegionalUser) {
      // Regional users start at region level to see departments
      setViewLevel('region');
    } else if (isDepartmentUser) {
      // Department users start at department level to see arrondissements
      setViewLevel('department');
    } else if (isArrondissementUser) {
      // Arrondissement users start at arrondissement level to see bureaux
      setViewLevel('arrondissement');
    } else if (isBureauUser) {
      // Bureau users can only see bureau level
      setViewLevel('bureau');
    }
  }, [territorialAccess, isTerritorialLoading, isRegionalUser, isDepartmentUser, isArrondissementUser, isBureauUser]);

  // Fetch territorial data for dropdowns - only user-assigned regions
  const { data: regionsData, isLoading: isLoadingRegions } = useQuery({
    queryKey: ['user-assigned-regions'],
    queryFn: getUserAssignedRegions,
  });

  // Debug: Log regions data
  console.log('🔍 [SYNTHESIS DEBUG] Regions data:', {
    regionsData,
    regionsCount: regionsData?.length,
    isLoadingRegions,
    regionsList: regionsData?.map((r: any) => ({ code: r.code, libelle: r.libelle }))
  });




  const { data: departmentsData, isLoading: isLoadingDepartments } = useQuery({
    queryKey: ['territorial-departments', selectedRegion],
    queryFn: () => getDepartementsByRegion(selectedRegion!),
    enabled: !!selectedRegion,
  });

  const { data: arrondissementsData, isLoading: isLoadingArrondissements } = useQuery({
    queryKey: ['territorial-arrondissements', selectedDepartment],
    queryFn: () => getArrondissementsByDepartement(selectedDepartment!),
    enabled: !!selectedDepartment,
  });

  const { data: bureauxData, isLoading: isLoadingBureaux } = useQuery({
    queryKey: ['territorial-bureaux', selectedArrondissement],
    queryFn: () => getBureauxVoteByArrondissement(selectedArrondissement!.toString()),
    enabled: !!selectedArrondissement,
  });

  // Fetch synthesis data based on current selection with JWT-based territorial filtering
  const { data: synthesisData, isLoading: isLoadingSynthesis, isError: isErrorSynthesis, error: synthesisError } = useQuery({
    queryKey: ['synthesis', viewLevel, selectedRegion, selectedDepartment, selectedArrondissement, bureauPage, bureauLimit],
    queryFn: async () => {
      if (selectedArrondissement && viewLevel === 'bureau') {
        // Use new bureau vote synthesis API with pagination
        const response = await getAllBureauVoteSynthesis(undefined, bureauPage, bureauLimit, true);
        setBureauPagination(response.pagination);
        return response.data;
      } else if (selectedArrondissement) {
        // When an arrondissement is selected, we should show bureaux de vote within that arrondissement
        // So we fetch bureau vote synthesis data and filter by arrondissement in the UI
        const response = await getAllBureauVoteSynthesis(undefined, bureauPage, bureauLimit, true);
        setBureauPagination(response.pagination);
        return response.data;
      } else if (selectedDepartment && viewLevel === 'arrondissement') {
        // When showing arrondissement-level for a department, get all arrondissement synthesis data
        return getAllArrondissementSynthesis();
      } else if (selectedDepartment) {
        // When a department is selected, we should show arrondissements within that department
        // So we fetch arrondissement synthesis data and filter by department in the UI
        return getAllArrondissementSynthesis();
      } else if (selectedRegion && viewLevel === 'department') {
        // When showing department-level for a region, get all department synthesis data
        return getAllDepartementSynthesis();
      } else if (selectedRegion) {
        // When a region is selected, we should show departments within that region
        // So we fetch department synthesis data and filter by region in the UI
        return getAllDepartementSynthesis();
      }
      // Default: Get regional data using JWT-based territorial filtering
      // Server automatically extracts user ID from JWT token and filters to user's assigned regions
      return getAllRegionalSynthesis();
    },
    retry: (failureCount, error: any) => {
      // Don't retry on JWT expiration (401) - user will be redirected to login
      if (error?.message?.includes('Session expirée') || error?.message?.includes('401')) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
  });

  // Handle JWT expiration errors
  useEffect(() => {
    if (isErrorSynthesis && synthesisError) {
      const error = synthesisError as Error;
      if (error.message.includes('Session expirée') || error.message.includes('401')) {
        console.log('JWT token expired, user will be redirected to login');
        // The apiFetch function already handles the redirect, just log for debugging
      }
    }
  }, [isErrorSynthesis, synthesisError]);

  // Fetch progress data - regions overview, departments within region, or arrondissements within department
  const { data: progressData, isLoading: isLoadingProgress } = useQuery({
    queryKey: ['progress', selectedRegion, selectedDepartment],
    queryFn: () => {
      if (selectedRegion && selectedDepartment) {
        // Show arrondissements within the selected department
        return getDepartmentProgress(selectedRegion, selectedDepartment);
      } else if (selectedRegion) {
        // Show departments within the selected region
        return getRegionProgress(selectedRegion);
      } else {
        // Show all regions assigned to user
        return getProgressOverview();
      }
    },
  });

  // Debug logging for API responses
  console.log('🔍 [SYNTHESIS DEBUG] API Data:', {
    synthesisData: synthesisData?.slice(0, 3), // First 3 items
    synthesisDataLength: synthesisData?.length,
    synthesisDataStructure: synthesisData?.length > 0 ? Object.keys(synthesisData[0]) : 'No data',
    departmentsData: departmentsData?.slice(0, 3), // First 3 items
    departmentsDataLength: departmentsData?.length,
    departmentsDataStructure: departmentsData?.length > 0 ? Object.keys(departmentsData[0]) : 'No data',
    arrondissementsData: arrondissementsData?.slice(0, 3), // First 3 items  
    arrondissementsDataLength: arrondissementsData?.length,
    selectedRegion,
    selectedDepartment,
    selectedArrondissement
  });

  // Extract unique parties for table headers
  const allParties = useMemo(() => {
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
  }, [synthesisData]);

  // Group data for table display based on current level
  const tableData = useMemo(() => {
    if (!synthesisData) return [];
    
    if (selectedArrondissement) {
      // Check if we have actual bureau synthesis data or just arrondissement data
      console.log('🔍 [SYNTHESIS DEBUG] Processing bureau data for arrondissement:', selectedArrondissement);
      console.log('🔍 [SYNTHESIS DEBUG] Synthesis data sample:', synthesisData?.slice(0, 1));
      
      const hasBureauSynthesis = synthesisData?.some((item: any) => item.code_bureau_vote);
      console.log('🔍 [BUREAU DEBUG] Has bureau-level synthesis data:', hasBureauSynthesis);
      
      if (!hasBureauSynthesis) {
        // We have arrondissement-level data, but need to show bureau-level results
        // If bureauxData is available, show bureaux with a message that synthesis is at arrondissement level
        if (bureauxData && bureauxData.length > 0) {
          console.log('🔍 [BUREAU DEBUG] Using bureau list data, synthesis not available at bureau level');
          
          // Get aggregated arrondissement data for this arrondissement
          const arrondissementSynthesis = synthesisData.filter((item: any) => 
            item.code_arrondissement === selectedArrondissement
          );
          
          let arrondissementTotals = { inscrit: 0, votant: 0, bulletin_nul: 0, parties: {} as any };
          if (arrondissementSynthesis.length > 0) {
            arrondissementTotals.inscrit = arrondissementSynthesis[0].nombre_inscrit || 0;
            arrondissementTotals.votant = arrondissementSynthesis[0].nombre_votant || 0;
            arrondissementTotals.bulletin_nul = arrondissementSynthesis[0].bulletin_nul || 0;
            
            arrondissementSynthesis.forEach((item: any) => {
              if (item.code_parti && item.nombre_vote) {
                arrondissementTotals.parties[item.code_parti] = (arrondissementTotals.parties[item.code_parti] || 0) + item.nombre_vote;
              }
            });
          }
          
          // Create bureau rows with arrondissement-level data distributed
          return bureauxData.map((bureau: any) => ({
            id: bureau.code,
            name: bureau.designation || `Bureau ${bureau.code}`,
            inscrit: Math.round(arrondissementTotals.inscrit / bureauxData.length), // Distribute evenly
            votant: Math.round(arrondissementTotals.votant / bureauxData.length),
            bulletin_nul: Math.round(arrondissementTotals.bulletin_nul / bureauxData.length),
            parties: Object.keys(arrondissementTotals.parties).reduce((acc: any, partyCode) => {
              acc[partyCode] = Math.round(arrondissementTotals.parties[partyCode] / bureauxData.length);
              return acc;
            }, {}),
            isEstimated: true // Flag to show this is estimated data
          }));
        }
        
        // No bureau data available, return empty
        return [];
      }
      
      // Process actual bureau synthesis data (if available)
      const filteredData = synthesisData.filter((item: any) => {
        return item.bureau_vote?.code_arrondissement === selectedArrondissement;
      });
      
      console.log('🔍 [BUREAU DEBUG] Filtered bureau synthesis data length:', filteredData.length);
      
      // Group by bureau de vote
      const bureauxMap = new Map();
      
      filteredData.forEach((item: any) => {
        const bureauCode = item.code_bureau_vote; // Bureau identifier
        const bureau = item.bureau_vote; // Bureau details
        
        if (!bureauxMap.has(bureauCode)) {
          // Initialize bureau entry with participation data and proper name
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
        
        // Add party votes - use party code as key
        if (item.code_parti && item.parti) {
          bureauEntry.parties[item.code_parti] = item.nombre_vote || 0;
        }
      });
      
      const result = Array.from(bureauxMap.values());
      console.log('🔍 [BUREAU DEBUG] Final bureau synthesis result:', {
        totalBureaux: result.length,
        sampleBureau: result[0],
        allParties: result.length > 0 ? Object.keys(result[0].parties) : []
      });
      
      return result;
    } else if (selectedDepartment) {
      // When a department is selected, show arrondissements
      console.log('🔍 [SYNTHESIS DEBUG] Creating arrondissement rows for department:', selectedDepartment);
      console.log('🔍 [SYNTHESIS DEBUG] Available arrondissementsData:', arrondissementsData?.length || 0);
      console.log('🔍 [SYNTHESIS DEBUG] Available synthesisData:', synthesisData?.length || 0);
      
      // If we don't have arrondissements data yet, but we have synthesis data,
      // derive arrondissements from synthesis data
      if (!arrondissementsData && synthesisData) {
        const arrMap = new Map();
        synthesisData.forEach((item: any) => {
          const arrCode = item.code_arrondissement || item.arrondissement_code;
          const arrName = item.arrondissement?.libelle || `Arrondissement ${arrCode}`;
          if (arrCode && !arrMap.has(arrCode)) {
            arrMap.set(arrCode, {
              code: arrCode,
              libelle: arrName,
              code_departement: item.code_departement
            });
          }
        });
        
        // Filter by selected department and create results
        const arrs = Array.from(arrMap.values()).filter((arr: any) => arr.code_departement === selectedDepartment);
        console.log('🔍 [SYNTHESIS DEBUG] Derived arrondissements for department', selectedDepartment, ':', arrs.length);
        
        return arrs.map((arr: any) => {
          const parties: { [key: string]: number } = {};
          let totalInscrit = 0, totalVotant = 0, totalBulletinNul = 0;
          
          // Find all synthesis records for this arrondissement
          const arrRecords = synthesisData.filter((item: any) => {
            return (item.code_arrondissement || item.arrondissement_code) === arr.code;
          });
          
          if (arrRecords.length > 0) {
            // Use first record for participation data (assuming they're the same across parties)
            totalInscrit = arrRecords[0].nombre_inscrit || 0;
            totalVotant = arrRecords[0].nombre_votant || 0;
            totalBulletinNul = arrRecords[0].bulletin_nul || 0;
            
            // Aggregate party votes
            arrRecords.forEach((record: any) => {
              if (record.code_parti && record.nombre_vote) {
                parties[record.code_parti] = (parties[record.code_parti] || 0) + record.nombre_vote;
              }
            });
          }
          
          console.log('🔍 [SYNTHESIS DEBUG] Arrondissement result:', {
            arr: arr.code,
            inscrit: totalInscrit,
            votant: totalVotant,
            parties: Object.keys(parties).length
          });
          
          return {
            id: arr.code,
            name: arr.libelle,
            inscrit: totalInscrit,
            votant: totalVotant,
            bulletin_nul: totalBulletinNul,
            parties
          };
        }).filter((result: any) => result.inscrit > 0 || result.votant > 0 || Object.keys(result.parties).length > 0);
      }
      
      // If we have arrondissements data, use the original logic
      if (arrondissementsData) {
        return arrondissementsData.map((arr: any) => {
        console.log('🔍 [SYNTHESIS DEBUG] Processing arrondissement:', {
          code: arr.code,
          name: arr.libelle,
          departmentCode: arr.code_departement
        });
    
        // Find synthesis data for this arrondissement
        const arrSynthesis = synthesisData?.filter((item: any) => {
          const arrMatch = item.code_arrondissement === arr.code || 
                           item.arrondissement_code === arr.code ||
                           item.code === arr.code;
          /*console.log('🔍 [SYNTHESIS DEBUG] Checking synthesis item:', {
            itemCodeArr: item.code_arrondissement,
            itemArrCode: item.arrondissement_code,
            itemCode: item.code,
            arrCode: arr.code,
            matches: arrMatch
          });*/
          return arrMatch;
        }) || [];
    
        let totalInscrit = 0;
        let totalVotant = 0;
        let totalBulletinNul = 0;
        const parties: { [key: string]: number } = {};
    
        if (arrSynthesis.length > 0) {
          // Vérifier que la première ligne correspond bien à l'arrondissement
          let firstRecord = arrSynthesis[0];
          const firstRecordArrCode = firstRecord.code_arrondissement || firstRecord.arrondissement_code || firstRecord.code;
    
          if (firstRecordArrCode !== arr.code) {
            //console.warn(`⚠️ [SYNTHESIS DEBUG] First row arrondissement code mismatch: expected ${arr.code}, got ${firstRecordArrCode}`);
            // Chercher la première ligne correcte si possible
            const validRecord = arrSynthesis.find((item: any) => {
              const itemArrCode = item.code_arrondissement || item.arrondissement_code || item.code;
              return itemArrCode === arr.code;
            });
            if (validRecord) {
              firstRecord = validRecord;
            } else {
              console.warn(`⚠️ [SYNTHESIS DEBUG] No valid record found for arrondissement ${arr.code}`);
            }
          }
    
          // Utiliser la première ligne valide pour les données de participation
          totalInscrit = firstRecord.nombre_inscrit ?? 0; 
          totalVotant = firstRecord.nombre_votant ?? 0; 
          totalBulletinNul = firstRecord.bulletin_nul ?? 0; 
    
          // Somme des votes par parti
          arrSynthesis.forEach((item: any) => {
            if (item.resultats && Array.isArray(item.resultats)) {
              item.resultats.forEach((result: any) => {
                const partyCode = result.code_parti || result.parti_code || result.code;
                const votes = result.nombre_vote || result.votes || result.total_votes || 0;
                if (partyCode) {
                  parties[partyCode] = (parties[partyCode] || 0) + votes;
                }
              });
            } else if (item.code_parti || item.parti_code) {
              const partyCode = item.code_parti || item.parti_code;
              const votes = item.nombre_vote || item.votes || item.total_votes || 0;
              parties[partyCode] = (parties[partyCode] || 0) + votes;
            }
          });
        }
    
        // Only include arrondissements that have actual synthesis data
        if (arrSynthesis.length === 0 || (totalInscrit === 0 && totalVotant === 0 && Object.keys(parties).length === 0)) {
          console.log('🔍 [SYNTHESIS DEBUG] Arrondissement has no valid synthesis data, skipping:', arr.code);
          return null;
        }
    
        console.log('🔍 [SYNTHESIS DEBUG] Arrondissement synthesis result:', {
          arrCode: arr.code,
          totalInscrit,
          totalVotant,
          partiesCount: Object.keys(parties).length
        });
    
        return {
          id: arr.code,
          name: arr.libelle || `Arrondissement ${arr.code}`,
          inscrit: totalInscrit,
          votant: totalVotant,
          bulletin_nul: totalBulletinNul,
          parties
        };
        }).filter(Boolean); // Remove null entries
      }
      
      // Fallback: no data available yet
      return [];
    }
     else if (selectedRegion) {
      // When a region is selected, show departments
      console.log('🔍 [SYNTHESIS DEBUG] Creating department rows for region:', selectedRegion);
      console.log('🔍 [SYNTHESIS DEBUG] Available departmentsData:', departmentsData?.length || 0);
      console.log('🔍 [SYNTHESIS DEBUG] Available synthesisData:', synthesisData?.length || 0);
      
      // If we don't have departments data yet, but we have synthesis data,
      // derive departments from synthesis data
      if (!departmentsData && synthesisData) {
        const deptMap = new Map();
        synthesisData.forEach((item: any) => {
          const deptCode = item.code_departement || item.departement_code;
          const deptName = item.departement?.libelle || `Département ${deptCode}`;
          if (deptCode && !deptMap.has(deptCode)) {
            deptMap.set(deptCode, {
              code: deptCode,
              libelle: deptName,
              code_region: item.code_region
            });
          }
        });
        
        // Filter by selected region and create results
        const depts = Array.from(deptMap.values()).filter((dept: any) => dept.code_region === selectedRegion);
        console.log('🔍 [SYNTHESIS DEBUG] Derived departments for region', selectedRegion, ':', depts.length);
        
        return depts.map((dept: any) => {
          const parties: { [key: string]: number } = {};
          let totalInscrit = 0, totalVotant = 0, totalBulletinNul = 0;
          
          // Find all synthesis records for this department
          const deptRecords = synthesisData.filter((item: any) => {
            return (item.code_departement || item.departement_code) === dept.code;
          });
          
          if (deptRecords.length > 0) {
            // Use first record for participation data (assuming they're the same across parties)
            totalInscrit = deptRecords[0].nombre_inscrit || 0;
            totalVotant = deptRecords[0].nombre_votant || 0;
            totalBulletinNul = deptRecords[0].bulletin_nul || 0;
            
            // Aggregate party votes
            deptRecords.forEach((record: any) => {
              if (record.code_parti && record.nombre_vote) {
                parties[record.code_parti] = (parties[record.code_parti] || 0) + record.nombre_vote;
              }
            });
          }
          
          console.log('🔍 [SYNTHESIS DEBUG] Department result:', {
            dept: dept.code,
            inscrit: totalInscrit,
            votant: totalVotant,
            parties: Object.keys(parties).length
          });
          
          return {
            id: dept.code,
            name: dept.libelle,
            inscrit: totalInscrit,
            votant: totalVotant,
            bulletin_nul: totalBulletinNul,
            parties
          };
        }).filter((result: any) => result.inscrit > 0 || result.votant > 0 || Object.keys(result.parties).length > 0);
      }
      
      // If we have departmentsData, use the original logic
      if (departmentsData) {
        return departmentsData.map((dept: any) => {
          // Find synthesis data for this department
          const deptSynthesis = synthesisData?.filter((item: any) => {
            return (item.code_departement || item.departement_code) === dept.code;
          }) || [];
          
          let totalInscrit = 0, totalVotant = 0, totalBulletinNul = 0;
          const parties: { [key: string]: number } = {};
          
          if (deptSynthesis.length > 0) {
            totalInscrit = deptSynthesis[0].nombre_inscrit || 0;
            totalVotant = deptSynthesis[0].nombre_votant || 0;
            totalBulletinNul = deptSynthesis[0].bulletin_nul || 0;
            
            deptSynthesis.forEach((item: any) => {
              if (item.code_parti && item.nombre_vote) {
                parties[item.code_parti] = (parties[item.code_parti] || 0) + item.nombre_vote;
              }
            });
          }
          
          return {
            id: dept.code,
            name: dept.libelle || `Département ${dept.code}`,
            inscrit: totalInscrit,
            votant: totalVotant,
            bulletin_nul: totalBulletinNul,
            parties
          };
        }).filter((result: any) => result.inscrit > 0 || result.votant > 0 || Object.keys(result.parties).length > 0);
      }
      
      // Fallback: no data available yet
      return [];
    }
     else {
      // Show regions level (default)
      const regionsMap = new Map();
      
      synthesisData.forEach((item: any) => {
        if (!regionsMap.has(item.code_region)) {
          regionsMap.set(item.code_region, {
            id: item.code_region,
            name: item.region?.libelle || `Région ${item.code_region}`,
            inscrit: item.nombre_inscrit || 0,
            votant: item.nombre_votant || 0,
            bulletin_nul: item.bulletin_nul || 0,
            parties: {}
          });
        }
        
        const region = regionsMap.get(item.code_region);
        region.parties[item.code_parti] = item.nombre_vote || 0;
      });
      
      return Array.from(regionsMap.values());
    }
  }, [synthesisData, selectedRegion, selectedDepartment, selectedArrondissement, departmentsData, arrondissementsData, bureauxData]);

  // Handle dropdown changes with validation
  const handleRegionChange = (regionCode: number | null) => {
    // Validate access for regional users
    if (regionCode && isRegionalUser && !canAccessRegion(regionCode)) {
      console.warn(`User does not have access to region ${regionCode}`);
      return;
    }
    
    setSelectedRegion(regionCode);
    setSelectedDepartment(null);
    setSelectedArrondissement(null);
    setViewLevel(regionCode ? 'department' : 'region');
  };

  const handleDepartmentChange = (departmentCode: number | null) => {
    // Validate access for department users
    if (departmentCode && isDepartmentUser && !canAccessDepartment(departmentCode)) {
      console.warn(`User does not have access to department ${departmentCode}`);
      return;
    }
    
    setSelectedDepartment(departmentCode);
    setSelectedArrondissement(null);
    setViewLevel(departmentCode ? 'arrondissement' : 'department');
  };

  const handleArrondissementChange = (arrondissementCode: number | null) => {
    // Validate access for arrondissement users
    if (arrondissementCode && isArrondissementUser && !canAccessArrondissement(arrondissementCode)) {
      console.warn(`User does not have access to arrondissement ${arrondissementCode}`);
      return;
    }
    
    setSelectedArrondissement(arrondissementCode);
    setViewLevel(arrondissementCode ? 'bureau' : 'arrondissement');
  };

  // Get current level name for display
  const getCurrentLevelName = () => {
    if (selectedArrondissement) return 'Bureau de Vote';
    if (selectedDepartment) return 'Arrondissement';
    if (selectedRegion) return 'Département';
    return 'Région';
  };

  const isLoading = isLoadingRegions || isLoadingDepartments || isLoadingArrondissements || isLoadingBureaux || isLoadingSynthesis || isTerritorialLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mr-4"></div>
          <span className="text-xl text-gray-600 font-semibold">
            {isTerritorialLoading ? 'Vérification de vos accès territoriaux...' : 'Chargement de la synthèse...'}
          </span>
        </div>
      </div>
    );
  }

  if (isErrorSynthesis) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <i className="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Erreur de chargement</h3>
          <p className="text-gray-600">Impossible de charger les données de synthèse</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Row: Two 1/3 sections with empty middle */}
      <div className="grid grid-cols-4 gap-4">
        {/* Left Section: Cascading Dropdowns */}
        <div className="col-span-1 bg-blue-50 rounded-xl shadow-lg p-6">
        <div className="mb-6">

          {/* <div className="mt-4">
            <button
              onClick={() => aggregationMutation.mutate()}
              disabled={aggregationMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {aggregationMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Agrégation en cours...
                </>
              ) : (
                <>
                  <i className="fas fa-sync mr-2"></i>
                  Actualiser les données
                </>
              )}
            </button>
          </div> */}
        </div>

        <div className="grid grid-rows-1 md:grid-rows-3 gap-4">
          {/* Region Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 ">Région</label>
            <select
              value={selectedRegion || ''}
              onChange={(e) => handleRegionChange(e.target.value ? Number(e.target.value) : null)}
              disabled={isTerritorialLoading || isLoadingRegions}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${(isTerritorialLoading || isLoadingRegions) ? 'disabled:bg-gray-100 cursor-not-allowed' : ''}`}
              title={isTerritorialLoading || isLoadingRegions ? "Chargement des régions..." : ""}
            >
              <option value="">Toutes les régions</option>
              {regionsData?.map((region: any) => (
                <option key={region.code} value={region.code}>
                  {region.libelle}
                </option>
              ))}
            </select>
          </div>

          {/* Department Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Département</label>
            <select
              value={selectedDepartment || ''}
              onChange={(e) => handleDepartmentChange(e.target.value ? Number(e.target.value) : null)}
              disabled={!selectedRegion || (!isRegionalUser && !isDepartmentUser) || isTerritorialLoading}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${(!selectedRegion || (!isRegionalUser && !isDepartmentUser) || isTerritorialLoading) ? 'disabled:bg-gray-100 cursor-not-allowed' : ''}`}
              title={(!isRegionalUser && !isDepartmentUser) ? "Vous n'avez pas accès à la modification des départements" : ""}
            >
              <option value="">Tous les départements</option>
              {departmentsData?.map((dept: any) => (
                <option key={dept.code} value={dept.code}>
                  {dept.libelle}
                </option>
              ))}
            </select>
          </div>

          {/* Arrondissement Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Arrondissement</label>
            <select
              value={selectedArrondissement || ''}
              onChange={(e) => handleArrondissementChange(e.target.value ? Number(e.target.value) : null)}
              disabled={!selectedDepartment || (!isRegionalUser && !isDepartmentUser && !isArrondissementUser) || isTerritorialLoading}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${(!selectedDepartment || (!isRegionalUser && !isDepartmentUser && !isArrondissementUser) || isTerritorialLoading) ? 'disabled:bg-gray-100 cursor-not-allowed' : ''}`}
              title={(!isRegionalUser && !isDepartmentUser && !isArrondissementUser) ? "Vous n'avez pas accès à la modification des arrondissements" : ""}
            >
              <option value="">Tous les arrondissements</option>
              {arrondissementsData?.map((arr: any) => (
                <option key={arr.code} value={arr.code}>
                  {arr.libelle}
                </option>
              ))}
            </select>
          </div>
        </div>
        {!selectedRegion && !selectedDepartment && !selectedArrondissement && (
          <div className="my-4">
            <button onClick={() => handleDownloadReport( 0, 'national')} className="btn-primary bg-blue-700 text-white px-6 py-2 rounded hover:bg-blue-800">
              Télécharger Rapport Nationale {spinnerLoader && <i className="fas fa-spinner fa-spin mr-2"></i>}
            </button>
          </div>
        )}

        {selectedRegion && !selectedDepartment && !selectedArrondissement && (
          <div className="my-4">
            <button onClick={() => handleDownloadReport(selectedRegion, 'regional')} className="btn-primary bg-blue-700 text-white px-6 py-2 rounded hover:bg-blue-800">
              Télécharger Rapport Régional {spinnerLoader && <i className="fas fa-spinner fa-spin mr-2"></i>}
            </button>
          </div>
        )}

        {selectedRegion && selectedDepartment && !selectedArrondissement && (
          <div className="my-4">
            <button onClick={() => handleDownloadReport(selectedDepartment, 'departement')} className="btn-primary bg-blue-700 text-white px-6 py-2 rounded hover:bg-blue-800">
              Télécharger Rapport Départemental {spinnerLoader && <i className="fas fa-spinner fa-spin mr-2"></i>}
            </button>
          </div>
        )}

        {selectedRegion && selectedDepartment && selectedArrondissement && (
          <div className="my-4">
            <button onClick={() => handleDownloadReport(selectedArrondissement, 'arrondissement')} className="btn-primary bg-blue-700 text-white px-6 py-2 rounded hover:bg-blue-800">
              Télécharger Rapport d'Arrondissement {spinnerLoader && <i className="fas fa-spinner fa-spin mr-2"></i>}
            </button>
          </div>
        )}
        </div>

        

        {/* Right Section: Progress Charts */}
        <div className="col-span-3 bg-white rounded-xl shadow-lg p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Progression des Soumissions</h2>
          <p className="text-gray-600">
            {selectedRegion && selectedDepartment
              ? `Suivi par arrondissement dans ${departmentsData?.find((d: any) => d.code === selectedDepartment)?.libelle || 'le département sélectionné'}`
              : selectedRegion 
              ? `Suivi par département dans ${regionsData?.find((r: any) => r.code === selectedRegion)?.libelle || 'la région sélectionnée'}`
              : 'Suivi en temps réel par région'
            }
          </p>
        </div>
        
        {/* Horizontal Progress Charts */}
        <div>
  {isLoadingProgress ? (
    <div className="flex items-center justify-center h-24">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
      <span className="text-gray-600">Chargement des données de progression...</span>
    </div>
  ) : (() => {
    let dataItems = [];

    if (selectedRegion && selectedDepartment && progressData?.arrondissements) {
      dataItems = progressData.arrondissements;
    } else if (selectedRegion && progressData?.departments) {
      dataItems = progressData.departments;
    } else if (progressData?.user_regions) {
      dataItems = progressData.user_regions;
    }

    if (dataItems.length > 0) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {dataItems.map((item: any) => {
            const percentage = item.statistics.percentage_filled;
            const getProgressColor = (pct: number) => {
              if (pct >= 80) return 'bg-emerald-600';
              if (pct >= 65) return 'bg-green-600';
              if (pct >= 50) return 'bg-blue-600';
              if (pct >= 35) return 'bg-yellow-600';
              return 'bg-orange-600';
            };

            return (
              <div
                key={item.code}
                className="space-y-1 p-3 bg-white rounded-lg shadow-sm"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{item.libelle}</span>
                  <span className="text-sm text-gray-500">
                    {item.statistics.filled_bureaux}/{item.statistics.total_bureaux} ({percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`${getProgressColor(percentage)} h-2.5 rounded-full transition-all duration-300`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      );
    } else {
      return (
        <div className="text-center text-gray-500 py-6">
          <i className="fas fa-chart-bar text-xl mb-1 block"></i>
          <p>Aucune donnée de progression disponible</p>
        </div>
      );
    }
  })()}
</div>


        {/* Summary Stats */}
        {(() => {
          // Handle summary stats for different contexts
          let summaryStats = null;
          let summaryTitle = '';
          let progressLabel = '';
          
          if (selectedRegion && selectedDepartment && progressData?.department_statistics) {
            // Department level summary
            summaryStats = progressData.department_statistics;
            summaryTitle = `Résumé ${progressData.department?.libelle || 'Départemental'}`;
            progressLabel = 'Départementale';
          } else if (selectedRegion && progressData?.region_statistics) {
            // Region level summary
            summaryStats = progressData.region_statistics;
            summaryTitle = `Résumé ${progressData.region?.libelle || 'Régional'}`;
            progressLabel = 'Régionale';
          } else if (progressData?.total_statistics) {
            // Global summary
            summaryStats = progressData.total_statistics;
            summaryTitle = 'Résumé Global';
            progressLabel = 'Globale';
          }
          
          if (summaryStats) {
            return (
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Progression {progressLabel}</span>
                    <span className="text-sm text-gray-500">{summaryStats.percentage_filled}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div className="bg-gradient-to-r from-blue-600 to-green-600 h-4 rounded-full transition-all duration-300" 
                         style={{width: `${summaryStats.percentage_filled}%`}}></div>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()}
        </div>
      </div>

      {/* Bottom Section: Results Table (Full Width) */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Résultats par {getCurrentLevelName()} ({tableData.length} {getCurrentLevelName().toLowerCase()}s)
          </h2>
        </div>

        {tableData.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            {viewLevel === 'bureau' && bureauxData && bureauxData.length > 0 ? (
              <div>
                <div className="text-center mb-6">
                  <i className="fas fa-building text-4xl mb-4 text-blue-400"></i>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Bureaux de vote dans cet arrondissement
                  </h3>
                  <p className="text-gray-600">
                    {bureauxData.length} bureaux de vote trouvés
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider sticky left-0 bg-gray-50">
                          Bureau de vote
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-black uppercase tracking-wider">
                          Code
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-black uppercase tracking-wider">
                          Statut données
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-black uppercase tracking-wider">
                          Inscrits
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-black uppercase tracking-wider">
                          Votants
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-black uppercase tracking-wider">
                          Bulletin nul
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-black uppercase tracking-wider">
                          Participation
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-black uppercase tracking-wider">
                          Résultats
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bureauxData.map((bureau: any) => (
                        <BureauRow key={bureau.code} bureau={bureau} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div>
                <i className="fas fa-chart-bar text-4xl mb-4 text-gray-400"></i>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {viewLevel === 'bureau' ? 'Synthèse par bureau non disponible' : 'Aucune donnée disponible'}
                </h3>
                <p className="text-gray-600">
                  {viewLevel === 'bureau'
                    ? 'Les données de synthèse ne sont disponibles que pour les niveaux région, département et arrondissement'
                    : 'Aucun résultat de synthèse trouvé pour cette sélection'}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider sticky left-0 bg-gray-50">
                    {getCurrentLevelName()}
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-black uppercase tracking-wider">
                    Inscrits
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-black uppercase tracking-wider">
                    Votants
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-black uppercase tracking-wider">
                    Bulletin nul
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-black uppercase tracking-wider">
                    Participation
                  </th>
                  {allParties.map((party) => (
                    <th key={party.code} className="px-6 py-3 text-center text-xs font-bold text-black uppercase tracking-wider">
                      {party.sigles}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-center text-xs font-bold text-black uppercase tracking-wider">
                    Total Votes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tableData.map((row: any, index: number) => {
                  const totalVotes = Object.values(row.parties).reduce((sum: number, votes: any) => sum + votes, 0);
                  const participationRate = row.inscrit > 0 ? ((row.votant / row.inscrit) * 100).toFixed(1) : '0.0';

                  return (
                    <tr key={row.id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                        {row.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                        {row.inscrit.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                        {row.votant.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                        {(row.bulletin_nul || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                        {participationRate}%
                      </td>
                      {allParties.map((party) => {
                        const partyVotes = row.parties[party.code] || 0;
                        const percentage = totalVotes > 0 ? ((partyVotes / totalVotes) * 100).toFixed(1) : '0.0';
                        return (
                          <td key={party.code} className="px-6 py-4 whitespace-nowrap text-sm text-center">
                            <div className="text-gray-900 font-medium">
                              {partyVotes.toLocaleString()}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {percentage}%
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-900">
                        {totalVotes.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls for bureau vote synthesis */}
        {selectedArrondissement && viewLevel === 'bureau' && bureauPagination && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-700">
                Affichage {((bureauPage - 1) * bureauLimit) + 1} à {Math.min(bureauPage * bureauLimit, bureauPagination.total)}
                de {bureauPagination.total} bureaux de vote
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBureauPage(prev => Math.max(1, prev - 1))}
                  disabled={bureauPage === 1}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded border"
                >
                  <i className="fas fa-chevron-left mr-1"></i>
                  Précédent
                </button>
                <span className="text-sm text-gray-700">
                  Page {bureauPage} sur {bureauPagination.totalPages}
                </span>
                <button
                  onClick={() => setBureauPage(prev => Math.min(bureauPagination.totalPages, prev + 1))}
                  disabled={bureauPage === bureauPagination.totalPages}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded border"
                >
                  Suivant
                  <i className="fas fa-chevron-right ml-1"></i>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const RegionsPage = () => (
  <div className="space-y-6">
    <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-8 text-white shadow-xl">
      <h1 className="text-3xl font-bold mb-2">Gestion des Régions</h1>
      <p className="text-green-100">Configuration et gestion des régions administratives</p>
    </div>
    <div className="table-container">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Liste des Régions</h2>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Rechercher une région..."
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="btn-primary">
            <i className="fas fa-plus"></i>
            Nouvelle région
          </button>
        </div>
      </div>
      <div className="p-12 text-center text-gray-500">
        <i className="fas fa-map text-4xl mb-4 text-gray-400"></i>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Gestion des régions</h3>
        <p>Cette fonctionnalité sera bientôt disponible</p>
      </div>
    </div>
  </div>
);

// Synthèse Départementale Component
const SynthesisDepartementalPage = () => {
  const { user } = useAuth();
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
  const [selectedArrondissement, setSelectedArrondissement] = useState<number | null>(null);
  const [viewLevel, setViewLevel] = useState<'department' | 'arrondissement' | 'bureau'>('department');
  const [spinnerLoader, setSpinnerLoader] = useState(false);

  // Pagination state for bureau vote synthesis
  const [bureauPage, setBureauPage] = useState<number>(1);
  const [bureauLimit] = useState<number>(100); // Fixed limit for now
  const [bureauPagination, setBureauPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);

  // Helper function to get party abbreviation from API data
  const getPartyAbbreviation = (partyCode: string | number, partyData?: any): string => {
    // First try to get abbreviation from API data
    if (partyData?.abbreviation) {
      return partyData.abbreviation;
    }
    
    // Fallback to hardcoded mapping if API data not available
    const codeStr = String(partyCode);
    const fallbackMapping: Record<string, string> = {
      '1': 'RDPC',
      '2': 'PAL', 
      '3': 'UNDP',
      '4': 'MCNC',
      '5': 'FSNC',
      '6': 'FDC',
      '7': 'UMS',
      '8': 'PCRN',
      '9': 'PURS',
      '10': 'UNIVERS',
      '11': 'SDF',
      '12': 'UDC'
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
    enabled: !!user,
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
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  // Fetch progress data for all departments when page loads
  const { data: allDepartmentProgressData, isLoading: isLoadingAllProgress } = useQuery({
    queryKey: ['all-department-progress', departments, allRegions],
    queryFn: async () => {
      if (!departments || departments.length === 0 || !allRegions) return [];
      
      // Group departments by region to minimize API calls
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
          // Find region code by name
          const region = allRegions.find((r: any) => r.libelle === regionName);
          if (!region) continue;
          
          // Fetch progress data for this region (includes all departments)
          const regionProgressData = await getRegionProgress(region.code);
          
          // Extract progress for each department in this region
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
    enabled: !!departments && departments.length > 0 && !!allRegions,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch progress data for departments and arrondissements
  const { data: progressData, isLoading: isLoadingProgress } = useQuery({
    queryKey: ['progress-departement', selectedDepartment, allRegions],
    queryFn: () => {
      if (selectedDepartment && allRegions) {
        // Show arrondissements within the selected department
        // We need to find the region for this department first
        const departmentData = departments.find((d: any) => d.department.code === selectedDepartment);
        const regionName = departmentData?.department.region;
        
        // Find region code by matching the region name
        const region = allRegions.find((r: any) => r.libelle === regionName);
        const regionCode = region?.code;
        
        if (regionCode) {
          console.log('🔍 [DEPT PROGRESS] Found region:', { regionName, regionCode, departmentCode: selectedDepartment });
          return getDepartmentProgress(regionCode, selectedDepartment);
        } else {
          console.warn('🔍 [DEPT PROGRESS] Could not find region code for:', regionName);
        }
      }
      // For department level overview, we'll use the departments data we already have
      return null;
    },
    enabled: !!selectedDepartment && departments.length > 0 && !!allRegions,
  });

  // Fetch arrondissements data when department is selected
  const { data: arrondissementsData, isLoading: isLoadingArrondissements } = useQuery({
    queryKey: ['territorial-arrondissements', selectedDepartment],
    queryFn: () => getArrondissementsByDepartement(selectedDepartment!),
    enabled: !!selectedDepartment,
  });

  // Fetch bureaux data when arrondissement is selected
  const { data: bureauxData, isLoading: isLoadingBureaux } = useQuery({
    queryKey: ['territorial-bureaux', selectedArrondissement],
    queryFn: () => getBureauxVoteByArrondissement(selectedArrondissement!.toString()),
    enabled: !!selectedArrondissement,
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
      // For department level, we'll use the user-department-results data instead of synthesis API
      return null; // We'll use departmentResultsData for department level
    },
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('Session expirée') || error?.message?.includes('401')) {
        return false;
      }
      return failureCount < 3;
    },
  });

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
    let format = 'pdf'; // or allow user choice
    setSpinnerLoader(true);
    try {
      await handleConfirmGenerate(format, selectedID, reportType); // fetch report
      // You can show success UI or trigger file download here...
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
      // For department level, extract parties from user-department-results
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
      // For arrondissement level, extract parties from user-department-results
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
      // For bureau level, use synthesis data
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
      // For department level, use user-department-results data
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
      // Show bureaux for selected arrondissement using synthesis data
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
      // Show arrondissements for selected department using user-department-results data
      if (!departmentResultsData?.departments) return [];
      
      const selectedDeptData = departmentResultsData.departments.find((dept: any) => 
        dept.department.code === selectedDepartment
      );
      
      if (!selectedDeptData?.arrondissements) return [];
      
      return selectedDeptData.arrondissements.map((arrData: any) => ({
        id: arrData.code,
        name: arrData.libelle,
        inscrit: arrData.totalRegistered || 0,
        votant: (arrData.totalVotes || 0) + (arrData.nullBallots || 0),
        bulletin_nul: arrData.nullBallots || 0,
        parties: arrData.results || {},
        pollingStations: arrData.pollingStations
      }));
    }
    
    return [];
  }, [departmentResultsData, synthesisData, selectedDepartment, selectedArrondissement]);

  const isLoading = isLoadingDepartmentResults || isLoadingArrondissements || isLoadingBureaux || isLoadingSynthesis;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mr-4"></div>
          <span className="text-xl text-gray-600 font-semibold">Chargement de la synthèse départementale...</span>
        </div>
      </div>
    );
  }

  if (isErrorSynthesis) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <i className="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Erreur de chargement</h3>
          <p className="text-gray-600">Impossible de charger les données de synthèse départementale</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-50 rounded-xl shadow-lg p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Synthèse Départementale</h1>
          <p className="text-gray-600">Résultats agrégés par département, arrondissement et bureau de vote</p>
        </div>
      </div>

      {/* Main Content: Filters (1/3) + Progress (2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Section: Filters (1/3 width) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtres Territoriaux</h2>
            
            {/* Department Dropdown */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Département</label>
              <select
                value={selectedDepartment || ''}
                onChange={(e) => handleDepartmentChange(e.target.value ? Number(e.target.value) : null)}
                disabled={isLoadingDepartmentResults}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isLoadingDepartmentResults ? 'disabled:bg-gray-100 cursor-not-allowed' : ''}`}
                title={isLoadingDepartmentResults ? "Chargement des départements..." : ""}
              >
                <option value="">Tous les départements</option>
                {departments.map((deptData: any) => (
                  <option key={deptData.department.code} value={deptData.department.code}>
                    {deptData.department.libelle} - {deptData.department.region}
                  </option>
                ))}
              </select>
            </div>

            {/* Arrondissement Dropdown */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Arrondissement</label>
              <select
                value={selectedArrondissement || ''}
                onChange={(e) => handleArrondissementChange(e.target.value ? Number(e.target.value) : null)}
                disabled={!selectedDepartment || isLoadingArrondissements}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${(!selectedDepartment || isLoadingArrondissements) ? 'disabled:bg-gray-100 cursor-not-allowed' : ''}`}
              >
                <option value="">Tous les arrondissements</option>
                {arrondissementsData?.map((arr: any) => (
                  <option key={arr.code} value={arr.code}>
                    {arr.libelle}
                  </option>
                ))}
              </select>
            </div>

            {/* Download Buttons */}
            {selectedDepartment && !selectedArrondissement && (
              <div className="mt-4">
                <button onClick={() => handleDownloadReport(selectedDepartment, 'departement')} className="w-full btn-primary bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800">
                  Télécharger Rapport Départemental {spinnerLoader && <i className="fas fa-spinner fa-spin mr-2"></i>}
                </button>
              </div>
            )}

            {selectedDepartment && selectedArrondissement && (
              <div className="mt-4">
                <button onClick={() => handleDownloadReport(selectedArrondissement, 'arrondissement')} className="w-full btn-primary bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800">
                  Télécharger Rapport d'Arrondissement {spinnerLoader && <i className="fas fa-spinner fa-spin mr-2"></i>}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Progress (2/3 width) */}
        <div className="lg:col-span-2">
          {selectedDepartment ? (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Progression des Soumissions</h2>
                <p className="text-gray-600">
                  Suivi par arrondissement dans {departments?.find((d: any) => d.department.code === selectedDepartment)?.department.libelle || 'le département sélectionné'}
                </p>
              </div>
              
              {/* Horizontal Progress Charts */}
              <div>
                {isLoadingProgress ? (
                  <div className="flex items-center justify-center h-24">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                    <span className="text-gray-600">Chargement des données de progression...</span>
                  </div>
                ) : progressData?.arrondissements && progressData.arrondissements.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {progressData.arrondissements.map((item: any) => {
                      const percentage = item.statistics.percentage_filled;
                      const getProgressColor = (pct: number) => {
                        if (pct >= 80) return 'bg-emerald-600';
                        if (pct >= 65) return 'bg-green-600';
                        if (pct >= 50) return 'bg-blue-600';
                        if (pct >= 35) return 'bg-yellow-600';
                        return 'bg-orange-600';
                      };

                      return (
                        <div key={item.code} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">{item.libelle}</span>
                            <span className="text-sm text-gray-500">
                              {item.statistics.filled_bureaux}/{item.statistics.total_bureaux} ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className={`${getProgressColor(percentage)} h-2.5 rounded-full transition-all duration-300`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-6">
                    <i className="fas fa-chart-bar text-xl mb-1 block"></i>
                    <p>Aucune donnée de progression disponible</p>
                  </div>
                )}
              </div>

              {/* Summary Stats */}
              {progressData?.department_statistics && (
                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Progression Départementale</span>
                      <span className="text-sm text-gray-500">{progressData.department_statistics.percentage_filled}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div className="bg-gradient-to-r from-blue-600 to-green-600 h-4 rounded-full transition-all duration-300" 
                           style={{width: `${progressData.department_statistics.percentage_filled}%`}}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Progression des Soumissions</h2>
                <p className="text-gray-600">Suivi par département - Vue d'ensemble</p>
              </div>
              
              {departments && departments.length > 0 ? (
                <>
                  {/* Department Progress Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {departments.map((deptData: any) => {
                      // Get progress data for this department from the progress API
                      const progressInfo = allDepartmentProgressData?.find(
                        (p: any) => p.department_code === deptData.department.code
                      );
                      
                      const totalBureaux = progressInfo?.progress?.total_bureaux || 0;
                      const filledBureaux = progressInfo?.progress?.filled_bureaux || 0;
                      const percentage = totalBureaux > 0 ? Math.round((filledBureaux / totalBureaux) * 100) : 0;
                      
                      const getProgressColor = (pct: number) => {
                        if (pct >= 80) return 'bg-emerald-600';
                        if (pct >= 65) return 'bg-green-600';
                        if (pct >= 50) return 'bg-blue-600';
                        if (pct >= 35) return 'bg-yellow-600';
                        return 'bg-orange-600';
                      };

                      return (
                        <div key={deptData.department.code} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">{deptData.department.libelle}</span>
                            <span className="text-sm text-gray-500">
                              {filledBureaux}/{totalBureaux} ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className={`${getProgressColor(percentage)} h-2.5 rounded-full transition-all duration-300`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Global Summary Stats */}
                  <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Progression Globale</span>
                        <span className="text-sm text-gray-500">
                          {(() => {
                            const totalBureaux = allDepartmentProgressData?.reduce((sum: number, p: any) => sum + (p.progress?.total_bureaux || 0), 0) || 0;
                            const filledBureaux = allDepartmentProgressData?.reduce((sum: number, p: any) => sum + (p.progress?.filled_bureaux || 0), 0) || 0;
                            return totalBureaux > 0 ? Math.round((filledBureaux / totalBureaux) * 100) : 0;
                          })()}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div className="bg-gradient-to-r from-purple-600 to-green-600 h-4 rounded-full transition-all duration-300" 
                             style={{width: `${(() => {
                               const totalBureaux = allDepartmentProgressData?.reduce((sum: number, p: any) => sum + (p.progress?.total_bureaux || 0), 0) || 0;
                               const filledBureaux = allDepartmentProgressData?.reduce((sum: number, p: any) => sum + (p.progress?.filled_bureaux || 0), 0) || 0;
                               return totalBureaux > 0 ? Math.round((filledBureaux / totalBureaux) * 100) : 0;
                             })()}%`}}></div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <div className="text-gray-500">Aucune donnée disponible</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Résultats par {getCurrentLevelName()} ({tableData.length} {getCurrentLevelName().toLowerCase()}s)
          </h2>
        </div>
        
        {tableData.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <div>
              <i className="fas fa-chart-bar text-4xl mb-4 text-gray-400"></i>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucune donnée disponible</h3>
              <p className="text-gray-600">Aucun résultat de synthèse trouvé pour cette sélection</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider sticky left-0 bg-gray-50">
                    {getCurrentLevelName()}
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-black uppercase tracking-wider">
                    Inscrits
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-black uppercase tracking-wider">
                    Votants
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-black uppercase tracking-wider">
                    Bulletin nul
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-black uppercase tracking-wider">
                    Participation
                  </th>
                  {allParties.map((party) => (
                    <th key={party.code} className="px-6 py-3 text-center text-xs font-bold text-black uppercase tracking-wider">
                      {party.sigles}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-center text-xs font-bold text-black uppercase tracking-wider">
                    Total Votes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tableData.map((row: any, index: number) => {
                  const totalVotes = Object.values(row.parties).reduce((sum: number, votes: any) => sum + votes, 0);
                  const participationRate = row.inscrit > 0 ? ((row.votant / row.inscrit) * 100).toFixed(1) : '0.0';
                  
                  return (
                    <tr key={row.id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                        {row.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                        {row.inscrit.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                        {row.votant.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                        {(row.bulletin_nul || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                        {participationRate}%
                      </td>
                      {allParties.map((party) => {
                        const partyVotes = row.parties[party.code] || 0;
                        const percentage = totalVotes > 0 ? ((partyVotes / totalVotes) * 100).toFixed(1) : '0.0';
                        return (
                          <td key={party.code} className="px-6 py-4 whitespace-nowrap text-sm text-center">
                            <div className="text-gray-900 font-medium">
                              {partyVotes.toLocaleString()}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {percentage}%
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-900">
                        {totalVotes.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Synthèse Communale Component
const SynthesisCommunalPage = () => {
  const { user } = useAuth();
  const [selectedArrondissement, setSelectedArrondissement] = useState<number | null>(null);
  const [viewLevel, setViewLevel] = useState<'arrondissement' | 'bureau'>('arrondissement');
  const [spinnerLoader, setSpinnerLoader] = useState(false);

  // Helper function to get party abbreviation from API data
  const getPartyAbbreviation = (partyCode: string | number, partyData?: any): string => {
    // First try to get abbreviation from API data
    if (partyData?.abbreviation) {
      return partyData.abbreviation;
    }
    
    // Fallback to hardcoded mapping if API data not available
    const codeStr = String(partyCode);
    const fallbackMapping: Record<string, string> = {
      '1': 'RDPC',
      '2': 'PAL', 
      '3': 'UNDP',
      '4': 'MCNC',
      '5': 'FSNC',
      '6': 'FDC',
      '7': 'UMS',
      '8': 'PCRN',
      '9': 'PURS',
      '10': 'UNIVERS',
      '11': 'SDF',
      '12': 'UDC'
    };
    
    return fallbackMapping[codeStr] || String(partyCode);
  };

  // Fetch user arrondissement results using the new endpoint
  const { 
    data: arrondissementResultsData, 
    isLoading: isLoadingArrondissementResults,
    error: arrondissementResultsError 
  } = useQuery({
    queryKey: ['user-arrondissement-results', user?.code],
    queryFn: () => getUserArrondissementResults(),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Extract arrondissements from the API response
  const arrondissements = useMemo(() => {
    if (!arrondissementResultsData?.arrondissements) return [];
    return arrondissementResultsData.arrondissements;
  }, [arrondissementResultsData]);

  // Get selected arrondissement data
  const selectedArrondissementData = useMemo(() => {
    if (!selectedArrondissement || !arrondissements) return null;
    return arrondissements.find((arr: any) => arr.arrondissement.code === selectedArrondissement);
  }, [selectedArrondissement, arrondissements]);

  // Fetch progress data for each arrondissement
  const { data: progressDataList, isLoading: isLoadingProgress } = useQuery({
    queryKey: ['arrondissement-progress-list', arrondissements],
    queryFn: async () => {
      if (!arrondissements || arrondissements.length === 0) return [];
      
      // Group arrondissements by department to minimize API calls
      const departmentGroups = new Map();
      arrondissements.forEach((arr: any) => {
        const deptKey = `${arr.arrondissement.region}-${arr.arrondissement.departement}`;
        if (!departmentGroups.has(deptKey)) {
          departmentGroups.set(deptKey, []);
        }
        departmentGroups.get(deptKey).push(arr);
      });

      const progressResults: ArrondissementProgressResult[] = [];
      
      // Get all regions to map region names to codes
      const allRegions = await getAllRegions();
      
      for (const [deptKey, arrList] of departmentGroups) {
        try {
          // Extract region and department info from first arrondissement in group
          const firstArr = arrList[0];
          const regionName = firstArr.arrondissement.region;
          const departmentName = firstArr.arrondissement.departement;
          
          // Find region code by name
          const region = allRegions.find((r: any) => r.libelle === regionName);
          if (!region) continue;
          
          // Find department code - we need to get departments for this region
          const regionDepartments = await getDepartementsByRegion(region.code);
          const department = regionDepartments.find((d: any) => d.libelle === departmentName);
          if (!department) continue;
          
          // Fetch progress data for this department
          const progressData = await getDepartmentProgress(region.code, department.code);
          
          // Extract progress for each arrondissement in this department
          if (progressData?.arrondissements) {
            arrList.forEach((arr: any) => {
              const arrProgress = progressData.arrondissements.find(
                (p: any) => p.code === arr.arrondissement.code
              );
              if (arrProgress) {
                progressResults.push({
                  arrondissement_code: arr.arrondissement.code,
                  progress: arrProgress.statistics
                });
              }
            });
          }
        } catch (error) {
          console.warn(`Failed to fetch progress for department group ${deptKey}:`, error);
        }
      }
      
      return progressResults;
    },
    enabled: !!arrondissements && arrondissements.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch bureaux data when arrondissement is selected
  // const { data: bureauxData, isLoading: isLoadingBureaux } = useQuery({
  //   queryKey: ['territorial-bureaux-communal', selectedArrondissement],
  //   queryFn: () => getBureauxVoteByArrondissement(selectedArrondissement!.toString()),
  //   enabled: !!selectedArrondissement,
  // });

  const handleArrondissementChange = (arrondissementId: number | null) => {
    setSelectedArrondissement(arrondissementId);
    setViewLevel('bureau');
  };

  const handleDownloadReport = async (selectedID: number, reportType: string) => {
    let format = 'pdf'; // or allow user choice
    setSpinnerLoader(true);
    try {
      await handleConfirmGenerate(format, selectedID, reportType); // fetch report
      // You can show success UI or trigger file download here...
      setSpinnerLoader(false);
    } catch (error) {
      setSpinnerLoader(false);
      console.error('Failed to fetch report:', error); 
    }
  };


  // Helper functions
  const getCurrentLevelName = () => {
    if (selectedArrondissement) return 'Bureau de vote';
    return 'Arrondissement';
  };

  // Extract unique parties for table headers
  const allParties = useMemo(() => {
    if (!selectedArrondissement) {
      // For arrondissement level, extract parties from user-arrondissement-results
      if (!arrondissementResultsData?.arrondissements) return [];
      const uniqueParties = new Map();
      arrondissementResultsData.arrondissements.forEach((arrData: any) => {
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
      // For bureau level, extract parties from selected arrondissement's bureaux
      if (!selectedArrondissementData?.bureaux) return [];
      const uniqueParties = new Map();
      selectedArrondissementData.bureaux.forEach((bureauData: any) => {
        if (bureauData.results) {
          Object.keys(bureauData.results).forEach((partyName) => {
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
    }
  }, [arrondissementResultsData, selectedArrondissementData, selectedArrondissement]);

  // Group data for table display based on current level
  const tableData = useMemo(() => {
    if (!selectedArrondissement) {
      // For arrondissement level, use user-arrondissement-results data
      if (!arrondissementResultsData?.arrondissements) return [];
      
      return arrondissementResultsData.arrondissements.map((arrData: any) => ({
        id: arrData.arrondissement.code,
        name: arrData.arrondissement.libelle,
        inscrit: arrData.totalRegistered || 0,
        votant: (arrData.totalVotes || 0) + (arrData.nullBallots || 0),
        bulletin_nul: arrData.nullBallots || 0,
        parties: arrData.results || {},
        departement: arrData.arrondissement.departement,
        region: arrData.arrondissement.region,
        pollingStations: arrData.pollingStations
      }));
    } else {
      // For bureau level, use selected arrondissement's bureaux data
      if (!selectedArrondissementData?.bureaux) return [];
      
      return selectedArrondissementData.bureaux.map((bureauData: any) => ({
        id: bureauData.code,
        name: bureauData.designation,
        inscrit: bureauData.totalRegistered || 0,
        votant: (bureauData.totalVotes || 0) + (bureauData.nullBallots || 0),
        bulletin_nul: bureauData.nullBallots || 0,
        parties: bureauData.results || {},
        reported: bureauData.reported || 0
      }));
    }
  }, [arrondissementResultsData, selectedArrondissementData, selectedArrondissement]);

  const isLoading = isLoadingArrondissementResults;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mr-4"></div>
          <span className="text-xl text-gray-600 font-semibold">Chargement de la synthèse communale...</span>
        </div>
      </div>
    );
  }

  if (arrondissementResultsError) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <i className="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Erreur de chargement</h3>
          <p className="text-gray-600">Impossible de charger les données de synthèse communale</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-purple-50 rounded-xl shadow-lg p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Synthèse Communale</h1>
          <p className="text-gray-600">Résultats agrégés par arrondissement et bureau de vote</p>
        </div>
      </div>

      {/* Main Content: Filters (1/3) + Progress (2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Section: Filters (1/3 width) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtres Territoriaux</h2>
            
            {/* Arrondissement Dropdown */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Arrondissement</label>
              <select
                value={selectedArrondissement || ''}
                onChange={(e) => handleArrondissementChange(e.target.value ? Number(e.target.value) : null)}
                disabled={isLoadingArrondissementResults}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${isLoadingArrondissementResults ? 'disabled:bg-gray-100 cursor-not-allowed' : ''}`}
                title={isLoadingArrondissementResults ? "Chargement des arrondissements..." : ""}
              >
                <option value="">Tous les arrondissements</option>
                {arrondissements.map((arrData: any) => (
                  <option key={arrData.arrondissement.code} value={arrData.arrondissement.code}>
                    {arrData.arrondissement.libelle} - {arrData.arrondissement.departement} ({arrData.arrondissement.region})
                  </option>
                ))}
              </select>
            </div>

            {/* Download Button */}
            {selectedArrondissement && (
              <div className="mt-4">
                <button onClick={() => handleDownloadReport(selectedArrondissement, 'arrondissement')} className="w-full btn-primary bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800">
                  Télécharger Rapport d'Arrondissement {spinnerLoader && <i className="fas fa-spinner fa-spin mr-2"></i>}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Progress (2/3 width) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Progression des Soumissions</h2>
              <p className="text-gray-600">Suivi par arrondissement - Vue d'ensemble</p>
            </div>
            
            {arrondissements && arrondissements.length > 0 ? (
              <>
                {/* Arrondissement Progress Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {arrondissements.map((arrData: any) => {
                    // Get progress data for this arrondissement from the progress API
                    const progressInfo = progressDataList?.find(
                      (p: any) => p.arrondissement_code === arrData.arrondissement.code
                    );
                    
                    const totalBureaux = progressInfo?.progress?.total_bureaux || 0;
                    const filledBureaux = progressInfo?.progress?.filled_bureaux || 0;
                    const percentage = totalBureaux > 0 ? Math.round((filledBureaux / totalBureaux) * 100) : 0;
                    
                    const getProgressColor = (pct: number) => {
                      if (pct >= 80) return 'bg-emerald-600';
                      if (pct >= 65) return 'bg-green-600';
                      if (pct >= 50) return 'bg-blue-600';
                      if (pct >= 35) return 'bg-yellow-600';
                      return 'bg-orange-600';
                    };

                    return (
                      <div key={arrData.arrondissement.code} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">{arrData.arrondissement.libelle}</span>
                          <span className="text-sm text-gray-500">
                            {filledBureaux}/{totalBureaux} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className={`${getProgressColor(percentage)} h-2.5 rounded-full transition-all duration-300`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Global Summary Stats */}
                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Progression Globale</span>
                      <span className="text-sm text-gray-500">
                        {(() => {
                          const totalBureaux = progressDataList?.reduce((sum: number, p: any) => sum + (p.progress?.total_bureaux || 0), 0) || 0;
                          const filledBureaux = progressDataList?.reduce((sum: number, p: any) => sum + (p.progress?.filled_bureaux || 0), 0) || 0;
                          return totalBureaux > 0 ? Math.round((filledBureaux / totalBureaux) * 100) : 0;
                        })()}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div className="bg-gradient-to-r from-purple-600 to-green-600 h-4 rounded-full transition-all duration-300" 
                           style={{width: `${(() => {
                             const totalBureaux = progressDataList?.reduce((sum: number, p: any) => sum + (p.progress?.total_bureaux || 0), 0) || 0;
                             const filledBureaux = progressDataList?.reduce((sum: number, p: any) => sum + (p.progress?.filled_bureaux || 0), 0) || 0;
                             return totalBureaux > 0 ? Math.round((filledBureaux / totalBureaux) * 100) : 0;
                           })()}%`}}></div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 py-12">
                <i className="fas fa-chart-bar text-xl mb-1 block"></i>
                <p>Aucune donnée de progression disponible</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Résultats par {getCurrentLevelName()} ({tableData.length} {getCurrentLevelName().toLowerCase()}s)
          </h2>
        </div>
        
        {tableData.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <div>
              <i className="fas fa-chart-bar text-4xl mb-4 text-gray-400"></i>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucune donnée disponible</h3>
              <p className="text-gray-600">Aucun résultat de synthèse trouvé pour cette sélection</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider sticky left-0 bg-gray-50">
                    {getCurrentLevelName()}
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-black uppercase tracking-wider">
                    Inscrits
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-black uppercase tracking-wider">
                    Votants
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-black uppercase tracking-wider">
                    Bulletin nul
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-black uppercase tracking-wider">
                    Participation
                  </th>
                  {allParties.map((party) => (
                    <th key={party.code} className="px-6 py-3 text-center text-xs font-bold text-black uppercase tracking-wider">
                      {party.sigles}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-center text-xs font-bold text-black uppercase tracking-wider">
                    Total Votes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tableData.map((row: any, index: number) => {
                  const totalVotes = Object.values(row.parties).reduce((sum: number, votes: any) => sum + votes, 0);
                  const participationRate = row.inscrit > 0 ? ((row.votant / row.inscrit) * 100).toFixed(1) : '0.0';
                  
                  return (
                    <tr key={row.id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                        <div>
                          {row.name}
                        </div>
                        {row.departement && (
                          <div className="text-xs text-gray-500">
                            {row.departement} - {row.region}
                          </div>
                        )}
                        {row.reported !== undefined && (
                          <div className="text-xs text-gray-500">
                            Rapporté: {row.reported ? 'Oui' : 'Non'}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                        {row.inscrit.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                        {row.votant.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                        {(row.bulletin_nul || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                        {participationRate}%
                      </td>
                      {allParties.map((party) => {
                        const partyVotes = row.parties[party.code] || 0;
                        const percentage = totalVotes > 0 ? ((partyVotes / totalVotes) * 100).toFixed(1) : '0.0';
                        return (
                          <td key={party.code} className="px-6 py-4 whitespace-nowrap text-sm text-center">
                            <div className="text-gray-900 font-medium">
                              {partyVotes.toLocaleString()}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {percentage}%
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-900">
                        {totalVotes.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};



const PollingStationsPage = () => {
  const { user } = useAuth();
  const [selectedResults, setSelectedResults] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<number>(0);
  const [selectedBureau, setSelectedBureau] = useState<string>('');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [pvModalOpen, setPvModalOpen] = useState(false);
  const [selectedResultForModal, setSelectedResultForModal] = useState<PollingStationResult | null>(null);
  const [selectedBureauForPV, setSelectedBureauForPV] = useState<Bureau | null>(null);
  const [editFormData, setEditFormData] = useState({ nombre_vote: 0 });
  const [participationFormData, setParticipationFormData] = useState({
    nombre_inscrit: 0,
    nombre_votant: 0,
    bulletin_nul: 0,
    taux_participation: 0,
  });
  const [showParticipationEdit, setShowParticipationEdit] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [backendValidationError, setBackendValidationError] = useState<any>(null);
  const queryClient = useQueryClient();

  // Fetch polling station results with user-based filtering
  const { data: pollingResults, isLoading, isError, refetch } = useQuery({
    queryKey: ['pollingStationResults', filterStatus, user?.code],
    queryFn: () => getPollingStationResults(filterStatus, user?.code),
  });

  // Fetch PV images for selected bureau
  const { data: pvData, isLoading: isPVLoading } = useQuery({
    queryKey: ['pvData', selectedBureauForPV?.code],
    queryFn: () => selectedBureauForPV ? getPVForBureau(selectedBureauForPV.code) : Promise.resolve([]),
    enabled: !!selectedBureauForPV,
  });

  // Validation mutations with user authorization
  const validateSingleMutation = useMutation({
    mutationFn: (resultCode: number) => validatePollingStationResult(resultCode, user?.code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pollingStationResults'] });
      setSelectedResults([]);
    },
  });

  const validateMultipleMutation = useMutation({
    mutationFn: (resultCodes: number[]) => validateMultipleResults(resultCodes, user?.code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pollingStationResults'] });
      setSelectedResults([]);
    },
  });

  // Update mutation
  const updateResultMutation = useMutation({
    mutationFn: ({ resultCode, data }: { resultCode: number; data: { nombre_vote: number } }) => 
      updatePollingStationResult(resultCode, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pollingStationResults'] });
      setEditModalOpen(false);
      setSelectedResultForModal(null);
      setValidationErrors([]);
      setShowParticipationEdit(false);
      setBackendValidationError(null);
    },
    onError: (error: any) => {
      console.error('Result update failed:', error);
      // Parse backend validation errors
      try {
        const errorMessage = error.message || 'Erreur lors de la mise à jour';
        if (errorMessage.includes('incohérentes détectées') || error.response?.data?.validationErrors) {
          setBackendValidationError(error.response?.data || {
            message: errorMessage,
            validationErrors: [{
              field: 'backend_error',
              message: errorMessage
            }]
          });
        } else {
          setBackendValidationError({
            message: errorMessage,
            validationErrors: [{
              field: 'general_error', 
              message: errorMessage
            }]
          });
        }
      } catch (e) {
        setBackendValidationError({
          message: 'Erreur inconnue lors de la mise à jour',
          validationErrors: [{
            field: 'unknown_error',
            message: error.message || 'Erreur inconnue lors de la mise à jour'
          }]
        });
      }
    },
  });

  // Participation query
  const { data: participation, refetch: refetchParticipation } = useQuery({
    queryKey: ['participation', selectedResultForModal?.bureau.code],
    queryFn: () => selectedResultForModal ? getParticipationByBureau(selectedResultForModal.bureau.code) : null,
    enabled: !!selectedResultForModal && editModalOpen,
  });

  // Sync participation data to form data whenever it changes
  useEffect(() => {
    if (participation) {
      setParticipationFormData({
        nombre_inscrit: Number(participation.nombre_inscrit) || 0,
        nombre_votant: Number(participation.nombre_votant) || 0,
        bulletin_nul: Number(participation.bulletin_nul) || 0,
        taux_participation: Number(participation.taux_participation) || 0,
      });
    }
  }, [participation]);

  // Update participation mutation
  const updateParticipationMutation = useMutation({
    mutationFn: ({ codeBureauVote, data }: { codeBureauVote: number; data: UpdateParticipationDto }) => 
      updateParticipation(codeBureauVote, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participation'] });
      refetchParticipation();
    },
    onError: (error: any) => {
      console.error('Participation update failed:', error);
      // Parse backend validation errors
      try {
        const errorMessage = error.message || 'Erreur lors de la mise à jour de la participation';
        if (errorMessage.includes('incohérentes détectées') || error.response?.data?.validationErrors) {
          setBackendValidationError(error.response?.data || {
            message: errorMessage,
            validationErrors: [{
              field: 'participation_backend_error',
              message: errorMessage
            }]
          });
        } else {
          setBackendValidationError({
            message: errorMessage,
            validationErrors: [{
              field: 'participation_general_error', 
              message: errorMessage
            }]
          });
        }
      } catch (e) {
        setBackendValidationError({
          message: 'Erreur inconnue lors de la mise à jour de la participation',
          validationErrors: [{
            field: 'participation_unknown_error',
            message: error.message || 'Erreur inconnue lors de la mise à jour de la participation'
          }]
        });
      }
    },
  });

  // Modal handlers
  const handleViewResult = (result: PollingStationResult) => {
    setSelectedResultForModal(result);
    setViewModalOpen(true);
  };

  // Data consistency validation function
  const validateDataConsistency = () => {
    const errors: string[] = [];
    const { nombre_vote } = editFormData;
    const { nombre_inscrit, nombre_votant, bulletin_nul } = participationFormData;
    
    // Calculate suffrage_exprime (automatically calculated)
    const suffrage_exprime = nombre_votant - bulletin_nul;
    
    // Validation rules
    if (nombre_votant > nombre_inscrit) {
      errors.push('Le nombre de votants ne peut pas être supérieur au nombre d\'inscrits');
    }
    
    if (bulletin_nul < 0) {
      errors.push('Le nombre de bulletins nuls ne peut pas être négatif');
    }
    
    if (suffrage_exprime < 0) {
      errors.push('Le nombre de suffrages exprimés ne peut pas être négatif');
    }
    
    if (bulletin_nul + suffrage_exprime !== nombre_votant) {
      errors.push('Bulletins nuls + Suffrages exprimés doit égaler le nombre de votants');
    }
    
    if (nombre_vote > suffrage_exprime) {
      errors.push('Le nombre de votes pour ce parti ne peut pas être supérieur aux suffrages exprimés');
    }
    
    return errors;
  };

  const handleEditResult = (result: PollingStationResult) => {
    setSelectedResultForModal(result);
    setEditFormData({ nombre_vote: result.nombre_vote });
    setEditModalOpen(true);
    setValidationErrors([]);
    setShowParticipationEdit(false);
  };

  const handleViewPV = (bureau: Bureau) => {
    setSelectedBureauForPV(bureau);
    setPvModalOpen(true);
  };

  const handleUpdateResult = () => {
    if (selectedResultForModal) {
      const errors = validateDataConsistency();
      
      if (errors.length > 0) {
        setValidationErrors(errors);
        setShowParticipationEdit(true);
        return;
      }
      
      // FINAL VALIDATION CHECK: Re-validate right before saving to prevent inconsistent data
      const finalErrors = validateDataConsistency();
      if (finalErrors.length > 0) {
        alert(`ERREUR CRITIQUE: Impossible de sauvegarder des données incohérentes!\n\nProblèmes détectés:\n${finalErrors.map(error => `• ${error}`).join('\n')}\n\nVeuillez corriger ces erreurs avant de continuer.`);
        setValidationErrors(finalErrors);
        setShowParticipationEdit(true);
        return;
      }
      
      // If validation passes, update the result
      updateResultMutation.mutate({
        resultCode: selectedResultForModal.code,
        data: editFormData
      });
      
      // Also update participation if it was modified
      if (showParticipationEdit && user) {
        const suffrage_exprime = participationFormData.nombre_votant - participationFormData.bulletin_nul;
        const taux_participation = participationFormData.nombre_inscrit > 0 ? 
          (participationFormData.nombre_votant / participationFormData.nombre_inscrit) * 100 : 0;
          
        // FINAL VALIDATION FOR PARTICIPATION DATA
        const participationData = {
          ...participationFormData,
          suffrage_exprime,
          taux_participation: parseFloat(taux_participation.toFixed(2)),
        };
        
        // Validate the final participation data
        if (participationData.nombre_votant > participationData.nombre_inscrit ||
            participationData.bulletin_nul < 0 ||
            participationData.suffrage_exprime < 0 ||
            (participationData.bulletin_nul + participationData.suffrage_exprime) !== participationData.nombre_votant) {
          alert('ERREUR CRITIQUE: Les données de participation calculées sont incohérentes!\n\nLa sauvegarde a été annulée pour protéger l\'intégrité des données.');
          return;
        }
          
        updateParticipationMutation.mutate({
          codeBureauVote: selectedResultForModal.bureau.code,
          data: {
            ...participationData,
            code_modificateur: user.code,
          }
        });
      }
    }
  };

  // Handle participation form changes with real-time calculation
  const handleParticipationChange = (field: string, value: number) => {
    const newData = { ...participationFormData, [field]: value };
    
    // Auto-calculate taux_participation
    if (field === 'nombre_votant' || field === 'nombre_inscrit') {
      newData.taux_participation = newData.nombre_inscrit > 0 ? 
        parseFloat(((newData.nombre_votant / newData.nombre_inscrit) * 100).toFixed(2)) : 0;
    }
    
    setParticipationFormData(newData);
    
    // Re-validate in real time
    const errors = validateDataConsistency();
    setValidationErrors(errors);
  };

  const closeModals = () => {
    setViewModalOpen(false);
    setEditModalOpen(false);
    setPvModalOpen(false);
    setSelectedResultForModal(null);
    setSelectedBureauForPV(null);
    setShowParticipationEdit(false);
    setValidationErrors([]);
    setBackendValidationError(null);
  };

  // Group results by bureau
  const groupedResults = pollingResults?.reduce((acc: any, result: PollingStationResult) => {
    const bureauCode = result.code_bureau;
    if (!acc[bureauCode]) {
      acc[bureauCode] = {
        bureau: result.bureau,
        results: [],
        totalVotes: 0,
      };
    }
    acc[bureauCode].results.push(result);
    acc[bureauCode].totalVotes += result.nombre_vote;
    return acc;
  }, {}) || {};

  // Get unique bureaux for the dropdown
  const availableBureaux = Object.values(groupedResults).map((group: any) => ({
    code: group.bureau.code,
    designation: group.bureau.designation,
    arrondissement: group.bureau.arrondissement?.libelle || 'N/A'
  })).sort((a, b) => a.designation.localeCompare(b.designation));

  // Filter results based on search term and selected bureau
  const filteredResults = Object.values(groupedResults).filter((group: any) => {
    const matchesSearch = group.bureau.designation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBureau = selectedBureau === '' || group.bureau.code.toString() === selectedBureau;
    return matchesSearch && matchesBureau;
  });

  const handleSelectAll = () => {
    if (selectedResults.length === pollingResults?.length) {
      setSelectedResults([]);
    } else {
      setSelectedResults(pollingResults?.map((r: PollingStationResult) => r.code) || []);
    }
  };

  const handleSelectResult = (resultCode: number) => {
    setSelectedResults(prev => 
      prev.includes(resultCode) 
        ? prev.filter(code => code !== resultCode)
        : [...prev, resultCode]
    );
  };

  const handleValidateSelected = () => {
    if (selectedResults.length === 1) {
      validateSingleMutation.mutate(selectedResults[0]);
    } else if (selectedResults.length > 1) {
      validateMultipleMutation.mutate(selectedResults);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mr-4"></div>
          <span className="text-xl text-gray-600 font-semibold">Chargement des résultats...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <i className="fas fa-exclamation-triangle text-6xl text-red-500 mb-6"></i>
          <h2 className="text-2xl font-semibold text-gray-700 mb-3">Erreur de chargement</h2>
          <p className="max-w-md mb-4">Impossible de récupérer les résultats. Veuillez réessayer.</p>
          <button onClick={() => refetch()} className="btn-primary">
            <i className="fas fa-refresh mr-2"></i>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Modal */}
      {viewModalOpen && selectedResultForModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Détails du Résultat</h2>
              <button 
                onClick={closeModals}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Bureau Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Informations du Bureau</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Code Bureau</label>
                    <p className="text-gray-900 font-medium">{selectedResultForModal.bureau.code}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Désignation</label>
                    <p className="text-gray-900 font-medium">{selectedResultForModal.bureau.designation}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Arrondissement</label>
                    <p className="text-gray-900 font-medium">{selectedResultForModal.bureau.code_arrondissement}</p>
                  </div>
                  {selectedResultForModal.bureau.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Description</label>
                      <p className="text-gray-900 font-medium">{selectedResultForModal.bureau.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Party Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Parti Politique</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Abréviation</label>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: selectedResultForModal.parti_politique.coloration_bulletin }}
                      ></div>
                      <p className="text-gray-900 font-medium">{selectedResultForModal.parti_politique.abbreviation}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Désignation</label>
                    <p className="text-gray-900 font-medium">{selectedResultForModal.parti_politique.designation}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Description</label>
                    <p className="text-gray-900 font-medium">{selectedResultForModal.parti_politique.description}</p>
                  </div>
                </div>
              </div>

              {/* Result Information */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Résultat</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nombre de Votes</label>
                    <p className="text-2xl font-bold text-blue-600">{selectedResultForModal.nombre_vote.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Statut</label>
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                      selectedResultForModal.statut_validation === 1 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedResultForModal.statut_validation === 1 ? 'Validé' : 'En attente'}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date de Création</label>
                    <p className="text-gray-900 font-medium">
                      {new Date(selectedResultForModal.date_creation).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Métadonnées</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Créé par</label>
                    <p className="text-gray-900">{selectedResultForModal.code_createur}</p>
                  </div>
                  {selectedResultForModal.code_modificateur && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Modifié par</label>
                      <p className="text-gray-900">{selectedResultForModal.code_modificateur}</p>
                    </div>
                  )}
                  {selectedResultForModal.date_modification && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Date de Modification</label>
                      <p className="text-gray-900">
                        {new Date(selectedResultForModal.date_modification).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button 
                onClick={closeModals}
                className="btn-secondary"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Edit Modal with Participation Data */}
      {editModalOpen && selectedResultForModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Modifier le Résultat avec Validation</h2>
              <button 
                onClick={closeModals}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Bureau and Party Info (Read-only) */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-2">
                  Bureau: <span className="font-medium text-gray-900">{selectedResultForModal.bureau.designation}</span>
                </div>
                <div className="text-sm text-gray-600">
                  Parti: <span className="font-medium text-gray-900">{selectedResultForModal.parti_politique.abbreviation}</span>
                </div>
              </div>



              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Results Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Résultats du Parti</h3>
                  
                  <div>
                    <label htmlFor="nombre_vote" className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de Votes
                    </label>
                    <input
                      type="number"
                      id="nombre_vote"
                      min="0"
                      value={editFormData.nombre_vote}
                      onChange={(e) => {
                        setEditFormData({ ...editFormData, nombre_vote: parseInt(e.target.value) || 0 });
                        // Re-validate when result changes
                        setTimeout(() => {
                          const errors = validateDataConsistency();
                          setValidationErrors(errors);
                        }, 100);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />


                  </div>
                </div>

                {/* Participation Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Données de Participation</h3>
                    {participation && !showParticipationEdit && (
                      <button
                        onClick={() => {
                          // Ensure form data is populated when switching to edit mode
                          setParticipationFormData({
                            nombre_inscrit: Number(participation.nombre_inscrit) || 0,
                            nombre_votant: Number(participation.nombre_votant) || 0,
                            bulletin_nul: Number(participation.bulletin_nul) || 0,
                            taux_participation: Number(participation.taux_participation) || 0,
                          });
                          setShowParticipationEdit(true);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        <i className="fas fa-edit mr-1"></i>
                        Modifier
                      </button>
                    )}
                  </div>
                  
                  {participation ? (
                    <div className="space-y-4">
                      {/* Row 1: Inscrits & Votants */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre d'Inscrits
                          </label>
                          {showParticipationEdit ? (
                            <input
                              type="number"
                              min="0"
                              value={participationFormData.nombre_inscrit}
                              onChange={(e) => handleParticipationChange('nombre_inscrit', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          ) : (
                            <p className="text-gray-900 font-medium bg-gray-100 px-3 py-2 rounded-lg">
                              {participation.nombre_inscrit.toLocaleString()}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre de Votants
                          </label>
                          {showParticipationEdit ? (
                            <input
                              type="number"
                              min="0"
                              value={participationFormData.nombre_votant}
                              onChange={(e) => handleParticipationChange('nombre_votant', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          ) : (
                            <p className="text-gray-900 font-medium bg-gray-100 px-3 py-2 rounded-lg">
                              {participation.nombre_votant.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Row 2: Bulletins Nuls & Suffrages Exprimés */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bulletins Nuls
                          </label>
                          {showParticipationEdit ? (
                            <input
                              type="number"
                              min="0"
                              value={participationFormData.bulletin_nul}
                              onChange={(e) => handleParticipationChange('bulletin_nul', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          ) : (
                            <p className="text-gray-900 font-medium bg-gray-100 px-3 py-2 rounded-lg">
                              {participation.bulletin_nul.toLocaleString()}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Suff. Exprimés
                          </label>
                          <p className="text-blue-900 font-bold bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                            {showParticipationEdit ? 
                              (participationFormData.nombre_votant - participationFormData.bulletin_nul).toLocaleString() :
                              participation.suffrage_exprime.toLocaleString()
                            }
                          </p>
                        </div>
                      </div>

                      {/* Row 3: Taux de Participation (full width) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <i className="fas fa-percentage text-green-600 mr-1"></i>
                          Taux de Participation
                        </label>
                        <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-300 rounded-lg p-3">
                          <p className="text-green-900 font-bold text-lg text-center">
                            {showParticipationEdit ? 
                              `${(participationFormData.taux_participation || 0).toFixed(2)}%` :
                              `${(Number(participation.taux_participation) || 0).toFixed(2)}%`
                            }
                          </p>
                          <p className="text-green-700 text-xs text-center mt-1">
                            {showParticipationEdit ?
                              `${participationFormData.nombre_votant.toLocaleString()} votants sur ${participationFormData.nombre_inscrit.toLocaleString()} inscrits` :
                              `${participation.nombre_votant.toLocaleString()} votants sur ${participation.nombre_inscrit.toLocaleString()} inscrits`
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <i className="fas fa-spinner fa-spin text-gray-400 text-lg mb-2"></i>
                      <p className="text-sm text-gray-500">Chargement des données de participation...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Validation Errors */}
              {(validationErrors.length > 0 || backendValidationError) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <i className="fas fa-exclamation-circle text-red-500 mt-1 mr-3"></i>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-sm font-medium text-red-800">Erreurs de validation</h3>
                        <button
                          onClick={() => {
                            setValidationErrors([]);
                            setBackendValidationError(null);
                          }}
                          className="text-red-400 hover:text-red-600 text-sm"
                          title="Fermer"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                      
                      {/* Frontend Validation Errors */}
                      {validationErrors.length > 0 && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-red-700 mb-1">Incohérences détectées:</h4>
                          <ul className="text-sm text-red-700 space-y-1">
                            {validationErrors.map((error, index) => (
                              <li key={index}>• {error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Backend Validation Errors */}
                      {backendValidationError && (
                        <div>
                          <h4 className="text-sm font-medium text-red-700 mb-1">Problème détecté:</h4>
                          {backendValidationError.validationErrors && backendValidationError.validationErrors.length > 0 ? (
                            <div className="space-y-1">
                              {backendValidationError.validationErrors.map((error: any, index: number) => (
                                <p key={index} className="text-sm text-red-700">
                                  • {error.message.replace(/^Erreur \d+: /, '')}
                                </p>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-red-700">
                              • {(backendValidationError.message || 'Le serveur a rejeté cette mise à jour').replace(/^Erreur \d+: /, '')}
                            </p>
                          )}
                          
                          {/* Show suggestions if available */}
                          {backendValidationError.suggestions && backendValidationError.suggestions.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-red-200">
                              <p className="text-xs text-red-600 font-medium mb-1">Suggestions:</p>
                              <ul className="text-xs text-red-700 space-y-1">
                                {backendValidationError.suggestions.map((suggestion: string, index: number) => (
                                  <li key={index}>💡 {suggestion}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button 
                onClick={closeModals}
                className="btn-secondary"
              >
                Annuler
              </button>
              {validationErrors.length > 0 && (
                <button 
                  onClick={() => {
                    setValidationErrors([]);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  <i className="fas fa-eye-slash mr-2"></i>
                  Masquer les erreurs
                </button>
              )}
              <button 
                onClick={handleUpdateResult}
                disabled={updateResultMutation.isPending || updateParticipationMutation.isPending}
                className="btn-primary"
              >
                {(updateResultMutation.isPending || updateParticipationMutation.isPending) ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Mise à jour...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save mr-2"></i>
                    Sauvegarder
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PV Modal */}
      {pvModalOpen && selectedBureauForPV && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Procès-Verbal - Bureau {selectedBureauForPV.code}
              </h2>
              <button 
                onClick={closeModals}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Bureau Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Informations du Bureau</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Code Bureau</label>
                    <p className="text-gray-900 font-medium">{selectedBureauForPV.code}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Désignation</label>
                    <p className="text-gray-900 font-medium">{selectedBureauForPV.designation}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Arrondissement</label>
                    <p className="text-gray-900 font-medium">{selectedBureauForPV.code_arrondissement}</p>
                  </div>
                  {selectedBureauForPV.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Description</label>
                      <p className="text-gray-900 font-medium">{selectedBureauForPV.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* PV Images */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Procès-Verbal</h3>
                {isPVLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                    <span className="text-gray-600">Chargement du procès-verbal...</span>
                  </div>
                ) : pvData && pvData.length > 0 ? (
                  <div className="space-y-4">
                    {pvData.map((pv: PV) => (
                      <div key={pv.code} className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-sm text-gray-600">
                              <strong>Date:</strong> {new Date(pv.timestamp).toLocaleString('fr-FR')}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              <strong>Hash:</strong> {pv.hash_file.substring(0, 16)}...
                            </p>
                          </div>
                        </div>
                        <div className="relative">
                          <img
                            src={`http://api.voteflow.cm${cleanPVUrl(pv.url_pv)}`}
                            alt={`Procès-verbal du bureau ${selectedBureauForPV.code}`}
                            className="w-full max-w-full rounded-lg border border-gray-300 shadow-md"
                            style={{ maxHeight: '600px', objectFit: 'contain' }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const errorDiv = target.nextElementSibling as HTMLDivElement;
                              if (errorDiv) errorDiv.style.display = 'block';
                            }}
                          />
                          <div 
                            className="hidden bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
                          >
                            <i className="fas fa-image text-4xl text-gray-400 mb-4"></i>
                            <p className="text-gray-600">Impossible de charger l'image</p>
                            <p className="text-sm text-gray-500 mt-2">{cleanPVUrl(pv.url_pv)}</p>
                            <a 
                              href={`http://api.voteflow.cm${cleanPVUrl(pv.url_pv)}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-block mt-3 text-blue-600 hover:text-blue-800"
                            >
                              Ouvrir dans un nouvel onglet
                            </a>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <a 
                            href={`http://api.voteflow.cm/${pv.url_pv}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn-primary text-sm"
                          >
                            <i className="fas fa-external-link-alt mr-2"></i>
                            Ouvrir en grand
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <i className="fas fa-file-alt text-4xl text-gray-400 mb-4"></i>
                    <p className="text-gray-600">Aucun procès-verbal disponible pour ce bureau</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button 
                onClick={closeModals}
                className="btn-secondary"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-blue-50 rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Validation des Résultats</h1>
          <p className="text-gray-600">Validation et contrôle des résultats électoraux par bureau de vote</p>
        </div>
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <select
              value={selectedBureau}
              onChange={(e) => setSelectedBureau(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-64"
            >
              <option value="">Tous les bureaux de vote</option>
              {availableBureaux.map((bureau) => (
                <option key={bureau.code} value={bureau.code.toString()}>
                  {bureau.designation} - {bureau.arrondissement}
                </option>
              ))}
            </select>
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Rechercher un bureau de vote..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-80"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>En attente de validation</option>
              <option value={1}>Validés</option>
              <option value={-1}>Tous les statuts</option>
            </select>
          </div>
          
          <div className="flex items-center gap-3">
            {selectedResults.length > 0 && (
              <button
                onClick={handleValidateSelected}
                disabled={validateSingleMutation.isPending || validateMultipleMutation.isPending}
                className="btn-primary flex items-center gap-2"
              >
                <i className="fas fa-check"></i>
                Valider ({selectedResults.length})
                {(validateSingleMutation.isPending || validateMultipleMutation.isPending) && (
                  <i className="fas fa-spinner fa-spin ml-2"></i>
                )}
              </button>
            )}
            <button
              onClick={handleSelectAll}
              className="btn-secondary"
            >
              <i className="fas fa-check-square"></i>
              {selectedResults.length === pollingResults?.length ? 'Tout désélectionner' : 'Tout sélectionner'}
            </button>
          </div>
        </div>
      </div>

      {/* Results by Bureau */}
      <div className="space-y-6">
        {filteredResults.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
            <i className="fas fa-inbox text-4xl text-gray-400 mb-4"></i>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucun résultat trouvé</h3>
            <p className="text-gray-500">
              {searchTerm ? 'Aucun bureau ne correspond à votre recherche.' : 'Aucun résultat en attente de validation.'}
            </p>
          </div>
        ) : (
          filteredResults.map((group: any) => (
            <div key={group.bureau.code} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              {/* Bureau Header */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Bureau {group.bureau.code} - {group.bureau.designation}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Total des votes exprimés: <span className="font-medium">{group.totalVotes.toLocaleString()}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleViewPV(group.bureau)}
                      className="action-btn bg-purple-500 hover:bg-purple-600 text-white"
                      title="Voir le procès-verbal"
                    >
                      <i className="fas fa-file-alt"></i>
                    </button>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      group.results.every((r: PollingStationResult) => r.statut_validation === 1) 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {group.results.every((r: PollingStationResult) => r.statut_validation === 1) ? 'Validé' : 'En attente'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Results Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={group.results.every((r: PollingStationResult) => selectedResults.includes(r.code))}
                          onChange={() => {
                            const groupCodes = group.results.map((r: PollingStationResult) => r.code);
                            const allSelected = groupCodes.every((code: number) => selectedResults.includes(code));
                            if (allSelected) {
                              setSelectedResults(prev => prev.filter(code => !groupCodes.includes(code)));
                            } else {
                              setSelectedResults(prev => [...new Set([...prev, ...groupCodes])]);
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6  py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                        <b>Parti Politique</b>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                        <b>Abréviation</b>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                        <b>Nombre de Votes</b>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                        <b>Pourcentage</b>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                        <b>Statut</b>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                        <b>Actions</b>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {group.results.map((result: PollingStationResult) => (
                      <tr key={result.code} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedResults.includes(result.code)}
                            onChange={() => handleSelectResult(result.code)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: result.parti_politique.coloration_bulletin }}
                            ></div>
                            <span className="text-sm font-medium text-gray-900">
                              {result.parti_politique.designation}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {result.parti_politique.abbreviation}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {result.nombre_vote.toLocaleString()} 
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {((result.nombre_vote / group.totalVotes) * 100).toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            result.statut_validation === 1 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {result.statut_validation === 1 ? 'Validé' : 'En attente'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex gap-1">
                            {result.statut_validation === 0 && (
                              <button 
                                onClick={() => validateSingleMutation.mutate(result.code)}
                                disabled={validateSingleMutation.isPending}
                                className="action-btn bg-green-500 hover:bg-green-600 text-white"
                                title="Valider ce résultat"
                              >
                                <i className="fas fa-check"></i>
                              </button>
                            )}
                            <button 
                              onClick={() => handleViewResult(result)}
                              className="action-btn bg-blue-500 hover:bg-blue-600 text-white" 
                              title="Voir détails"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button 
                              onClick={() => handleEditResult(result)}
                              className="action-btn bg-yellow-500 hover:bg-yellow-600 text-white" 
                              title="Modifier"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

function AppContent() {
  const { user } = useAuth();
  
  // Determine initial menu based on user role immediately
  const getInitialMenu = (): string => {
    if (!user) return 'dashboard';
    
    const getUserRoleNames = (): string[] => {
      const normalize = (s: string) => s?.toString().trim().toLowerCase();
      if (user.roles && Array.isArray(user.roles)) {
        return user.roles.map(r => normalize(r.libelle));
      }
      if (user.role) {
        return [normalize(user.role.libelle)];
      }
      return [];
    };
    
    const roleNames = getUserRoleNames();
    const isValidator = roleNames.includes('validateur');
    const isScrutateur = roleNames.includes('scrutateur');
    const isLocalObserver = roleNames.includes('observateur-local');
    const isSuperviseurRegionale = roleNames.includes('superviseur-regionale');
    const isSuperviseurDepartementale = roleNames.includes('superviseur-departementale');
    const isSuperviseurCommunale = roleNames.includes('superviseur-communale');
    
    if (isValidator) {
      return 'polling-stations'; // Validators go directly to validation
    } else if (isLocalObserver) {
      return 'synthesis-departemental'; // Local observers go directly to departmental synthesis
    } else if (isSuperviseurRegionale) {
      return 'synthesis'; // Regional supervisors go directly to regional synthesis
    } else if (isSuperviseurDepartementale) {
      return 'synthesis-departemental'; // Departmental supervisors go directly to departmental synthesis
    } else if (isSuperviseurCommunale) {
      return 'synthesis-communal'; // Communal supervisors go directly to communal synthesis
    } else if (isScrutateur) {
      return 'submission'; // Communal supervisors go directly to communal synthesis
    } else {
      return 'dashboard'; // Admins and observers see dashboard
    }
  };
  
  const [activeMenu, setActiveMenu] = useState(getInitialMenu());

  // Define full menu (admin sees everything) - Compressed with submenus
  const fullMenuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: 'fas fa-gauge'
    },
    {
      id: 'results',
      label: 'Résultats',
      icon: 'fas fa-chart-line',
      children: [
        {
          id: 'polling-stations',
          label: 'Validation des résultats',
          icon: 'fas fa-check-double'
        },
        {
          id: 'submission',
          label: 'Saisie des résultats',
          icon: 'fas fa-edit'
        },
        {
          id: 'validation-results-new',
          label: 'Nouvelle Validation',
          icon: 'fas fa-clipboard-check'
        }
      ]
    },
    {
      id: 'synthesis',
      label: 'Synthèses',
      icon: 'fas fa-chart-column',
      children: [
        {
          id: 'synthesis',
          label: 'Régionale',
          icon: 'fas fa-map'
        },
        {
          id: 'synthesis-departemental',
          label: 'Départementale',
          icon: 'fas fa-building'
        },
        {
          id: 'synthesis-communal',
          label: 'Communale',
          icon: 'fas fa-city'
        }
      ]
    },
    {
      id: 'management',
      label: 'Gestion',
      icon: 'fas fa-cogs',
      children: [
        {
          id: 'commissions',
          label: 'Commissions',
          icon: 'fas fa-users-cog'
        },
        {
          id: 'arrondissements',
          label: 'Arrondissements',
          icon: 'fas fa-map-marked-alt'
        },
        {
          id: 'participations',
          label: 'Participations',
          icon: 'fas fa-chart-pie'
        },
        {
          id: 'redressements',
          label: 'Redressements',
          icon: 'fas fa-undo'
        }
      ]
    },
    {
      id: 'reports',
      label: 'Rapports',
      icon: 'fas fa-file-alt'
    }
  ];

  // Normalize role names
  const getUserRoleNames = (): string[] => {
    const normalize = (s: string) => s?.toString().trim().toLowerCase();
    if (!user) return [];
    if (user.roles && Array.isArray(user.roles)) {
      return user.roles.map(r => normalize(r.libelle));
    }
    if (user.role) {
      return [normalize(user.role.libelle)];
    }
    return [];
  };

  const roleNames = getUserRoleNames();
  const isAdmin = roleNames.includes('administrateur');
  const isValidator = roleNames.includes('validateur');
  const isObserver = roleNames.includes('observateur');
  const isLocalObserver = roleNames.includes('observateur-local');
  const isSuperviseurRegionale = roleNames.includes('superviseur-regionale');
  const isSuperviseurDepartementale = roleNames.includes('superviseur-departementale');
  const isSuperviseurCommunale = roleNames.includes('superviseur-communale');
    const isScrutateur = roleNames.includes('scrutateur'); // Add this line

  // Filter menu by role (memoized) with submenu support
  const menuItems: MenuItem[] = useMemo(() => {
    if (isAdmin) {
      // Administrateurs can see all items
      return fullMenuItems;
    }
    if (isValidator) {
      // Validateurs can see results and synthesis
      return fullMenuItems.filter(item => ['dashboard', 'results', 'synthesis'].includes(item.id))
        .map(item => {
          if (item.id === 'results') {
            return {
              ...item,
              children: item.children?.filter(child => ['polling-stations', 'validation-results-new'].includes(child.id))
            };
          }
          if (item.id === 'synthesis') {
            return {
              ...item,
              children: item.children?.filter(child => ['synthesis-communal'].includes(child.id))
            };
          }
          return item;
        });
    }
    if (isObserver) {
      // Observateurs can see dashboard, synthesis, and reports
      return fullMenuItems.filter(item => ['dashboard', 'synthesis', 'reports'].includes(item.id));
    }
    if (isLocalObserver) {
      // Observateur-local can see only departmental synthesis
      return fullMenuItems.filter(item => ['dashboard', 'synthesis'].includes(item.id))
        .map(item => {
          if (item.id === 'synthesis') {
            return {
              ...item,
              children: item.children?.filter(child => ['synthesis-departemental'].includes(child.id))
            };
          }
          return item;
        });
    }
    if (isScrutateur) {
      // Scrutateurs can see only results submission
      return fullMenuItems.filter(item => ['dashboard', 'results'].includes(item.id))
        .map(item => {
          if (item.id === 'results') {
            return {
              ...item,
              children: item.children?.filter(child => ['submission'].includes(child.id))
            };
          }
          return item;
        });
    }
    if (isSuperviseurRegionale) {
      // Superviseur-Regionale can see only regional synthesis
      return fullMenuItems.filter(item => ['dashboard', 'synthesis'].includes(item.id))
        .map(item => {
          if (item.id === 'synthesis') {
            return {
              ...item,
              children: item.children?.filter(child => ['synthesis'].includes(child.id))
            };
          }
          return item;
        });
    }
    if (isSuperviseurDepartementale) {
      // Superviseur-Departementale can see synthesis and management
      return fullMenuItems.filter(item => ['dashboard', 'synthesis', 'management'].includes(item.id))
        .map(item => {
          if (item.id === 'synthesis') {
            return {
              ...item,
              children: item.children?.filter(child => ['synthesis-departemental'].includes(child.id))
            };
          }
          if (item.id === 'management') {
            return {
              ...item,
              children: item.children?.filter(child => ['commissions', 'participations', 'redressements'].includes(child.id))
            };
          }
          return item;
        });
    }
    if (isSuperviseurCommunale) {
      // Superviseur-Communale can see only communal synthesis
      return fullMenuItems.filter(item => ['dashboard', 'synthesis'].includes(item.id))
        .map(item => {
          if (item.id === 'synthesis') {
            return {
              ...item,
              children: item.children?.filter(child => ['synthesis-communal'].includes(child.id))
            };
          }
          return item;
        });
    }
    // Default case (fallback) - only dashboard and synthesis
    return fullMenuItems.filter(item => ['dashboard', 'synthesis'].includes(item.id));
  }, [isAdmin, isValidator, isObserver, isLocalObserver, isScrutateur, isSuperviseurRegionale, isSuperviseurDepartementale, isSuperviseurCommunale]);

  // Ensure activeMenu is valid for current role and update if user loads after initial render
  const allAllowedIds = new Set<string>([
    ...menuItems.map(i => i.id),
    ...menuItems.flatMap(i => i.children?.map(c => c.id) || [])
  ]);
  
  useEffect(() => {
    // Update menu if user loads after initial render or if current menu is not allowed
    const correctMenu = getInitialMenu();
    if (!allAllowedIds.has(activeMenu) || (user && activeMenu !== correctMenu)) {
      setActiveMenu(correctMenu);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, JSON.stringify(Array.from(allAllowedIds)), isValidator, isLocalObserver]);

  const renderContent = () => {
    // Show loading state while user is being determined
    if (!user) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mr-4"></div>
            <span className="text-xl text-gray-600 font-semibold">Chargement de l'application...</span>
          </div>
        </div>
      );
    }
    
    switch (activeMenu) {
      case 'dashboard':
        return <Dashboard />;
      case 'polling-stations':
        return <PollingStationsPage />;
        case 'submission': // Add this case
        return <SubmissionPage />;
      case 'validation-results-new':
        return <ValidationResultsNew />;
      case 'regions':
        return <RegionsPage />;
      case 'reports':
        return <ReportsComponent />; 
      case 'commissions':
        return <CommissionManagement className="max-w-7xl mx-auto" />;
      case 'arrondissements':
        return <ArrondissementManagement className="max-w-7xl mx-auto" />;
      case 'participations':
        return <ParticipationManagement className="max-w-7xl mx-auto" />;
      case 'redressements':
        return <RedressementManagement className="max-w-7xl mx-auto" />;
      case 'synthesis': 
        return <SynthesisPage />;
      case 'synthesis-departemental':
        return <SynthesisDepartementalPage />;
      case 'synthesis-communal':
        return <SynthesisCommunalPage />;
      default:
        return (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <i className="fas fa-tools text-6xl text-gray-400 mb-6"></i>
              <h2 className="text-2xl font-semibold text-gray-700 mb-3">Page en construction</h2>
              <p className="max-w-md">Cette fonctionnalité sera bientôt disponible. Notre équipe travaille activement sur son développement.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <Navigation 
        menuItems={menuItems}
        activeMenu={activeMenu}
        onMenuClick={setActiveMenu}
      />
      <main className="p-8">
        {renderContent()}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AppContent />
      </ProtectedRoute>
    </AuthProvider>
  );
}

export default App;
