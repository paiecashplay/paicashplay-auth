'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';

interface SocialProvider {
  name: string;
  displayName: string;
  type: string;
  config: any;
}

interface SocialAuthProps {
  mode: 'login' | 'signup';
  userType?: string;
  additionalData?: any;
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
}

export default function SocialAuth({ 
  mode, 
  userType = 'donor', 
  additionalData = {}, 
  onSuccess, 
  onError 
}: SocialAuthProps) {
  const [providers, setProviders] = useState<SocialProvider[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const toast = useToast();

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
    }
  };

  const handleSocialAuth = async (provider: SocialProvider) => {
    setLoading(provider.name);

    try {
      // Étape 1: Obtenir le token d'accès du provider
      const accessToken = await getAccessTokenFromProvider(provider);
      
      if (!accessToken) {
        throw new Error('Impossible d\'obtenir le token d\'accès');
      }

      // Étape 2: Authentifier avec notre API
      const response = await fetch('/api/auth/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: provider.name,
          access_token: accessToken,
          userType,
          additionalData
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Succès', data.message);
        onSuccess?.(data.user);
      } else {
        throw new Error(data.error || 'Erreur d\'authentification');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur de connexion';
      toast.error('Erreur', errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(null);
    }
  };

  const getAccessTokenFromProvider = async (provider: SocialProvider): Promise<string | null> => {
    return new Promise((resolve, reject) => {
      switch (provider.name) {
        case 'google':
          handleGoogleAuth(resolve, reject);
          break;
        case 'facebook':
          handleFacebookAuth(resolve, reject);
          break;
        case 'linkedin':
          handleLinkedInAuth(resolve, reject);
          break;
        default:
          reject(new Error(`Provider ${provider.name} non supporté`));
      }
    });
  };

  const handleGoogleAuth = (resolve: (token: string) => void, reject: (error: Error) => void) => {
    // Redirection vers Google OAuth
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      reject(new Error('Google Client ID non configuré'));
      return;
    }
    
    const redirectUri = encodeURIComponent(`${window.location.origin}/auth/google/callback`);
    const scope = encodeURIComponent('openid email profile');
    const state = Math.random().toString(36).substring(7);
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
    
    // Stocker les callbacks pour le retour
    (window as any).googleAuthCallbacks = { resolve, reject };
    
    // Ouvrir popup ou rediriger
    const popup = window.open(authUrl, 'google-auth', 'width=500,height=600');
    
    // Vérifier la fermeture du popup
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed);
        reject(new Error('Authentification Google annulée'));
      }
    }, 1000);
  };

  const handleFacebookAuth = (resolve: (token: string) => void, reject: (error: Error) => void) => {
    // Utilisation du SDK Facebook
    if (typeof window !== 'undefined' && (window as any).FB) {
      (window as any).FB.login((response: any) => {
        if (response.authResponse && response.authResponse.accessToken) {
          resolve(response.authResponse.accessToken);
        } else {
          reject(new Error('Échec de l\'authentification Facebook'));
        }
      }, { scope: 'email,public_profile' });
    } else {
      reject(new Error('Facebook SDK non chargé'));
    }
  };

  const handleLinkedInAuth = (resolve: (token: string) => void, reject: (error: Error) => void) => {
    // Redirection vers LinkedIn OAuth
    const clientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID;
    const redirectUri = encodeURIComponent(`${window.location.origin}/auth/linkedin/callback`);
    const scope = encodeURIComponent('r_liteprofile r_emailaddress');
    const state = Math.random().toString(36).substring(7);
    
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
    
    // Stocker les callbacks pour le retour
    (window as any).linkedinAuthCallbacks = { resolve, reject };
    
    // Ouvrir popup ou rediriger
    const popup = window.open(authUrl, 'linkedin-auth', 'width=600,height=600');
    
    // Vérifier la fermeture du popup
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed);
        reject(new Error('Authentification LinkedIn annulée'));
      }
    }, 1000);
  };

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'google': return 'fab fa-google';
      case 'facebook': return 'fab fa-facebook-f';
      case 'linkedin': return 'fab fa-linkedin-in';
      default: return 'fas fa-sign-in-alt';
    }
  };

  const getProviderColor = (type: string) => {
    switch (type) {
      case 'google': return 'hover:border-red-300 hover:bg-red-50 text-red-600';
      case 'facebook': return 'hover:border-blue-300 hover:bg-blue-50 text-blue-600';
      case 'linkedin': return 'hover:border-blue-400 hover:bg-blue-50 text-blue-700';
      default: return 'hover:border-gray-300 hover:bg-gray-50 text-gray-600';
    }
  };

  if (providers.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="relative flex items-center py-6">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="flex-shrink mx-4 text-gray-500 font-medium">ou</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>

      <div className={`grid gap-3 ${providers.length === 1 ? 'grid-cols-1' : providers.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {providers.map((provider) => (
          <button
            key={provider.name}
            onClick={() => handleSocialAuth(provider)}
            disabled={loading === provider.name}
            className={`flex items-center justify-center gap-2 bg-white border-2 border-gray-200 rounded-xl py-3 px-4 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${getProviderColor(provider.type)}`}
          >
            {loading === provider.name ? (
              <i className="fas fa-spinner fa-spin text-lg"></i>
            ) : (
              <i className={`${getProviderIcon(provider.type)} text-lg`}></i>
            )}
            <span className="text-sm font-medium">
              {provider.displayName}
            </span>
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-500 text-center mt-4">
        {mode === 'signup' 
          ? 'En vous inscrivant, vous acceptez nos conditions d\'utilisation'
          : 'Connexion sécurisée avec votre compte social'
        }
      </p>
    </div>
  );
}