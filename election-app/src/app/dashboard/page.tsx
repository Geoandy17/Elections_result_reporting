// app/dashboard/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  MapPin, 
  BarChart3, 
  Users, 
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Download,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalDepartments: number;
  completedDepartments: number;
  totalRegisteredVoters: number;
  averageParticipation: number;
  pendingValidations: number;
  lastUpdated: string;
}

interface RecentActivity {
  id: number;
  type: 'participation' | 'validation' | 'correction';
  department: string;
  user: string;
  timestamp: string;
  description: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { canViewReports, hasAnyDepartmentAccess, getUserDepartments } = usePermissions();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Mock data - replace with actual API calls
      const userDepartments = getUserDepartments();
      const mockStats: DashboardStats = {
        totalDepartments: userDepartments.length || 58,
        completedDepartments: Math.floor((userDepartments.length || 58) * 0.77),
        totalRegisteredVoters: 7200000,
        averageParticipation: 73.5,
        pendingValidations: 8,
        lastUpdated: new Date().toISOString()
      };

      const mockActivity: RecentActivity[] = [
        {
          id: 1,
          type: 'participation',
          department: 'Wouri',
          user: user?.noms_prenoms || 'Unknown',
          timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
          description: 'Participation data submitted for Wouri'
        },
        {
          id: 2,
          type: 'validation',
          department: 'Fako',
          user: 'Marie Ngono',
          timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
          description: 'Data validation completed for Fako'
        },
        {
          id: 3,
          type: 'correction',
          department: 'Mfoundi',
          user: 'Paul Atangana',
          timestamp: new Date(Date.now() - 80 * 60000).toISOString(),
          description: 'Vote count correction applied for Mfoundi'
        }
      ];

      setStats(mockStats);
      setRecentActivity(mockActivity);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">{t('common.loading') || 'Loading...'}</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const completionRate = stats ? (stats.completedDepartments / stats.totalDepartments) * 100 : 0;
  const userDepartments = getUserDepartments();

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6 p-6">
          {/* Page Header */}
          <PageHeader
            title={t('navigation.dashboard') || 'Dashboard'}
            description={`Welcome back, ${user?.noms_prenoms || 'User'}! Here's your election data overview.`}
            icon={BarChart3}
            actions={
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={loadDashboardData}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh</span>
                </Button>
                {canViewReports() && (
                  <Button className="flex items-center space-x-2">
                    <Download className="h-4 w-4" />
                    <span>Export Report</span>
                  </Button>
                )}
              </div>
            }
          />

          {/* User Role Info */}
          {user && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Logged in as: {user.role.libelle}
                  </p>
                  {userDepartments.length > 0 && (
                    <p className="text-sm text-blue-700">
                      Assigned to: {userDepartments.map(d => d.libelle).join(', ')}
                    </p>
                  )}
                </div>
                <div className="text-sm text-blue-600">
                  Last login: {new Date().toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title={userDepartments.length > 0 ? "Your Departments" : "Total Departments"}
              value={stats?.totalDepartments || 0}
              icon={MapPin}
              color="blue"
              change={{ value: 0, type: 'increase' }}
            />
            <StatsCard
              title="Data Complete"
              value={stats?.completedDepartments || 0}
              icon={CheckCircle}
              color="green"
              change={{ value: 12, type: 'increase' }}
            />
            <StatsCard
              title="Registered Voters"
              value={stats?.totalRegisteredVoters?.toLocaleString() || '0'}
              icon={Users}
              color="purple"
              change={{ value: 2.3, type: 'increase' }}
            />
            <StatsCard
              title="Avg. Participation"
              value={`${stats?.averageParticipation || 0}%`}
              icon={TrendingUp}
              color="yellow"
              change={{ value: 1.2, type: 'increase' }}
            />
          </div>

          {/* Progress and Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Data Collection Progress */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Data Collection Progress
                </h3>
                <span className="text-sm text-gray-500">
                  {stats?.completedDepartments}/{stats?.totalDepartments} Departments
                </span>
              </div>
              
              <div className="space-y-4">
                <ProgressBar
                  label="Overall Completion"
                  value={completionRate}
                  color="blue"
                  size="lg"
                />
                <ProgressBar
                  label="Participation Data"
                  value={85}
                  color="green"
                  size="md"
                />
                <ProgressBar
                  label="Results Data"
                  value={72}
                  color="red"
                  size="md"
                />
                <ProgressBar
                  label="Validation"
                  value={68}
                  color="yellow"
                  size="md"
                />
              </div>

              {stats?.pendingValidations && stats.pendingValidations > 0 && (
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">
                      {stats.pendingValidations} items pending validation
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Quick Actions
              </h3>
              
              <div className="space-y-3">
                {hasAnyDepartmentAccess() && (
                  <Link href="/departments" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <MapPin className="h-4 w-4 mr-2" />
                      Departments
                      <ArrowRight className="h-4 w-4 ml-auto" />
                    </Button>
                  </Link>
                )}
                
                {hasAnyDepartmentAccess() && (
                  <Link href="/participation" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Participation
                      <ArrowRight className="h-4 w-4 ml-auto" />
                    </Button>
                  </Link>
                )}
                
                {canViewReports() && (
                  <Link href="/results" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Results
                      <ArrowRight className="h-4 w-4 ml-auto" />
                    </Button>
                  </Link>
                )}
                
                <Link href="/settings" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Settings
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Recent Activity
                </h3>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>
            </div>
            
            <div className="divide-y divide-gray-200">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.type === 'participation' ? 'bg-blue-100 text-blue-600' :
                      activity.type === 'validation' ? 'bg-green-100 text-green-600' :
                      'bg-orange-100 text-orange-600'
                    }`}>
                      {activity.type === 'participation' ? <FileText className="h-4 w-4" /> :
                       activity.type === 'validation' ? <CheckCircle className="h-4 w-4" /> :
                       <AlertCircle className="h-4 w-4" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.description}
                        </p>
                        <span className="text-xs text-gray-500">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.department} • {activity.user}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}