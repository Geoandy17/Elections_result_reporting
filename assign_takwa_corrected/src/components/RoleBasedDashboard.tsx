/**
 * @file Composant principal pour l'affichage du tableau de bord selon le rôle
 */

import React from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { RoleType } from '../types/roles';
import ValidatorView from './ValidatorView';
import ScrutatorView from './ScrutatorView';
import ObserverView from './ObserverView';
import SupervisorView from './SupervisorView';
import ArrondissementManagement from './ArrondissementManagement';
import CommissionManagement from './CommissionManagement';
import ParticipationManagement from './ParticipationManagement';
import RedressementManagement from './RedressementManagement';

interface RoleBasedDashboardProps {
  className?: string;
}

export const RoleBasedDashboard: React.FC<RoleBasedDashboardProps> = ({ className = '' }) => {
  const { 
    userRoles, 
    isAdmin, 
    isValidator, 
    isScrutator, 
    isLocalObserver, 
    isDepartmentSupervisor,
    getAccessLevel 
  } = usePermissions();

  // Déterminer la vue principale selon le rôle
  const getMainView = () => {
    if (isAdmin()) {
      return <AdminDashboard className={className} />;
    }
    
    if (isDepartmentSupervisor()) {
      return <SupervisorView className={className} />;
    }
    
    if (isValidator()) {
      return <ValidatorView className={className} />;
    }
    
    if (isScrutator()) {
      return <ScrutatorView className={className} />;
    }
    
    if (isLocalObserver()) {
      return <ObserverView className={className} />;
    }
    
    return <AccessDeniedView className={className} />;
  };

  return getMainView();
};

// Tableau de bord administrateur avec accès complet
const AdminDashboard: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<'arrondissements' | 'commissions' | 'participations' | 'redressements'>('arrondissements');

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-2xl font-bold text-gray-800">Tableau de Bord Administrateur</h2>
        <p className="text-gray-600 mt-1">
          Gestion complète du système électoral
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex px-6">
          {[
            { key: 'arrondissements', label: 'Arrondissements' },
            { key: 'commissions', label: 'Commissions' },
            { key: 'participations', label: 'Participations' },
            { key: 'redressements', label: 'Redressements' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'arrondissements' && (
          <ArrondissementManagement />
        )}
        {activeTab === 'commissions' && (
          <CommissionManagement />
        )}
        {activeTab === 'participations' && (
          <ParticipationManagement />
        )}
        {activeTab === 'redressements' && (
          <RedressementManagement />
        )}
      </div>
    </div>
  );
};

// Vue d'accès refusé
const AccessDeniedView: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-8 text-center ${className}`}>
      <div className="text-red-600 text-2xl font-bold mb-4">
        Accès Refusé
      </div>
      <div className="text-red-700 text-lg mb-2">
        Vous n'avez pas les permissions nécessaires pour accéder à ce tableau de bord.
      </div>
      <div className="text-red-600 text-sm">
        Veuillez contacter votre administrateur pour obtenir les permissions appropriées.
      </div>
    </div>
  );
};

export default RoleBasedDashboard;
