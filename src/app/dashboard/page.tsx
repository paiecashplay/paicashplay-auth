'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProfileManager from '@/components/profile/ProfileManager';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/profile');
        if (!response.ok) {
          router.push('/login');
        }
      } catch (error) {
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  return <ProfileManager />;
}