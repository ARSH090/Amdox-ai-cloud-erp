// apps/api/src/modules/hr/hr.controller.ts
import { Controller, Get, Post, Body, Headers, BadRequestException } from '@nestjs/common';
import { HrService } from './hr.service';

@Controller('hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Get('employees')
  async getEmployees(@Headers('x-tenant-id') tenantId: string) {
    if (!tenantId) throw new BadRequestException('Missing mandatory tenant domain execution claims.');
    return this.hrService.retrieveWorkforceRegistry(tenantId);
  }

  @Post('payroll-run')
  async runPayroll(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Body() payload: any
  ) {
    if (!tenantId || !userId) {
      throw new BadRequestException('Missing mandatory execution headers.');
    }
    return this.hrService.dispatchBulkPayrollRun(tenantId, userId, payload);
  }
}
