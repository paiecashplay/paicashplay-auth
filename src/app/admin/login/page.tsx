'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/ui/Logo';
import { useToast } from '@/components/ui/Toast';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Connexion réussie', 'Redirection vers le dashboard...');
        setTimeout(() => router.push('/admin/dashboard'), 1000);
      } else {
        toast.error('Erreur de connexion', data.error || 'Identifiants incorrects');
        setError(data.error || 'Erreur de connexion');
      }
    } catch (error) {
      toast.error('Erreur de connexion', 'Impossible de se connecter au serveur');
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
          <div className="inline-flex items-center px-4 py-2 bg-red-100 rounded-full text-red-700 font-medium text-sm mb-4">
            <i className="fas fa-shield-alt mr-2"></i>
            Zone d'Administration
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Connexion Administrateur</h1>
          <p className="text-gray-600">Accès sécurisé réservé aux administrateurs système</p>
        </div>

        {/* Login Form */}
        <div className="card-elevated relative">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <i className="fas fa-user mr-2 text-paiecash"></i>
                Nom d'utilisateur
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                placeholder="Entrez votre nom d'utilisateur"
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
                  placeholder="Entrez votre mot de passe"
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
                  <p className="font-medium">Erreur d'authentification</p>
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
                  Authentification en cours...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt mr-3"></i>
                  Se connecter
                </>
              )}
            </button>
          </form>

          {/* Development Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6">
              <div className="flex items-center mb-3">
                <i className="fas fa-info-circle text-blue-500 mr-2"></i>
                <span className="text-sm font-semibold text-gray-700">Environnement de développement</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Utilisateur:</span>
                  <code className="bg-white px-3 py-1 rounded border text-sm font-mono text-paiecash">admin</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Mot de passe:</span>
                  <code className="bg-white px-3 py-1 rounded border text-sm font-mono text-paiecash">password</code>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center px-4 py-2 bg-yellow-50 rounded-full text-yellow-700 text-sm">
            <i className="fas fa-exclamation-triangle mr-2"></i>
            Connexion sécurisée SSL/TLS
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Toutes les communications sont chiffrées et sécurisées
          </p>
        </div>
      </div>
    </div>
  );
}