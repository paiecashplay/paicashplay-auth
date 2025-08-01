'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProfileManager from '@/components/profile/ProfileManager';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated with retry logic
    const checkAuth = async (retryCount = 0) => {
      try {
        const response = await fetch('/api/auth/check');
        if (response.ok) {
          return; // User is authenticated
        }
        
        // If first attempt fails, wait a bit and retry (for social auth timing)
        if (retryCount < 2) {
          setTimeout(() => checkAuth(retryCount + 1), 1000);
          return;
        }
        
        // After retries, redirect to login
        router.push('/login');
      } catch (error) {
        // If first attempt fails, wait a bit and retry
        if (retryCount < 2) {
          setTimeout(() => checkAuth(retryCount + 1), 1000);
          return;
        }
        
        router.push('/login');
      }
    };

    // Small delay to allow session cookie to be set
    setTimeout(() => checkAuth(), 500);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <ProfileManager />
    </div>
  );
}