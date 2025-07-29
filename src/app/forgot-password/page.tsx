'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/ui/Logo';
import { useToast } from '@/components/ui/Toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setSent(true);
        toast.success('Email envoyé !', 'Vérifiez votre boîte mail pour réinitialiser votre mot de passe');
      } else {
        toast.error('Erreur', data.error || 'Impossible d\'envoyer l\'email de réinitialisation');
      }
    } catch (error) {
      toast.error('Erreur de connexion', 'Vérifiez votre connexion internet et réessayez');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Logo size="lg" className="justify-center mb-6" />
          </div>

          <div className="card-elevated text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-paper-plane text-green-600 text-2xl"></i>
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-4">Email envoyé !</h2>
            <p className="text-gray-600 mb-6">
              Nous avons envoyé un lien de réinitialisation à <strong>{email}</strong>
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-sm">
                <i className="fas fa-info-circle mr-2"></i>
                Le lien expire dans 1 heure. Vérifiez aussi vos spams.
              </p>
            </div>

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mot de passe oublié</h1>
          <p className="text-gray-600">Saisissez votre email pour recevoir un lien de réinitialisation</p>
        </div>

        <div className="card-elevated">
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

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed text-lg py-4"
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-3"></i>
                  Envoi en cours...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane mr-3"></i>
                  Envoyer le lien de réinitialisation
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-600 text-sm">
              Vous vous souvenez de votre mot de passe ?{' '}
              <a href="/login" className="text-paiecash hover:text-paiecash-dark font-medium">
                Se connecter
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}