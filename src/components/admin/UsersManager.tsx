'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';

interface User {
  id: string;
  email: string;
  user_type: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  country?: string;
}

export default function UsersManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const [filters, setFilters] = useState({
    userType: '',
    search: '',
    page: 1
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: '50'
      });
      
      if (filters.userType) params.append('userType', filters.userType);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();
      
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    setActionLoading(userId);
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive })
      });
      loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const verifyUserEmail = async (userId: string) => {
    setActionLoading(`verify-${userId}`);
    try {
      await fetch(`/api/admin/users/${userId}/verify`, {
        method: 'POST'
      });
      loadUsers();
    } catch (error) {
      console.error('Error verifying user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const resetUserPassword = async (userId: string) => {
    setActionLoading(`reset-${userId}`);
    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Mot de passe réinitialisé', `Nouveau mot de passe temporaire : ${data.temporaryPassword}`);
      } else {
        toast.error('Erreur', 'Impossible de réinitialiser le mot de passe');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Erreur de connexion', 'Impossible de réinitialiser le mot de passe');
    } finally {
      setActionLoading(null);
    }
  };

  const getUserTypeLabel = (type: string) => {
    const labels = {
      donor: 'Donateur',
      player: 'Licencié',
      club: 'Club',
      federation: 'Fédération',
      company: 'Société',
      affiliate: 'Ambassadeur'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getUserTypeColor = (type: string) => {
    const colors = {
      donor: 'bg-red-100 text-red-800',
      player: 'bg-blue-100 text-blue-800',
      club: 'bg-green-100 text-green-800',
      federation: 'bg-purple-100 text-purple-800',
      company: 'bg-indigo-100 text-indigo-800',
      affiliate: 'bg-yellow-100 text-yellow-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
        <div className="text-sm text-gray-600">
          Total : {pagination.total} utilisateurs
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type d'utilisateur</label>
            <select
              value={filters.userType}
              onChange={(e) => setFilters({ ...filters, userType: e.target.value, page: 1 })}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Tous les types</option>
              <option value="donor">Donateur</option>
              <option value="player">Licencié</option>
              <option value="club">Club</option>
              <option value="federation">Fédération</option>
              <option value="company">Société</option>
              <option value="affiliate">Ambassadeur</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              placeholder="Email, nom, prénom..."
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={loadUsers}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              <i className="fas fa-search mr-2"></i>
              Rechercher
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex justify-center py-8">
          <i className="fas fa-spinner fa-spin text-2xl text-blue-500"></i>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inscription</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">
                        {user.first_name && user.last_name 
                          ? `${user.first_name} ${user.last_name}`
                          : 'Nom non renseigné'
                        }
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUserTypeColor(user.user_type)}`}>
                      {getUserTypeLabel(user.user_type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="flex items-center">
                      {user.email}
                      {user.is_verified ? (
                        <i className="fas fa-check-circle text-green-500 ml-2" title="Email vérifié"></i>
                      ) : (
                        <i className="fas fa-exclamation-circle text-orange-500 ml-2" title="Email non vérifié"></i>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => toggleUserStatus(user.id, user.is_active)}
                        disabled={actionLoading === user.id}
                        className={`${
                          user.is_active 
                            ? 'text-red-600 hover:text-red-900' 
                            : 'text-green-600 hover:text-green-900'
                        } disabled:opacity-50`}
                        title={user.is_active ? 'Désactiver' : 'Activer'}
                      >
                        {actionLoading === user.id ? (
                          <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                          <i className={`fas ${user.is_active ? 'fa-ban' : 'fa-check'}`}></i>
                        )}
                      </button>
                      
                      {!user.is_verified && (
                        <button
                          onClick={() => verifyUserEmail(user.id)}
                          disabled={actionLoading === `verify-${user.id}`}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                          title="Vérifier l'email"
                        >
                          {actionLoading === `verify-${user.id}` ? (
                            <i className="fas fa-spinner fa-spin"></i>
                          ) : (
                            <i className="fas fa-envelope-check"></i>
                          )}
                        </button>
                      )}
                      
                      <button
                        onClick={() => resetUserPassword(user.id)}
                        disabled={actionLoading === `reset-${user.id}`}
                        className="text-orange-600 hover:text-orange-900 disabled:opacity-50"
                        title="Réinitialiser le mot de passe"
                      >
                        {actionLoading === `reset-${user.id}` ? (
                          <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                          <i className="fas fa-key"></i>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
                  disabled={filters.page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setFilters({ ...filters, page: Math.min(pagination.totalPages, filters.page + 1) })}
                  disabled={filters.page === pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Suivant
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Affichage de <span className="font-medium">{((filters.page - 1) * pagination.limit) + 1}</span> à{' '}
                    <span className="font-medium">{Math.min(filters.page * pagination.limit, pagination.total)}</span> sur{' '}
                    <span className="font-medium">{pagination.total}</span> résultats
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setFilters({ ...filters, page })}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === filters.page
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}