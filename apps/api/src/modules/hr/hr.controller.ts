// apps/api/src/modules/hr/hr.controller.ts
import { Controller, Get, Post, Body, Headers, BadRequestException, UseGuards } from '@nestjs/common';
import { HrService } from './hr.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RoleType } from '@prisma/client';

@Controller('hr')
@UseGuards(RolesGuard)
@Roles(RoleType.Manager, RoleType.Viewer)
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Get('employees')
  async getEmployees() {
    return this.hrService.getEmployees();
  }

  @Post('employees')
  async createEmployee(@Body() payload: any) {
    return this.hrService.createEmployee(payload);
  }

  @Get('leaves')
  async getLeaveRequests() {
    return this.hrService.getLeaveRequests();
  }

  @Post('leaves')
  async createLeaveRequest(@Body() payload: any) {
    return this.hrService.createLeaveRequest(payload);
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
    return { status: 'mock' };
  }
}
