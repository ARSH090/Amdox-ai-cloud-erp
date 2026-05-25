// apps/api/src/modules/hr/hr.service.ts
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class HrService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('payroll-processing-matrix') private readonly payrollQueue: Queue
  ) {}

  async retrieveWorkforceRegistry(tenantId: string) {
    return this.prisma.employee.findMany({
      where: { tenantId: tenantId, deletedAt: null },
      include: { department: true }
    });
  }

  /**
   * Orchestrates high-volume parallel payroll processing queues via BullMQ.
   */
  async dispatchBulkPayrollRun(tenantId: string, initiatorId: string, payload: any) {
    const { periodName, startDate, endDate } = payload;

    // 1. Initialize master execution tracking header record
    const payrollRun = await this.prisma.payrollRun.create({
      data: {
        tenantId: tenantId,
        periodName: periodName,
        periodStart: new Date(startDate),
        periodEnd: new Date(endDate),
        status: 'processing',
        initiatedBy: initiatorId,
      }
    });

    // 2. Extract active workforce records for the processing tenant partition
    const activeStaff = await this.prisma.employee.findMany({
      where: { tenantId: tenantId, isActive: true, deletedAt: null },
      select: { id: true }
    });

    // 3. Push items concurrently into the Redis execution queue cluster
    const jobs = activeStaff.map((staff) => ({
      name: 'execute-salary-calculation-node',
      data: {
        tenantId,
        payrollRunId: payrollRun.id,
        employeeId: staff.id
      },
      opts: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true
      }
    }));

    await this.payrollQueue.addBulk(jobs);

    return {
      message: 'Bulk execution run successfully dispatched across processing clusters.',
      batchTrackingId: payrollRun.id,
      recordsQueuedCount: activeStaff.length
    };
  }
}
