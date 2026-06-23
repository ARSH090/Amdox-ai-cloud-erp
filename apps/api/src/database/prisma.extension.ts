import { Prisma } from '@prisma/client';
import { requestContext } from '../common/context/request-context';

// List of models that are tenant-scoped (have tenantId column)
const tenantModels = [
  'User', 'Role', 'Account', 'FiscalPeriod', 'PeriodLock', 'JournalEntry',
  'ExchangeRate', 'SupplierInvoice', 'Department', 'Employee', 'LeaveType',
  'TaxSlab', 'PayrollRun', 'Vendor', 'Warehouse', 'InventoryItem',
  'PurchaseOrder', 'GoodsReceipt', 'FinancialMatching', 'Project',
  'AuditLog', 'Notification', 'Dashboard', 'DashboardWidget', 'Lead', 'TerminalLog',
  'Customer', 'Payment', 'PurchaseRequisition', 'StockMovement', 'Budget', 'Forecast', 'FileObject'
];

export function createTenantExtension() {
  return Prisma.defineExtension((client) => {
    return client.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            // Only apply tenant isolation to models that have a tenantId
            if (!tenantModels.includes(model)) {
              return query(args);
            }

            const ctx = requestContext.getStore();
            const tenantId = ctx?.tenantId;

            // If we are not in a tenant context, just execute query (might fail RLS later if not set)
            if (!tenantId) {
              return query(args);
            }

            // Automatically inject tenantId into where and data clauses
            const newArgs = { ...args } as any;

            if (['findUnique', 'findFirst', 'findMany', 'count', 'update', 'updateMany', 'delete', 'deleteMany'].includes(operation)) {
              newArgs.where = { ...newArgs.where, tenantId };
            }

            if (['create', 'createMany', 'update', 'updateMany', 'upsert'].includes(operation)) {
              if (newArgs.data && !Array.isArray(newArgs.data)) {
                newArgs.data = { ...newArgs.data, tenantId };
              } else if (Array.isArray(newArgs.data)) {
                newArgs.data = newArgs.data.map((item: any) => ({ ...item, tenantId }));
              }
            }

            if (operation === 'upsert') {
              newArgs.where = { ...newArgs.where, tenantId };
              newArgs.create = { ...newArgs.create, tenantId };
              newArgs.update = { ...newArgs.update, tenantId };
            }

            return query(newArgs);
          },
        },
      },
    });
  });
}
