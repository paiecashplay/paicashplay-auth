'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import Logo from '@/components/ui/Logo';

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'waiting'>('waiting');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    const token = searchParams.get('token');
    const emailParam = searchParams.get('email');
    
    if (emailParam) {
      setEmail(emailParam);
    }

    if (token) {
      verifyEmail(token);
    }
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    setStatus('loading');
    
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message);
        
        // Redirection après 3 secondes
        setTimeout(() => {
          const redirectUrl = searchParams.get('redirect_uri');
          if (redirectUrl) {
            window.location.href = redirectUrl;
          } else {
            router.push('/login?verified=true');
          }
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.error);
      }
    } catch (error) {
      setStatus('error');
      setMessage('Erreur de connexion. Veuillez réessayer.');
    }
  };

  const startCountdown = () => {
    setCountdown(10);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const resendVerification = async () => {
    if (!email) {
      toast.error('Email manquant', 'Impossible de renvoyer le lien de vérification');
      return;
    }

    setResendLoading(true);
    
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        toast.success('Email envoyé !', 'Un nouveau lien de vérification a été envoyé');
        startCountdown();
      } else {
        toast.error('Erreur', 'Impossible d\'envoyer le lien de vérification');
      }
    } catch (error) {
      toast.error('Erreur de connexion', 'Veuillez réessayer plus tard');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Logo size="lg" className="justify-center mb-6" />
        </div>

        <div className="card-elevated">
          {status === 'waiting' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-paiecash/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-envelope text-paiecash text-2xl"></i>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Vérifiez votre email</h2>
              <p className="text-gray-600 mb-6">
                Nous avons envoyé un lien de vérification à votre adresse email.
                Cliquez sur le lien dans l'email pour activer votre compte.
              </p>
              {email && (
                <div className="bg-paiecash/5 border border-paiecash/20 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-700">Email envoyé à :</p>
                  <p className="font-medium text-paiecash">{email}</p>
                </div>
              )}
              <button
                onClick={resendVerification}
                disabled={resendLoading || !email || countdown > 0}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {resendLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Envoi en cours...
                  </>
                ) : countdown > 0 ? (
                  <>
                    <i className="fas fa-clock mr-2"></i>
                    Renvoyer dans {countdown}s
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane mr-2"></i>
                    Renvoyer le lien de vérification
                  </>
                )}
              </button>
            </div>
          )}

          {status === 'loading' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-paiecash/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-spinner fa-spin text-paiecash text-2xl"></i>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Vérification en cours...</h2>
              <p className="text-gray-600">
                Veuillez patienter pendant que nous vérifions votre compte.
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-check text-green-600 text-2xl"></i>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Compte vérifié !</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 text-sm flex items-center justify-center">
                  <i className="fas fa-clock mr-2"></i>
                  Redirection automatique dans quelques secondes...
                </p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-times text-red-600 text-2xl"></i>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Erreur de vérification</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-3">
                <button
                  onClick={resendVerification}
                  disabled={resendLoading || !email || countdown > 0}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Envoi en cours...
                    </>
                  ) : countdown > 0 ? (
                    <>
                      <i className="fas fa-clock mr-2"></i>
                      Renvoyer dans {countdown}s
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane mr-2"></i>
                      Renvoyer le lien de vérification
                    </>
                  )}
                </button>
                <button
                  onClick={() => router.push('/login')}
                  className="btn-secondary w-full"
                >
                  <i className="fas fa-arrow-left mr-2"></i>
                  Retour à la connexion
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>Vous n'avez pas reçu l'email ? Vérifiez vos spams ou</p>
          <button
            onClick={resendVerification}
            disabled={resendLoading || !email || countdown > 0}
            className="text-paiecash hover:text-paiecash-dark font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendLoading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-1"></i>
                envoi en cours...
              </>
            ) : countdown > 0 ? (
              <>
                <i className="fas fa-clock mr-1"></i>
                attendre {countdown}s
              </>
            ) : (
              'cliquez ici pour le renvoyer'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}