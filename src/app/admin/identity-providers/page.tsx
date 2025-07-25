'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useToast } from '@/components/ui/Toast';

interface IdentityProvider {
  id: string;
  name: string;
  displayName: string;
  type: string;
  clientId: string;
  isEnabled: boolean;
  createdAt: string;
}

export default function IdentityProvidersPage() {
  const [providers, setProviders] = useState<IdentityProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProvider, setNewProvider] = useState({
    name: '',
    displayName: '',
    type: 'google',
    clientId: '',
    clientSecret: ''
  });
  const toast = useToast();

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/admin/identity-providers');
      if (response.ok) {
        const data = await response.json();
        setProviders(data.providers);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/identity-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProvider)
      });

      if (response.ok) {
        toast.success('Fournisseur créé', 'Le fournisseur d\'identité a été configuré avec succès');
        setShowCreateModal(false);
        setNewProvider({ name: '', displayName: '', type: 'google', clientId: '', clientSecret: '' });
        fetchProviders();
      } else {
        const errorData = await response.json();
        toast.error('Erreur de création', errorData.error || 'Impossible de créer le fournisseur');
      }
    } catch (error) {
      console.error('Error creating provider:', error);
      toast.error('Erreur de connexion', 'Impossible de communiquer avec le serveur');
    }
  };

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'google':
        return <i className="fab fa-google text-red-500"></i>;
      case 'facebook':
        return <i className="fab fa-facebook text-blue-600"></i>;
      case 'linkedin':
        return <i className="fab fa-linkedin text-blue-700"></i>;
      default:
        return <i className="fas fa-sign-in-alt text-gray-500"></i>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fournisseurs d'Identité</h1>
            <p className="text-gray-600">Gérez les connexions sociales (Google, Facebook, LinkedIn)</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            <i className="fas fa-plus mr-2"></i>
            Ajouter un fournisseur
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <i className="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
            <p className="text-gray-500 mt-2">Chargement des fournisseurs...</p>
          </div>
        ) : (
          <div className="card-elevated">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fournisseur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Créé le
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {providers.map((provider) => (
                    <tr key={provider.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-lg mr-3">
                            {getProviderIcon(provider.type)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {provider.displayName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {provider.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                          {provider.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                        {provider.clientId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          provider.isEnabled 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {provider.isEnabled ? 'Activé' : 'Désactivé'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(provider.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                  {providers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        <i className="fas fa-plug text-3xl mb-3 text-gray-300"></i>
                        <p>Aucun fournisseur d'identité configuré</p>
                        <p className="text-sm">Ajoutez Google, Facebook ou LinkedIn pour permettre la connexion sociale</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create Provider Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Ajouter un fournisseur d'identité</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <form onSubmit={handleCreateProvider} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de fournisseur
                  </label>
                  <select
                    value={newProvider.type}
                    onChange={(e) => setNewProvider({ ...newProvider, type: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="google">Google</option>
                    <option value="facebook">Facebook</option>
                    <option value="linkedin">LinkedIn</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom interne
                  </label>
                  <input
                    type="text"
                    value={newProvider.name}
                    onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                    className="input-field"
                    placeholder="google, facebook, linkedin..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom d'affichage
                  </label>
                  <input
                    type="text"
                    value={newProvider.displayName}
                    onChange={(e) => setNewProvider({ ...newProvider, displayName: e.target.value })}
                    className="input-field"
                    placeholder="Google, Facebook, LinkedIn..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client ID
                  </label>
                  <input
                    type="text"
                    value={newProvider.clientId}
                    onChange={(e) => setNewProvider({ ...newProvider, clientId: e.target.value })}
                    className="input-field"
                    placeholder="Client ID de l'application OAuth"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Secret
                  </label>
                  <input
                    type="password"
                    value={newProvider.clientSecret}
                    onChange={(e) => setNewProvider({ ...newProvider, clientSecret: e.target.value })}
                    className="input-field"
                    placeholder="Client Secret de l'application OAuth"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-secondary"
                  >
                    Annuler
                  </button>
                  <button type="submit" className="btn-primary">
                    <i className="fas fa-plus mr-2"></i>
                    Créer le fournisseur
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}