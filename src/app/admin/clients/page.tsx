'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface OAuthClient {
  id: string;
  client_id: string;
  client_secret: string;
  name: string;
  description?: string;
  redirect_uris: string[];
  allowed_scopes: string[];
  is_active: boolean;
  created_at: string;
}

export default function AdminClients() {
  const [clients, setClients] = useState<OAuthClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    description: '',
    redirectUris: ['']
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/admin/clients');
      const data = await response.json();
      
      if (response.ok) {
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newClient.name,
          description: newClient.description,
          redirectUris: newClient.redirectUris.filter(uri => uri.trim() !== '')
        })
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewClient({ name: '', description: '', redirectUris: [''] });
        fetchClients();
      }
    } catch (error) {
      console.error('Error creating client:', error);
    }
  };

  const addRedirectUri = () => {
    setNewClient({
      ...newClient,
      redirectUris: [...newClient.redirectUris, '']
    });
  };

  const updateRedirectUri = (index: number, value: string) => {
    const updated = [...newClient.redirectUris];
    updated[index] = value;
    setNewClient({ ...newClient, redirectUris: updated });
  };

  const removeRedirectUri = (index: number) => {
    setNewClient({
      ...newClient,
      redirectUris: newClient.redirectUris.filter((_, i) => i !== index)
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse">
          <div className="card">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="inline-flex items-center px-3 py-1 bg-blue-100 rounded-full text-blue-800 text-sm">
            <i className="fas fa-shield-alt mr-2"></i>
            OAuth 2.0 / OpenID Connect
          </div>
          <div className="text-sm text-gray-500">
            {clients.length} clients configurés
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          <i className="fas fa-plus mr-2"></i>
          Nouveau Client
        </button>
      </div>

      {/* Clients Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {clients.map((client) => (
          <div key={client.id} className="card-elevated">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <i className="fas fa-cube text-blue-600 text-xl"></i>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                  <p className="text-sm text-gray-500">{client.description || 'Aucune description'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {client.is_active ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                    <i className="fas fa-check-circle mr-1"></i>
                    Actif
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                    <i className="fas fa-times-circle mr-1"></i>
                    Inactif
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">CLIENT ID</label>
                <div className="flex items-center">
                  <code className="flex-1 bg-gray-50 px-3 py-2 rounded text-sm font-mono text-gray-800 border">
                    {client.client_id}
                  </code>
                  <button className="ml-2 text-gray-400 hover:text-gray-600">
                    <i className="fas fa-copy"></i>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">CLIENT SECRET</label>
                <div className="flex items-center">
                  <code className="flex-1 bg-gray-50 px-3 py-2 rounded text-sm font-mono text-gray-800 border">
                    {client.client_secret.substring(0, 20)}...
                  </code>
                  <button className="ml-2 text-gray-400 hover:text-gray-600">
                    <i className="fas fa-eye"></i>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">REDIRECT URIS</label>
                <div className="space-y-1">
                  {client.redirect_uris.map((uri, index) => (
                    <div key={index} className="text-sm bg-gray-50 px-3 py-2 rounded border font-mono text-gray-700">
                      {uri}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">SCOPES AUTORISÉS</label>
                <div className="flex flex-wrap gap-2">
                  {client.allowed_scopes.map((scope, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-paiecash/10 text-paiecash border border-paiecash/20">
                      {scope}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  Créé le {new Date(client.created_at).toLocaleDateString('fr-FR')}
                </div>
                <div className="flex items-center space-x-2">
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    <i className="fas fa-edit mr-1"></i>
                    Modifier
                  </button>
                  <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                    <i className="fas fa-trash mr-1"></i>
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {clients.length === 0 && (
        <div className="card-elevated text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-key text-2xl text-gray-400"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun client OAuth configuré</h3>
          <p className="text-gray-500 mb-6">Créez votre premier client pour permettre aux applications tierces de s'authentifier</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            <i className="fas fa-plus mr-2"></i>
            Créer un client
          </button>
        </div>
      )}

      {/* Create Client Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Nouveau Client OAuth</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateClient} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Nom de l'application
                </label>
                <input
                  type="text"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  className="input-field"
                  placeholder="Mon Application"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Description (optionnel)
                </label>
                <textarea
                  value={newClient.description}
                  onChange={(e) => setNewClient({ ...newClient, description: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="Description de votre application..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  URLs de redirection
                </label>
                <div className="space-y-3">
                  {newClient.redirectUris.map((uri, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="url"
                        value={uri}
                        onChange={(e) => updateRedirectUri(index, e.target.value)}
                        className="input-field"
                        placeholder="https://monapp.com/callback"
                        required
                      />
                      {newClient.redirectUris.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRedirectUri(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addRedirectUri}
                    className="text-paiecash hover:text-paiecash-dark text-sm font-medium"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Ajouter une URL
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Créer le client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}