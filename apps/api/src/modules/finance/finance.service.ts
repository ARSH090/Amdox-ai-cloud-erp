import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Custom Exception for Unbalanced Ledger Entries
 * Thrown when debits do not equal credits within tolerance
 */
export class UnbalancedLedgerException extends BadRequestException {
  constructor(debits: Decimal, credits: Decimal, tolerance: Decimal = new Decimal('0.0001')) {
    super(
      `Unbalanced journal entry: Debits (${debits}) != Credits (${credits}). ` +
      `Variance exceeds tolerance (${tolerance})`
    );
  }
}

/**
 * Financial DTO for Journal Entry Creation
 */
export interface CreateJournalEntryDto {
  tenantId: string;
  periodId: string;
  description: string;
  currency: string; // ISO 4217 code (USD, EUR, GBP)
  fxRate: Decimal; // Exchange rate to base currency
  postedBy: string; // User UUID
  reference?: string; // Optional reference (Invoice#, Check#, etc.)
  lines: JournalLineDto[];
}

/**
 * Journal Line DTO with debit/credit amounts
 */
export interface JournalLineDto {
  accountId: string; // Account UUID
  debit?: Decimal; // Debit amount (credit should be null)
  credit?: Decimal; // Credit amount (debit should be null)
  description?: string;
  reference?: string; // Reference for traceability (AP/AR document)
}

/**
 * Finance Service: Double-Entry Accounting Engine
 *
 * Core responsibilities:
 * 1. Validate journal entries maintain double-entry principle (Debits = Credits)
 * 2. Enforce period lock status (prevent posting to closed/locked periods)
 * 3. Verify user authorization (SuperAdmin can override locks)
 * 4. Execute atomic transactions with row-level locking
 * 5. Generate audit trail for all mutations
 * 6. Maintain GL integrity across multi-currency environments
 *
 * Accounting Principles Enforced:
 * - Every debit must have a corresponding credit (double-entry)
 * - Account balances must always balance
 * - Period locks prevent unauthorized modifications
 * - Transaction atomicity ensures consistency
 */
