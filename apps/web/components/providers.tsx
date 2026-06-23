"use client";

import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './theme-provider';
import { useAuthStore } from '../store/auth-store';
import { useRouter, usePathname } from 'next/navigation';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, setAuthData } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // In a real app, you would verify the session/token here via API.
    // For now, we simulate a check.
    const checkAuth = async () => {
      try {
        // Example check:
        // const res = await apiClient.get('/auth/me');
        // setAuthData({ isAuthenticated: true, user: res.data, isLoading: false });
        
        // Mocking an authenticated state if not already:
        if (!isAuthenticated) {
          // Temporarily auto-authenticate for dev/demo purposes
          setAuthData({
            isAuthenticated: true,
            user: { id: '1', email: 'admin@amdox.com', fullName: 'Super Admin', keycloakSub: 'sub-123' },
            tenantId: 'tenant-123',
            tenantStatus: 'ACTIVE',
            assignedRoles: ['SuperAdmin'],
            isLoading: false,
          });
        }
      } catch (err) {
        setAuthData({ isAuthenticated: false, isLoading: false });
        if (pathname !== '/login') {
          router.push('/login');
        }
      }
    };

    checkAuth();
  }, [isAuthenticated, pathname, router, setAuthData]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading Amdox ERP...</div>;
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Prevents hydration mismatch on theme
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthWrapper>
          {children}
        </AuthWrapper>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
