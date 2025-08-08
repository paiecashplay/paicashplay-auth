'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { useToast } from '@/components/ui/Toast';
import CopyButton from '@/components/ui/CopyButton';

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

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const [client, setClient] = useState<OAuthClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const availableScopes = [
    { id: 'openid', name: 'OpenID Connect', description: 'Authentification de base', category: 'auth' },
    { id: 'profile', name: 'Profil', description: 'Accès au profil utilisateur', category: 'auth' },
    { id: 'email', name: 'Email', description: 'Accès à l\'adresse email', category: 'auth' },
    { id: 'users:read', name: 'Lecture utilisateurs', description: 'Lister les utilisateurs', category: 'users' },
    { id: 'users:write', name: 'Écriture utilisateurs', description: 'Créer/modifier des utilisateurs', category: 'users' },
    { id: 'clubs:read', name: 'Lecture clubs', description: 'Lister les clubs', category: 'clubs' },
    { id: 'clubs:write', name: 'Écriture clubs', description: 'Créer/modifier des clubs', category: 'clubs' },
    { id: 'clubs:members', name: 'Membres clubs', description: 'Accès aux membres des clubs', category: 'clubs' },
    { id: 'players:read', name: 'Lecture joueurs', description: 'Lister les joueurs', category: 'players' },
    { id: 'players:write', name: 'Écriture joueurs', description: 'Créer/modifier des joueurs', category: 'players' },
    { id: 'federations:read', name: 'Lecture fédérations', description: 'Lister les fédérations', category: 'federations' }
  ];

  const scopeCategories = {
    auth: { name: 'Authentification', icon: 'fas fa-shield-alt', color: 'blue' },
    users: { name: 'Utilisateurs', icon: 'fas fa-users', color: 'green' },
    clubs: { name: 'Clubs', icon: 'fas fa-futbol', color: 'purple' },
    players: { name: 'Joueurs', icon: 'fas fa-running', color: 'orange' },
    federations: { name: 'Fédérations', icon: 'fas fa-flag', color: 'red' }
  };

  useEffect(() => {
    fetchClient();
  }, [params.id]);

  const fetchClient = async () => {
    try {
      const response = await fetch(`/api/admin/clients/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setClient(data.client);
      } else {
        toast.error('Erreur', 'Client non trouvé');
        router.push('/admin/clients');
      }
    } catch (error) {
      toast.error('Erreur', 'Impossible de charger le client');
      router.push('/admin/clients');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!client) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/clients/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: client.name,
          description: client.description,
          redirectUris: client.redirect_uris,
          allowedScopes: client.allowed_scopes,
          isActive: client.is_active
        })
      });

      if (response.ok) {
        toast.success('Succès', 'Client modifié avec succès');
        router.push('/admin/clients');
      } else {
        const errorData = await response.json();
        toast.error('Erreur', errorData.error || 'Erreur lors de la modification');
      }
    } catch (error) {
      toast.error('Erreur', 'Erreur de connexion');
    } finally {
      setSaving(false);
    }
  };

  const addRedirectUri = () => {
    if (!client) return;
    setClient({
      ...client,
      redirect_uris: [...client.redirect_uris, '']
    });
  };

  const updateRedirectUri = (index: number, value: string) => {
    if (!client) return;
    const updated = [...client.redirect_uris];
    updated[index] = value;
    setClient({ ...client, redirect_uris: updated });
  };

  const removeRedirectUri = (index: number) => {
    if (!client) return;
    setClient({
      ...client,
      redirect_uris: client.redirect_uris.filter((_, i) => i !== index)
    });
  };

  const toggleScope = (scopeId: string) => {
    if (!client) return;
    const scopes = client.allowed_scopes.includes(scopeId)
      ? client.allowed_scopes.filter(s => s !== scopeId)
      : [...client.allowed_scopes, scopeId];
    setClient({ ...client, allowed_scopes: scopes });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!client) {
    return (
      <AdminLayout>
        <div className="text-center py-16">
          <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Client non trouvé</h2>
          <button onClick={() => router.push('/admin/clients')} className="btn-primary">
            Retour aux clients
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/admin/clients')}
              className="text-gray-500 hover:text-gray-700"
            >
              <i className="fas fa-arrow-left text-xl"></i>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Modifier le client OAuth</h1>
              <p className="text-gray-600">{client.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
              client.is_active 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              <i className={`fas ${client.is_active ? 'fa-check-circle' : 'fa-times-circle'} mr-2`}></i>
              {client.is_active ? 'Actif' : 'Inactif'}
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary disabled:opacity-50"
            >
              {saving ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Sauvegarde...
                </>
              ) : (
                <>
                  <i className="fas fa-save mr-2"></i>
                  Sauvegarder
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'general', name: 'Informations générales', icon: 'fas fa-info-circle' },
              { id: 'credentials', name: 'Identifiants', icon: 'fas fa-key' },
              { id: 'redirects', name: 'URLs de redirection', icon: 'fas fa-link' },
              { id: 'permissions', name: 'Permissions', icon: 'fas fa-shield-alt' },
              { id: 'advanced', name: 'Avancé', icon: 'fas fa-cog' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-paiecash text-paiecash'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <i className={`${tab.icon} mr-2`}></i>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {activeTab === 'general' && (
              <div className="card-elevated">
                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Nom de l'application
                    </label>
                    <input
                      type="text"
                      value={client.name}
                      onChange={(e) => setClient({ ...client, name: e.target.value })}
                      className="input-field"
                      placeholder="Mon Application"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Description
                    </label>
                    <textarea
                      value={client.description || ''}
                      onChange={(e) => setClient({ ...client, description: e.target.value })}
                      className="input-field"
                      rows={4}
                      placeholder="Description de votre application..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Date de création
                    </label>
                    <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded border">
                      {new Date(client.created_at).toLocaleString('fr-FR')}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'credentials' && (
              <div className="card-elevated">
                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Client ID
                    </label>
                    <div className="flex items-center">
                      <code className="flex-1 bg-gray-50 px-3 py-2 rounded text-sm font-mono text-gray-800 border">
                        {client.client_id}
                      </code>
                      <CopyButton text={client.client_id} className="ml-2" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Identifiant public de votre application
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Client Secret
                    </label>
                    <div className="flex items-center">
                      <code className="flex-1 bg-gray-50 px-3 py-2 rounded text-sm font-mono text-gray-800 border">
                        {client.client_secret.substring(0, 20)}...
                      </code>
                      <CopyButton text={client.client_secret} className="ml-2" />
                    </div>
                    <p className="text-xs text-red-500 mt-1">
                      <i className="fas fa-exclamation-triangle mr-1"></i>
                      Gardez ce secret confidentiel et sécurisé
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'redirects' && (
              <div className="card-elevated">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">URLs de redirection</h3>
                      <p className="text-sm text-gray-600">
                        URLs autorisées pour les callbacks OAuth
                      </p>
                    </div>
                    <button
                      onClick={addRedirectUri}
                      className="btn-secondary"
                    >
                      <i className="fas fa-plus mr-2"></i>
                      Ajouter
                    </button>
                  </div>

                  <div className="space-y-4">
                    {client.redirect_uris.map((uri, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="flex-1">
                          <input
                            type="url"
                            value={uri}
                            onChange={(e) => updateRedirectUri(index, e.target.value)}
                            className="input-field"
                            placeholder="https://monapp.com/callback"
                          />
                        </div>
                        {client.redirect_uris.length > 1 && (
                          <button
                            onClick={() => removeRedirectUri(index)}
                            className="text-red-600 hover:text-red-800 p-2"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'permissions' && (
              <div className="card-elevated">
                <div className="p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Permissions (Scopes)</h3>
                    <p className="text-sm text-gray-600">
                      Sélectionnez les permissions que cette application peut demander
                    </p>
                  </div>

                  <div className="space-y-6">
                    {Object.entries(scopeCategories).map(([categoryId, category]) => {
                      const categoryScopes = availableScopes.filter(s => s.category === categoryId);
                      return (
                        <div key={categoryId} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center mb-4">
                            <div className={`w-8 h-8 bg-${category.color}-100 rounded-lg flex items-center justify-center mr-3`}>
                              <i className={`${category.icon} text-${category.color}-600`}></i>
                            </div>
                            <h4 className="font-semibold text-gray-900">{category.name}</h4>
                          </div>
                          
                          <div className="grid gap-3">
                            {categoryScopes.map((scope) => (
                              <label key={scope.id} className="flex items-start space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                <input
                                  type="checkbox"
                                  checked={client.allowed_scopes.includes(scope.id)}
                                  onChange={() => toggleScope(scope.id)}
                                  className="mt-1"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">{scope.id}</code>
                                    <span className="font-medium text-gray-900">{scope.name}</span>
                                  </div>
                                  <div className="text-sm text-gray-600 mt-1">{scope.description}</div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="card-elevated">
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Paramètres avancés</h3>
                    
                    <div className="space-y-4">
                      <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">Client actif</div>
                          <div className="text-sm text-gray-600">
                            Désactiver temporairement ce client sans le supprimer
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={client.is_active}
                          onChange={(e) => setClient({ ...client, is_active: e.target.checked })}
                          className="toggle"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="card-elevated">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Résumé</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">URLs configurées</span>
                    <span className="font-medium">{client.redirect_uris.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Permissions</span>
                    <span className="font-medium">{client.allowed_scopes.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Statut</span>
                    <span className={`font-medium ${client.is_active ? 'text-green-600' : 'text-red-600'}`}>
                      {client.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card-elevated">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                <div className="space-y-3">
                  <button className="w-full btn-secondary">
                    <i className="fas fa-chart-bar mr-2"></i>
                    Voir les statistiques
                  </button>
                  <button className="w-full btn-secondary">
                    <i className="fas fa-history mr-2"></i>
                    Historique des tokens
                  </button>
                  <button className="w-full text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors">
                    <i className="fas fa-trash mr-2"></i>
                    Supprimer le client
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}