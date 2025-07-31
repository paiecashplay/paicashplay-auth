'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Logo from '@/components/ui/Logo';
import { useToast } from '@/components/ui/Toast';

interface ClientInfo {
  name: string;
  description?: string;
  logoUrl?: string;
  website?: string;
}

export default function ConsentPage() {
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [scopes, setScopes] = useState<string[]>([]);
  const [error, setError] = useState('');
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();

  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const scope = searchParams.get('scope');
  const state = searchParams.get('state');

  useEffect(() => {
    if (!clientId) {
      setError('Client ID manquant');
      setLoading(false);
      return;
    }
    
    loadClientInfo();
  }, [clientId]);

  const loadClientInfo = async () => {
    try {
      const response = await fetch(`/api/auth/client-info?client_id=${clientId}`);
      const data = await response.json();

      if (response.ok) {
        setClientInfo(data.client);
        setScopes(scope?.split(' ') || []);
      } else {
        setError(data.error || 'Client non trouvé');
      }
    } catch (error) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setApproving(true);
    
    try {
      const response = await fetch('/api/auth/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          redirect_uri: redirectUri,
          scope: scope,
          state: state,
          approved: true
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Redirection avec le code d'autorisation
        window.location.href = data.redirectUrl;
      } else {
        toast.error('Erreur', data.error || 'Impossible d\'approuver l\'autorisation');
      }
    } catch (error) {
      toast.error('Erreur de connexion', 'Veuillez réessayer');
    } finally {
      setApproving(false);
    }
  };

  const handleDeny = () => {
    const url = new URL(redirectUri || '/');
    url.searchParams.set('error', 'access_denied');
    if (state) url.searchParams.set('state', state);
    window.location.href = url.toString();
  };

  const getScopeDescription = (scope: string) => {
    const descriptions: Record<string, string> = {
      'openid': 'Vérifier votre identité',
      'profile': 'Accéder à vos informations de profil (nom, type de compte)',
      'email': 'Accéder à votre adresse email'
    };
    return descriptions[scope] || scope;
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Logo size="lg" className="justify-center mb-6" />
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-spinner fa-spin text-blue-600 text-2xl"></i>
            </div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Logo size="lg" className="justify-center mb-6" />
          </div>

          <div className="card-elevated text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-times text-red-600 text-2xl"></i>
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-4">Erreur d'autorisation</h2>
            <p className="text-gray-600 mb-6">{error}</p>

            <button
              onClick={() => router.push('/login')}
              className="btn-secondary w-full"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Logo size="lg" className="justify-center mb-6" />
        </div>

        <div className="card-elevated">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-shield-alt text-blue-600 text-2xl"></i>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Autorisation requise</h2>
            <p className="text-gray-600">
              <strong>{clientInfo?.name}</strong> souhaite accéder à votre compte PaieCashPlay
            </p>
          </div>

          {clientInfo?.description && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">{clientInfo.description}</p>
            </div>
          )}

          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Cette application pourra :</h3>
            <ul className="space-y-2">
              {scopes.map((scope) => (
                <li key={scope} className="flex items-center text-sm text-gray-700">
                  <i className="fas fa-check text-green-500 mr-3"></i>
                  {getScopeDescription(scope)}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleApprove}
              disabled={approving}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {approving ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Autorisation en cours...
                </>
              ) : (
                <>
                  <i className="fas fa-check mr-2"></i>
                  Autoriser l'accès
                </>
              )}
            </button>
            
            <button
              onClick={handleDeny}
              disabled={approving}
              className="btn-secondary w-full"
            >
              <i className="fas fa-times mr-2"></i>
              Refuser
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              En autorisant, vous acceptez que {clientInfo?.name} accède aux informations sélectionnées selon nos{' '}
              <a href="#" className="text-paiecash hover:text-paiecash-dark">conditions d'utilisation</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}