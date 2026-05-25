// apps/api/src/modules/supply-chain/supply-chain.service.ts
import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SupplyChainService {
  // Idempotency token tracker for POs
  private processedOrderTokens = new Set<string>();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registers a unique purchase order with strict cache-checked idempotency safety locks.
   */
  async commitPurchaseOrder(tenantId: string, creatorId: string, idempotencyToken: string, payload: any) {
    if (!idempotencyToken) {
      throw new BadRequestException('Missing mandatory structural tracking token [X-Idempotency-Key].');
    }

    const { vendorId, orderNumber, currency, items } = payload;
    const trackingKey = `${tenantId}:${idempotencyToken}`;

    // Enforce idempotency protection checks
    if (this.processedOrderTokens.has(trackingKey)) {
      throw new ConflictException('Idempotency failure. Duplicate transaction payload intercepted.');
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // Double check against structural code collisions inside database tracking partitions
        const existingOrder = await tx.purchaseOrder.findFirst({
          where: { tenantId: tenantId, orderNumber: orderNumber }
        });

        if (existingOrder) {
          throw new ConflictException(`Transaction aborted. Purchase Order identifier collision: ${orderNumber}`);
        }

        let calculatedSubtotal = 0;

        // Verify tracking items against real-time multi-warehouse catalog records
        for (const item of items) {
          const product = await tx.inventoryItem.findUnique({
            where: { id: item.itemId }
          });

          if (!product) throw new BadRequestException(`Catalog entry missing for targeted item: ${item.itemId}`);
          calculatedSubtotal += Number(product.unitCost) * item.qtyOrdered;
        }

        const calculatedTax = calculatedSubtotal * 0.18;
        const netAggregateTotal = calculatedSubtotal + calculatedTax;

        // Create verified, immutable order record
        return tx.purchaseOrder.create({
          data: {
            tenantId: tenantId,
            vendorId: vendorId,
            orderNumber: orderNumber,
            totalAmount: netAggregateTotal,
            status: 'pending_approval'
          }
        });
      });

      this.processedOrderTokens.add(trackingKey);
      return result;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Idempotency failure. Duplicate transaction payload intercepted.');
      }
      throw error;
    }
  }
}
