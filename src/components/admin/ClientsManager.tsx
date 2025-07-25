'use client';

import { useState, useEffect } from 'react';

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

export default function ClientsManager() {
  const [clients, setClients] = useState<OAuthClient[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSecretModal, setShowSecretModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    redirectUris: [''],
    allowedScopes: ['openid', 'profile', 'email']
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const response = await fetch('/api/admin/clients');
      const data = await response.json();
      setClients(data.clients);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const createClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          redirectUris: formData.redirectUris.filter(uri => uri.trim()),
          allowedScopes: formData.allowedScopes
        })
      });

      if (response.ok) {
        const data = await response.json();
        setShowCreateModal(false);
        setShowSecretModal(data.client.clientSecret);
        loadClients();
        setFormData({ name: '', description: '', redirectUris: [''], allowedScopes: ['openid', 'profile', 'email'] });
      }
    } catch (error) {
      console.error('Error creating client:', error);
    }
  };

  const toggleClientStatus = async (clientId: string, isActive: boolean) => {
    try {
      await fetch(`/api/admin/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive })
      });
      loadClients();
    } catch (error) {
      console.error('Error updating client:', error);
    }
  };

  const addRedirectUri = () => {
    setFormData({ ...formData, redirectUris: [...formData.redirectUris, ''] });
  };

  const updateRedirectUri = (index: number, value: string) => {
    const newUris = [...formData.redirectUris];
    newUris[index] = value;
    setFormData({ ...formData, redirectUris: newUris });
  };

  const removeRedirectUri = (index: number) => {
    const newUris = formData.redirectUris.filter((_, i) => i !== index);
    setFormData({ ...formData, redirectUris: newUris });
  };

  if (loading) {
    return <div className="flex justify-center py-8">
      <i className="fas fa-spinner fa-spin text-2xl text-blue-500"></i>
    </div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Clients OAuth</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          <i className="fas fa-plus mr-2"></i>
          Nouveau Client
        </button>
      </div>

      {/* Clients List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Redirect URIs</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scopes</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clients.map((client) => (
              <tr key={client.id}>
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-gray-900">{client.name}</div>
                    {client.description && (
                      <div className="text-sm text-gray-500">{client.description}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-mono text-gray-900">
                  {client.client_id}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {client.redirect_uris.map((uri, index) => (
                      <div key={index} className="truncate max-w-xs">{uri}</div>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {client.allowed_scopes.map((scope) => (
                      <span key={scope} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {scope}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    client.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {client.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-medium space-x-2">
                  <button
                    onClick={() => toggleClientStatus(client.client_id, client.is_active)}
                    className={`${
                      client.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                    }`}
                  >
                    {client.is_active ? 'Désactiver' : 'Activer'}
                  </button>
                  <button
                    onClick={() => setShowSecretModal(client.client_secret)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Voir Secret
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Client Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Créer un nouveau client OAuth</h2>
            <form onSubmit={createClient}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows={3}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Redirect URIs</label>
                {formData.redirectUris.map((uri, index) => (
                  <div key={index} className="flex mb-2">
                    <input
                      type="url"
                      value={uri}
                      onChange={(e) => updateRedirectUri(index, e.target.value)}
                      className="flex-1 border border-gray-300 rounded px-3 py-2"
                      placeholder="https://example.com/callback"
                      required
                    />
                    {formData.redirectUris.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRedirectUri(index)}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addRedirectUri}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Ajouter une URI
                </button>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Secret Modal */}
      {showSecretModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Client Secret</h2>
            <div className="bg-gray-100 p-3 rounded font-mono text-sm break-all">
              {showSecretModal}
            </div>
            <p className="text-sm text-red-600 mt-2">
              ⚠️ Copiez ce secret maintenant. Il ne sera plus affiché.
            </p>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowSecretModal(null)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}