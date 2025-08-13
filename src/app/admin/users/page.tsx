'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
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

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; user: User | null }>({ show: false, user: null });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    fetchUsers();
  }, [page, typeFilter]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (filter.trim()) {
        searchUsers();
      } else {
        fetchUsers();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filter]);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      if (typeFilter) params.append('userType', typeFilter);

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setUsers(data.users || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!filter.trim()) {
      fetchUsers();
      return;
    }

    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '20',
        search: filter.trim()
      });
      if (typeFilter) params.append('userType', typeFilter);

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setUsers(data.users || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setPage(1);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const getUserTypeIcon = (type: string) => {
    switch (type) {
      case 'donor': return 'fas fa-heart';
      case 'player': return 'fas fa-running';
      case 'club': return 'fas fa-users';
      case 'federation': return 'fas fa-flag';
      case 'company': return 'fas fa-building';
      case 'affiliate': return 'fas fa-star';
      default: return 'fas fa-user';
    }
  };

  const getUserTypeColor = (type: string) => {
    switch (type) {
      case 'donor': return 'text-red-600 bg-red-100 border-red-200';
      case 'player': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'club': return 'text-green-600 bg-green-100 border-green-200';
      case 'federation': return 'text-purple-600 bg-purple-100 border-purple-200';
      case 'company': return 'text-indigo-600 bg-indigo-100 border-indigo-200';
      case 'affiliate': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getUserTypeLabel = (type: string) => {
    switch (type) {
      case 'donor': return 'Donateur';
      case 'player': return 'Licencié';
      case 'club': return 'Club';
      case 'federation': return 'Fédération';
      case 'company': return 'Société';
      case 'affiliate': return 'Ambassadeur';
      default: return type;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse">
          <div className="card">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    setActionLoading(userId);
    
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (response.ok) {
        toast.success(
          'Succès', 
          `Compte ${!currentStatus ? 'activé' : 'suspendu'} avec succès`
        );
        fetchUsers(); // Recharger la liste
      } else {
        const data = await response.json();
        toast.error('Erreur', data.error || 'Impossible de modifier le statut');
      }
    } catch (error) {
      toast.error('Erreur de connexion', 'Impossible de modifier le statut');
    } finally {
      setActionLoading(null);
    }
  };

  const confirmDeleteUser = (user: User) => {
    setDeleteModal({ show: true, user });
  };

  const deleteUser = async () => {
    if (!deleteModal.user) return;
    
    setActionLoading(deleteModal.user.id);
    
    try {
      const response = await fetch(`/api/admin/users/${deleteModal.user.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Succès', 'Utilisateur supprimé avec succès');
        setDeleteModal({ show: false, user: null });
        fetchUsers(); // Recharger la liste
      } else {
        const data = await response.json();
        toast.error('Erreur', data.error || 'Impossible de supprimer l\'utilisateur');
      }
    } catch (error) {
      toast.error('Erreur de connexion', 'Impossible de supprimer l\'utilisateur');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <AdminLayout>
      {/* Header avec bouton d'ajout */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
          <p className="text-gray-600">Administrer les comptes utilisateurs de la plateforme</p>
        </div>
        <button 
          onClick={() => router.push('/admin/users/new')}
          className="btn-primary"
        >
          <i className="fas fa-plus mr-2"></i>
          Nouvel utilisateur
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder="Rechercher par email ou nom..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input-field pl-10"
            />
            {filter && (
              <button
                onClick={() => setFilter('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="input-field w-48"
        >
          <option value="">Tous les types</option>
          <option value="donor">Donateur</option>
          <option value="player">Joueur</option>
          <option value="club">Club</option>
          <option value="federation">Fédération</option>
          <option value="company">Société</option>
          <option value="affiliate">Ambassadeur</option>
        </select>
        <div className="flex items-center space-x-4">
          <button
            onClick={fetchUsers}
            className="btn-secondary px-3 py-2"
            title="Actualiser la liste"
          >
            <i className="fas fa-sync-alt"></i>
          </button>
          <div className="text-sm text-gray-500">
            {users.length} utilisateurs • Page {page} sur {totalPages}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Inscription
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user, index) => (
                <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${actionLoading === user.id ? 'opacity-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-paiecash/10 rounded-full flex items-center justify-center mr-4">
                        <i className="fas fa-user text-paiecash"></i>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.first_name && user.last_name 
                            ? `${user.first_name} ${user.last_name}`
                            : 'Nom non renseigné'
                          }
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getUserTypeColor(user.user_type)}`}>
                      <i className={`${getUserTypeIcon(user.user_type)} mr-2`}></i>
                      {getUserTypeLabel(user.user_type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {user.is_verified ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          <i className="fas fa-check-circle mr-1"></i>
                          Vérifié
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                          <i className="fas fa-clock mr-1"></i>
                          En attente
                        </span>
                      )}
                      {user.is_active ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                          <i className="fas fa-circle mr-1 text-xs"></i>
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                          <i className="fas fa-ban mr-1"></i>
                          Suspendu
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => router.push(`/admin/users/${user.id}`)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                        title="Modifier l'utilisateur"
                      >
                        <i className="fas fa-edit mr-1"></i>
                        Modifier
                      </button>
                      <button 
                        onClick={() => toggleUserStatus(user.id, user.is_active)}
                        className={`text-sm font-medium transition-colors ${
                          user.is_active 
                            ? 'text-orange-600 hover:text-orange-800' 
                            : 'text-green-600 hover:text-green-800'
                        }`}
                        title={user.is_active ? 'Suspendre le compte' : 'Activer le compte'}
                      >
                        <i className={`fas ${user.is_active ? 'fa-ban' : 'fa-check'} mr-1`}></i>
                        {user.is_active ? 'Suspendre' : 'Activer'}
                      </button>
                      <button 
                        onClick={() => confirmDeleteUser(user)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                        title="Supprimer l'utilisateur"
                      >
                        <i className="fas fa-trash mr-1"></i>
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-users text-2xl text-gray-400"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun utilisateur trouvé</h3>
            <p className="text-gray-500">Les utilisateurs apparaîtront ici une fois inscrits</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="btn-secondary disabled:opacity-50"
              >
                Précédent
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="btn-secondary disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Page <span className="font-medium">{page}</span> sur{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="btn-secondary disabled:opacity-50 px-4 py-2"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="btn-secondary disabled:opacity-50 px-4 py-2"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmation de suppression */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Confirmer la suppression</h3>
                  <p className="text-sm text-gray-600">Cette action est irréversible</p>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800 mb-2">
                  <strong>Utilisateur à supprimer :</strong>
                </p>
                <div className="text-sm text-red-700">
                  <div className="font-medium">
                    {deleteModal.user?.first_name && deleteModal.user?.last_name 
                      ? `${deleteModal.user.first_name} ${deleteModal.user.last_name}`
                      : 'Nom non renseigné'
                    }
                  </div>
                  <div className="text-red-600">{deleteModal.user?.email}</div>
                  <div className="text-xs mt-1 text-red-500">
                    Type: {deleteModal.user?.user_type} • 
                    Inscrit le {deleteModal.user ? new Date(deleteModal.user.created_at).toLocaleDateString('fr-FR') : ''}
                  </div>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Êtes-vous sûr de vouloir supprimer définitivement cet utilisateur ? 
                Toutes ses données (profil, sessions, historique) seront perdues.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setDeleteModal({ show: false, user: null })}
                  className="flex-1 btn-secondary"
                  disabled={actionLoading === deleteModal.user?.id}
                >
                  <i className="fas fa-times mr-2"></i>
                  Annuler
                </button>
                <button
                  onClick={deleteUser}
                  disabled={actionLoading === deleteModal.user?.id}
                  className="flex-1 bg-red-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {actionLoading === deleteModal.user?.id ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Suppression...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-trash mr-2"></i>
                      Supprimer définitivement
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}