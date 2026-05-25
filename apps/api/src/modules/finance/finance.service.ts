// apps/api/src/modules/finance/finance.service.ts
import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getLedgerAccounts(tenantId: string) {
    return this.prisma.account.findMany({
      where: { tenantId: tenantId, isActive: true },
      orderBy: { code: 'asc' },
    });
  }

  /**
   * Posts an isolated accounting ledger entry with explicit row-level verification locks.
   * Uses raw SQL transaction blocks to apply standard double-entry rules.
   */
  async postJournalEntry(tenantId: string, payload: any) {
    const { periodId, description, currency, fxRate, postedBy, lines } = payload;

    // Verify double-entry balancing rules before allocating computational resources
    let totalDebit = 0;
    let totalCredit = 0;
    for (const line of lines) {
      totalDebit += line.debit || 0;
      totalCredit += line.credit || 0;
    }

    if (Math.abs(totalDebit - totalCredit) > 0.000001) {
      throw new BadRequestException(`Unbalanced entry rejected. Variance: ${totalDebit - totalCredit}`);
    }

    // Execute isolated transaction block with pessimistic database locking
    return this.prisma.$transaction(async (tx) => {
      // 1. Lock the target fiscal period to prevent concurrent state modifications
      const [period]: any[] = await tx.$queryRaw`
        SELECT id, status FROM fiscal_periods 
        WHERE id = ${periodId}::uuid AND tenant_id = ${tenantId}::uuid 
        FOR UPDATE
      `;

      if (!period || period.status !== 'open') {
        throw new ConflictException('Target accounting period is locked or closed.');
      }

      // 2. Commit Master Journal Entry Header record
      const entry = await tx.journalEntry.create({
        data: {
          tenantId: tenantId,
          periodId: periodId,
          description,
          currency,
          fxRate: fxRate || 1.0,
          postedBy: postedBy,
        }
      });

      // 3. Populate matching accounting entry line items sequentially
      for (const line of lines) {
        // Apply row-level locks to each account node to preserve calculation matrices
        await tx.$queryRaw`
          SELECT id FROM accounts WHERE id = ${line.accountId}::uuid FOR UPDATE
        `;

        await tx.journalLine.create({
          data: {
            entryId: entry.id,
            accountId: line.accountId,
            debit: line.debit || 0,
            credit: line.credit || 0,
            description: line.description,
          }
        });
      }

      return entry;
    });
  }
}
