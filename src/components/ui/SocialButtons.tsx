'use client';

import { useState, useEffect } from 'react';

interface Provider {
  id: string;
  name: string;
  displayName: string;
  type: string;
}

interface SocialButtonsProps {
  mode: 'login' | 'signup';
  onSocialAuth?: (provider: string) => void;
}

export default function SocialButtons({ mode, onSocialAuth }: SocialButtonsProps) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/auth/providers');
      if (response.ok) {
        const data = await response.json();
        setProviders(data.providers || []);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  };

  const handleSocialAuth = async (provider: Provider) => {
    setLoading(provider.name);
    
    try {
      const state = btoa(JSON.stringify({ 
        mode, 
        provider: provider.name,
        timestamp: Date.now() 
      }));
      
      window.location.href = `/api/auth/${provider.name}?state=${state}`;
      
      if (onSocialAuth) {
        onSocialAuth(provider.name);
      }
    } catch (error) {
      console.error('Social auth error:', error);
      setLoading(null);
    }
  };

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'google':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        );
      case 'facebook':
        return (
          <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        );
      case 'linkedin':
        return (
          <svg className="w-5 h-5" fill="#0A66C2" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        );
      default:
        return <i className="fas fa-sign-in-alt"></i>;
    }
  };

  const getProviderColor = (type: string) => {
    switch (type) {
      case 'google':
        return 'border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50';
      case 'facebook':
        return 'border-blue-600 hover:border-blue-700 text-blue-600 hover:bg-blue-50';
      case 'linkedin':
        return 'border-blue-700 hover:border-blue-800 text-blue-700 hover:bg-blue-50';
      default:
        return 'border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50';
    }
  };

  if (providers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">
            {mode === 'login' ? 'Ou connectez-vous avec' : 'Ou inscrivez-vous avec'}
          </span>
        </div>
      </div>

      <div className="grid gap-3">
        {providers.map((provider) => (
          <button
            key={provider.id}
            onClick={() => handleSocialAuth(provider)}
            disabled={loading === provider.name}
            className={`w-full flex items-center justify-center px-4 py-3 border rounded-lg font-medium transition-all duration-200 ${getProviderColor(provider.type)} ${
              loading === provider.name ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading === provider.name ? (
              <i className="fas fa-spinner fa-spin mr-3"></i>
            ) : (
              <span className="mr-3">{getProviderIcon(provider.type)}</span>
            )}
            {loading === provider.name 
              ? 'Connexion en cours...' 
              : `${mode === 'login' ? 'Se connecter' : 'S\'inscrire'} avec ${provider.displayName}`
            }
          </button>
        ))}
      </div>
    </div>
  );
}