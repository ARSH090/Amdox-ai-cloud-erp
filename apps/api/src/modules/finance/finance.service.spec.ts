import { Test, TestingModule } from '@nestjs/testing';
import { FinanceService, UnbalancedLedgerException } from './finance.service';
import { PrismaService } from '../../database/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

describe('FinanceService', () => {
  let service: FinanceService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanceService,
        {
          provide: PrismaService,
          useValue: {
            runInTenantContext: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FinanceService>(FinanceService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createJournalEntry', () => {
    it('should throw UnbalancedLedgerException if debits do not equal credits', async () => {
      const dto = {
        periodId: 'period-1',
        description: 'Test Entry',
        currency: 'USD',
        fxRate: new Decimal(1),
        postedBy: 'user-1',
        lines: [
          { accountId: 'acc-1', debit: new Decimal(100), credit: new Decimal(0) },
          { accountId: 'acc-2', debit: new Decimal(0), credit: new Decimal(90) }, // Imbalance of 10
        ],
      };

      await expect(service.createJournalEntry('tenant-1', dto)).rejects.toThrow(UnbalancedLedgerException);
    });

    it('should proceed if debits equal credits', async () => {
      const dto = {
        periodId: 'period-1',
        description: 'Test Entry',
        currency: 'USD',
        fxRate: new Decimal(1),
        postedBy: 'user-1',
        lines: [
          { accountId: 'acc-1', debit: new Decimal(100), credit: new Decimal(0) },
          { accountId: 'acc-2', debit: new Decimal(0), credit: new Decimal(100) },
        ],
      };

      jest.spyOn(prisma, 'runInTenantContext').mockResolvedValueOnce({ id: 'entry-1' } as any);

      const result = await service.createJournalEntry('tenant-1', dto);
      expect(result).toBeDefined();
      expect(prisma.runInTenantContext).toHaveBeenCalled();
    });
  });
});
