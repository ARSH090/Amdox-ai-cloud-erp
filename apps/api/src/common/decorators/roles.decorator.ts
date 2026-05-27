import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * @Roles Decorator for NestJS Controllers and Handlers
 *
 * Declaratively defines the required roles for accessing a protected endpoint.
 * Supported for both RBAC (role-based) and ABAC (attribute-based) access control.
 *
 * Usage:
 * @Roles('SuperAdmin', 'TenantAdmin')
 * @Post('/')
 * create() { ... }
 *
 * Supported Roles (from Keycloak):
 * - SuperAdmin: Global system administrator, can access all tenants
 * - TenantAdmin: Tenant-level administrator, can manage tenant configuration
 * - Manager: Department/module manager, can approve workflows
 * - Viewer: Read-only access
 *
 * Role Hierarchy (for inheritance-based checks):
 * SuperAdmin > TenantAdmin > Manager > Viewer
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Supported Application Roles with Hierarchical Relationships
 */
export enum ApplicationRole {
  /**
   * System-wide administrator
   * - Access to all tenants and configurations
   * - Can manage users, roles, and permissions
   * - Can modify audit logs and period locks
   */
  SUPER_ADMIN = 'SuperAdmin',

  /**
   * Tenant-level administrator
   * - Full access to tenant's data and configurations
   * - Can manage tenant users and their roles
   * - Can approve high-value transactions
   */
  TENANT_ADMIN = 'TenantAdmin',

  /**
   * Department/module manager
   * - Can approve workflows within department/module
   * - Can view reports and analytics
   * - Limited user management (subordinates only)
   */
  MANAGER = 'Manager',

  /**
   * Read-only viewer
   * - Can view dashboards, reports, and data
   * - Cannot create or modify records
   */
  VIEWER = 'Viewer',

  /**
   * Finance module access
   * - Can post journal entries
   * - Can approve invoices
   */
  FINANCE_USER = 'FinanceUser',

  /**
   * HR module access
   * - Can manage employee records
   * - Can process leave requests
   */
  HR_USER = 'HRUser',

  /**
   * Supply chain module access
   * - Can manage purchase orders
   * - Can receive goods
   */
  SUPPLY_CHAIN_USER = 'SupplyChainUser',

  /**
   * Project management module access
   * - Can create and manage projects
   * - Can assign resources
   */
  PROJECT_MANAGER = 'ProjectManager',
}

/**
 * Role hierarchy for inheritance-based permission checking
 * A higher role inherits permissions of lower roles
 */
export const ROLE_HIERARCHY: Record<ApplicationRole, ApplicationRole[]> = {
  [ApplicationRole.SUPER_ADMIN]: [
    ApplicationRole.SUPER_ADMIN,
    ApplicationRole.TENANT_ADMIN,
    ApplicationRole.MANAGER,
    ApplicationRole.VIEWER,
    ApplicationRole.FINANCE_USER,
    ApplicationRole.HR_USER,
    ApplicationRole.SUPPLY_CHAIN_USER,
    ApplicationRole.PROJECT_MANAGER,
  ],
  [ApplicationRole.TENANT_ADMIN]: [
    ApplicationRole.TENANT_ADMIN,
    ApplicationRole.MANAGER,
    ApplicationRole.VIEWER,
    ApplicationRole.FINANCE_USER,
    ApplicationRole.HR_USER,
    ApplicationRole.SUPPLY_CHAIN_USER,
    ApplicationRole.PROJECT_MANAGER,
  ],
  [ApplicationRole.MANAGER]: [ApplicationRole.MANAGER, ApplicationRole.VIEWER],
  [ApplicationRole.VIEWER]: [ApplicationRole.VIEWER],
  [ApplicationRole.FINANCE_USER]: [ApplicationRole.FINANCE_USER],
  [ApplicationRole.HR_USER]: [ApplicationRole.HR_USER],
  [ApplicationRole.SUPPLY_CHAIN_USER]: [ApplicationRole.SUPPLY_CHAIN_USER],
  [ApplicationRole.PROJECT_MANAGER]: [ApplicationRole.PROJECT_MANAGER],
};

/**
 * Module-level permissions matrix (Attribute-Based Access Control)
 * Maps roles to specific module permissions
 *
 * Usage in guards: Check if user role allows access to module:action
 */
