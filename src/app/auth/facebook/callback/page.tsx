'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function FacebookCallbackContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        console.error('Facebook OAuth error:', error);
        window.location.href = `/login?error=${encodeURIComponent('Erreur d\'authentification Facebook')}`;
        return;
      }

      if (!code || !state) {
        console.error('Missing code or state parameter');
        window.location.href = `/login?error=${encodeURIComponent('Paramètres manquants')}`;
        return;
      }

      try {
        let stateData;
        try {
          stateData = JSON.parse(atob(state));
        } catch {
          throw new Error('État invalide');
        }

        const response = await fetch('/api/auth/social/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: 'facebook',
            code,
            state: stateData
          })
        });

        const data = await response.json();

        if (response.ok) {
          if (data.requiresSignup) {
            const params = new URLSearchParams({
              provider: 'facebook',
              socialData: JSON.stringify(data.socialData)
            });
            
            // Préserver les paramètres OAuth s'ils existent
            const originalParams = new URLSearchParams(window.location.search);
            const clientId = originalParams.get('client_id');
            const redirectUri = originalParams.get('redirect_uri');
            const scope = originalParams.get('scope');
            const oauthState = originalParams.get('state');
            
            if (clientId) params.set('client_id', clientId);
            if (redirectUri) params.set('redirect_uri', redirectUri);
            if (scope) params.set('scope', scope);
            if (oauthState) params.set('oauth_state', oauthState);
            
            window.location.href = `/signup?${params.toString()}`;
          } else {
            // Connexion réussie - vérifier s'il y a des paramètres OAuth
            const originalParams = new URLSearchParams(window.location.search);
            const clientId = originalParams.get('client_id');
            const redirectUri = originalParams.get('redirect_uri');
            const scope = originalParams.get('scope');
            const oauthState = originalParams.get('state');
            
            if (clientId && redirectUri) {
              // Flux OAuth - rediriger vers l'endpoint d'autorisation
              const authorizeUrl = new URL('/api/auth/authorize', window.location.origin);
              authorizeUrl.searchParams.set('response_type', 'code');
              authorizeUrl.searchParams.set('client_id', clientId);
              authorizeUrl.searchParams.set('redirect_uri', redirectUri);
              if (scope) authorizeUrl.searchParams.set('scope', scope);
              if (oauthState) authorizeUrl.searchParams.set('state', oauthState);
              
              window.location.href = authorizeUrl.toString();
            } else {
              // Connexion directe - rediriger vers le dashboard
              window.location.href = '/dashboard';
            }
          }
        } else {
          throw new Error(data.error || 'Erreur d\'authentification');
        }
      } catch (error: any) {
        console.error('Facebook callback error:', error);
        const errorMessage = encodeURIComponent(error.message || 'Erreur d\'authentification');
        window.location.href = `/login?error=${errorMessage}`;
      }
    };

    handleCallback();
  }, [searchParams]);

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center">
      <div className="card-elevated w-full max-w-md">
        <div className="text-center py-8">
          <i className="fas fa-spinner fa-spin text-paiecash text-2xl mb-4"></i>
          <p className="text-gray-600">Authentification Facebook en cours...</p>
          <p className="text-sm text-gray-500 mt-2">Veuillez patienter...</p>
        </div>
      </div>
    </div>
  );
}

export default function FacebookCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="card-elevated w-full max-w-md">
          <div className="text-center py-8">
            <i className="fas fa-spinner fa-spin text-paiecash text-2xl mb-4"></i>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      </div>
    }>
      <FacebookCallbackContent />
    </Suspense>
  );
}