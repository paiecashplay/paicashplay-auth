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
      // Créer un état avec les informations nécessaires
      const state = btoa(JSON.stringify({
        mode,
        userType,
        additionalData,
        timestamp: Date.now()
      }));

      // Redirection directe vers le provider
      const authUrl = getAuthUrl(provider, state);
      window.location.href = authUrl;
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur de connexion';
      toast.error('Erreur', errorMessage);
      onError?.(errorMessage);
      setLoading(null);
    }
  };

  const getAuthUrl = (provider: SocialProvider, state: string): string => {
    const baseUrls = {
      google: 'https://accounts.google.com/o/oauth2/v2/auth',
      facebook: 'https://www.facebook.com/v18.0/dialog/oauth',
      linkedin: 'https://www.linkedin.com/oauth/v2/authorization'
    };

    const scopes = {
      google: 'openid email profile',
      facebook: 'email public_profile',
      linkedin: 'r_liteprofile r_emailaddress'
    };

    const clientIds = {
      google: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      facebook: process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID,
      linkedin: process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID
    };

    const redirectUri = `${window.location.origin}/auth/${provider.name}/callback`;
    
    const params = new URLSearchParams({
      client_id: clientIds[provider.type as keyof typeof clientIds] || '',
      redirect_uri: redirectUri,
      scope: scopes[provider.type as keyof typeof scopes] || 'email profile',
      response_type: 'code',
      state
    });

    return `${baseUrls[provider.type as keyof typeof baseUrls]}?${params.toString()}`;
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
      case 'google': return 'hover:border-red-300 hover:bg-red-50 text-gray-700 hover:text-red-600';
      case 'facebook': return 'hover:border-blue-300 hover:bg-blue-50 text-gray-700 hover:text-blue-600';
      case 'linkedin': return 'hover:border-blue-400 hover:bg-blue-50 text-gray-700 hover:text-blue-700';
      default: return 'hover:border-gray-300 hover:bg-gray-50 text-gray-600';
    }
  };

  if (providers.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <div className="relative flex items-center py-4">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="flex-shrink mx-4 text-gray-500 font-medium text-sm">ou continuez avec</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>

      <div className={`grid gap-3 ${providers.length === 1 ? 'grid-cols-1' : providers.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {providers.map((provider) => (
          <button
            key={provider.name}
            onClick={() => handleSocialAuth(provider)}
            disabled={loading === provider.name}
            className={`flex items-center justify-center gap-2 bg-white border-2 border-gray-200 rounded-xl py-3 px-4 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md ${getProviderColor(provider.type)}`}
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

      <p className="text-xs text-gray-500 text-center mt-4 leading-relaxed">
        {mode === 'signup' 
          ? 'En vous inscrivant avec un réseau social, vous acceptez nos conditions d\'utilisation et notre politique de confidentialité.'
          : 'Connexion rapide et sécurisée avec votre compte social'
        }
      </p>
    </div>
  );
}