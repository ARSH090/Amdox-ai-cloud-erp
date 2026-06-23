// apps/api/src/modules/finance/finance.controller.ts
import { Controller, Get, Post, Body, Headers, BadRequestException, UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RoleType } from '@prisma/client';

@Controller('finance')
@UseGuards(RolesGuard)
@Roles(RoleType.SuperAdmin, RoleType.TenantAdmin, RoleType.Manager)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('ledger')
  async fetchLedger(@Headers('x-tenant-id') tenantId: string) {
    if (!tenantId) throw new BadRequestException('Missing mandatory tenant domain execution claims.');
    return { status: 'mock' };
  }

  @Post('journal-entries')
  async createEntry(@Headers('x-tenant-id') tenantId: string, @Body() payload: any) {
    if (!tenantId) throw new BadRequestException('Missing mandatory tenant domain execution claims.');
    return this.financeService.createJournalEntry(tenantId, payload, true);
  }
}