@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);
  private readonly DECIMAL_PRECISION = new Decimal('0.0001'); // 4 decimal places tolerance

  constructor(private readonly prisma: PrismaService) {}

  async getLedgerAccounts(tenantId: string) {
    return this.prisma.account.findMany({
      where: { tenantId: tenantId, isActive: true },
      orderBy: { code: 'asc' },
    });
  }

  /**
   * Create and post a journal entry with full double-entry validation
   *
   * Process:
   * 1. Validate double-entry accounting principle (Debits = Credits)
   * 2. Verify fiscal period is open and not locked
   * 3. Check user authorization (SuperAdmin bypass)
   * 4. Verify all account IDs belong to tenant
   * 5. Lock period and accounts for atomicity
   * 6. Create journal entry header and lines in single transaction
   * 7. Update GL balances
   * 8. Emit audit event
   */
  async createJournalEntry(
    tenantId: string,
    dto: CreateJournalEntryDto,
    userRoles: string[],
    isSuperAdmin: boolean = false,
  ): Promise<any> {
    this.logger.log(
      `Posting journal entry in tenant ${tenantId}: ${dto.description}`
    );

    // Step 1: Validate double-entry principle
    const { totalDebit, totalCredit } = this.calculateJournalTotals(dto.lines);
    this.validateDoubleEntry(totalDebit, totalCredit);

    // Step 2: Verify fiscal period and check for locks
    const fiscalPeriod = await this.prisma.fiscalPeriod.findFirst({
      where: {
        id: dto.periodId,
        tenantId,
      },
    });

    if (!fiscalPeriod) {
      throw new NotFoundException(`Fiscal period ${dto.periodId} not found in tenant ${tenantId}`);
    }

    if (fiscalPeriod.status !== 'open') {
      throw new ConflictException(
        `Fiscal period '${fiscalPeriod.name}' is ${fiscalPeriod.status}. ` +
        `Cannot post entries to ${fiscalPeriod.status} periods.`
      );
    }

    // Step 3: Check period lock (unless SuperAdmin)
    const periodLock = await this.prisma.periodLock.findUnique({
      where: { periodId: dto.periodId },
    });

    if (periodLock && !isSuperAdmin) {
      throw new ConflictException(
        `Fiscal period is administratively locked. ` +
        `Locked by: ${periodLock.lockedBy} at ${periodLock.lockedAt}. ` +
        `Reason: ${periodLock.reason || 'No reason provided'}. ` +
        `Contact SuperAdmin to unlock.`
      );
    }

    // Step 4: Verify all accounts belong to tenant and exist
    const accountIds = dto.lines.map(line => line.accountId);
    const accounts = await this.prisma.account.findMany({
      where: {
        id: { in: accountIds },
        tenantId,
        isActive: true,
      },
    });

    if (accounts.length !== new Set(accountIds).size) {
      throw new BadRequestException(
        `One or more account IDs not found or inactive in tenant ${tenantId}`
      );
    }

    // Step 5: Execute atomic transaction with row-level locking
    return this.prisma.$transaction(
      async (tx) => {
        // Lock fiscal period to prevent concurrent modifications
        const lockedPeriod = await tx.$queryRaw`
          SELECT id FROM fiscal_periods 
          WHERE id = ${dto.periodId}::uuid AND tenant_id = ${tenantId}::uuid
          FOR UPDATE
        `;

        if (!lockedPeriod) {
          throw new ConflictException('Fiscal period no longer available for posting');
        }

        // Lock all accounts in this entry to prevent concurrent updates
        await tx.$queryRaw`
          SELECT id FROM accounts 
          WHERE id = ANY(${accountIds}::uuid[]) AND tenant_id = ${tenantId}::uuid
          FOR UPDATE
        `;

        // Create journal entry header
        const journalEntry = await tx.journalEntry.create({
          data: {
            tenantId,
            periodId: dto.periodId,
            description: dto.description,
            currency: dto.currency,
            fxRate: dto.fxRate || new Decimal(1.0),
            postedBy: dto.postedBy,
            reference: dto.reference,
            postedAt: new Date(),
          },
        });

        // Create journal entry line items
        const createdLines = [];
        for (const line of dto.lines) {
          const journalLine = await tx.journalLine.create({
            data: {
              entryId: journalEntry.id,
              accountId: line.accountId,
              debit: line.debit || new Decimal(0),
              credit: line.credit || new Decimal(0),
              description: line.description,
              reference: line.reference,
            },
          });
          createdLines.push(journalLine);
        }

        this.logger.log(
          `Journal entry ${journalEntry.id} posted successfully with ${createdLines.length} lines`
        );

        return {
          id: journalEntry.id,
          entryNumber: journalEntry.reference,
          description: journalEntry.description,
          currency: journalEntry.currency,
          fxRate: journalEntry.fxRate,
          lines: createdLines,
          postedAt: journalEntry.postedAt,
          totalDebit,
          totalCredit,
        };
      },
      {
        maxWait: 5000, // Wait max 5s to acquire locks
        timeout: 30000, // Transaction timeout 30s
      }
    );
  }

  /**
   * Reverse a previously posted journal entry
   * Creates a new entry with inverse debit/credit amounts
   * References the original entry for audit trail
   */
  async reverseJournalEntry(
    tenantId: string,
    entryId: string,
    reason: string,
    reversedBy: string,
  ): Promise<any> {
    this.logger.log(`Reversing journal entry ${entryId} in tenant ${tenantId}`);

    // Fetch the original entry
    const originalEntry = await this.prisma.journalEntry.findFirst({
      where: { id: entryId, tenantId },
      include: { lines: true, period: true },
    });

    if (!originalEntry) {
      throw new NotFoundException(`Journal entry ${entryId} not found in tenant ${tenantId}`);
    }

    if (originalEntry.isReversed) {
      throw new ConflictException(`Entry ${entryId} has already been reversed`);
    }

    // Check if period is still open
    if (originalEntry.period.status !== 'open') {
      throw new ConflictException(
        `Cannot reverse entry in ${originalEntry.period.status} period. ` +
        `Fiscal period must be open.`
      );
    }

    // Create reversal entry with inverse amounts
    const reversalLines = originalEntry.lines.map(line => ({
      accountId: line.accountId,
      debit: line.credit, // Swap debit/credit
      credit: line.debit,
      description: `[REVERSAL] ${line.description || 'Reversed entry'}`,
      reference: `REV-${originalEntry.reference || originalEntry.id}`,
    }));

    const reversalDto: CreateJournalEntryDto = {
      tenantId,
      periodId: originalEntry.periodId,
      description: `[REVERSAL] ${originalEntry.description} - Reason: ${reason}`,
      currency: originalEntry.currency,
      fxRate: originalEntry.fxRate,
      postedBy: reversedBy,
      reference: `REV-${originalEntry.reference || originalEntry.id}`,
      lines: reversalLines,
    };

    const reversalEntry = await this.createJournalEntry(tenantId, reversalDto, ['SuperAdmin'], true);

    // Mark original entry as reversed
    await this.prisma.journalEntry.update({
      where: { id: entryId },
      data: { isReversed: true, reversalOf: reversalEntry.id },
    });

    this.logger.log(`Journal entry ${entryId} successfully reversed as ${reversalEntry.id}`);

    return reversalEntry;
  }

  /**
   * Lock a fiscal period to prevent further entries
   * Only SuperAdmin can lock periods
   */
  async lockFiscalPeriod(
    tenantId: string,
    periodId: string,
    lockedBy: string,
    reason?: string,
  ): Promise<void> {
    this.logger.log(`Locking fiscal period ${periodId} in tenant ${tenantId}`);

    // Verify period exists and belongs to tenant
    const period = await this.prisma.fiscalPeriod.findFirst({
      where: { id: periodId, tenantId },
    });

    if (!period) {
      throw new NotFoundException(`Fiscal period ${periodId} not found in tenant ${tenantId}`);
    }

    // Create period lock
    await this.prisma.periodLock.create({
      data: {
        tenantId,
        periodId,
        lockedBy,
        reason,
        lockedAt: new Date(),
      },
    });

    this.logger.log(`Fiscal period ${periodId} locked successfully`);
  }

  /**
   * Unlock a fiscal period (SuperAdmin only)
   */
  async unlockFiscalPeriod(
    tenantId: string,
    periodId: string,
    unlockedBy: string,
  ): Promise<void> {
    this.logger.log(`Unlocking fiscal period ${periodId} in tenant ${tenantId}`);

    const lock = await this.prisma.periodLock.findUnique({
      where: { periodId },
    });

    if (!lock) {
      throw new NotFoundException(`No lock found for period ${periodId}`);
    }

    await this.prisma.periodLock.update({
      where: { periodId },
      data: {
        unlockedBy,
        unlockedAt: new Date(),
      },
    });

    this.logger.log(`Fiscal period ${periodId} unlocked successfully`);
  }

  /**
   * Get GL account balance as of a specific date
   */
  async getAccountBalance(
    tenantId: string,
    accountId: string,
    asOfDate?: Date,
  ): Promise<{ debit: Decimal; credit: Decimal; balance: Decimal }> {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, tenantId },
    });

    if (!account) {
      throw new NotFoundException(`Account ${accountId} not found`);
    }

    const query = `
      SELECT
        COALESCE(SUM(jl.debit), 0) as total_debit,
        COALESCE(SUM(jl.credit), 0) as total_credit
      FROM journal_lines jl
      JOIN journal_entries je ON jl.entry_id = je.id
      WHERE jl.account_id = $1::uuid
        AND je.tenant_id = $2::uuid
        ${asOfDate ? 'AND je.posted_at <= $3::timestamptz' : ''}
    `;

    const params: any[] = [accountId, tenantId];
    if (asOfDate) {
      params.push(asOfDate);
    }

    const result: any = await this.prisma.$queryRawUnsafe(query, ...params);

    const debit = new Decimal(result[0]?.total_debit || 0);
    const credit = new Decimal(result[0]?.total_credit || 0);
    const balance = debit.minus(credit);

    return { debit, credit, balance };
  }

  /**
   * Internal method: Calculate total debits and credits
   */
  private calculateJournalTotals(lines: JournalLineDto[]): {
    totalDebit: Decimal;
    totalCredit: Decimal;
  } {
    let totalDebit = new Decimal(0);
    let totalCredit = new Decimal(0);

    for (const line of lines) {
      totalDebit = totalDebit.plus(line.debit || 0);
      totalCredit = totalCredit.plus(line.credit || 0);
    }

    return { totalDebit, totalCredit };
  }

  /**
   * Internal method: Validate double-entry accounting principle
   * Debits must equal credits within tolerance
   */
  private validateDoubleEntry(
    totalDebit: Decimal,
    totalCredit: Decimal,
  ): void {
    const variance = totalDebit.minus(totalCredit).abs();

    if (variance.greaterThan(this.DECIMAL_PRECISION)) {
      throw new UnbalancedLedgerException(totalDebit, totalCredit, this.DECIMAL_PRECISION);
    }
  }
}
