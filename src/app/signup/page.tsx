'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/ui/Logo';

const USER_TYPES = [
  { value: 'donor', label: 'Donateur', icon: 'fas fa-heart', color: 'text-red-600', bg: 'bg-red-100' },
  { value: 'player', label: 'Joueur', icon: 'fas fa-running', color: 'text-blue-600', bg: 'bg-blue-100' },
  { value: 'club', label: 'Club', icon: 'fas fa-users', color: 'text-green-600', bg: 'bg-green-100' },
  { value: 'federation', label: 'Fédération', icon: 'fas fa-flag', color: 'text-purple-600', bg: 'bg-purple-100' }
];

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    userType: '',
    firstName: '',
    lastName: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/verify-email');
      } else {
        setError(data.error || 'Erreur lors de l\'inscription');
      }
    } catch (error) {
      setError('Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg py-12 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Logo size="lg" className="justify-center mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Créer un compte</h1>
          <p className="text-gray-600">Rejoignez la communauté PaieCashPlay</p>
        </div>

        {/* Signup Form */}
        <div className="card-elevated">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Type Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-4">
                <i className="fas fa-user-tag mr-2 text-paiecash"></i>
                Type de compte
              </label>
              <div className="grid grid-cols-2 gap-3">
                {USER_TYPES.map((type) => (
                  <label
                    key={type.value}
                    className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.userType === type.value
                        ? 'border-paiecash bg-paiecash/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="userType"
                      value={type.value}
                      checked={formData.userType === type.value}
                      onChange={(e) => setFormData({ ...formData, userType: e.target.value })}
                      className="sr-only"
                    />
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${type.bg}`}>
                      <i className={`${type.icon} ${type.color}`}></i>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{type.label}</div>
                    </div>
                    {formData.userType === type.value && (
                      <i className="fas fa-check-circle text-paiecash absolute top-2 right-2"></i>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Personal Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Prénom
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="input-field"
                  placeholder="Votre prénom"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Nom
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="input-field"
                  placeholder="Votre nom"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <i className="fas fa-envelope mr-2 text-paiecash"></i>
                Adresse email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field"
                placeholder="votre@email.com"
                required
              />
            </div>

            {/* Password */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <i className="fas fa-lock mr-2 text-paiecash"></i>
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field"
                  placeholder="Minimum 8 caractères"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="input-field"
                  placeholder="Répétez le mot de passe"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
                <i className="fas fa-exclamation-triangle mr-3 text-red-500"></i>
                <div>
                  <p className="font-medium">Erreur d'inscription</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !formData.userType}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed text-lg py-4"
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-3"></i>
                  Création du compte...
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus mr-3"></i>
                  Créer mon compte
                </>
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <div className="text-gray-600 text-sm">
              Déjà un compte ?{' '}
              <a href="/login" className="text-paiecash hover:text-paiecash-dark font-medium">
                Se connecter
              </a>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            En créant un compte, vous acceptez nos{' '}
            <a href="#" className="text-paiecash hover:underline">Conditions d'utilisation</a>
            {' '}et notre{' '}
            <a href="#" className="text-paiecash hover:underline">Politique de confidentialité</a>
          </p>
        </div>
      </div>
    </div>
  );
}