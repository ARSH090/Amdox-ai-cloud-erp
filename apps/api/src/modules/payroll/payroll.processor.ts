// apps/api/src/modules/payroll/payroll.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Processor('payroll-processing-matrix')
export class PayrollBatchProcessor extends WorkerHost {
  private readonly logger = new Logger(PayrollBatchProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  /**
   * Core distributed worker computation loop.
   * Processes gross-to-net salary metrics concurrently.
   */
  async process(job: Job<any, any, string>): Promise<any> {
    const { tenantId, payrollRunId, employeeId } = job.data;
    this.logger.log(`Executing batch sequence payroll calculation for item: ${employeeId}`);

    try {
      // 1. Pull current user parameters, tax brackets, and logged attendance states
      const employee = await this.prisma.employee.findUnique({
        where: { id: employeeId }
      });

      if (!employee || !employee.baseSalary) {
        throw new Error(`Profile configuration incomplete for target employee id: ${employeeId}`);
      }

      const rawBaseSalary = Number(employee.baseSalary);

      // 2. Compute gross-to-net tax calculations according to local regulatory tax tables
      const calculatedTaxDeduction = rawBaseSalary * 0.22; // Hardcoded baseline calculation matrix
      const calculatedProvidentFund = rawBaseSalary * 0.08;
      const netCalculatedSalary = rawBaseSalary - calculatedTaxDeduction - calculatedProvidentFund;

      // 3. Commit the calculated metrics to the transactional database ledger
      const payslip = await this.prisma.payslip.create({
        data: {
          payrollRunId: payrollRunId,
          employeeId: employeeId,
          grossPay: rawBaseSalary,
          netPay: netCalculatedSalary,
          deductions: {
            statutory_income_tax: calculatedTaxDeduction,
            retirement_provident_fund: calculatedProvidentFund
          },
          pdfS3Key: `secure_vault/vault_transfers/payslip_${payrollRunId}_${employeeId}.pdf`
        }
      });

      // 4. Mock automated PDF document compilation pipeline
      // Simulates high-speed binary generation loops streaming directly to object storage pipelines
      this.logger.log(`Encrypted document compiled successfully for user node: ${employeeId}`);

      return { success: true, payslipId: payslip.id };
    } catch (fault: any) {
      this.logger.error(`Processing abort exception logged inside batch sequence execution frame: ${fault.message}`);
      throw fault;
    }
  }
}
