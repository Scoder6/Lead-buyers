import { getServerSession } from 'next-auth';

export const getSession = async () => {
  const session = await getServerSession();
  return session;
};

export const getCurrentUser = async () => {
  const session = await getSession();
  return session?.user;
};

export const requireAuth = async () => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Not authenticated');
  }
  return user;
};

// This is a simplified version for the backend to use
// In a real app, you'd want to verify the session token properly
export const verifySession = async (req: any) => {
  try {
    // In a real implementation, you would verify the session token here
    // For now, we'll just check for a user in the session
    const session = await getSession();
    if (!session?.user) {
      throw new Error('Unauthorized');
    }
    return session.user;
  } catch (error) {
    console.error('Session verification failed:', error);
    throw new Error('Invalid session');
  }
};
