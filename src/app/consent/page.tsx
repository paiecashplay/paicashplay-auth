import { Suspense } from 'react';
import ConsentPage from '@/components/auth/ConsentPage';

function ConsentPageWrapper() {
  return (
    <Suspense fallback={
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-2xl text-gray-400 mb-2"></i>
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    }>
      <ConsentPage />
    </Suspense>
  );
}

export default ConsentPageWrapper;