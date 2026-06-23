import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class SupplyChainService {
  private readonly logger = new Logger(SupplyChainService.name);

  constructor(private prisma: PrismaService) {}

  async generatePurchaseOrder(tenantId: string, vendorId: string, items: { itemId: string; quantity: Decimal }[], idempotencyKey: string) {
    this.logger.log(`Generating PO for vendor ${vendorId} in tenant ${tenantId}`);

    return this.prisma.runInTenantContext(tenantId, async (tx) => {
      let totalAmount = new Decimal(0);
      const lines = [];

      for (const item of items) {
        const inventoryItem = await tx.inventoryItem.findUnique({
          where: { id: item.itemId }
        });
        if (!inventoryItem) throw new NotFoundException(`Item ${item.itemId} not found`);

        const totalPrice = inventoryItem.unitCost.mul(item.quantity);
        totalAmount = totalAmount.plus(totalPrice);

        lines.push({
          itemId: item.itemId,
          qtyOrdered: item.quantity,
          unitPrice: inventoryItem.unitCost,
          totalPrice: totalPrice
        });
      }

      const po = await tx.purchaseOrder.create({
        data: {
          vendorId,
          orderNumber: `PO-${Date.now()}`,
          status: 'draft',
          totalAmount,
          currency: 'USD',
          idempotencyKey,
          lines: {
            create: lines
          }
        },
        include: { lines: true }
      });

      return po;
    });
  }

  async createPurchaseRequisition(tenantId: string, requesterId: string, totalAmount: Decimal) {
    return this.prisma.purchaseRequisition.create({
      data: {
        tenantId,
        requesterId,
        status: 'pending',
        totalAmount
      }
    });
  }

  async processGoodsReceipt(tenantId: string, purchaseOrderId: string, receivedBy: string, receiptLines: { poLineId: string; quantityReceived: Decimal; unitCost: Decimal }[]) {
    this.logger.log(`Processing Goods Receipt for PO ${purchaseOrderId}`);

    return this.prisma.runInTenantContext(tenantId, async (tx) => {
      // 1. Create Goods Receipt
      const receipt = await tx.goodsReceipt.create({
        data: {
          purchaseOrderId,
          receivedBy,
        }
      });

      // 2. Create Receipt Lines and update stock
      for (const line of receiptLines) {
        await tx.receiptLine.create({
          data: {
            receiptId: receipt.id,
            poLineId: line.poLineId,
            quantityReceived: line.quantityReceived,
            unitCost: line.unitCost
          }
        });

        // Get Item ID from PO line
        const poLine = await tx.purchaseOrderLine.findUnique({
          where: { id: line.poLineId }
        });

        if (poLine) {
          // Track movement
          await tx.stockMovement.create({
            data: {
              itemId: poLine.itemId,
              warehouseId: 'DEFAULT_WH_ID', // In real app, passed in args
              quantity: line.quantityReceived,
              type: 'in',
              reference: `GR-${receipt.id}`
            }
          });
        }
      }

      // 3. Update PO status
      await tx.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: { status: 'received' }
      });

      return receipt;
    });
  }
}
