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
        if (window.opener && (window.opener as any).googleAuthCallbacks) {
          (window.opener as any).googleAuthCallbacks.reject(new Error(`Google OAuth error: ${error}`));
        }
        window.close();
        return;
      }

      if (!code) {
        if (window.opener && (window.opener as any).googleAuthCallbacks) {
          (window.opener as any).googleAuthCallbacks.reject(new Error('No authorization code received'));
        }
        window.close();
        return;
      }

      try {
        // Échanger le code contre un access token
        const tokenResponse = await fetch('/api/auth/google/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, state })
        });

        const tokenData = await tokenResponse.json();

        if (tokenResponse.ok && tokenData.access_token) {
          // Retourner le token à la fenêtre parent
          if (window.opener && (window.opener as any).googleAuthCallbacks) {
            (window.opener as any).googleAuthCallbacks.resolve(tokenData.access_token);
          }
        } else {
          throw new Error(tokenData.error || 'Failed to get access token');
        }
      } catch (error: any) {
        if (window.opener && (window.opener as any).googleAuthCallbacks) {
          (window.opener as any).googleAuthCallbacks.reject(error);
        }
      }

      window.close();
    };

    handleCallback();
  }, [searchParams]);

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center">
      <div className="card-elevated w-full max-w-md">
        <div className="text-center py-8">
          <i className="fas fa-spinner fa-spin text-paiecash text-2xl mb-4"></i>
          <p className="text-gray-600">Authentification Google en cours...</p>
          <p className="text-sm text-gray-500 mt-2">Cette fenêtre va se fermer automatiquement</p>
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