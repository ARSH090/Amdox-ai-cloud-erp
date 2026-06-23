import { Injectable, BadRequestException, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

export class UnbalancedLedgerException extends BadRequestException {
  constructor(debits: Decimal, credits: Decimal, tolerance: Decimal = new Decimal('0.0001')) {
    super(`Unbalanced journal entry: Debits (${debits}) != Credits (${credits}). Variance exceeds tolerance (${tolerance})`);
  }
}

export interface CreateJournalEntryDto {
  periodId: string;
  description: string;
  currency: string;
  fxRate: Decimal;
  postedBy: string;
  reference?: string;
  lines: JournalLineDto[];
}

export interface JournalLineDto {
  accountId: string;
  debit?: Decimal;
  credit?: Decimal;
  description?: string;
  reference?: string;
}

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);
  private readonly DECIMAL_PRECISION = new Decimal('0.0001');

  constructor(private readonly prisma: PrismaService) {}

  async createJournalEntry(tenantId: string, dto: CreateJournalEntryDto, isSuperAdmin: boolean = false) {
    this.logger.log(`Posting journal entry in tenant ${tenantId}: ${dto.description}`);

    const { totalDebit, totalCredit } = this.calculateTotals(dto.lines);
    this.validateDoubleEntry(totalDebit, totalCredit);

    return this.prisma.runInTenantContext(tenantId, async (tx) => {
      // Check period
      const period = await tx.fiscalPeriod.findUnique({
        where: { id: dto.periodId },
        include: { lock: true }
      });

      if (!period) throw new NotFoundException('Fiscal period not found');
      if (period.status !== 'open') throw new ConflictException(`Fiscal period is ${period.status}`);
      if (period.lock && !isSuperAdmin) throw new ConflictException('Fiscal period is locked');

      // Verify accounts
      const accountIds = dto.lines.map(l => l.accountId);
      const accounts = await tx.account.findMany({
        where: { id: { in: accountIds }, isActive: true }
      });
      if (accounts.length !== new Set(accountIds).size) {
        throw new BadRequestException('One or more accounts invalid or inactive');
      }

      // Create Entry
      const entry = await tx.journalEntry.create({
        data: {
          periodId: dto.periodId,
          description: dto.description,
          currency: dto.currency,
          fxRate: dto.fxRate,
          postedBy: dto.postedBy,
          reference: dto.reference,
          lines: {
            create: dto.lines.map(line => ({
              accountId: line.accountId,
              debit: line.debit || new Decimal(0),
              credit: line.credit || new Decimal(0),
              description: line.description,
              reference: line.reference
            }))
          }
        },
        include: { lines: true }
      });

      return entry;
    });
  }

  async reverseEntry(tenantId: string, entryId: string, reversedBy: string, reason: string) {
    return this.prisma.runInTenantContext(tenantId, async (tx) => {
      const original = await tx.journalEntry.findUnique({
        where: { id: entryId },
        include: { lines: true, period: true }
      });

      if (!original) throw new NotFoundException('Journal entry not found');
      if (original.isReversed) throw new ConflictException('Already reversed');
      if (original.period.status !== 'open') throw new ConflictException('Period is closed');

      const reversalEntry = await tx.journalEntry.create({
        data: {
          periodId: original.periodId,
          description: `[REVERSAL] ${original.description} - ${reason}`,
          currency: original.currency,
          fxRate: original.fxRate,
          postedBy: reversedBy,
          reference: `REV-${original.reference || original.id}`,
          lines: {
            create: original.lines.map((line: any) => ({
              accountId: line.accountId,
              debit: line.credit,
              credit: line.debit,
              description: `[REVERSAL] ${line.description || ''}`,
              reference: `REV-${original.reference || original.id}`
            }))
          }
        }
      });

      await tx.journalEntry.update({
        where: { id: entryId },
        data: { isReversed: true, reversalOf: reversalEntry.id }
      });

      return reversalEntry;
    });
  }

  private calculateTotals(lines: JournalLineDto[]) {
    return {
      totalDebit: lines.reduce((sum, l) => sum.plus(l.debit || 0), new Decimal(0)),
      totalCredit: lines.reduce((sum, l) => sum.plus(l.credit || 0), new Decimal(0))
    };
  }

  private validateDoubleEntry(totalDebit: Decimal, totalCredit: Decimal) {
    if (totalDebit.minus(totalCredit).abs().greaterThan(this.DECIMAL_PRECISION)) {
      throw new UnbalancedLedgerException(totalDebit, totalCredit, this.DECIMAL_PRECISION);
    }
  }
}
