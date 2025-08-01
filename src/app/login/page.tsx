'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Logo from '@/components/ui/Logo';
import { useToast } from '@/components/ui/Toast';
import SocialButtons from '@/components/ui/SocialButtons';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  useEffect(() => {
    const reset = searchParams.get('reset');
    const errorParam = searchParams.get('error');
    
    if (reset === 'success') {
      toast.success('Mot de passe modifié !', 'Votre mot de passe a été mis à jour avec succès. Vous pouvez maintenant vous connecter.');
    }
    
    if (errorParam) {
      toast.error('Erreur d\'authentification', decodeURIComponent(errorParam));
    }
    
    // Nettoyer l'URL pour éviter les re-renders
    if (reset || errorParam) {
      const url = new URL(window.location.href);
      url.searchParams.delete('reset');
      url.searchParams.delete('error');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        // Check for OAuth parameters
        const clientId = searchParams.get('client_id');
        const redirectUri = searchParams.get('redirect_uri');
        const scope = searchParams.get('scope');
        const state = searchParams.get('state');
        
        if (clientId && redirectUri) {
          // OAuth flow - redirect to authorize endpoint
          const authorizeUrl = new URL('/api/auth/authorize', window.location.origin);
          authorizeUrl.searchParams.set('response_type', 'code');
          authorizeUrl.searchParams.set('client_id', clientId);
          authorizeUrl.searchParams.set('redirect_uri', redirectUri);
          if (scope) authorizeUrl.searchParams.set('scope', scope);
          if (state) authorizeUrl.searchParams.set('state', state);
          
          window.location.href = authorizeUrl.toString();
        } else {
          toast.success('Connexion réussie', 'Redirection vers votre tableau de bord...');
          // Redirection immédiate pour éviter les problèmes de timing
          router.push('/dashboard');
        }
      } else {
        toast.error('Erreur de connexion', data.error || 'Email ou mot de passe incorrect');
        setError(data.error || 'Erreur de connexion');
      }
    } catch (error) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-paiecash/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
        </div>

        {/* Header */}
        <div className="text-center mb-8 relative">
          <Logo size="lg" className="justify-center mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Connexion</h1>
          <p className="text-gray-600">Accédez à votre compte PaieCashPlay</p>
        </div>

        {/* Login Form */}
        <div className="card-elevated relative">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <i className="fas fa-envelope mr-2 text-paiecash"></i>
                Adresse email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="votre@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <i className="fas fa-lock mr-2 text-paiecash"></i>
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-12"
                  placeholder="Votre mot de passe"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
                <i className="fas fa-exclamation-triangle mr-3 text-red-500"></i>
                <div>
                  <p className="font-medium">Erreur de connexion</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed text-lg py-4"
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-3"></i>
                  Connexion en cours...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt mr-3"></i>
                  Se connecter
                </>
              )}
            </button>
          </form>

          <SocialButtons mode="login" />

          {/* Links */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center space-y-3">
            <a href="/forgot-password" className="text-paiecash hover:text-paiecash-dark text-sm font-medium">
              Mot de passe oublié ?
            </a>
            <div className="text-gray-600 text-sm">
              Pas encore de compte ?{' '}
              <a href="/signup" className="text-paiecash hover:text-paiecash-dark font-medium">
                S'inscrire
              </a>
            </div>
          </div>
        </div>

        {/* Admin Link */}
        <div className="text-center mt-8">
          <a href="/admin/login" className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 text-sm transition-colors">
            <i className="fas fa-cog mr-2"></i>
            Accès administrateur
          </a>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
        <div className="card-elevated w-full max-w-md">
          <div className="text-center py-8">
            <i className="fas fa-spinner fa-spin text-paiecash text-2xl mb-4"></i>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}