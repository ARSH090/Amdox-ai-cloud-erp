import { useEffect } from 'react';
import { useAuthStore } from '../store/auth-store';

export const useAuth = () => {
  const { 
    user, 
    tenantId, 
    tenantStatus, 
    assignedRoles, 
    isLoading, 
    isAuthenticated, 
    setAuthData, 
    clearAuth 
  } = useAuthStore();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch('/api/v1/auth/session', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          credentials: 'include', // Important: Ensures httpOnly cookies are sent
        });

        if (!response.ok) {
          throw new Error('Session is invalid or expired');
        }

        const data = await response.json();
        
        setAuthData({
          user: data.user,
          tenantId: data.tenantId,
          tenantStatus: data.tenantStatus,
          assignedRoles: data.assignedRoles || [],
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        console.error('Auth session check failed:', error);
        clearAuth();
      }
    };

    if (!isAuthenticated) {
      fetchSession();
    }
  }, [isAuthenticated, setAuthData, clearAuth]);

  return { user, tenantId, tenantStatus, assignedRoles, isLoading, isAuthenticated };
};
