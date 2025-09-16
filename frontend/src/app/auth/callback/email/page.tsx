'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

export default function EmailCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Wait a moment for the session to be established
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if user is authenticated
        const session = await getSession();
        
        if (session) {
          // Redirect to buyers page
          router.push('/buyers');
        } else {
          // If no session, redirect to signin with error
          router.push('/auth/signin?error=verification');
        }
      } catch (error) {
        console.error('Callback error:', error);
        router.push('/auth/signin?error=verification');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <h2 className="text-lg font-semibold">Signing you in...</h2>
        <p className="text-gray-600">Please wait while we complete your authentication.</p>
      </div>
    </div>
  );
}
