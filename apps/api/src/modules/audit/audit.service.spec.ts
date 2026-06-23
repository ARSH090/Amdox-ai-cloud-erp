import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../../database/prisma.service';

describe('AuditService', () => {
  let service: AuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: PrismaService,
          useValue: {
            runInTenantContext: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Mocking the cryptographic chain logic to prove the mathematical link
  describe('verifyChainIntegrity', () => {
    it('should detect cryptographic corruption if prevHash does not match hash', async () => {
      const mockBlocks = [
        { id: '1', hash: 'hash1', prevHash: 'hash0' },
        { id: '2', hash: 'hash2', prevHash: 'tampered-hash' }, // Tampered
      ];

      jest.spyOn(service['prisma'], 'runInTenantContext').mockImplementation(async (tenant, cb) => {
        return cb({
          auditLog: { findMany: jest.fn().mockResolvedValue(mockBlocks) },
        } as any);
      });

      const isValid = await service.verifyChainIntegrity('tenant-1');
      expect(isValid).toBe(false);
    });

    it('should return true if the hash chain is perfectly linked', async () => {
      const mockBlocks = [
        { id: '1', hash: 'hash1', prevHash: 'hash0' },
        { id: '2', hash: 'hash2', prevHash: 'hash1' },
        { id: '3', hash: 'hash3', prevHash: 'hash2' },
      ];

      jest.spyOn(service['prisma'], 'runInTenantContext').mockImplementation(async (tenant, cb) => {
        return cb({
          auditLog: { findMany: jest.fn().mockResolvedValue(mockBlocks) },
        } as any);
      });

      const isValid = await service.verifyChainIntegrity('tenant-1');
      expect(isValid).toBe(true);
    });
  });
});
