// apps/api/src/modules/supply-chain/supply-chain.controller.ts
import { Controller, Post, Body, Headers, BadRequestException } from '@nestjs/common';
import { SupplyChainService } from './supply-chain.service';

@Controller('supply-chain')
export class SupplyChainController {
  constructor(private readonly supplyChainService: SupplyChainService) {}

  @Post('purchase-orders')
  async generateOrder(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-idempotency-key') idempotencyKey: string,
    @Body() payload: any
  ) {
    if (!tenantId || !userId) {
      throw new BadRequestException('Missing mandatory validation headers.');
    }
    return this.supplyChainService.commitPurchaseOrder(tenantId, userId, idempotencyKey, payload);
  }
}
