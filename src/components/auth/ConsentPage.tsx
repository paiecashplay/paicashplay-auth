'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ConsentPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  
  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const scope = searchParams.get('scope');
  const state = searchParams.get('state');
  
  const scopes = scope?.split(' ') || [];
  const scopeDescriptions = {
    openid: 'Accéder à votre identité',
    profile: 'Accéder à vos informations de profil (nom, prénom)',
    email: 'Accéder à votre adresse email'
  };

  const handleConsent = async (approved: boolean) => {
    setLoading(true);
    
    if (!approved) {
      // Redirect with error
      const errorUrl = new URL(redirectUri!);
      errorUrl.searchParams.set('error', 'access_denied');
      if (state) errorUrl.searchParams.set('state', state);
      window.location.href = errorUrl.toString();
      return;
    }
    
    // Submit consent
    const formData = new FormData();
    formData.append('client_id', clientId!);
    formData.append('redirect_uri', redirectUri!);
    formData.append('scope', scope!);
    if (state) formData.append('state', state);
    formData.append('user_id', 'current_user_id'); // TODO: Get from session
    
    try {
      const response = await fetch('/api/auth/authorize', {
        method: 'POST',
        body: formData
      });
      
      if (response.redirected) {
        window.location.href = response.url;
      }
    } catch (error) {
      console.error('Consent error:', error);
    }
    
    setLoading(false);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-blue-500 rounded mr-3"></div>
            <h1 className="text-xl font-bold text-gray-800">PaieCashPlay Fondation</h1>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-center mb-8">
            <div className="bg-blue-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-shield-alt text-blue-500 text-2xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Autorisation requise</h2>
            <p className="text-gray-600">
              L'application <strong>{clientId}</strong> souhaite accéder à votre compte
            </p>
          </div>

          <div className="mb-8">
            <h3 className="font-semibold text-gray-800 mb-4">Permissions demandées :</h3>
            <div className="space-y-3">
              {scopes.map((scopeItem) => (
                <div key={scopeItem} className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-3"></i>
                  <span className="text-gray-700">
                    {scopeDescriptions[scopeItem as keyof typeof scopeDescriptions] || scopeItem}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleConsent(true)}
              disabled={loading}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Autorisation...' : 'Autoriser'}
            </button>
            
            <button
              onClick={() => handleConsent(false)}
              disabled={loading}
              className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              Refuser
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>En autorisant, vous acceptez que cette application accède aux informations sélectionnées.</p>
          </div>
        </div>
      </main>
    </div>
  );
}