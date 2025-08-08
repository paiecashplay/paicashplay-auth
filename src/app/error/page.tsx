'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Logo from '@/components/ui/Logo';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const description = searchParams.get('description');

  const getErrorInfo = (errorCode: string) => {
    switch (errorCode) {
      case 'invalid_client':
        return {
          title: 'Client non autorisé',
          message: 'L\'application qui tente de vous authentifier n\'est pas reconnue.',
          icon: 'fas fa-shield-alt'
        };
      case 'invalid_redirect_uri':
        return {
          title: 'URL de redirection invalide',
          message: 'L\'URL de redirection fournie n\'est pas autorisée pour cette application.',
          icon: 'fas fa-link'
        };
      default:
        return {
          title: 'Erreur d\'authentification',
          message: 'Une erreur s\'est produite lors de l\'authentification.',
          icon: 'fas fa-exclamation-triangle'
        };
    }
  };

  const errorInfo = getErrorInfo(error || 'unknown');

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Logo size="lg" className="justify-center mb-6" />
        </div>

        <div className="card-elevated text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className={`${errorInfo.icon} text-red-600 text-2xl`}></i>
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 mb-4">{errorInfo.title}</h2>
          <p className="text-gray-600 mb-2">{errorInfo.message}</p>
          
          {description && (
            <p className="text-sm text-gray-500 mb-6">{decodeURIComponent(description)}</p>
          )}

          <div className="space-y-3">
            <button
              onClick={() => window.history.back()}
              className="btn-secondary w-full"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Retour
            </button>
            
            <a href="/login" className="btn-primary w-full inline-block">
              <i className="fas fa-sign-in-alt mr-2"></i>
              Aller à la connexion
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-2xl text-gray-400 mb-2"></i>
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}