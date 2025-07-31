'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useToast } from '@/components/ui/Toast';

interface SocialProvider {
  id: string;
  name: string;
  displayName: string;
  type: string;
  clientId: string;
  clientSecret: string;
  isEnabled: boolean;
  config: any;
}

export default function SocialProvidersPage() {
  const [providers, setProviders] = useState<SocialProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/admin/identity-providers');
      const data = await response.json();
      
      if (response.ok) {
        setProviders(data.providers || []);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProvider = async (providerId: string, updates: Partial<SocialProvider>) => {
    setSaving(providerId);
    
    try {
      const response = await fetch(`/api/admin/identity-providers/${providerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Succès', 'Provider mis à jour avec succès');
        fetchProviders();
      } else {
        toast.error('Erreur', data.error || 'Impossible de mettre à jour le provider');
      }
    } catch (error) {
      toast.error('Erreur de connexion', 'Impossible de sauvegarder les modifications');
    } finally {
      setSaving(null);
    }
  };

  const toggleProvider = async (provider: SocialProvider) => {
    await updateProvider(provider.id, { isEnabled: !provider.isEnabled });
  };

  const testProvider = async (provider: SocialProvider) => {
    try {
      const response = await fetch('/api/auth/social');
      const data = await response.json();
      
      if (response.ok) {
        const activeProviders = data.providers || [];
        const isVisible = activeProviders.some((p: any) => p.name === provider.name);
        
        if (isVisible) {
          toast.success('Test réussi', `${provider.displayName} est visible sur le frontend`);
        } else {
          toast.error('Test échoué', `${provider.displayName} n'est pas visible. Vérifiez la configuration.`);
        }
      } else {
        toast.error('Erreur de test', 'Impossible de vérifier l\'affichage frontend');
      }
    } catch (error) {
      toast.error('Erreur de connexion', 'Impossible de tester l\'affichage');
    }
  };

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'google': return 'fab fa-google text-red-500';
      case 'facebook': return 'fab fa-facebook-f text-blue-600';
      case 'linkedin': return 'fab fa-linkedin-in text-blue-700';
      default: return 'fas fa-sign-in-alt text-gray-500';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse">
          <div className="card mb-6">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Providers d'authentification sociale</h1>
          <p className="text-gray-600">Configurer les connexions avec les réseaux sociaux</p>
        </div>
        <div className="flex items-center space-x-3">
          <a href="/test-social" target="_blank" className="btn-secondary">
            <i className="fas fa-eye mr-2"></i>
            Tester l'affichage
          </a>
          <button
            onClick={fetchProviders}
            className="btn-secondary"
          >
            <i className="fas fa-sync-alt mr-2"></i>
            Actualiser
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {providers.map((provider) => (
          <div key={provider.id} className="card-elevated">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                  <i className={`${getProviderIcon(provider.type)} text-xl`}></i>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{provider.displayName}</h3>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      provider.isEnabled 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {provider.isEnabled ? 'Activé' : 'Désactivé'}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      provider.clientId && provider.clientSecret
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {provider.clientId && provider.clientSecret ? 'Configuré' : 'Non configuré'}
                    </span>
                  </div>
                </div>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={provider.isEnabled}
                  onChange={() => toggleProvider(provider)}
                  disabled={saving === provider.id}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-paiecash/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-paiecash disabled:opacity-50"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Client ID
                </label>
                <input
                  type="text"
                  value={provider.clientId}
                  onChange={(e) => {
                    const updatedProviders = providers.map(p => 
                      p.id === provider.id ? { ...p, clientId: e.target.value } : p
                    );
                    setProviders(updatedProviders);
                  }}
                  className="input-field"
                  placeholder={`${provider.displayName} Client ID`}
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Client Secret
                </label>
                <input
                  type="password"
                  value={provider.clientSecret}
                  onChange={(e) => {
                    const updatedProviders = providers.map(p => 
                      p.id === provider.id ? { ...p, clientSecret: e.target.value } : p
                    );
                    setProviders(updatedProviders);
                  }}
                  className="input-field"
                  placeholder={`${provider.displayName} Client Secret`}
                />
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => updateProvider(provider.id, {
                  clientId: provider.clientId,
                  clientSecret: provider.clientSecret
                })}
                disabled={saving === provider.id}
                className="btn-primary disabled:opacity-50"
              >
                {saving === provider.id ? (
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
              
              <button
                onClick={() => testProvider(provider)}
                className="btn-secondary"
                disabled={!provider.isEnabled || !provider.clientId}
              >
                <i className="fas fa-eye mr-2"></i>
                Tester l'affichage
              </button>
            </div>

            {provider.name === 'google' && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Configuration Google</h4>
                <p className="text-sm text-blue-700 mb-2">
                  1. Allez sur <a href="https://console.developers.google.com" target="_blank" className="underline">Google Cloud Console</a>
                </p>
                <p className="text-sm text-blue-700 mb-2">
                  2. Créez un projet et activez l'API Google+ 
                </p>
                <p className="text-sm text-blue-700 mb-2">
                  3. Configurez l'écran de consentement OAuth
                </p>
                <p className="text-sm text-blue-700 mb-2">
                  4. <strong>URLs de redirection autorisées :</strong>
                </p>
                <div className="bg-white p-2 rounded border text-xs font-mono text-gray-800">
                  {typeof window !== 'undefined' ? `${window.location.origin}/auth/google/callback` : 'http://localhost:3000/auth/google/callback'}
                </div>
              </div>
            )}

            {provider.name === 'facebook' && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Configuration Facebook</h4>
                <p className="text-sm text-blue-700 mb-2">
                  1. Allez sur <a href="https://developers.facebook.com" target="_blank" className="underline">Facebook Developers</a>
                </p>
                <p className="text-sm text-blue-700 mb-2">
                  2. Créez une application et configurez Facebook Login
                </p>
                <p className="text-sm text-blue-700">
                  3. Ajoutez vos domaines dans les paramètres de l'application
                </p>
              </div>
            )}

            {provider.name === 'linkedin' && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Configuration LinkedIn</h4>
                <p className="text-sm text-blue-700 mb-2">
                  1. Allez sur <a href="https://www.linkedin.com/developers" target="_blank" className="underline">LinkedIn Developers</a>
                </p>
                <p className="text-sm text-blue-700 mb-2">
                  2. Créez une application et demandez l'accès aux APIs
                </p>
                <p className="text-sm text-blue-700">
                  3. Configurez les URLs de redirection autorisées
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}