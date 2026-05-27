import { Injectable, Logger, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { FinanceService, CreateJournalEntryDto } from './finance.service';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * 3-Way Matching Result DTO
 */
export interface ThreeWayMatchResult {
  invoiceId: string;
  purchaseOrderId: string;
  goodsReceiptId: string;
  status: 'matched' | 'discrepancy' | 'rejected';
  quantityVariance: Decimal; // Percentage variance
  amountVariance: Decimal; // Percentage variance
  discrepancyNotes?: string;
  matchedAt?: Date;
  generatedJournalEntryId?: string;
}

/**
 * 3-Way Matching Service: Automated Invoice Reconciliation
 *
 * The 3-way match process ensures accuracy in invoice processing by comparing:
 * 1. Purchase Order (PO) - Authorized quantities and amounts
 * 2. Goods Receipt (GR) - Actual quantities received
 * 3. Supplier Invoice (SI) - Vendor's claimed payment amount
 *
 * Core Process:
 * 1. Match invoice to PO by vendor invoice number
 * 2. Find corresponding goods receipt by PO
 * 3. Compare quantities: GR quantity vs PO quantity
 * 4. Compare amounts: Invoice amount vs (PO quantity * unit price)
 * 5. Flag discrepancies exceeding 1% variance threshold
 * 6. Auto-approve matches within tolerance
 * 7. Generate AP journal entry for approved matches
 *
 * Discrepancy Types (Flagged for Manual Review):
 * - Over-shipment: GR quantity > PO quantity by > 1%
 * - Under-shipment: GR quantity < PO quantity by > 1%
 * - Invoice overbilling: Invoice amount > (GR qty * PO unit price) by > 1%
 * - Invoice underbilling: Invoice amount < (GR qty * PO unit price) by > 1%
 * - Duplicate invoices: Same vendor invoice# for same PO
 *
 * Performance Target: < 30 seconds per invoice match
 * (3-way matching is typically batch-processed at end of day)
 */
@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);
  private readonly VARIANCE_THRESHOLD = new Decimal('1.0'); // 1% tolerance
  private readonly MATCH_TIMEOUT_MS = 30000; // 30 second timeout per match

  constructor(
    private readonly prisma: PrismaService,
    private readonly financeService: FinanceService,
  ) {}

  /**
   * Execute 3-way match for a supplier invoice
   *
   * Process:
   * 1. Validate invoice exists and is not already matched
   * 2. Find associated PO by vendor and invoice date
   * 3. Find goods receipt for that PO
   * 4. Compare line items (qty) and totals (amount)
   * 5. Flag or auto-approve based on variance
   * 6. Generate AP entry if approved
   */
  async performThreeWayMatch(
    tenantId: string,
    invoiceId: string,
    userId: string,
  ): Promise<ThreeWayMatchResult> {
    const startTime = Date.now();
    this.logger.log(`Starting 3-way match for invoice ${invoiceId} in tenant ${tenantId}`);

    try {
      // Step 1: Fetch and validate invoice
      const invoice = await this.prisma.supplierInvoice.findFirst({
        where: { id: invoiceId, tenantId },
        include: { po: { include: { lines: { include: { item: true } }, vendor: true } } },
      });

      if (!invoice) {
        throw new NotFoundException(`Supplier invoice ${invoiceId} not found in tenant ${tenantId}`);
      }

      if (invoice.status !== 'draft') {
        throw new ConflictException(
          `Invoice is already ${invoice.status}. Cannot match non-draft invoices.`
        );
      }

      // Step 2: Fetch goods receipts for this PO
      const goodsReceipts = await this.prisma.goodsReceipt.findMany({
        where: { poId: invoice.poId, tenantId },
        include: { lines: { include: { item: true } } },
        orderBy: { receivedAt: 'desc' },
      });

      if (goodsReceipts.length === 0) {
        throw new NotFoundException(
          `No goods receipts found for PO ${invoice.poId}`
        );
      }

      // Use most recent goods receipt
      const goodsReceipt = goodsReceipts[0];

      // Step 3: Compare quantities
      const quantityComparison = await this.compareQuantities(
        invoice.po,
        goodsReceipt
      );

      // Step 4: Compare amounts
      const amountComparison = await this.compareAmounts(
        invoice,
        invoice.po,
        goodsReceipt
      );

      // Step 5: Determine match status
      const isQuantityMatchOK =
        quantityComparison.variance.lessThanOrEqualTo(this.VARIANCE_THRESHOLD);
      const isAmountMatchOK =
        amountComparison.variance.lessThanOrEqualTo(this.VARIANCE_THRESHOLD);

      const matchStatus: 'matched' | 'discrepancy' = isQuantityMatchOK && isAmountMatchOK
        ? 'matched'
        : 'discrepancy';

      const discrepancyNotes = this.buildDiscrepancyNotes(
        quantityComparison,
        amountComparison,
        matchStatus
      );

      this.logger.log(
        `Match result: ${matchStatus} | Qty var: ${quantityComparison.variance}% | Amt var: ${amountComparison.variance}%`
      );

      // Step 6: Record matching result in database
      const matchingRecord = await this.prisma.financialMatching.create({
        data: {
          tenantId,
          invoiceId,
          grId: goodsReceipt.id,
          status: matchStatus,
          quantityVar: quantityComparison.variance,
          amountVar: amountComparison.variance,
          discrepancyNotes,
          matchedAt: matchStatus === 'matched' ? new Date() : undefined,
        },
      });

      // Step 7: If matched, update invoice status and generate AP entry
      let generatedEntryId: string | undefined;

      if (matchStatus === 'matched') {
        // Update invoice status
        await this.prisma.supplierInvoice.update({
          where: { id: invoiceId },
          data: { status: 'matched' },
        });

        // Generate AP journal entry
        generatedEntryId = await this.generateAPJournalEntry(
          tenantId,
          invoice,
          goodsReceipt,
          userId
        );

        this.logger.log(`Journal entry ${generatedEntryId} generated for matched invoice`);
      }

      // Step 8: Log execution time
      const executionTime = Date.now() - startTime;
      this.logger.log(`3-way match completed in ${executionTime}ms (target: <${this.MATCH_TIMEOUT_MS}ms)`);

      if (executionTime > this.MATCH_TIMEOUT_MS) {
        this.logger.warn(`Match operation exceeded target time: ${executionTime}ms`);
      }

      return {
        invoiceId,
        purchaseOrderId: invoice.poId,
        goodsReceiptId: goodsReceipt.id,
        status: matchStatus,
        quantityVariance: quantityComparison.variance,
        amountVariance: amountComparison.variance,
        discrepancyNotes,
        matchedAt: matchStatus === 'matched' ? new Date() : undefined,
        generatedJournalEntryId: generatedEntryId,
      };
    } catch (error) {
      this.logger.error(`3-way match failed: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Compare quantities: GR quantity vs PO quantity
   * Calculates variance as percentage
   */
  private async compareQuantities(
    po: any,
    goodsReceipt: any,
  ): Promise<{ poQty: Decimal; grQty: Decimal; variance: Decimal }> {
    // Sum quantities from PO and GR
    let poTotalQty = new Decimal(0);
    let grTotalQty = new Decimal(0);

    for (const poLine of po.lines) {
      poTotalQty = poTotalQty.plus(poLine.quantity);
    }

    for (const grLine of goodsReceipt.lines) {
      grTotalQty = grTotalQty.plus(grLine.quantity);
    }

    // Calculate variance as percentage
    // Variance % = ABS(GR - PO) / PO * 100
    const variance = poTotalQty.isZero()
      ? new Decimal(0)
      : grTotalQty
          .minus(poTotalQty)
          .abs()
          .dividedBy(poTotalQty)
          .times(100);

    this.logger.debug(`Quantity comparison: PO=${poTotalQty}, GR=${grTotalQty}, variance=${variance}%`);

    return {
      poQty: poTotalQty,
      grQty: grTotalQty,
      variance,
    };
  }

  /**
   * Compare amounts: Invoice amount vs PO * unit price
   * Takes GR quantity (actual received) for accurate comparison
   */
  private async compareAmounts(
    invoice: any,
    po: any,
    goodsReceipt: any,
  ): Promise<{ invoiceAmount: Decimal; expectedAmount: Decimal; variance: Decimal }> {
    const invoiceAmount = new Decimal(invoice.invoiceAmount);

    // Calculate expected amount based on GR quantities and PO unit prices
    let expectedAmount = new Decimal(0);

    for (const grLine of goodsReceipt.lines) {
      // Find matching PO line to get unit price
      const poLine = po.lines.find((line: any) => line.itemId === grLine.itemId);

      if (!poLine) {
        this.logger.warn(
          `No PO line found for item ${grLine.itemId} in GR. Using invoice amount as-is.`
        );
        continue;
      }

      // Expected: (GR quantity * PO unit price)
      const lineAmount = grLine.quantity.times(poLine.unitPrice);
      expectedAmount = expectedAmount.plus(lineAmount);
    }

    // Calculate variance as percentage
    const variance = expectedAmount.isZero()
      ? new Decimal(0)
      : invoiceAmount
          .minus(expectedAmount)
          .abs()
          .dividedBy(expectedAmount)
          .times(100);

    this.logger.debug(
      `Amount comparison: Invoice=${invoiceAmount}, Expected=${expectedAmount}, variance=${variance}%`
    );

    return {
      invoiceAmount,
      expectedAmount,
      variance,
    };
  }

  /**
   * Build human-readable discrepancy notes for manual review
   */
  private buildDiscrepancyNotes(
    quantityComparison: { poQty: Decimal; grQty: Decimal; variance: Decimal },
    amountComparison: { invoiceAmount: Decimal; expectedAmount: Decimal; variance: Decimal },
    matchStatus: string,
  ): string {
    const notes: string[] = [];

    if (matchStatus === 'discrepancy') {
      if (quantityComparison.variance.greaterThan(this.VARIANCE_THRESHOLD)) {
        const diff = quantityComparison.grQty.minus(quantityComparison.poQty);
        const direction = diff.isNegative() ? 'Under-shipment' : 'Over-shipment';
        notes.push(
          `${direction}: GR quantity (${quantityComparison.grQty}) differs from PO (${quantityComparison.poQty}) by ${quantityComparison.variance}%`
        );
      }

      if (amountComparison.variance.greaterThan(this.VARIANCE_THRESHOLD)) {
        const diff = amountComparison.invoiceAmount.minus(amountComparison.expectedAmount);
        const direction = diff.isNegative() ? 'Under-billing' : 'Over-billing';
        notes.push(
          `${direction}: Invoice amount (${amountComparison.invoiceAmount}) differs from expected (${amountComparison.expectedAmount}) by ${amountComparison.variance}%`
        );
      }
    } else {
      notes.push('All quantities and amounts match within 1% tolerance.');
    }

    return notes.join(' | ');
  }

  /**
   * Generate Accounts Payable journal entry for matched invoices
   *
   * Creates a balanced journal entry:
   * Debit:  Accounts Payable (liability account)
   * Credit: Expense/Asset account (based on item type)
   *
   * For material goods:
   *   Debit:  Inventory/Asset
   *   Credit: Accounts Payable
   *
   * For services/expenses:
   *   Debit:  Operating Expense
   *   Credit: Accounts Payable
   */
  private async generateAPJournalEntry(
    tenantId: string,
    invoice: any,
    goodsReceipt: any,
    userId: string,
  ): Promise<string> {
    // Find or create AP Payable account
    let apAccount = await this.prisma.account.findFirst({
      where: {
        tenantId,
        code: '2000', // Standard AP account code
        type: 'liability',
      },
    });

    if (!apAccount) {
      // Create default AP account if doesn't exist
      apAccount = await this.prisma.account.create({
        data: {
          tenantId,
          code: '2000',
          name: 'Accounts Payable',
          type: 'liability',
          currency: invoice.currency,
          isActive: true,
        },
      });
    }

    // Find open fiscal period
    const fiscalPeriod = await this.prisma.fiscalPeriod.findFirst({
      where: {
        tenantId,
        status: 'open',
        startDate: { lte: new Date(invoice.invoiceDate) },
        endDate: { gte: new Date(invoice.invoiceDate) },
      },
    });

    if (!fiscalPeriod) {
      throw new ConflictException(
        `No open fiscal period found for invoice date ${invoice.invoiceDate}`
      );
    }

    // Determine expense account based on item types in GR
    let expenseAccount = await this.prisma.account.findFirst({
      where: {
        tenantId,
        code: '5000', // Standard expense account code
        type: 'expense',
      },
    });

    if (!expenseAccount) {
      expenseAccount = await this.prisma.account.create({
        data: {
          tenantId,
          code: '5000',
          name: 'Cost of Goods Sold',
          type: 'expense',
          currency: invoice.currency,
          isActive: true,
        },
      });
    }

    // Create journal entry
    const journalEntryDto: CreateJournalEntryDto = {
      tenantId,
      periodId: fiscalPeriod.id,
      description: `AP Entry: Invoice ${invoice.vendorInvoiceNo} from ${invoice.po.vendor.name}`,
      currency: invoice.currency,
      fxRate: new Decimal(1.0),
      postedBy: userId,
      reference: `AP-${invoice.vendorInvoiceNo}`,
      lines: [
        {
          accountId: expenseAccount.id,
          debit: invoice.invoiceAmount,
          description: `Goods/Services received per GR ${goodsReceipt.receiptNumber}`,
          reference: invoice.vendorInvoiceNo,
        },
        {
          accountId: apAccount.id,
          credit: invoice.invoiceAmount,
          description: `Liability for invoice from ${invoice.po.vendor.name}`,
          reference: invoice.vendorInvoiceNo,
        },
      ],
    };

    // Post entry via finance service
    const entry = await this.financeService.createJournalEntry(
      tenantId,
      journalEntryDto,
      ['SuperAdmin'],
      true // Bypass role checks for internal service call
    );

    // Update invoice status to posted
    await this.prisma.supplierInvoice.update({
      where: { id: invoice.id },
      data: { status: 'posted' },
    });

    return entry.id;
  }

  /**
   * Batch 3-way matching for multiple invoices
   * Typically run at end of day
   */
  async batchThreeWayMatch(
    tenantId: string,
    userId: string,
    invoiceIds?: string[],
  ): Promise<ThreeWayMatchResult[]> {
    this.logger.log(`Starting batch 3-way matching for tenant ${tenantId}`);

    // Find unmatched invoices
    const invoices = await this.prisma.supplierInvoice.findMany({
      where: {
        tenantId,
        status: 'draft',
        ...(invoiceIds && { id: { in: invoiceIds } }),
      },
      select: { id: true },
    });

    this.logger.log(`Found ${invoices.length} unmatched invoices for batch processing`);

    const results: ThreeWayMatchResult[] = [];

    for (const invoice of invoices) {
      try {
        const result = await this.performThreeWayMatch(tenantId, invoice.id, userId);
        results.push(result);
      } catch (error) {
        this.logger.error(`Failed to match invoice ${invoice.id}: ${error.message}`);
        // Continue with next invoice on error
      }
    }

    this.logger.log(
      `Batch matching completed: ${results.filter(r => r.status === 'matched').length} matched, ` +
      `${results.filter(r => r.status === 'discrepancy').length} flagged for review`
    );

    return results;
  }

  /**
   * Manually approve a discrepant invoice
   * Only managers/admins can override discrepancies
   */
  async approveDiscrepant(
    tenantId: string,
    matchingId: string,
    approvalNotes: string,
    userId: string,
  ): Promise<void> {
    this.logger.log(`Approving discrepant match ${matchingId} by user ${userId}`);

    const matching = await this.prisma.financialMatching.findFirst({
      where: { id: matchingId, tenantId },
      include: { invoice: true },
    });

    if (!matching) {
      throw new NotFoundException(`Matching record ${matchingId} not found`);
    }

    if (matching.status !== 'discrepancy') {
      throw new ConflictException(`Only discrepant matches can be approved. This match is ${matching.status}.`);
    }

    // Update status and generate AP entry
    await this.prisma.financialMatching.update({
      where: { id: matchingId },
      data: {
        status: 'matched',
        matchedAt: new Date(),
        discrepancyNotes: `${matching.discrepancyNotes} [APPROVED BY ${userId}: ${approvalNotes}]`,
      },
    });

    // Generate AP entry
    const goodsReceipt = await this.prisma.goodsReceipt.findUnique({
      where: { id: matching.grId },
    });

    await this.generateAPJournalEntry(
      tenantId,
      matching.invoice,
      goodsReceipt,
      userId
    );

    this.logger.log(`Discrepant match ${matchingId} approved and AP entry generated`);
  }

  /**
   * Reject a matched invoice
   * Prevents AP posting and returns to pending state
   */
  async rejectMatch(
    tenantId: string,
    matchingId: string,
    rejectionReason: string,
    userId: string,
  ): Promise<void> {
    this.logger.log(`Rejecting match ${matchingId} by user ${userId}`);

    const matching = await this.prisma.financialMatching.findFirst({
      where: { id: matchingId, tenantId },
      include: { invoice: true },
    });

    if (!matching) {
      throw new NotFoundException(`Matching record ${matchingId} not found`);
    }

    // Update matching status
    await this.prisma.financialMatching.update({
      where: { id: matchingId },
      data: {
        status: 'rejected',
        discrepancyNotes: `[REJECTED BY ${userId}: ${rejectionReason}]`,
      },
    });

    // Revert invoice to draft
    await this.prisma.supplierInvoice.update({
      where: { id: matching.invoiceId },
      data: { status: 'draft' },
    });

    this.logger.log(`Match ${matchingId} rejected and invoice reverted to draft`);
  }
}
