// apps/api/prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('AMDOX ERP: Starting database seeding...');

  // 1. Seed Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'amdox-corp' },
    update: {},
    create: {
      slug: 'amdox-corp',
      name: 'Amdox Global Corporate Ltd',
      plan: 'enterprise',
      keycloakRealm: 'amdox-enterprise',
      activationId: 'ACT-CORP-9999-XYZ',
      status: 'ACTIVE',
      settings: {
        theme: 'dark',
        features: { finance: true, hr: true, supplyChain: true, forecasting: true }
      }
    }
  });
  console.log(`Seeded Tenant: ${tenant.name} (${tenant.id})`);

  // 2. Seed Roles and Users
  const superAdminRole = await prisma.role.upsert({ where: { tenantId_name: { tenantId: tenant.id, name: 'SuperAdmin' } }, update: {}, create: { tenantId: tenant.id, name: 'SuperAdmin' } });
  const tenantAdminRole = await prisma.role.upsert({ where: { tenantId_name: { tenantId: tenant.id, name: 'TenantAdmin' } }, update: {}, create: { tenantId: tenant.id, name: 'TenantAdmin' } });
  const managerRole = await prisma.role.upsert({ where: { tenantId_name: { tenantId: tenant.id, name: 'Manager' } }, update: {}, create: { tenantId: tenant.id, name: 'Manager' } });
  const viewerRole = await prisma.role.upsert({ where: { tenantId_name: { tenantId: tenant.id, name: 'Viewer' } }, update: {}, create: { tenantId: tenant.id, name: 'Viewer' } });

  const adminUser = await prisma.user.upsert({
    where: { tenantId_keycloakSub: { tenantId: tenant.id, keycloakSub: 'k-super-01' } },
    update: {},
    create: {
      tenantId: tenant.id,
      keycloakSub: 'k-super-01',
      email: 'admin@amdox.com',
      fullName: 'Super Admin',
      isActive: true,
      roles: { create: { roleId: superAdminRole.id } }
    }
  });
  
  await prisma.user.upsert({
    where: { tenantId_keycloakSub: { tenantId: tenant.id, keycloakSub: 'k-sarah-02' } },
    update: {},
    create: { tenantId: tenant.id, keycloakSub: 'k-sarah-02', email: 'sarah.admin@amdox.io', fullName: 'Sarah Connor', isActive: true, roles: { create: { roleId: tenantAdminRole.id } } }
  });

  await prisma.user.upsert({
    where: { tenantId_keycloakSub: { tenantId: tenant.id, keycloakSub: 'k-john-03' } },
    update: {},
    create: { tenantId: tenant.id, keycloakSub: 'k-john-03', email: 'john.manager@amdox.io', fullName: 'John Manager', isActive: true, roles: { create: { roleId: managerRole.id } } }
  });

  await prisma.user.upsert({
    where: { tenantId_keycloakSub: { tenantId: tenant.id, keycloakSub: 'k-david-04' } },
    update: {},
    create: { tenantId: tenant.id, keycloakSub: 'k-david-04', email: 'david.viewer@amdox.io', fullName: 'David Viewer', isActive: true, roles: { create: { roleId: viewerRole.id } } }
  });

  console.log(`Seeded Users: SuperAdmin, TenantAdmin, Manager, and Viewer`);

  // 3. Seed Accounts (GL Chart of Accounts)
  let cashAccount = await prisma.account.findFirst({
    where: { tenantId: tenant.id, code: '1010' }
  });
  if (!cashAccount) {
    cashAccount = await prisma.account.create({
      data: {
        tenantId: tenant.id,
        code: '1010',
        name: 'Cash and Bank Assets',
        type: 'asset',
        currency: 'USD'
      }
    });
  }
  
  let revenueAccount = await prisma.account.findFirst({
    where: { tenantId: tenant.id, code: '4000' }
  });
  if (!revenueAccount) {
    revenueAccount = await prisma.account.create({
      data: {
        tenantId: tenant.id,
        code: '4000',
        name: 'Sales Revenue',
        type: 'revenue',
        currency: 'USD'
      }
    });
  }
  console.log('Seeded Chart of Accounts.');

  // 4. Seed Departments & Employees
  const department = await prisma.employee.create({
    data: {
      tenantId: tenant.id,
      employeeNumber: 'EMP_001',
      fullName: 'Sarah Connor',
      email: 's.connor@amdox.com',
      jobTitle: 'Chief Executive Officer',
      employmentType: 'full_time',
      startDate: new Date('2025-01-01'),
      baseSalary: 240000.00,
      currency: 'USD',
      isActive: true
    }
  });
  
  const devEmployee = await prisma.employee.create({
    data: {
      tenantId: tenant.id,
      employeeNumber: 'EMP_002',
      fullName: 'John Doe',
      email: 'j.doe@amdox.com',
      jobTitle: 'Lead DevOps Architect',
      employmentType: 'full_time',
      startDate: new Date('2025-06-01'),
      baseSalary: 180000.00,
      currency: 'USD',
      isActive: true,
      managerId: department.id
    }
  });
  console.log('Seeded HR employees and hierarchies.');

  // 5. Seed Inventory Warehouse & Items
  const warehouse = await prisma.warehouse.create({
    data: {
      tenantId: tenant.id,
      name: 'US-East Logistics Hub',
      location: 'New York, USA'
    }
  });

  const sku1 = await prisma.inventoryItem.create({
    data: {
      tenantId: tenant.id,
      sku: 'SKU_NODE_01',
      name: 'Core Compute Node v4',
      reorderPoint: 50.00,
      reorderQty: 200.00,
      unitCost: 120.00,
      currency: 'USD'
    }
  });
  
  const sku2 = await prisma.inventoryItem.create({
    data: {
      tenantId: tenant.id,
      sku: 'SKU_SHIELD_09',
      name: 'Decryption Shield HSM',
      reorderPoint: 20.00,
      reorderQty: 50.00,
      unitCost: 1500.00,
      currency: 'USD'
    }
  });

  // Seed inventory stock levels
  await prisma.inventoryLevel.createMany({
    data: [
      { itemId: sku1.id, warehouseId: warehouse.id, quantity: 120.00 },
      { itemId: sku2.id, warehouseId: warehouse.id, quantity: 12.00 } // under reorder limit trigger
    ]
  });
  console.log('Seeded Warehousing items and stock loops.');

  // 6. Seed Projects
  await prisma.project.create({
    data: {
      tenantId: tenant.id,
      name: 'Global Supply Chain Audit',
      code: 'PROJ_SUPPLY_AUDIT',
      description: 'Re-align APAC warehouse node compliance indices.',
      budget: 450000.00,
      actualCost: 120000.00,
      status: 'active',
      startDate: new Date('2026-04-01')
    }
  });

  // 7. Seed Leads
  await prisma.lead.createMany({
    data: [
      { tenantId: tenant.id, source: 'Inbound Web', company: 'Hyperion Logistics', name: 'Alice Smith', email: 'alice@hyperion.com', status: 'new' },
      { tenantId: tenant.id, source: 'API Partner', company: 'Synthax Systems', name: 'Bob Jones', email: 'bob@synthax.com', status: 'qualified' },
      { tenantId: tenant.id, source: 'Direct Outreach', company: 'Vanguard Tech', name: 'Charlie Davis', email: 'charlie@vanguard.com', status: 'contacted' }
    ]
  });
  console.log('Seeded Leads ingestion rows.');

  console.log('AMDOX ERP: Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
