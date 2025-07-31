'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function IdentityProvidersRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/social-providers');
  }, [router]);

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center">
      <div className="card-elevated w-full max-w-md">
        <div className="text-center py-8">
          <i className="fas fa-spinner fa-spin text-paiecash text-2xl mb-4"></i>
          <p className="text-gray-600">Redirection vers la nouvelle interface...</p>
        </div>
      </div>
    </div>
  );
}