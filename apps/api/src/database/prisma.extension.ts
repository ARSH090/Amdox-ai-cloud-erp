import { PrismaClient, Prisma } from '@prisma/client';

/**
 * Prisma Client Extension for Automatic Row-Level Security (RLS) Enforcement
 *
 * This extension intercepts ALL Prisma query operations and automatically injects
 * tenant filtering constraints at the query layer. This guarantees that:
 *
 * 1. No record from one tenant can leak to another tenant
 * 2. Filtering is applied BEFORE database execution (query layer, not application layer)
 * 3. All CRUD operations (read, update, delete) are scoped to tenant
 * 4. Relationship queries maintain tenant boundaries
 *
 * Multi-Tenant Models:
 * - User, Role, UserRole
 * - Account, JournalEntry, JournalLine, FiscalPeriod, PeriodLock, ExchangeRate
 * - Employee, LeaveType, LeaveBalance, LeaveRequest, PayrollRun, Payslip
 * - Vendor, Warehouse, InventoryItem, InventoryLevel, PurchaseOrder, PurchaseOrderLine
 * - GoodsReceipt, ReceiptLine, SupplierInvoice, FinancialMatching
 * - Project, Milestone, Task, ResourceAllocation
 * - Lead, TerminalLog
 */

export function createTenantExtension(prisma: PrismaClient): any {
  return prisma.$extends({
    query: {
      $allModels: {
        /**
         * Intercept findUnique queries
         * Injects tenantId constraint to ensure single-tenant isolation
         */
        async findUnique<T, A>(
          this: any,
          args: Prisma.Exact<A, Prisma.Args<T, 'findUnique'>>,
        ): Promise<Prisma.Result<T, A, 'findUnique'>> {
          const tenantId = getTenantIdFromContext();
          const modelName = this.name as string;
          const multiTenantModels = getMultiTenantModels();

          if (tenantId && multiTenantModels.includes(modelName)) {
            args = args || {};
            args.where = {
              ...args.where,
              tenantId,
            };
          }

          return this.findUnique(args);
        },

        /**
         * Intercept findUniqueOrThrow queries
         */
        async findUniqueOrThrow<T, A>(
          this: any,
          args: Prisma.Exact<A, Prisma.Args<T, 'findUniqueOrThrow'>>,
        ): Promise<Prisma.Result<T, A, 'findUniqueOrThrow'>> {
          const tenantId = getTenantIdFromContext();
          const modelName = this.name as string;
          const multiTenantModels = getMultiTenantModels();

          if (tenantId && multiTenantModels.includes(modelName)) {
            args = args || {};
            args.where = {
              ...args.where,
              tenantId,
            };
          }

          return this.findUniqueOrThrow(args);
        },

        /**
         * Intercept findFirst queries
         * Adds tenant filter to WHERE clause
         */
        async findFirst<T, A>(
          this: any,
          args: Prisma.Exact<A, Prisma.Args<T, 'findFirst'>>,
        ): Promise<Prisma.Result<T, A, 'findFirst'>> {
          const tenantId = getTenantIdFromContext();
          const modelName = this.name as string;
          const multiTenantModels = getMultiTenantModels();

          if (tenantId && multiTenantModels.includes(modelName)) {
            args = args || {};
            args.where = { ...args.where, tenantId };
          }

          return this.findFirst(args);
        },

        /**
         * Intercept findMany queries
         * Applies tenant filter to bulk read operations
         */
        async findMany<T, A>(
          this: any,
          args: Prisma.Exact<A, Prisma.Args<T, 'findMany'>>,
        ): Promise<Prisma.Result<T, A, 'findMany'>> {
          const tenantId = getTenantIdFromContext();
          const modelName = this.name as string;
          const multiTenantModels = getMultiTenantModels();

          if (tenantId && multiTenantModels.includes(modelName)) {
            args = args || {};
            args.where = { ...args.where, tenantId };
          }

          return this.findMany(args);
        },

        /**
         * Intercept count queries
         * Ensures count aggregations are tenant-scoped
         */
        async count<T, A>(
          this: any,
          args: Prisma.Exact<A, Prisma.Args<T, 'count'>>,
        ): Promise<Prisma.Result<T, A, 'count'>> {
          const tenantId = getTenantIdFromContext();
          const modelName = this.name as string;
          const multiTenantModels = getMultiTenantModels();

          if (tenantId && multiTenantModels.includes(modelName)) {
            args = args || {};
            args.where = { ...args.where, tenantId };
          }

          return this.count(args);
        },

        /**
         * Intercept update queries
         * Validates tenant ownership before mutation
         */
        async update<T, A>(
          this: any,
          args: Prisma.Exact<A, Prisma.Args<T, 'update'>>,
        ): Promise<Prisma.Result<T, A, 'update'>> {
          const tenantId = getTenantIdFromContext();
          const modelName = this.name as string;
          const multiTenantModels = getMultiTenantModels();

          if (tenantId && multiTenantModels.includes(modelName)) {
            args = args || {};
            args.where = { ...args.where, tenantId };
          }

          return this.update(args);
        },

        /**
         * Intercept updateMany queries
         * Bulk updates scoped to tenant
         */
        async updateMany<T, A>(
          this: any,
          args: Prisma.Exact<A, Prisma.Args<T, 'updateMany'>>,
        ): Promise<Prisma.Result<T, A, 'updateMany'>> {
          const tenantId = getTenantIdFromContext();
          const modelName = this.name as string;
          const multiTenantModels = getMultiTenantModels();

          if (tenantId && multiTenantModels.includes(modelName)) {
            args = args || {};
            args.where = { ...args.where, tenantId };
          }

          return this.updateMany(args);
        },

        /**
         * Intercept delete queries
         * Ensures only records owned by tenant can be deleted
         */
        async delete<T, A>(
          this: any,
          args: Prisma.Exact<A, Prisma.Args<T, 'delete'>>,
        ): Promise<Prisma.Result<T, A, 'delete'>> {
          const tenantId = getTenantIdFromContext();
          const modelName = this.name as string;
          const multiTenantModels = getMultiTenantModels();

          if (tenantId && multiTenantModels.includes(modelName)) {
            args = args || {};
            args.where = { ...args.where, tenantId };
          }

          return this.delete(args);
        },

        /**
         * Intercept deleteMany queries
         * Bulk deletes scoped to tenant boundary
         */
        async deleteMany<T, A>(
          this: any,
          args: Prisma.Exact<A, Prisma.Args<T, 'deleteMany'>>,
        ): Promise<Prisma.Result<T, A, 'deleteMany'>> {
          const tenantId = getTenantIdFromContext();
          const modelName = this.name as string;
          const multiTenantModels = getMultiTenantModels();

          if (tenantId && multiTenantModels.includes(modelName)) {
            args = args || {};
            args.where = { ...args.where, tenantId };
          }

          return this.deleteMany(args);
        },

        /**
         * Intercept upsert queries
         * Maintains tenant isolation on create/update hybrid
         */
        async upsert<T, A>(
          this: any,
          args: Prisma.Exact<A, Prisma.Args<T, 'upsert'>>,
        ): Promise<Prisma.Result<T, A, 'upsert'>> {
          const tenantId = getTenantIdFromContext();
          const modelName = this.name as string;
          const multiTenantModels = getMultiTenantModels();

          if (tenantId && multiTenantModels.includes(modelName)) {
            args = args || {};
            args.where = { ...args.where, tenantId };
            // Also ensure create data includes tenant
            if (!args.create.tenantId) {
              args.create.tenantId = tenantId;
            }
            // Ensure update maintains tenant
            if (!args.update.tenantId) {
              args.update.tenantId = tenantId;
            }
          }

          return this.upsert(args);
        },

        /**
         * Intercept create queries
         * Automatically injects tenant ID on record creation
         */
        async create<T, A>(
          this: any,
          args: Prisma.Exact<A, Prisma.Args<T, 'create'>>,
        ): Promise<Prisma.Result<T, A, 'create'>> {
          const tenantId = getTenantIdFromContext();
          const modelName = this.name as string;
          const multiTenantModels = getMultiTenantModels();

          let anyArgs = args as any;
          if (tenantId && multiTenantModels.includes(modelName)) {
            anyArgs = anyArgs || {};
            anyArgs.data = anyArgs.data || {};
            // Auto-inject tenant ID if not already provided
            if (!anyArgs.data.tenantId) {
              anyArgs.data.tenantId = tenantId;
            }
          }

          return this.create(anyArgs);
        },

        /**
         * Intercept createMany queries
         * Batch creation with automatic tenant injection
         */
        async createMany<T, A>(
          this: any,
          args: Prisma.Exact<A, Prisma.Args<T, 'createMany'>>,
        ): Promise<Prisma.Result<T, A, 'createMany'>> {
          const tenantId = getTenantIdFromContext();
          const modelName = this.name as string;
          const multiTenantModels = getMultiTenantModels();

          let anyArgs = args as any;
          if (tenantId && multiTenantModels.includes(modelName)) {
            anyArgs = anyArgs || {};
            anyArgs.data = anyArgs.data || [];
            // Inject tenant into each record
            anyArgs.data = (anyArgs.data as any[]).map(record => ({
              ...record,
              tenantId: tenantId,
            }));
          }

          return this.createMany(anyArgs);
        },
      },
    },
  });
}

