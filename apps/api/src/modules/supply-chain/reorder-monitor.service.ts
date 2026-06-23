import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { SupplyChainService } from './supply-chain.service';

@Injectable()
export class ReorderMonitorService {
  private readonly logger = new Logger(ReorderMonitorService.name);

  constructor(
    private prisma: PrismaService,
    private supplyChain: SupplyChainService
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async checkInventoryLevels() {
    this.logger.log('Running hourly inventory reorder check...');

    // We need to bypass RLS here to check all tenants, or iterate tenants
    // For a global cron, we run raw queries or iterate active tenants
    const tenants = await this.prisma.tenant.findMany({ where: { status: 'ACTIVE' } });

    for (const tenant of tenants) {
      await this.prisma.runInTenantContext(tenant.id, async (tx) => {
        const levels = await tx.inventoryLevel.findMany({
          include: { item: true }
        });

        for (const level of levels) {
          if (level.quantity.lessThanOrEqualTo(level.item.reorderPoint) && level.item.autoDraftEnabled) {
            const vendorId = level.item.preferredVendorId;
            if (vendorId) {
              const idempotencyKey = `auto-po-${level.item.id}-${new Date().toISOString().split('T')[0]}`;
              
              // Check if PO already exists today for this item
              const existing = await tx.purchaseOrder.findUnique({
                where: { idempotencyKey }
              });

              if (!existing) {
                this.logger.log(`Auto-drafting PO for item ${level.item.sku} in tenant ${tenant.id}`);
                await this.supplyChain.generatePurchaseOrder(
                  tenant.id,
                  vendorId,
                  [{ itemId: level.item.id, quantity: level.item.reorderQty }],
                  idempotencyKey
                );
              }
            }
          }
        }
      });
    }
  }
}