export const MODULE_PERMISSIONS: Record<string, Record<string, ApplicationRole[]>> = {
  // Finance Module
  finance: {
    'post-journal-entry': [ApplicationRole.SUPER_ADMIN, ApplicationRole.TENANT_ADMIN, ApplicationRole.FINANCE_USER],
    'approve-invoice': [ApplicationRole.SUPER_ADMIN, ApplicationRole.TENANT_ADMIN, ApplicationRole.MANAGER],
    'close-period': [ApplicationRole.SUPER_ADMIN, ApplicationRole.TENANT_ADMIN],
    'view-ledger': [
      ApplicationRole.SUPER_ADMIN,
      ApplicationRole.TENANT_ADMIN,
      ApplicationRole.FINANCE_USER,
      ApplicationRole.MANAGER,
      ApplicationRole.VIEWER,
    ],
  },

  // HR Module
  hr: {
    'manage-employee': [ApplicationRole.SUPER_ADMIN, ApplicationRole.TENANT_ADMIN, ApplicationRole.HR_USER],
    'approve-leave': [ApplicationRole.SUPER_ADMIN, ApplicationRole.TENANT_ADMIN, ApplicationRole.MANAGER],
    'run-payroll': [ApplicationRole.SUPER_ADMIN, ApplicationRole.TENANT_ADMIN],
    'view-hr-data': [
      ApplicationRole.SUPER_ADMIN,
      ApplicationRole.TENANT_ADMIN,
      ApplicationRole.HR_USER,
      ApplicationRole.MANAGER,
      ApplicationRole.VIEWER,
    ],
  },

  // Supply Chain Module
  supply_chain: {
    'create-po': [ApplicationRole.SUPER_ADMIN, ApplicationRole.TENANT_ADMIN, ApplicationRole.SUPPLY_CHAIN_USER],
    'approve-po': [ApplicationRole.SUPER_ADMIN, ApplicationRole.TENANT_ADMIN, ApplicationRole.MANAGER],
    'receive-goods': [ApplicationRole.SUPER_ADMIN, ApplicationRole.TENANT_ADMIN, ApplicationRole.SUPPLY_CHAIN_USER],
    'view-inventory': [
      ApplicationRole.SUPER_ADMIN,
      ApplicationRole.TENANT_ADMIN,
      ApplicationRole.SUPPLY_CHAIN_USER,
      ApplicationRole.VIEWER,
    ],
  },

  // Project Module
  projects: {
    'create-project': [ApplicationRole.SUPER_ADMIN, ApplicationRole.TENANT_ADMIN, ApplicationRole.PROJECT_MANAGER],
    'allocate-resource': [ApplicationRole.SUPER_ADMIN, ApplicationRole.TENANT_ADMIN, ApplicationRole.PROJECT_MANAGER],
    'view-projects': [
      ApplicationRole.SUPER_ADMIN,
      ApplicationRole.TENANT_ADMIN,
      ApplicationRole.PROJECT_MANAGER,
      ApplicationRole.VIEWER,
    ],
  },

  // Audit & Compliance
  audit: {
    'view-audit-logs': [ApplicationRole.SUPER_ADMIN, ApplicationRole.TENANT_ADMIN],
    'lock-period': [ApplicationRole.SUPER_ADMIN],
    'process-dsr': [ApplicationRole.SUPER_ADMIN, ApplicationRole.TENANT_ADMIN],
  },
};

/**
 * Helper function to check if a user role has access to a module:action
 * Used in ABAC (Attribute-Based Access Control) guards
 */
export function hasPermission(
  userRoles: string[],
  module: string,
  action: string,
): boolean {
  const requiredRoles = MODULE_PERMISSIONS[module]?.[action] || [];
  
  if (requiredRoles.length === 0) {
    // If no permission defined, deny access by default
    return false;
  }

  // Check if any user role matches required roles
  return userRoles.some(userRole =>
    requiredRoles.includes(userRole as ApplicationRole)
  );
}

/**
 * Helper function to check if a user role inherits from required roles
 * Implements role hierarchy inheritance
 */
export function hasRole(
  userRoles: string[],
  requiredRoles: string[],
): boolean {
  return userRoles.some(userRole => {
    const hierarchy = ROLE_HIERARCHY[userRole as ApplicationRole] || [];
    return requiredRoles.some(requiredRole =>
      hierarchy.includes(requiredRole as ApplicationRole)
    );
  });
}
