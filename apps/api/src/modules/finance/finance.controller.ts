// apps/api/src/modules/finance/finance.controller.ts
import { Controller, Get, Post, Body, Headers, BadRequestException } from '@nestjs/common';
import { FinanceService } from './finance.service';

@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('ledger')
  async fetchLedger(@Headers('x-tenant-id') tenantId: string) {
    if (!tenantId) throw new BadRequestException('Missing mandatory tenant domain execution claims.');
    return this.financeService.getLedgerAccounts(tenantId);
  }

  @Post('journal-entries')
  async createEntry(@Headers('x-tenant-id') tenantId: string, @Body() payload: any) {
    if (!tenantId) throw new BadRequestException('Missing mandatory tenant domain execution claims.');
    return this.financeService.createJournalEntry(tenantId, payload, ['admin'], true);
  }
}
