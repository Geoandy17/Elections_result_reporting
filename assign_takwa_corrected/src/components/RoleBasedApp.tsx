/**
 * @file Composant principal de l'application avec gestion des rôles
 */

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import RoleBasedNavigation from './RoleBasedNavigation';
import LoginPage from './LoginPage';

interface RoleBasedAppProps {
  className?: string;
}

export const RoleBasedApp: React.FC<RoleBasedAppProps> = ({ className = '' }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-screen ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Chargement...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage className={className} />;
  }

  return <RoleBasedNavigation className={className} />;
};

export default RoleBasedApp;
