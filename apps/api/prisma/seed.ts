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
      settings: {
        theme: 'dark',
        features: { finance: true, hr: true, supplyChain: true, forecasting: true }
      }
    }
  });
  console.log(`Seeded Tenant: ${tenant.name} (${tenant.id})`);

  // 2. Seed Users
  const adminUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'admin@amdox.com' } },
    update: {},
    create: {
      tenantId: tenant.id,
      keycloakSub: 'k-admin-01',
      email: 'admin@amdox.com',
      fullName: 'Sarah Connor',
      avatarUrl: '',
      isActive: true
    }
  });
  console.log(`Seeded User: ${adminUser.fullName}`);

  // 3. Seed Accounts (GL Chart of Accounts)
  const cashAccount = await prisma.account.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: '1010' } },
    update: {},
    create: {
      tenantId: tenant.id,
      code: '1010',
      name: 'Cash and Bank Assets',
      type: 'asset',
      currency: 'USD'
    }
  });
  
  const revenueAccount = await prisma.account.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: '4000' } },
    update: {},
    create: {
      tenantId: tenant.id,
      code: '4000',
      name: 'Sales Revenue',
      type: 'revenue',
      currency: 'USD'
    }
  });
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
      code: 'WH_EAST_01',
      name: 'US-East Logistics Hub',
      location: 'New York, USA'
    }
  });

  const sku1 = await prisma.inventoryItem.create({
    data: {
      tenantId: tenant.id,
      sku: 'SKU_NODE_01',
      name: 'Core Compute Node v4',
      unitOfMeasure: 'each',
      reorderPoint: 50.00,
      reorderQty: 200.00,
      unitCost: 120.00,
      costingMethod: 'FIFO'
    }
  });
  
  const sku2 = await prisma.inventoryItem.create({
    data: {
      tenantId: tenant.id,
      sku: 'SKU_SHIELD_09',
      name: 'Decryption Shield HSM',
      unitOfMeasure: 'each',
      reorderPoint: 20.00,
      reorderQty: 50.00,
      unitCost: 1500.00,
      costingMethod: 'FIFO'
    }
  });

  // Seed inventory stock levels
  await prisma.inventoryLevel.createMany({
    data: [
      { tenantId: tenant.id, itemId: sku1.id, warehouseId: warehouse.id, quantity: 120.00, location: 'Shelf-A1' },
      { tenantId: tenant.id, itemId: sku2.id, warehouseId: warehouse.id, quantity: 12.00, location: 'Vault-B2' } // under reorder limit trigger
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
      spent: 120000.00,
      status: 'active',
      startDate: new Date('2026-04-01')
    }
  });

  // 7. Seed Leads
  await prisma.lead.createMany({
    data: [
      { tenantId: tenant.id, source: 'Inbound Web', company: 'Hyperion Logistics', estimatedValue: 142500.00, status: 'new', partition: 'SEC_ALPHA_01' },
      { tenantId: tenant.id, source: 'API Partner', company: 'Synthax Systems', estimatedValue: 89000.00, status: 'qualified', partition: 'SEC_BETA_04' },
      { tenantId: tenant.id, source: 'Direct Outreach', company: 'Vanguard Tech', estimatedValue: 210000.00, status: 'contacted', partition: 'SEC_ALPHA_09' }
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
