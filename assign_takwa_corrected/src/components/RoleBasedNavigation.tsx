/**
 * @file Composant de navigation basé sur les rôles
 */

import React, { useState } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { EntityType, ActionType } from '../types/roles';
import { RoleBasedView } from './RoleBasedView';
import RoleBasedDashboard from './RoleBasedDashboard';
import ArrondissementManagement from './ArrondissementManagement';
import CommissionManagement from './CommissionManagement';
import ParticipationManagement from './ParticipationManagement';
import RedressementManagement from './RedressementManagement';

interface RoleBasedNavigationProps {
  className?: string;
}

export const RoleBasedNavigation: React.FC<RoleBasedNavigationProps> = ({ className = '' }) => {
  const { 
    isAdmin, 
    isValidator, 
    isScrutator, 
    isLocalObserver, 
    isDepartmentSupervisor,
    getAccessLevel 
  } = usePermissions();
  
  const [activeView, setActiveView] = useState<'dashboard' | 'arrondissements' | 'commissions' | 'participations' | 'redressements'>('dashboard');

  // Déterminer les vues accessibles selon le rôle
  const getAccessibleViews = () => {
    const views = [];
    
    if (isAdmin()) {
      views.push(
        { key: 'dashboard', label: 'Tableau de Bord', icon: '🏠' },
        { key: 'arrondissements', label: 'Arrondissements', icon: '🏘️' },
        { key: 'commissions', label: 'Commissions', icon: '👥' },
        { key: 'participations', label: 'Participations', icon: '📊' },
        { key: 'redressements', label: 'Redressements', icon: '🔄' }
      );
    } else if (isDepartmentSupervisor()) {
      views.push(
        { key: 'dashboard', label: 'Tableau de Bord', icon: '🏠' },
        { key: 'commissions', label: 'Commissions', icon: '👥' },
        { key: 'participations', label: 'Participations', icon: '📊' },
        { key: 'redressements', label: 'Redressements', icon: '🔄' }
      );
    } else if (isValidator()) {
      views.push(
        { key: 'dashboard', label: 'Validation', icon: '✅' }
      );
    } else if (isScrutator()) {
      views.push(
        { key: 'dashboard', label: 'Soumissions', icon: '📝' }
      );
    } else if (isLocalObserver()) {
      views.push(
        { key: 'dashboard', label: 'Consultation', icon: '👁️' }
      );
    }
    
    return views;
  };

  const accessibleViews = getAccessibleViews();

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <RoleBasedDashboard className="flex-1" />;
      case 'arrondissements':
        return <ArrondissementManagement className="flex-1" />;
      case 'commissions':
        return <CommissionManagement className="flex-1" />;
      case 'participations':
        return <ParticipationManagement className="flex-1" />;
      case 'redressements':
        return <RedressementManagement className="flex-1" />;
      default:
        return <RoleBasedDashboard className="flex-1" />;
    }
  };

  return (
    <div className={`flex h-screen bg-gray-100 ${className}`}>
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Système Électoral</h2>
          <div className="text-sm text-gray-600 mt-1">
            Niveau: {getAccessLevel()}
          </div>
        </div>
        
        <nav className="mt-6">
          {accessibleViews.map((view) => (
            <button
              key={view.key}
              onClick={() => setActiveView(view.key as any)}
              className={`w-full flex items-center px-6 py-3 text-left text-sm font-medium transition-colors ${
                activeView === view.key
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="mr-3 text-lg">{view.icon}</span>
              {view.label}
            </button>
          ))}
        </nav>
        
        {/* User Info */}
        <div className="absolute bottom-0 w-64 p-6 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            Connecté en tant que
          </div>
          <div className="text-sm font-medium text-gray-800">
            {isAdmin() && 'Administrateur'}
            {isDepartmentSupervisor() && 'Superviseur Départemental'}
            {isValidator() && 'Validateur'}
            {isScrutator() && 'Scrutateur'}
            {isLocalObserver() && 'Observateur Local'}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {renderActiveView()}
      </div>
    </div>
  );
};

export default RoleBasedNavigation;
