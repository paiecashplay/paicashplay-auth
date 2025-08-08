'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function LinkedInCallbackContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        console.error('LinkedIn OAuth error:', error);
        window.location.href = `/login?error=${encodeURIComponent('Erreur d\'authentification LinkedIn')}`;
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
            provider: 'linkedin',
            code,
            state: stateData
          })
        });

        const data = await response.json();

        if (response.ok) {
          if (data.requiresSignup) {
            const params = new URLSearchParams({
              provider: 'linkedin',
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
            
            if (stateData.oauthSession) {
              // Flux OAuth - rediriger vers l'endpoint continue
              window.location.href = `/api/auth/continue?oauth_session=${stateData.oauthSession}`;
            } else {
              // Connexion directe - rediriger vers le dashboard
              window.location.href = '/dashboard';
            }
          }
        } else {
          throw new Error(data.error || 'Erreur d\'authentification');
        }
      } catch (error: any) {
        console.error('LinkedIn callback error:', error);
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
          <p className="text-gray-600">Authentification LinkedIn en cours...</p>
          <p className="text-sm text-gray-500 mt-2">Veuillez patienter...</p>
        </div>
      </div>
    </div>
  );
}

export default function LinkedInCallbackPage() {
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
      <LinkedInCallbackContent />
    </Suspense>
  );
}