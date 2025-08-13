'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Stats {
  totalUsers: number;
  verifiedUsers: number;
  activeSessions: number;
  userTypeStats: Array<{ userType: string; count: number }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserTypeIcon = (type: string) => {
    switch (type) {
      case 'donor': return 'fas fa-heart';
      case 'player': return 'fas fa-running';
      case 'club': return 'fas fa-users';
      case 'federation': return 'fas fa-flag';
      case 'company': return 'fas fa-briefcase';
      case 'affiliate': return 'fas fa-star';
      default: return 'fas fa-user';
    }
  };

  const getUserTypeColor = (type: string) => {
    switch (type) {
      case 'donor': return 'text-red-600 bg-red-100';
      case 'player': return 'text-blue-600 bg-blue-100';
      case 'club': return 'text-green-600 bg-green-100';
      case 'federation': return 'text-purple-600 bg-purple-100';
      case 'company': return 'text-indigo-600 bg-indigo-100';
      case 'affiliate': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse">
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="card-elevated">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <i className="fas fa-users text-blue-600 text-xl"></i>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Utilisateurs Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
            </div>
          </div>
        </div>

        <div className="card-elevated">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
              <i className="fas fa-check-circle text-green-600 text-xl"></i>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Comptes Vérifiés</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.verifiedUsers || 0}</p>
            </div>
          </div>
        </div>

        <div className="card-elevated">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
              <i className="fas fa-clock text-orange-600 text-xl"></i>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Sessions Actives</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.activeSessions || 0}</p>
            </div>
          </div>
        </div>

        <div className="card-elevated">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
              <i className="fas fa-shield-alt text-purple-600 text-xl"></i>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Sécurité</p>
              <p className="text-2xl font-bold text-green-600">Optimal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* User Types Distribution */}
        <div className="card-elevated">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-paiecash/10 rounded-lg flex items-center justify-center mr-3">
              <i className="fas fa-chart-pie text-paiecash"></i>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Répartition des Comptes</h2>
          </div>
          <div className="space-y-4">
            {stats?.userTypeStats?.map((stat) => (
              <div key={stat.userType} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${getUserTypeColor(stat.userType)}`}>
                    <i className={`${getUserTypeIcon(stat.userType)} text-sm`}></i>
                  </div>
                  <span className="font-medium text-gray-900">
                    {stat.userType === 'donor' && 'Donateur'}
                    {stat.userType === 'player' && 'Licencié'}
                    {stat.userType === 'club' && 'Club'}
                    {stat.userType === 'federation' && 'Fédération'}
                    {stat.userType === 'company' && 'Société'}
                    {stat.userType === 'affiliate' && 'Ambassadeur'}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-gray-900 mr-2">{stat.count}</span>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-paiecash h-2 rounded-full" 
                      style={{ width: `${(stat.count / (stats?.totalUsers || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card-elevated">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <i className="fas fa-bolt text-blue-600"></i>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Actions Rapides</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <a href="/admin/users" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-center">
                <i className="fas fa-users text-2xl text-blue-600 mb-2"></i>
                <p className="font-medium text-gray-900">Gérer Utilisateurs</p>
              </div>
            </a>
            <a href="/admin/clients" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-center">
                <i className="fas fa-key text-2xl text-green-600 mb-2"></i>
                <p className="font-medium text-gray-900">Clients OAuth</p>
              </div>
            </a>
            <a href="/admin/logs" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-center">
                <i className="fas fa-clipboard-list text-2xl text-purple-600 mb-2"></i>
                <p className="font-medium text-gray-900">Logs Système</p>
              </div>
            </a>
            <a href="/admin/services" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-center">
                <i className="fas fa-external-link-alt text-2xl text-indigo-600 mb-2"></i>
                <p className="font-medium text-gray-900">Services Externes</p>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="mt-8">
        <div className="card-elevated">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <i className="fas fa-heartbeat text-green-600"></i>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">État du Système</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="inline-flex items-center px-3 py-1 bg-green-100 rounded-full text-green-800 text-sm mb-2">
                <i className="fas fa-check-circle mr-2"></i>
                Opérationnel
              </div>
              <p className="text-sm text-gray-600">Base de données</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center px-3 py-1 bg-green-100 rounded-full text-green-800 text-sm mb-2">
                <i className="fas fa-check-circle mr-2"></i>
                Opérationnel
              </div>
              <p className="text-sm text-gray-600">API OAuth</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center px-3 py-1 bg-green-100 rounded-full text-green-800 text-sm mb-2">
                <i className="fas fa-check-circle mr-2"></i>
                Opérationnel
              </div>
              <p className="text-sm text-gray-600">Service Email</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}