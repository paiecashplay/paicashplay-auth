'use client';

import { useState, useEffect } from 'react';
import SocialAuth from '@/components/auth/SocialAuth';

export default function TestSocialPage() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/auth/social');
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

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="card-elevated">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Test des Providers Sociaux</h1>
            <p className="text-gray-600">Vérification de l'affichage des providers actifs</p>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <i className="fas fa-spinner fa-spin text-paiecash text-2xl mb-4"></i>
              <p className="text-gray-600">Chargement des providers...</p>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Providers actifs ({providers.length})
                </h3>
                {providers.length > 0 ? (
                  <div className="space-y-2">
                    {providers.map((provider: any) => (
                      <div key={provider.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <i className={`fab fa-${provider.type} text-xl mr-3 ${
                            provider.type === 'google' ? 'text-red-500' :
                            provider.type === 'facebook' ? 'text-blue-600' :
                            provider.type === 'linkedin' ? 'text-blue-700' : 'text-gray-500'
                          }`}></i>
                          <span className="font-medium">{provider.displayName}</span>
                        </div>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Actif
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <i className="fas fa-exclamation-triangle text-yellow-500 text-2xl mb-4"></i>
                    <p className="text-gray-600">Aucun provider social actif</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Configurez et activez les providers dans l'administration
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Composant d'authentification
                </h3>
                <SocialAuth 
                  mode="login"
                  onSuccess={(user) => console.log('Success:', user)}
                  onError={(error) => console.error('Error:', error)}
                />
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t text-center">
            <a href="/admin/social-providers" className="btn-secondary">
              <i className="fas fa-cog mr-2"></i>
              Administration des providers
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}