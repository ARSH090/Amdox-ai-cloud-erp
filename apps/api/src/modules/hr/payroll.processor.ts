import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Processor('payroll')
export class PayrollProcessor extends WorkerHost {
  private readonly logger = new Logger(PayrollProcessor.name);

  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { tenantId, payrollRunId, employeeId } = job.data;
    this.logger.log(`Processing payroll for employee ${employeeId} in run ${payrollRunId}`);

    return this.prisma.runInTenantContext(tenantId, async (tx) => {
      const employee = await tx.employee.findUnique({ where: { id: employeeId } });
      if (!employee) throw new Error(`Employee ${employeeId} not found`);

      const baseSalary = employee.baseSalary || new Decimal(0);
      
      const taxSlabs = await tx.taxSlab.findMany({
        where: { jurisdiction: 'US' },
        orderBy: { minIncome: 'asc' }
      });

      let remainingIncome = baseSalary;
      let totalTax = new Decimal(0);

      for (const slab of taxSlabs) {
        if (remainingIncome.greaterThan(0)) {
          const taxableInThisSlab = slab.maxIncome 
            ? Decimal.min(remainingIncome, slab.maxIncome.minus(slab.minIncome))
            : remainingIncome;
          
          if (taxableInThisSlab.greaterThan(0)) {
            totalTax = totalTax.plus(taxableInThisSlab.mul(slab.rate));
            remainingIncome = remainingIncome.minus(taxableInThisSlab);
          }
        }
      }

      const netPay = baseSalary.minus(totalTax);

      await tx.payslip.create({
        data: {
          payrollRunId,
          employeeId,
          grossPay: baseSalary,
          netPay: netPay,
          deductions: { tax: totalTax.toString() }
        }
      });

      return { success: true, netPay: netPay.toString() };
    });
  }
}
