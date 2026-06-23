import React from 'react';
import { useAuthStore } from '../../store/auth-store';

export const ROLE_HIERARCHY: Record<string, string[]> = {
  SuperAdmin: ['SuperAdmin', 'TenantAdmin', 'Manager', 'Viewer'],
  TenantAdmin: ['TenantAdmin', 'Manager', 'Viewer'],
  Manager: ['Manager', 'Viewer'],
  Viewer: ['Viewer'],
};

interface RbacSectionGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RbacSectionGuard: React.FC<RbacSectionGuardProps> = ({ 
  allowedRoles, 
  children, 
  fallback = null 
}) => {
  const { assignedRoles, isLoading } = useAuthStore();

  if (isLoading) {
    return null; // Or a skeleton loader
  }

  // Cross-check passed roles against assignedRoles in the Zustand state using role hierarchy
  const hasAccess = assignedRoles.some((userRole) => {
    const hierarchy = ROLE_HIERARCHY[userRole] || [];
    return allowedRoles.some((allowedRole) => hierarchy.includes(allowedRole));
  });

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
