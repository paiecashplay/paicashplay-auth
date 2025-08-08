'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function GoogleCallbackContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        console.error('Google OAuth error:', error);
        window.location.href = `/login?error=${encodeURIComponent('Erreur d\'authentification Google')}`;
        return;
      }

      if (!code || !state) {
        console.error('Missing code or state parameter');
        window.location.href = `/login?error=${encodeURIComponent('Paramètres manquants')}`;
        return;
      }

      try {
        // Décoder l'état pour récupérer les informations
        let stateData;
        try {
          stateData = JSON.parse(atob(state));

        } catch {
          throw new Error('État invalide');
        }

        // Échanger le code contre un access token et traiter l'authentification
        const response = await fetch('/api/auth/social/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: 'google',
            code,
            state: stateData
          })
        });

        const data = await response.json();

        console.log("Response ",data)
        if (response.ok) {
          if (data.requiresSignup) {
            // Rediriger vers signup avec les données pré-remplies
            const params = new URLSearchParams({
              provider: 'google',
              socialData: JSON.stringify(data.socialData)
            });
            
            // Préserver la session OAuth si elle existe
            if (stateData.oauthSession) {
              params.set('oauth_session', stateData.oauthSession);
            }
            
            window.location.href = `/signup?${params.toString()}`;
          } else {
            // Connexion réussie - vérifier s'il y a une session OAuth
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
        console.error('Google callback error:', error);
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
          <p className="text-gray-600">Authentification Google en cours...</p>
          <p className="text-sm text-gray-500 mt-2">Veuillez patienter...</p>
        </div>
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
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
      <GoogleCallbackContent />
    </Suspense>
  );
}