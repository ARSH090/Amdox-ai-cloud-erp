// apps/api/src/modules/supply-chain/supply-chain.controller.ts
import { Controller, Post, Body, Headers, BadRequestException, UseGuards } from '@nestjs/common';
import { SupplyChainService } from './supply-chain.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RoleType } from '@prisma/client';

@Controller('supply-chain')
@UseGuards(RolesGuard)
@Roles(RoleType.Manager, RoleType.Viewer)
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
    return this.supplyChainService.generatePurchaseOrder(tenantId, payload?.vendorId || 'fake', [], idempotencyKey);
  }
}