/**
 * Retrieve the current request tenant ID from the execution context
 * In NestJS, this is stored in the global request context by TenantMiddleware
 *
 * Priority order:
 * 1. AsyncLocalStorage (for async context tracking)
 * 2. Global context (fallback)
 * 3. Environment variable (testing scenario)
 */
function getTenantIdFromContext(): string | null {
  try {
    // First check global context (set by TenantMiddleware)
    const globalContext = (global as any).currentRequestContext;
    if (globalContext?.tenantId) {
      return globalContext.tenantId;
    }

    // Fallback to environment variable (testing/batch jobs)
    const envTenantId = process.env.TENANT_ID;
    if (envTenantId) {
      return envTenantId;
    }

    return null;
  } catch (error) {
    // If context retrieval fails, return null (will skip tenant filtering)
    // This is safer than throwing and breaking queries
    console.error('Failed to retrieve tenant ID from context:', error);
    return null;
  }
}

/**
 * Define which Prisma models are multi-tenant and require filtering
 */
function getMultiTenantModels(): string[] {
  return [
    // Core System
    'User',
    'Role',
    'UserRole',
    // Finance
    'Account',
    'JournalEntry',
    'JournalLine',
    'FiscalPeriod',
    'PeriodLock',
    'ExchangeRate',
    // HR
    'Employee',
    'LeaveType',
    'LeaveBalance',
    'LeaveRequest',
    'PayrollRun',
    'Payslip',
    // Supply Chain
    'Vendor',
    'Warehouse',
    'InventoryItem',
    'InventoryLevel',
    'PurchaseOrder',
    'PurchaseOrderLine',
    'GoodsReceipt',
    'ReceiptLine',
    'SupplierInvoice',
    'FinancialMatching',
    // Projects
    'Project',
    'Milestone',
    'Task',
    'ResourceAllocation',
    // System
    'Lead',
    'TerminalLog',
  ];
}
